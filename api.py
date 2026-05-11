"""
WealthOS — FastAPI Backend
All endpoints wired to Supabase CRUD layer.
"""

import os
import io
import uuid
from typing import Optional, List
from datetime import date

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

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
from ai.cfo_advisor import get_cfo_response

app = FastAPI(title="WealthOS API", version="2.0.0")


def _allowed_origins() -> list[str]:
    """Allow local dev frontends on the common Vite/Streamlit ports.

    FRONTEND_URL can still override this with a comma-separated list.
    """
    env_origins = [origin.strip() for origin in os.getenv("FRONTEND_URL", "").split(",") if origin.strip()]
    default_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ]
    return list(dict.fromkeys(env_origins or default_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Auth helper ──────────────────────────────────────────────
def get_user_id(authorization: str = Header(None)) -> str:
    """
    Extract user ID from Supabase JWT.
    In production, verify JWT signature with supabase-py.
    For dev, accepts x-user-id header as fallback.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    try:
        from database.supabase_client import get_supabase
        sb = get_supabase()
        user = sb.auth.get_user(authorization.replace("Bearer ", ""))
        return user.user.id
    except Exception:
        # Dev fallback — remove in production
        dev_id = os.getenv("DEV_USER_ID")
        if dev_id:
            return dev_id
        raise HTTPException(status_code=401, detail="Invalid token")


# ── Pydantic Models ──────────────────────────────────────────
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
    allocations: List[dict]  # [{asset_class: str, target_pct: float}]

class ChatMessageIn(BaseModel):
    message: str
    session_id: Optional[str] = None

class WatchlistIn(BaseModel):
    ticker: str
    exchange: str = "NSE"
    company_name: Optional[str] = None
    target_price: Optional[float] = None


# ── Health ───────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}


# ── Profile ──────────────────────────────────────────────────
@app.get("/profile")
def read_profile(user_id: str = Depends(get_user_id)):
    return get_or_create_profile(user_id)

@app.patch("/profile")
def patch_profile(updates: dict, user_id: str = Depends(get_user_id)):
    return update_profile(user_id, updates)


# ── Holdings ─────────────────────────────────────────────────
@app.get("/holdings")
def read_holdings(user_id: str = Depends(get_user_id)):
    return get_holdings(user_id)

@app.get("/portfolio")
def read_portfolio_summary(user_id: str = Depends(get_user_id)):
    """Holdings joined with live prices — use this for dashboard."""
    return get_portfolio_summary(user_id)

@app.post("/holdings")
def create_holding(holding: HoldingIn, user_id: str = Depends(get_user_id)):
    return upsert_holding(user_id, holding.model_dump())

@app.delete("/holdings/{holding_id}")
def remove_holding(holding_id: str, user_id: str = Depends(get_user_id)):
    ok = delete_holding(user_id, holding_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Holding not found")
    return {"deleted": True}


# ── Transactions ─────────────────────────────────────────────
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


# ── Prices ───────────────────────────────────────────────────
@app.get("/prices")
def read_prices(tickers: str, user_id: str = Depends(get_user_id)):
    """Pass tickers as comma-separated: ?tickers=RELIANCE.NS,INFY.NS,VTI"""
    ticker_list = [t.strip() for t in tickers.split(",") if t.strip()]
    return fetch_prices(ticker_list)


# ── Target Allocation ────────────────────────────────────────
@app.get("/target-allocation")
def read_target(user_id: str = Depends(get_user_id)):
    return get_target_allocation(user_id)

@app.post("/target-allocation")
def write_target(body: TargetAllocationIn, user_id: str = Depends(get_user_id)):
    return set_target_allocation(user_id, body.allocations)


# ── Watchlist ────────────────────────────────────────────────
@app.get("/watchlist")
def read_watchlist(user_id: str = Depends(get_user_id)):
    return get_watchlist(user_id)

@app.post("/watchlist")
def add_watchlist(item: WatchlistIn, user_id: str = Depends(get_user_id)):
    return add_to_watchlist(user_id, **item.model_dump())

@app.delete("/watchlist/{ticker}")
def delete_watchlist(ticker: str, user_id: str = Depends(get_user_id)):
    ok = remove_from_watchlist(user_id, ticker)
    if not ok:
        raise HTTPException(status_code=404, detail="Ticker not in watchlist")
    return {"deleted": True}


# ── Upload: CSV ───────────────────────────────────────────────
@app.post("/upload/holdings-csv")
async def upload_holdings_csv(
    file: UploadFile = File(...),
    user_id: str = Depends(get_user_id)
):
    session = create_upload_session(user_id, file.filename, "csv_holdings")
    try:
        contents = await file.read()
        holdings = parse_holdings_csv(io.BytesIO(contents))
        saved = bulk_upsert_holdings(user_id, holdings)
        update_upload_session(session["id"], "completed", recognized_data={"count": len(saved)})
        return {"imported": len(saved), "holdings": saved}
    except Exception as e:
        update_upload_session(session["id"], "failed", error=str(e))
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/upload/transactions-csv")
async def upload_transactions_csv(
    file: UploadFile = File(...),
    user_id: str = Depends(get_user_id)
):
    session = create_upload_session(user_id, file.filename, "csv_transactions")
    try:
        contents = await file.read()
        txns = parse_transactions_csv(io.BytesIO(contents))
        saved = bulk_add_transactions(user_id, txns)
        update_upload_session(session["id"], "completed", recognized_data={"count": len(saved)})
        return {"imported": len(saved), "transactions": saved}
    except Exception as e:
        update_upload_session(session["id"], "failed", error=str(e))
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/upload/image")
async def upload_screenshot(
    file: UploadFile = File(...),
    user_id: str = Depends(get_user_id)
):
    session = create_upload_session(user_id, file.filename, "image_screenshot")
    try:
        contents = await file.read()
        holdings = extract_holdings_from_image(contents)
        if holdings:
            saved = bulk_upsert_holdings(user_id, holdings)
            update_upload_session(session["id"], "completed", recognized_data={"count": len(saved), "holdings": holdings})
            return {"recognized": len(saved), "holdings": saved, "session_id": session["id"]}
        else:
            update_upload_session(session["id"], "failed", error="No holdings detected in image")
            raise HTTPException(status_code=422, detail="No holdings detected in image")
    except HTTPException:
        raise
    except Exception as e:
        update_upload_session(session["id"], "failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ── AI CFO Chat ───────────────────────────────────────────────
@app.post("/ai/chat")
async def ai_chat(body: ChatMessageIn, user_id: str = Depends(get_user_id)):
    session_id = body.session_id or str(uuid.uuid4())

    # Get live portfolio context
    portfolio = get_portfolio_summary(user_id)
    history = get_conversation_history(user_id, session_id)

    # Save user message
    save_message(user_id, session_id, "user", body.message,
                 portfolio_snapshot=portfolio)

    # Get AI response
    response = get_cfo_response(
        user_message=body.message,
        portfolio=portfolio,
        history=history
    )

    # Save assistant response
    save_message(user_id, session_id, "assistant", response,
                 tokens=len(response) // 4)

    return {"reply": response, "session_id": session_id}


@app.get("/ai/history")
def ai_history(session_id: str, user_id: str = Depends(get_user_id)):
    return get_conversation_history(user_id, session_id)
