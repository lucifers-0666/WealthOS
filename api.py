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
from datetime import date

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
import logging
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
from backend.services.live_market_engine import LiveMarketEngine

live_market_engine = LiveMarketEngine()

app = FastAPI(title="WealthOS API", version="2.1.0")


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

class WatchlistIn(BaseModel):
    ticker: str
    exchange: str = "NSE"
    company_name: Optional[str] = None
    target_price: Optional[float] = None

class ImportConfirmIn(BaseModel):
    holdings: List[dict]
    merge_strategy: str = "skip"
    broker: Optional[str] = None


# ── Health ─────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "version": "2.1.0"}


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
            import asyncio
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
    return get_portfolio_summary(user_id)

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

@app.post("/watchlist")
def add_watchlist(item: WatchlistIn, user_id: str = Depends(get_user_id)):
    return add_to_watchlist(user_id, **item.model_dump())

@app.delete("/watchlist/{ticker}")
def delete_watchlist(ticker: str, user_id: str = Depends(get_user_id)):
    ok = remove_from_watchlist(user_id, ticker)
    if not ok:
        raise HTTPException(status_code=404, detail="Ticker not in watchlist")
    return {"deleted": True}


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
        update_upload_session(session_id, "completed", recognized_data={"count": len(saved)})
        return {"imported": len(saved), "holdings": saved, "persisted": persisted}
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
            update_upload_session(session_id, "completed", recognized_data={"count": len(saved)})
            return {"recognized": len(saved), "holdings": saved, "session_id": session_id, "persisted": persisted}
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


# ── AI CFO Chat ──────────────────────────────────────────────────
@app.post("/ai/chat")
async def ai_chat(body: ChatMessageIn, user_id: str = Depends(get_user_id)):
    session_id = body.session_id or str(uuid.uuid4())
    portfolio = get_portfolio_summary(user_id)
    history = get_conversation_history(user_id, session_id)
    save_message(user_id, session_id, "user", body.message, portfolio_snapshot=portfolio)
    try:
        response = get_cfo_response(user_message=body.message, portfolio=portfolio, history=history)
    except Exception as e:
        logger.error(f"AI chat error: {e}", exc_info=e)
        return {"success": False, "error": str(e), "message": "AI service unavailable", "session_id": session_id}
    save_message(user_id, session_id, "assistant", response, tokens=len(response) // 4)
    return {"reply": response, "session_id": session_id}


@app.get("/ai/history")
def ai_history(session_id: str, user_id: str = Depends(get_user_id)):
    return get_conversation_history(user_id, session_id)


# ── Serve React frontend (production only) ───────────────────────
# Mount AFTER all API routes so /api/* is never caught by static handler
_frontend_dist = Path(__file__).parent / "frontend" / "dist"
if _frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(_frontend_dist), html=True), name="spa")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
