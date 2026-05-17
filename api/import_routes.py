"""
import_routes.py — FastAPI routes for the AI Portfolio Import feature.
Mounts at: /api/import/

Endpoints:
  POST /api/import/upload   — Upload & process file, return preview
  POST /api/import/confirm  — Confirm and save holdings to Supabase
  GET  /api/import/history  — Get upload history for user
"""

import uuid
import logging
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional

from core.import_services.import_service import process_upload
from core.import_services.insights_generator import generate_insights

logger = logging.getLogger("wealthos-import")
router = APIRouter(prefix="/api/import", tags=["Import"])

# Reuse auth helper from main api.py
def _get_user_id(authorization: str = Header(None)) -> str:
    import os
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


class HoldingEdit(BaseModel):
    ticker: str
    company_name: Optional[str] = None
    quantity: float
    avg_buy_price: Optional[float] = None
    current_price: Optional[float] = None
    exchange: str = "NSE"
    asset_class: str = "equity"
    pnl: Optional[float] = None
    pnl_percent: Optional[float] = None
    ocr_confidence: Optional[int] = None
    ticker_valid: Optional[bool] = True


class ConfirmImportRequest(BaseModel):
    holdings: List[HoldingEdit]
    merge_strategy: str = "skip"  # skip | update | always_add
    source: Optional[str] = "import"
    broker: Optional[str] = None


# ── Upload & Process ─────────────────────────────────────────────────────
@router.post("/upload")
async def upload_and_process(
    file: UploadFile = File(...),
    user_id: str = Depends(_get_user_id),
):
    """
    Upload a portfolio file. Returns extracted holdings preview + AI insights.
    Supported: JPG, PNG, WEBP, PDF, CSV, XLSX
    """
    ALLOWED_TYPES = {
        "image/jpeg", "image/png", "image/webp",
        "text/csv",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
    }
    ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".pdf", ".csv", ".xlsx", ".xls"}

    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if file.content_type not in ALLOWED_TYPES and ext not in ALLOWED_EXTS:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {file.content_type}")

    file_bytes = await file.read()
    if len(file_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Max 20 MB allowed.")

    logger.info(f"Import upload: user={user_id} file={file.filename} size={len(file_bytes)} type={file.content_type}")

    result = process_upload(file_bytes, file.content_type, file.filename)

    if result.get("error"):
        raise HTTPException(status_code=422, detail=result["error"])

    holdings = result.get("holdings", [])
    insights = generate_insights(holdings) if holdings else {}

    return {
        "upload_id": str(uuid.uuid4()),
        "holdings": holdings,
        "insights": insights,
        "broker": result.get("broker"),
        "parser_used": result.get("parser_used"),
        "ocr_confidence": result.get("ocr_confidence"),
        "file_type": result.get("file_type"),
        "count": len(holdings),
    }


# ── Confirm & Save ───────────────────────────────────────────────────────
@router.post("/confirm")
async def confirm_import(
    body: ConfirmImportRequest,
    user_id: str = Depends(_get_user_id),
):
    """
    Save confirmed (possibly user-edited) holdings to Supabase.
    Handles merge strategies: skip existing, update quantity, always add.
    """
    from database import upsert_holding, get_holdings

    existing = get_holdings(user_id)
    existing_tickers = {h["ticker"].upper() for h in (existing or [])}

    saved, skipped, updated = [], [], []

    for h in body.holdings:
        ticker = h.ticker.upper()
        holding_data = {
            "ticker":        ticker,
            "company_name":  h.company_name,
            "quantity":      h.quantity,
            "avg_buy_price": h.avg_buy_price or 0,
            "exchange":      h.exchange,
            "asset_class":   h.asset_class,
            "currency":      "INR",
        }

        if ticker in existing_tickers:
            if body.merge_strategy == "skip":
                skipped.append(ticker)
                continue
            elif body.merge_strategy == "update":
                upsert_holding(user_id, holding_data)
                updated.append(ticker)
            else:  # always_add
                upsert_holding(user_id, holding_data)
                saved.append(ticker)
        else:
            upsert_holding(user_id, holding_data)
            saved.append(ticker)

    return {
        "saved": saved,
        "updated": updated,
        "skipped": skipped,
        "total_saved": len(saved) + len(updated),
        "message": f"Imported {len(saved)} new, updated {len(updated)}, skipped {len(skipped)} duplicates.",
    }


# ── Insights only (re-run on edited list) ────────────────────────────────
@router.post("/insights")
async def get_insights(
    body: ConfirmImportRequest,
    user_id: str = Depends(_get_user_id),
):
    holdings = [h.model_dump() for h in body.holdings]
    insights = generate_insights(holdings)
    return insights
