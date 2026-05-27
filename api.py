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
)
from core.price_fetcher import fetch_prices
from core.data_loader import parse_holdings_csv, parse_transactions_csv
from core.image_ocr import extract_holdings_from_image
from core.market_status import get_market_status
from core.import_engine import process_import_file, apply_confirm
from ai.cfo_advisor import get_cfo_response
from ai.rag_engine import fetch_news_for_symbols
from backend.services.live_market_engine import LiveMarketEngine

live_market_engine = LiveMarketEngine()

app = FastAPI(title="WealthOS API", version="2.3.0")


@app.on_event("startup")
async def _start_live_market_engine():
    await live_market_engine.start()


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
def get_user_id(authorization: str = Header(None)) -> str:
    dev_id = os.getenv("DEV_USER_ID")
    if not authorization:
        if dev_id:
            return dev_id
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    try:
        from database.supabase_client import get_supabase
        sb = get_supabase()
        user = sb.auth.get_user(authorization.replace("Bearer ", ""))
        return user.user.id
    except Exception:
        if dev_id:
            return dev_id
        raise HTTPException(status_code=401, detail="Invalid token")


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
    return websocket.query_params.get("user_id") or os.getenv("DEV_USER_ID")


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
def read_profile(user_id: str = Depends(get_user_id)):
    return get_or_create_profile(user_id)

@app.patch("/profile")
def patch_profile(updates: dict, user_id: str = Depends(get_user_id)):
    return update_profile(user_id, updates)


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
    return upsert_holding(user_id, holding.model_dump())

@app.delete("/holdings/{holding_id}")
def remove_holding(holding_id: str, user_id: str = Depends(get_user_id)):
    ok = delete_holding(user_id, holding_id)
    if not ok:
        return {"deleted": True, "persisted": False, "message": "Holding was not present in the remote store; local state may still be cleared."}
    return {"deleted": True, "persisted": True}


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
    return add_to_watchlist(user_id, **item.model_dump())


@app.post("/api/watchlist", tags=["Watchlist"])
def add_watchlist_api(item: WatchlistIn, user_id: str = Depends(get_user_id)):
    return add_to_watchlist(user_id, **item.model_dump())

@app.delete("/watchlist/{ticker}")
def delete_watchlist(ticker: str, user_id: str = Depends(get_user_id)):
    ok = remove_from_watchlist(user_id, ticker)
    if not ok:
        raise HTTPException(status_code=404, detail="Ticker not in watchlist")
    return {"deleted": True}


@app.delete("/api/watchlist/{ticker}", tags=["Watchlist"])
def delete_watchlist_api(ticker: str, user_id: str = Depends(get_user_id)):
    ok = remove_from_watchlist(user_id, ticker)
    if not ok:
        raise HTTPException(status_code=404, detail="Ticker not in watchlist")
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
        return apply_confirm(
            user_id=user_id,
            holdings=body.holdings,
            merge_strategy=body.merge_strategy,
            broker=body.broker,
            bulk_upsert_fn=bulk_upsert_holdings,
            get_holdings_fn=get_holdings,
            upsert_holding_fn=upsert_holding,
        )
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


# ── Serve React frontend (production only) ───────────────────────
_frontend_dist = Path(__file__).parent / "frontend" / "dist"
if _frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(_frontend_dist), html=True), name="spa")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
