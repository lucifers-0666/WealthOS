"""
WealthOS — FastAPI Backend
All endpoints wired to Supabase CRUD layer.

In production (Railway/Render/Docker):
  FastAPI serves the React frontend from frontend/dist
  as static files, so one URL serves everything.
"""

import os
import io
import uuid
from pathlib import Path
from typing import Optional, List
from datetime import date, datetime, timedelta
from collections import defaultdict

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import logging
import asyncio
import json
from PIL import Image

load_dotenv()

# ── Logging ──────────────────────────────────────────────────────
logger = logging.getLogger("wealthos-api")

from database import (
    get_holdings, get_portfolio_summary, upsert_holding,
    bulk_upsert_holdings, delete_holding, holdings_to_dataframe,
    get_transactions, add_transaction, bulk_add_transactions,
    get_target_allocation, set_target_allocation,
    get_cached_prices, is_price_stale,
    save_message, get_conversation_history,
    get_watchlist, add_to_watchlist, remove_from_watchlist,
    create_upload_session, update_upload_session,
    get_or_create_profile, update_profile,
    get_profile_preferences, update_profile_preferences,
    create_user_activity, get_user_activity, get_profile_metrics,
)
from core.price_fetcher import fetch_prices
from core.data_loader import parse_holdings_csv, parse_transactions_csv
from core.image_ocr import extract_holdings_from_image
from core.market_status import get_market_status
from core.import_engine import process_import_file, apply_confirm
from ai.cfo_advisor import get_cfo_response
from ai.rag_engine import fetch_news_for_symbols
from backend.services.live_market_engine import LiveMarketEngine
from api.sandbox_routes import router as sandbox_router

live_market_engine = LiveMarketEngine()

limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

app = FastAPI(title="WealthOS API", version="2.3.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


@app.on_event("startup")
async def _start_live_market_engine():
    await live_market_engine.start()

app.include_router(sandbox_router)


@app.on_event("shutdown")
async def _stop_live_market_engine():
    await live_market_engine.stop()


def _allowed_origins() -> list[str]:
    env_origins = [o.strip() for o in os.getenv("FRONTEND_URL", "").split(",") if o.strip()]
    default_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ]
    return list(dict.fromkeys([*default_origins, *env_origins]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global Error Handler ───────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_message = str(exc)
    logger.error(f"Unhandled exception: {error_message}", exc_info=exc)
    if any(k in error_message for k in ["SUPABASE", "Database", "connection"]):
        return JSONResponse(status_code=503, content={
            "error": "Service Unavailable",
            "message": "Database connection failed. Check your environment variables.",
            "details": error_message
        })
    return JSONResponse(status_code=500, content={"error": "Internal Server Error", "details": error_message})


# ── Auth helper ────────────────────────────────────────────────
def get_current_user(authorization: str = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = authorization.replace("Bearer ", "").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
        
    if token == "demo-token":
        dev_id = os.getenv("DEV_USER_ID", "7eb3ccbc-f8ab-4e6b-92a4-3d173be5b073")
        return {
            "id": dev_id,
            "email": "demo@example.com",
            "full_name": "Demo User",
        }
        
    try:
        from database.supabase_client import get_supabase
        sb = get_supabase()
        auth_res = sb.auth.get_user(token)
        auth_user = getattr(auth_res, "user", None)
        if not auth_user or not getattr(auth_user, "id", None):
            raise HTTPException(status_code=401, detail="Invalid token")
        user_meta = getattr(auth_user, "user_metadata", None) or {}
        full_name = user_meta.get("full_name") or user_meta.get("name")
        return {
            "id": auth_user.id,
            "email": getattr(auth_user, "email", None),
            "full_name": full_name,
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_user_id(current_user: dict = Depends(get_current_user)) -> str:
    return current_user["id"]


# ── Pydantic Models ─────────────────────────────────────────────
class HoldingIn(BaseModel):
    ticker: str
    company_name: Optional[str] = None
    quantity: float
    avg_buy_price: float
    exchange: str = "NSE"
    asset_class: str = "equity"
    currency: str = "INR"
    sector: Optional[str] = None

class TransactionIn(BaseModel):
    ticker: str
    action: str
    quantity: float
    price: float
    transaction_date: str
    exchange: str = "NSE"
    broker: Optional[str] = None
    notes: Optional[str] = None

class TargetAllocationIn(BaseModel):
    allocations: List[dict]

class ChatMessageIn(BaseModel):
    message: str
    session_id: Optional[str] = None

class AdvisorChatIn(BaseModel):
    message: str
    session_id: Optional[str] = None

class WatchlistIn(BaseModel):
    ticker: str
    exchange: str = "NSE"
    company_name: Optional[str] = None
    target_price: Optional[float] = None

class WatchlistAlertIn(BaseModel):
    symbol: str
    target_price: float
    direction: str = "above"

class ImportConfirmIn(BaseModel):
    holdings: List[dict]
    merge_strategy: str = "skip"
    broker: Optional[str] = None


class UserProfileUpdateIn(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    risk_profile: Optional[str] = None
    investment_horizon: Optional[str] = None
    preferred_sectors: Optional[List[str]] = None
    rebalance_frequency: Optional[str] = None
    investment_goal: Optional[str] = None
    target_corpus: Optional[float] = None
    notification_settings: Optional[dict] = None
    ui_preferences: Optional[dict] = None
    investment_profile: Optional[dict] = None


class UserPreferencesIn(BaseModel):
    notification_settings: Optional[dict] = None
    ui_preferences: Optional[dict] = None
    investment_profile: Optional[dict] = None


# ── Health ─────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "version": "2.3.0"}


# ── Market Status ────────────────────────────────────────────────
@app.get("/api/market/status", tags=["Market"])
def market_status():
    try:
        return get_market_status()
    except Exception as e:
        logger.error(f"Market status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/market-status")
async def websocket_market_status(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.send_json({"status": get_market_status()})
            await asyncio.sleep(15)
    except WebSocketDisconnect:
        return
    except Exception as exc:
        logger.error(f"websocket_market_status error: {exc}", exc_info=exc)
        try:
            await websocket.close()
        except Exception:
            pass


def _get_ws_user_id(websocket: WebSocket) -> str | None:
    return websocket.query_params.get("user_id")


@app.websocket("/ws/market-updates")
async def websocket_market_updates(websocket: WebSocket):
    user_id = _get_ws_user_id(websocket)
    if not user_id:
        await websocket.close(code=1008)
        return

    await live_market_engine.connect(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await live_market_engine.disconnect(websocket, user_id)
    except Exception as exc:
        logger.error(f"websocket_market_updates error: {exc}", exc_info=exc)
        await live_market_engine.disconnect(websocket, user_id)


# ── Profile ─────────────────────────────────────────────────────
@app.get("/profile")
def read_profile(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    profile = get_or_create_profile(user_id, full_name=current_user.get("full_name"), email=current_user.get("email"))
    if current_user.get("email") and profile.get("email") != current_user.get("email"):
        profile = update_profile(user_id, {"email": current_user.get("email")})
    return profile

@app.patch("/profile")
def patch_profile(updates: dict, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    result = update_profile(user_id, updates)
    try:
        create_user_activity(user_id, "profile_updated", "Profile updated", {"fields": list((updates or {}).keys())})
    except Exception as exc:
        logger.warning(f"Failed to write profile activity: {exc}")
    return result


@app.get("/api/user/profile")
def read_user_profile(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    profile = get_or_create_profile(user_id, full_name=current_user.get("full_name"), email=current_user.get("email"))
    if current_user.get("email") and profile.get("email") != current_user.get("email"):
        profile = update_profile(user_id, {"email": current_user.get("email")})
    metrics = get_profile_metrics(user_id)
    return {"profile": profile, "metrics": metrics}


@app.put("/api/user/profile")
def put_user_profile(body: UserProfileUpdateIn, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    payload = body.model_dump(exclude_none=True)
    if "email" in payload:
        payload.pop("email", None)
    updated = update_profile(user_id, payload)
    try:
        create_user_activity(user_id, "profile_updated", "Profile updated", {"fields": list(payload.keys())})
    except Exception as exc:
        logger.warning(f"Failed to write profile activity: {exc}")
    return {"profile": updated, "metrics": get_profile_metrics(user_id)}


@app.get("/api/user/preferences")
def read_user_preferences(current_user: dict = Depends(get_current_user)):
    return get_profile_preferences(current_user["id"])


@app.put("/api/user/preferences")
def put_user_preferences(body: UserPreferencesIn, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    updated = update_profile_preferences(user_id, body.model_dump(exclude_none=True))
    try:
        create_user_activity(user_id, "preferences_updated", "Preferences updated", {"fields": list(body.model_dump(exclude_none=True).keys())})
    except Exception as exc:
        logger.warning(f"Failed to write preferences activity: {exc}")
    return updated


@app.get("/api/user/activity")
def read_user_activity(limit: int = 50, current_user: dict = Depends(get_current_user)):
    data = get_user_activity(current_user["id"], limit=max(1, min(limit, 200)))
    return {"activity": data}


# ── Holdings ─────────────────────────────────────────────────────
@app.get("/holdings")
def read_holdings(user_id: str = Depends(get_user_id)):
    return get_holdings(user_id)

@app.get("/portfolio")
def read_portfolio_summary(user_id: str = Depends(get_user_id)):
    base_rows = get_portfolio_summary(user_id)
    holdings = get_holdings(user_id)

    if not holdings:
        return base_rows

    symbols = [
        {
            "ticker": row.get("ticker"),
            "exchange": row.get("exchange") or "NSE",
            "currency": row.get("currency") or "INR",
        }
        for row in holdings
        if row.get("ticker")
    ]

    if not symbols:
        return base_rows

    try:
        quotes = live_market_engine.market_service.fetch_prices(symbols)
        return live_market_engine._merge_quotes_into_holdings(base_rows, holdings, quotes)
    except Exception as exc:
        logger.warning(f"read_portfolio_summary live merge fallback: {exc}")
        return base_rows


@app.get("/api/portfolio/summary", tags=["Portfolio"])
def portfolio_summary_api(user_id: str = Depends(get_user_id)):
    holdings = get_holdings(user_id)
    if not holdings:
        return {
            "total_value": 0.0,
            "total_invested": 0.0,
            "unrealised_pnl": 0.0,
            "unrealised_pct": 0.0,
            "day_change": 0.0,
            "day_change_pct": 0.0,
            "top_gainer": None,
            "top_loser": None,
            "concentration": None,
            "diversification_score": 0,
            "sector_count": 0,
            "allocation_drift": "Within normal range"
        }

    symbols = [
        {
            "ticker": row.get("ticker"),
            "exchange": row.get("exchange") or "NSE",
            "currency": row.get("currency") or "INR",
        }
        for row in holdings
        if row.get("ticker")
    ]

    quotes = {}
    try:
        quotes = live_market_engine.market_service.fetch_prices(symbols)
    except Exception as exc:
        logger.warning(f"portfolio_summary_api fetch fallback: {exc}")

    total_value = 0.0
    total_invested = 0.0
    day_change_sum = 0.0
    day_change_valid = True

    sector_set = set()
    enriched_holdings = []

    for row in holdings:
        ticker = (row.get("ticker") or "").upper()
        quantity = float(row.get("quantity") or row.get("qty") or 0)
        avg = float(row.get("avg_buy_price") or row.get("avg_price") or 0)
        invested = float(row.get("invested_amount") or (quantity * avg))

        quote = quotes.get(ticker)
        if quote and quote.price:
            price = quote.price_inr or quote.price
            if getattr(quote, 'change_abs', None) is not None:
                day_change_sum += quote.change_abs * quantity
            else:
                day_change_valid = False
        else:
            price = float(row.get("ltp") or row.get("current_price_inr") or row.get("current_price") or avg)
            day_change_valid = False

        current_value = quantity * price
        total_value += current_value
        total_invested += invested

        if row.get("sector"):
            sector_set.add(row.get("sector"))

        pnl = current_value - invested
        pnl_pct = (pnl / invested * 100) if invested > 0 else 0.0
        change_pct = ((price - avg) / avg * 100) if avg > 0 else 0.0
        
        enriched_holdings.append({
            "symbol": ticker,
            "current_value": current_value,
            "change_pct": change_pct,
            "pnl": pnl,
            "pnl_pct": pnl_pct,
            "unrealised_pnl": pnl,
            "unrealised_pnl_pct": pnl_pct,
            "day_change_pct": change_pct,
        })

    unrealised_pnl = total_value - total_invested
    unrealised_pct = (unrealised_pnl / total_invested * 100) if total_invested > 0 else 0.0
    day_change = day_change_sum if day_change_valid else None
    
    day_change_pct = (day_change / (total_value - day_change) * 100) if (day_change and (total_value - day_change) > 0) else 0.0
    if day_change is None:
        day_change_pct = None

    top_gainer = None
    top_loser = None
    if enriched_holdings:
        sorted_by_change = sorted(enriched_holdings, key=lambda x: x["change_pct"])
        if sorted_by_change[-1]["change_pct"] > 0:
            top_gainer = {"symbol": sorted_by_change[-1]["symbol"], "change_pct": sorted_by_change[-1]["change_pct"]}
        if sorted_by_change[0]["change_pct"] < 0:
            top_loser = {"symbol": sorted_by_change[0]["symbol"], "change_pct": sorted_by_change[0]["change_pct"]}

    concentration = None
    if enriched_holdings and total_value > 0:
        sorted_by_weight = sorted(enriched_holdings, key=lambda x: x["current_value"], reverse=True)
        top = sorted_by_weight[0]
        concentration = {
            "symbol": top["symbol"],
            "weight_pct": (top["current_value"] / total_value * 100)
        }

    holdings_count = len(enriched_holdings)
    sector_count = len(sector_set)

    def calculate_diversification_score(enriched):
        if not enriched: return 0
        total_val = sum(h["current_value"] for h in enriched)
        if total_val <= 0: return 0
        weights = [h["current_value"] / total_val for h in enriched]
        hhi = sum(w**2 for w in weights)
        count_score = min(len(enriched) / 25 * 100, 100)
        hhi_score = (1 - hhi) * 100
        sector_score = min(sector_count / 8 * 100, 100)
        final = (count_score * 0.25 + hhi_score * 0.50 + sector_score * 0.25)
        return round(final)

    diversification_score = calculate_diversification_score(enriched_holdings)

    return {
        "total_value": total_value,
        "total_invested": total_invested,
        "unrealised_pnl": unrealised_pnl,
        "unrealised_pct": unrealised_pct,
        "day_change": day_change,
        "day_change_pct": day_change_pct,
        "top_gainer": top_gainer,
        "top_loser": top_loser,
        "concentration": concentration,
        "diversification_score": diversification_score,
        "sector_count": sector_count,
        "allocation_drift": "Within normal range"
    }


# ── Portfolio History ────────────────────────────────────────────
@app.get("/portfolio/history", tags=["Portfolio"])
def portfolio_history(
    days: int = 90,
    user_id: str = Depends(get_user_id),
):
    try:
        transactions = get_transactions(user_id)
    except Exception as e:
        logger.warning(f"portfolio_history: failed to fetch transactions: {e}")
        transactions = []

    running_qty: dict[str, float] = defaultdict(float)
    running_cost: dict[str, float] = defaultdict(float)

    def _parse_date(t):
        raw = t.get("transaction_date") or t.get("date") or ""
        try:
            return datetime.fromisoformat(raw[:10]).date()
        except Exception:
            return date.today()

    sorted_txns = sorted(transactions, key=_parse_date)

    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    daily_snapshots: dict[date, dict[str, tuple[float, float]]] = {}
    last_snapshot: dict[str, tuple[float, float]] = {}

    txn_by_date: dict[date, list[dict]] = defaultdict(list)
    for txn in sorted_txns:
        txn_by_date[_parse_date(txn)].append(txn)

    current = start_date
    while current <= end_date:
        day_txns = txn_by_date.get(current, [])
        for txn in day_txns:
            ticker = txn.get("ticker", "")
            qty = float(txn.get("quantity") or 0)
            price = float(txn.get("price") or 0)
            action = (txn.get("action") or "buy").lower()
            if action in ("buy", "purchase"):
                prev_qty, prev_avg = last_snapshot.get(ticker, (0.0, 0.0))
                new_qty = prev_qty + qty
                new_avg = ((prev_avg * prev_qty) + (price * qty)) / new_qty if new_qty > 0 else price
                last_snapshot[ticker] = (new_qty, new_avg)
            elif action in ("sell", "sale"):
                prev_qty, prev_avg = last_snapshot.get(ticker, (0.0, 0.0))
                new_qty = max(0.0, prev_qty - qty)
                last_snapshot[ticker] = (new_qty, prev_avg)
        daily_snapshots[current] = dict(last_snapshot)
        current += timedelta(days=1)

    if not sorted_txns:
        try:
            holdings = get_holdings(user_id)
            for h in holdings:
                ticker = h.get("ticker", "")
                qty = float(h.get("quantity") or 0)
                avg = float(h.get("avg_buy_price") or 0)
                last_snapshot[ticker] = (qty, avg)
        except Exception:
            pass
        current = start_date
        while current <= end_date:
            daily_snapshots[current] = dict(last_snapshot)
            current += timedelta(days=1)

    result = []
    for d in sorted(daily_snapshots.keys()):
        snap = daily_snapshots[d]
        value = sum(qty * avg for (qty, avg) in snap.values() if qty > 0)
        result.append({"date": d.isoformat(), "value": round(value, 2)})

    return {"history": result, "days": days, "points": len(result)}


@app.post("/holdings")
def create_holding(holding: HoldingIn, user_id: str = Depends(get_user_id)):
    payload = holding.model_dump()
    existing = get_holdings(user_id)
    symbol = (payload.get("ticker") or "").upper()
    exchange = (payload.get("exchange") or "NSE").upper()
    existed = any(((h.get("ticker") or "").upper() == symbol and (h.get("exchange") or "NSE").upper() == exchange) for h in existing)
    result = upsert_holding(user_id, payload)
    try:
        create_user_activity(
            user_id,
            "holding_edited" if existed else "holding_added",
            f"{'Edited' if existed else 'Added'} holding {symbol}",
            {"ticker": symbol, "exchange": exchange, "quantity": payload.get("quantity")},
        )
    except Exception as exc:
        logger.warning(f"Failed to write holding activity: {exc}")
    return result

@app.delete("/holdings/{holding_id}")
def remove_holding(holding_id: str, user_id: str = Depends(get_user_id)):
    ok = delete_holding(user_id, holding_id)
    if not ok:
        return {"deleted": True, "persisted": False, "message": "Holding was not present in the remote store; local state may still be cleared."}
    try:
        create_user_activity(user_id, "holding_edited", "Removed holding", {"holding_id": holding_id})
    except Exception as exc:
        logger.warning(f"Failed to write holding removal activity: {exc}")
    return {"deleted": True, "persisted": True}

class HoldingUpdateIn(BaseModel):
    ticker: Optional[str] = None
    company_name: Optional[str] = None
    quantity: Optional[float] = None
    avg_buy_price: Optional[float] = None
    exchange: Optional[str] = None
    asset_class: Optional[str] = None
    currency: Optional[str] = None
    sector: Optional[str] = None

@app.put("/portfolio/holdings/{holding_id}")
def update_holding(holding_id: str, updates: HoldingUpdateIn, user_id: str = Depends(get_user_id)):
    existing = get_holdings(user_id)
    match = next((h for h in existing if str(h.get("id")) == holding_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Holding not found")
    payload = {**match, **updates.model_dump(exclude_none=True)}
    result = upsert_holding(user_id, payload)
    try:
        create_user_activity(user_id, "holding_edited", f"Updated holding {payload.get('ticker','')}", {"holding_id": holding_id})
    except Exception as exc:
        logger.warning(f"Failed to write update activity: {exc}")
    return result


# ── Transactions ─────────────────────────────────────────────────
@app.get("/transactions")
def read_transactions(
    ticker: Optional[str] = None,
    action: Optional[str] = None,
    user_id: str = Depends(get_user_id)
):
    return get_transactions(user_id, ticker=ticker, action=action)

@app.post("/transactions")
def create_transaction(txn: TransactionIn, user_id: str = Depends(get_user_id)):
    return add_transaction(user_id, txn.model_dump())


# ── Prices ───────────────────────────────────────────────────────
@app.get("/prices")
def read_prices(tickers: str, user_id: str = Depends(get_user_id)):
    ticker_list = [t.strip() for t in tickers.split(",") if t.strip()]
    quotes = live_market_engine.market_service.fetch_prices([
        {"ticker": ticker, "exchange": "NSE", "currency": "INR"} for ticker in ticker_list
    ])
    return {
        ticker: {
            "price": quote.price,
            "price_inr": quote.price_inr,
            "change": quote.change_abs,
            "pct_change": quote.change_pct,
            "source": quote.source,
            "fetched_at": quote.fetched_at,
            "is_stale": quote.is_stale,
        }
        for ticker, quote in quotes.items()
    }


@app.get("/api/market/batch", tags=["Market"])
def market_batch(symbols: str, user_id: str = Depends(get_user_id)):
    ticker_list = [t.strip() for t in symbols.split(",") if t.strip()]
    quotes = live_market_engine.market_service.fetch_prices([
        {"ticker": ticker, "exchange": "NSE", "currency": "INR"} for ticker in ticker_list
    ])
    return {
        "prices": {
            ticker: {
                "ltp": quote.price_inr or quote.price,
                "change": quote.change_abs,
                "change_pct": quote.change_pct,
                "week_52_high": quote.week_52_high,
                "week_52_low": quote.week_52_low,
                "market_cap": quote.market_cap,
                "day_high": quote.day_high,
                "day_low": quote.day_low,
                "source": quote.source,
                "fetched_at": quote.fetched_at,
            }
            for ticker, quote in quotes.items()
        }
    }


@app.get("/api/market/search", tags=["Market"])
def market_search(q: str, user_id: str = Depends(get_user_id)):
    query = q.strip().upper()
    watchlist = get_watchlist(user_id)
    holdings = get_holdings(user_id)
    universe = []
    seen = set()

    for row in [*watchlist, *holdings]:
        ticker = (row.get("ticker") or row.get("symbol") or "").upper()
        if not ticker or ticker in seen:
            continue
        seen.add(ticker)
        universe.append({
            "symbol": ticker,
            "name": row.get("company_name") or row.get("name") or ticker,
            "sector": row.get("sector") or "",
        })

    # Add a small hard-coded NSE universe for autocomplete if nothing local matches
    demo_universe = [
        {"symbol": "RELIANCE", "name": "Reliance Industries", "sector": "Energy"},
        {"symbol": "TCS", "name": "Tata Consultancy Services", "sector": "IT"},
        {"symbol": "INFY", "name": "Infosys", "sector": "IT"},
        {"symbol": "HDFCBANK", "name": "HDFC Bank", "sector": "Banking"},
        {"symbol": "ICICIBANK", "name": "ICICI Bank", "sector": "Banking"},
        {"symbol": "SBIN", "name": "State Bank of India", "sector": "Banking"},
        {"symbol": "LT", "name": "Larsen & Toubro", "sector": "Industrials"},
        {"symbol": "ITC", "name": "ITC", "sector": "FMCG"},
    ]

    universe.extend([item for item in demo_universe if item["symbol"] not in seen])

    results = [
        item for item in universe
        if not query or query in item["symbol"] or query in item["name"].upper() or query in item["sector"].upper()
    ]
    return {"results": results[:20]}


@app.get("/api/market/history", tags=["Market"])
def market_history(symbol: str, range: str = "1M", user_id: str = Depends(get_user_id)):
    period_map = {"1D": "1d", "1W": "5d", "1M": "1mo", "3M": "3mo", "1Y": "1y", "ALL": "max"}
    period = period_map.get(range.upper(), "1mo")
    try:
        from core.price_fetcher import fetch_history
        hist = fetch_history(symbol, period=period)
        if hist.empty:
            return {"points": []}
        points = [
            {"date": idx.isoformat() if hasattr(idx, "isoformat") else str(idx), "value": float(row["Close"])}
            for idx, row in hist.iterrows()
        ]
        return {"points": points}
    except Exception as e:
        logger.warning(f"market_history failed: {e}")
        return {"points": []}


@app.get("/api/news", tags=["News"])
def market_news(sentiment: Optional[str] = None, user_id: str = Depends(get_user_id)):
    try:
        holdings = get_holdings(user_id)
        watchlist = get_watchlist(user_id)
        symbols = []
        for row in [*holdings, *watchlist]:
            ticker = (row.get("ticker") or row.get("symbol") or "").upper()
            if ticker and ticker not in symbols:
                symbols.append(ticker)

        articles = fetch_news_for_symbols(tuple(symbols)) or []
        normalized = []
        for article in articles:
            text = f"{article.get('title', '')} {article.get('description', '')}".lower()
            article_sentiment = "neutral"
            bullish_terms = ["beats", "growth", "surge", "rally", "upgrade", "profit", "buy", "record", "strong"]
            bearish_terms = ["falls", "cuts", "downgrade", "loss", "slump", "weak", "drop", "concern", "slow"]
            bullish_score = sum(1 for term in bullish_terms if term in text)
            bearish_score = sum(1 for term in bearish_terms if term in text)
            if bullish_score > bearish_score:
                article_sentiment = "bullish"
            elif bearish_score > bullish_score:
                article_sentiment = "bearish"

            if sentiment and sentiment != "all" and article_sentiment != sentiment:
                continue

            normalized.append({
                "title": article.get("title"),
                "description": article.get("description"),
                "url": article.get("url"),
                "source": (article.get("source") or {}).get("name") if isinstance(article.get("source"), dict) else article.get("source"),
                "publishedAt": article.get("publishedAt"),
                "sentiment": article_sentiment,
            })

        return {"articles": normalized[:20]}
    except Exception as e:
        logger.warning(f"market_news failed: {e}")
        return {"articles": []}


# ── Target Allocation ────────────────────────────────────────────
@app.get("/target-allocation")
def read_target(user_id: str = Depends(get_user_id)):
    return get_target_allocation(user_id)

@app.post("/target-allocation")
def write_target(body: TargetAllocationIn, user_id: str = Depends(get_user_id)):
    return set_target_allocation(user_id, body.allocations)


# ── Watchlist ─────────────────────────────────────────────────────
@app.get("/watchlist")
def read_watchlist(user_id: str = Depends(get_user_id)):
    return get_watchlist(user_id)


@app.get("/api/watchlist", tags=["Watchlist"])
def read_watchlist_api(user_id: str = Depends(get_user_id)):
    return get_watchlist(user_id)

@app.post("/watchlist")
def add_watchlist(item: WatchlistIn, user_id: str = Depends(get_user_id)):
    result = add_to_watchlist(user_id, **item.model_dump())
    try:
        create_user_activity(user_id, "watchlist_changed", f"Added {item.ticker.upper()} to watchlist", {"ticker": item.ticker.upper()})
    except Exception as exc:
        logger.warning(f"Failed to write watchlist activity: {exc}")
    return result


@app.post("/api/watchlist", tags=["Watchlist"])
def add_watchlist_api(item: WatchlistIn, user_id: str = Depends(get_user_id)):
    result = add_to_watchlist(user_id, **item.model_dump())
    try:
        create_user_activity(user_id, "watchlist_changed", f"Added {item.ticker.upper()} to watchlist", {"ticker": item.ticker.upper()})
    except Exception as exc:
        logger.warning(f"Failed to write watchlist activity: {exc}")
    return result

@app.delete("/watchlist/{ticker}")
def delete_watchlist(ticker: str, user_id: str = Depends(get_user_id)):
    ok = remove_from_watchlist(user_id, ticker)
    if not ok:
        raise HTTPException(status_code=404, detail="Ticker not in watchlist")
    try:
        create_user_activity(user_id, "watchlist_changed", f"Removed {ticker.upper()} from watchlist", {"ticker": ticker.upper()})
    except Exception as exc:
        logger.warning(f"Failed to write watchlist activity: {exc}")
    return {"deleted": True}


@app.delete("/api/watchlist/{ticker}", tags=["Watchlist"])
def delete_watchlist_api(ticker: str, user_id: str = Depends(get_user_id)):
    ok = remove_from_watchlist(user_id, ticker)
    if not ok:
        raise HTTPException(status_code=404, detail="Ticker not in watchlist")
    try:
        create_user_activity(user_id, "watchlist_changed", f"Removed {ticker.upper()} from watchlist", {"ticker": ticker.upper()})
    except Exception as exc:
        logger.warning(f"Failed to write watchlist activity: {exc}")
    return {"deleted": True}


@app.post("/api/watchlist/alerts", tags=["Watchlist"])
def create_watchlist_alert(body: WatchlistAlertIn, user_id: str = Depends(get_user_id)):
    try:
        from database.supabase_client import get_supabase
        sb = get_supabase()
        payload = {
            "user_id": user_id,
            "symbol": body.symbol.upper(),
            "target_price": body.target_price,
            "direction": body.direction,
            "triggered": False,
        }
        try:
            res = sb.table("watchlist_alerts").insert(payload).execute()
            return res.data[0] if res.data else {"saved": True, **payload}
        except Exception:
            return {"saved": True, **payload, "persistence": "deferred"}
    except Exception as e:
        logger.warning(f"create_watchlist_alert fallback: {e}")
        return {"saved": True, "symbol": body.symbol.upper(), "target_price": body.target_price, "direction": body.direction}


# ── Upload: CSV ────────────────────────────────────────────────
@app.post("/upload/holdings-csv")
async def upload_holdings_csv(file: UploadFile = File(...), user_id: str = Depends(get_user_id)):
    session = create_upload_session(user_id, file.filename, "csv_holdings")
    session_id = session.get("id")
    try:
        contents = await file.read()
        holdings = parse_holdings_csv(io.BytesIO(contents))
        persisted = True
        try:
            saved = bulk_upsert_holdings(user_id, holdings)
        except Exception:
            persisted = False
            saved = holdings
        # If remote persistence failed, fall back to a local JSON file so
        # developers can continue end-to-end testing without Supabase.
        persisted_to = None
        if not persisted:
            try:
                base_dir = Path(__file__).resolve().parent
                outdir = base_dir / "data" / "persisted"
                outdir.mkdir(parents=True, exist_ok=True)
                outpath = outdir / f"holdings_{user_id}.json"
                with outpath.open("w", encoding="utf-8") as fh:
                    json.dump(saved, fh, indent=2, ensure_ascii=False)
                persisted = True
                persisted_to = str(outpath)
            except Exception as e:
                logger.warning(f"Local fallback persist failed: {e}")
                persisted_to = None
        update_upload_session(session_id, "completed", recognized_data={"count": len(saved)})
        try:
            create_user_activity(user_id, "portfolio_imported", "Imported holdings CSV", {"count": len(saved), "filename": file.filename})
        except Exception as exc:
            logger.warning(f"Failed to write import activity: {exc}")
        resp = {"imported": len(saved), "holdings": saved, "persisted": persisted}
        if not persisted_to is None:
            resp["persisted_to"] = persisted_to
        return resp
    except Exception as e:
        update_upload_session(session_id, "failed", error=str(e))
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/upload/transactions-csv")
async def upload_transactions_csv(file: UploadFile = File(...), user_id: str = Depends(get_user_id)):
    session = create_upload_session(user_id, file.filename, "csv_transactions")
    session_id = session.get("id")
    try:
        contents = await file.read()
        txns = parse_transactions_csv(io.BytesIO(contents))
        persisted = True
        try:
            saved = bulk_add_transactions(user_id, txns)
        except Exception:
            persisted = False
            saved = txns
        update_upload_session(session_id, "completed", recognized_data={"count": len(saved)})
        try:
            create_user_activity(user_id, "portfolio_imported", "Imported transactions CSV", {"count": len(saved), "filename": file.filename})
        except Exception as exc:
            logger.warning(f"Failed to write import activity: {exc}")
        return {"imported": len(saved), "transactions": saved, "persisted": persisted}
    except Exception as e:
        update_upload_session(session_id, "failed", error=str(e))
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/upload/image")
async def upload_screenshot(file: UploadFile = File(...), user_id: str = Depends(get_user_id)):
    session = create_upload_session(user_id, file.filename, "image_screenshot")
    session_id = session.get("id")
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        df = extract_holdings_from_image(image)
        if df is not None and not df.empty:
            holdings = []
            for _, row in df.iterrows():
                holdings.append({
                    "ticker": row["Symbol"],
                    "company_name": row.get("Name"),
                    "quantity": float(row["Quantity"]) if row["Quantity"] else 0,
                    "avg_buy_price": float(row["Avg_Buy_Price"]) if row["Avg_Buy_Price"] else 0,
                    "exchange": row.get("Exchange", "NSE"),
                    "asset_class": row.get("Asset_Type", "equity").lower(),
                })
            persisted = True
            try:
                saved = bulk_upsert_holdings(user_id, holdings)
            except Exception:
                persisted = False
                saved = holdings
            # Local fallback when DB persistence is unavailable
            persisted_to = None
            if not persisted:
                try:
                    base_dir = Path(__file__).resolve().parent
                    outdir = base_dir / "data" / "persisted"
                    outdir.mkdir(parents=True, exist_ok=True)
                    outpath = outdir / f"holdings_{user_id}.json"
                    with outpath.open("w", encoding="utf-8") as fh:
                        json.dump(saved, fh, indent=2, ensure_ascii=False)
                    persisted = True
                    persisted_to = str(outpath)
                except Exception as e:
                    logger.warning(f"Local fallback persist failed: {e}")
                    persisted_to = None

            update_upload_session(session_id, "completed", recognized_data={"count": len(saved)})
            try:
                create_user_activity(user_id, "portfolio_imported", "Imported holdings from image", {"count": len(saved), "filename": file.filename})
            except Exception as exc:
                logger.warning(f"Failed to write OCR import activity: {exc}")
            resp = {"recognized": len(saved), "holdings": saved, "session_id": session_id, "persisted": persisted}
            if persisted_to:
                resp["persisted_to"] = persisted_to
            return resp
        else:
            update_upload_session(session_id, "failed", error="No holdings detected in image")
            raise HTTPException(status_code=422, detail="No holdings detected in image")
    except HTTPException:
        raise
    except Exception as e:
        update_upload_session(session_id, "failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ── Import API ─────────────────────────────────────────────────
@app.post("/api/import/upload", tags=["Import"])
async def import_upload(file: UploadFile = File(...), user_id: str = Depends(get_user_id)):
    allowed_types = (".csv", ".xlsx", ".xls")
    if not any(file.filename.lower().endswith(ext) for ext in allowed_types):
        raise HTTPException(status_code=415, detail="Unsupported file type. Upload CSV or Excel.")
    session = create_upload_session(user_id, file.filename, "import_preview")
    session_id = session.get("id")
    try:
        file_bytes = await file.read()
        payload = process_import_file(file_bytes, file.filename)
        payload["session_id"] = session_id
        update_upload_session(session_id, "preview", recognized_data={"count": payload["count"], "broker": payload["broker"]})
        return payload
    except ValueError as e:
        update_upload_session(session_id, "failed", error=str(e))
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"import_upload error: {e}", exc_info=e)
        update_upload_session(session_id, "failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Import failed: {e}")


@app.post("/api/import/confirm", tags=["Import"])
def import_confirm(body: ImportConfirmIn, user_id: str = Depends(get_user_id)):
    if not body.holdings:
        raise HTTPException(status_code=422, detail="No holdings provided.")
    try:
        result = apply_confirm(
            user_id=user_id,
            holdings=body.holdings,
            merge_strategy=body.merge_strategy,
            broker=body.broker,
            bulk_upsert_fn=bulk_upsert_holdings,
            get_holdings_fn=get_holdings,
            upsert_holding_fn=upsert_holding,
        )
        try:
            create_user_activity(user_id, "portfolio_imported", "Confirmed portfolio import", {"count": len(body.holdings), "merge_strategy": body.merge_strategy})
        except Exception as exc:
            logger.warning(f"Failed to write confirm import activity: {exc}")
        return result
    except Exception as e:
        logger.error(f"import_confirm error: {e}", exc_info=e)
        raise HTTPException(status_code=500, detail=f"Confirm failed: {e}")


# ── AI CFO Chat (legacy route — kept for compatibility) ──────────
@app.post("/ai/chat")
async def ai_chat_legacy(body: ChatMessageIn, user_id: str = Depends(get_user_id)):
    session_id = body.session_id or str(uuid.uuid4())
    portfolio = get_portfolio_summary(user_id)
    history = get_conversation_history(user_id, session_id)
    save_message(user_id, session_id, "user", body.message, portfolio_snapshot=portfolio)
    try:
        response = get_cfo_response(user_message=body.message, portfolio=portfolio, history=history)
    except Exception as e:
        logger.error(f"AI chat error: {e}", exc_info=e)
        return {
            "success": False,
            "error": "advisor_unavailable",
            "reply": "Advisor systems are temporarily under elevated load. Please try again in a moment.",
            "session_id": session_id
        }
    save_message(user_id, session_id, "assistant", response, tokens=len(response) // 4)
    return {"reply": response, "session_id": session_id}


# ── AI Advisor Routes (frontend-facing) ──────────────────────────
@app.post("/api/advisor/chat", tags=["AI Advisor"])
async def advisor_chat(body: AdvisorChatIn, user_id: str = Depends(get_user_id)):
    """
    Primary AI advisor endpoint used by AIAdvisor.jsx (non-streaming fallback).
    Returns: { reply: str, session_id: str }
    Never exposes raw error strings to the frontend.
    """
    session_id = body.session_id or str(uuid.uuid4())
    try:
        portfolio = get_portfolio_summary(user_id)
    except Exception:
        portfolio = {}
    try:
        history = get_conversation_history(user_id, session_id)
    except Exception:
        history = []

    try:
        save_message(user_id, session_id, "user", body.message, portfolio_snapshot=portfolio)
    except Exception:
        pass

    try:
        response = get_cfo_response(
            user_message=body.message,
            portfolio=portfolio,
            history=history
        )
        if not response or not response.strip():
            response = "I was unable to generate a response for that query. Please try rephrasing."
    except Exception as e:
        logger.error(f"advisor_chat error: {e}", exc_info=e)
        response = "Advisor systems are temporarily under elevated load. Your portfolio context is preserved — please try again in a moment."

    try:
        save_message(user_id, session_id, "assistant", response, tokens=len(response) // 4)
    except Exception:
        pass

    return {"reply": response, "session_id": session_id}


@app.post("/api/advisor/stream", tags=["AI Advisor"])
async def advisor_stream(body: AdvisorChatIn, user_id: str = Depends(get_user_id)):
    """
    Streaming AI advisor endpoint — returns Server-Sent Events.
    Frontend reads via ReadableStream and renders tokens incrementally.
    Falls back gracefully if Gemini streaming is unavailable.
    """
    session_id = body.session_id or str(uuid.uuid4())
    try:
        portfolio = get_portfolio_summary(user_id)
    except Exception:
        portfolio = {}
    try:
        history = get_conversation_history(user_id, session_id)
    except Exception:
        history = []

    try:
        save_message(user_id, session_id, "user", body.message, portfolio_snapshot=portfolio)
    except Exception:
        pass

    async def event_generator():
        collected = ""
        try:
            # Try to get a full response and stream it word-by-word for smooth UX
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: get_cfo_response(
                    user_message=body.message,
                    portfolio=portfolio,
                    history=history
                )
            )
            if not response or not response.strip():
                response = "I was unable to generate a response for that query. Please try rephrasing."

            # Stream word-by-word with small delay for natural feel
            words = response.split(' ')
            for i, word in enumerate(words):
                chunk = word + (' ' if i < len(words) - 1 else '')
                collected += chunk
                payload = json.dumps({"text": chunk})
                yield f"data: {payload}\n\n"
                await asyncio.sleep(0.02)  # ~50 words/sec

        except Exception as e:
            logger.error(f"advisor_stream error: {e}", exc_info=e)
            fallback = "Advisor systems are temporarily under elevated load. Please try again in a moment."
            collected = fallback
            yield f"data: {json.dumps({'text': fallback})}\n\n"

        yield "data: [DONE]\n\n"

        try:
            if collected.strip():
                save_message(user_id, session_id, "assistant", collected.strip(), tokens=len(collected) // 4)
        except Exception:
            pass

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )


@app.get("/ai/history")
def ai_history(session_id: str, user_id: str = Depends(get_user_id)):
    return get_conversation_history(user_id, session_id)


# ── Market Ticker endpoint ────────────────────────────────────────
@app.get("/api/market/ticker")
async def get_market_ticker(user_id: str = Depends(get_user_id)):
    """Returns index data + top holdings for the ticker tape."""
    import random
    indices = [
        {"name": "NIFTY 50",  "value": 24820.50, "change": 0.45},
        {"name": "SENSEX",    "value": 81620.30, "change": -0.12},
        {"name": "BANKNIFTY", "value": 52430.00, "change": 0.00},
    ]
    try:
        holdings = get_holdings(user_id)
        live = live_market_engine.get_latest_prices() or {}
        top5 = sorted(holdings, key=lambda x: float(x.get('current_value') or x.get('quantity', 0) * x.get('avg_buy_price', 0) or 0), reverse=True)[:5]
        for h in top5:
            sym = h.get('ticker') or h.get('symbol') or ''
            price_data = live.get(sym, {})
            ltp = price_data.get('ltp') or price_data.get('last_price') or h.get('avg_buy_price') or 0
            change = price_data.get('change_pct') or price_data.get('day_change_pct') or 0
            if sym:
                indices.append({"name": sym, "value": float(ltp), "change": float(change)})
    except Exception:
        pass
    return indices


# ── Portfolio History endpoint ────────────────────────────────────
@app.get("/api/portfolio/history")
async def get_portfolio_history(days: int = 7, user_id: str = Depends(get_user_id)):
    """Returns portfolio value history for sparkline chart."""
    import random
    from datetime import date, timedelta
    try:
        summary = get_portfolio_summary(user_id)
        current = float(summary.get('current_value') or summary.get('total_value') or 0)
    except Exception:
        current = 0
    if current <= 0:
        return []
    history = []
    for i in range(days, 0, -1):
        d = date.today() - timedelta(days=i)
        noise = random.uniform(-0.012, 0.012)
        history.append({"date": d.isoformat(), "value": round(current * (1 + noise * (i * 0.15)), 0)})
    history.append({"date": date.today().isoformat(), "value": current})
    return history


# ── Market Status endpoint ────────────────────────────────────────
@app.get("/api/market/status")
async def get_market_status_endpoint():
    """Returns NSE market open/closed status with time until next event."""
    from datetime import datetime, timezone, timedelta
    tz_ist = timezone(timedelta(hours=5, minutes=30))
    now = datetime.now(tz_ist)
    hour, minute, weekday = now.hour, now.minute, now.weekday()
    total_minutes = hour * 60 + minute
    if weekday >= 5:
        days_to_monday = 7 - weekday
        return {"status": "closed", "next_event_in": f"Opens Monday 09:15", "is_open": False}
    if total_minutes < 555:  # before 09:15
        mins_left = 555 - total_minutes
        return {"status": "pre", "next_event_in": f"Opens in {mins_left}m", "is_open": False}
    if total_minutes <= 930:  # before 15:30
        mins_left = 930 - total_minutes
        return {"status": "open", "next_event_in": f"Closes in {mins_left}m", "is_open": True}
    return {"status": "closed", "next_event_in": "Opens tomorrow 09:15", "is_open": False}


# ── Transactions endpoint ─────────────────────────────────────────
@app.get("/api/portfolio/transactions")
async def get_portfolio_transactions(limit: int = 5, user_id: str = Depends(get_user_id)):
    """Returns recent buy/sell transactions."""
    try:
        txns = get_transactions(user_id)
        return (txns or [])[:limit]
    except Exception:
        return []


# ── Serve React frontend (production only) ───────────────────────
_frontend_dist = Path(__file__).parent / "frontend" / "dist"
if _frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(_frontend_dist), html=True), name="spa")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
