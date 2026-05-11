"""
WealthOS — Supabase Database Layer
Centralised client and all CRUD operations for every table.
"""

import os
from datetime import date, datetime
from typing import Optional
from uuid import UUID

from dotenv import load_dotenv
from supabase import create_client, Client
from loguru import logger

load_dotenv()

# ──────────────────────────────────────────
# Client singleton
# ──────────────────────────────────────────

def get_supabase() -> Client:
    url  = os.getenv("SUPABASE_URL")
    key  = os.getenv("SUPABASE_ANON_KEY")
    if not url or not key:
        raise EnvironmentError(
            "SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env"
        )
    return create_client(url, key)

supabase: Client = get_supabase()


# ══════════════════════════════════════════
# HOLDINGS
# ══════════════════════════════════════════

def get_holdings(user_id: str) -> list[dict]:
    """Fetch all holdings for a user."""
    res = (
        supabase.table("holdings")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=False)
        .execute()
    )
    return res.data or []


def upsert_holding(user_id: str, ticker: str, exchange: str, payload: dict) -> dict:
    """
    Insert or update a holding.
    payload keys: name, asset_class, quantity, avg_buy_price, currency, sector, notes, source
    """
    data = {
        "user_id":       user_id,
        "ticker":        ticker.upper(),
        "exchange":      exchange.upper(),
        **payload,
        "updated_at":    datetime.utcnow().isoformat(),
    }
    res = (
        supabase.table("holdings")
        .upsert(data, on_conflict="user_id,ticker,exchange")
        .execute()
    )
    return res.data[0] if res.data else {}


def delete_holding(user_id: str, holding_id: str) -> bool:
    """Delete a holding by ID."""
    res = (
        supabase.table("holdings")
        .delete()
        .eq("id", holding_id)
        .eq("user_id", user_id)
        .execute()
    )
    return bool(res.data)


def bulk_upsert_holdings(user_id: str, holdings: list[dict]) -> int:
    """
    Bulk insert/update holdings from CSV or OCR import.
    Each dict must have: ticker, exchange, quantity, avg_buy_price.
    Returns count of rows upserted.
    """
    rows = [
        {
            "user_id":       user_id,
            "ticker":        h["ticker"].upper(),
            "exchange":      h.get("exchange", "NSE").upper(),
            "quantity":      h["quantity"],
            "avg_buy_price": h["avg_buy_price"],
            "name":          h.get("name"),
            "asset_class":   h.get("asset_class", "equity_IN"),
            "currency":      h.get("currency", "INR"),
            "sector":        h.get("sector"),
            "source":        h.get("source", "csv_import"),
        }
        for h in holdings
    ]
    res = (
        supabase.table("holdings")
        .upsert(rows, on_conflict="user_id,ticker,exchange")
        .execute()
    )
    logger.info(f"Bulk upserted {len(res.data or [])} holdings for user {user_id}")
    return len(res.data or [])


# ══════════════════════════════════════════
# TRANSACTIONS
# ══════════════════════════════════════════

def get_transactions(
    user_id: str,
    ticker: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
) -> list[dict]:
    """Fetch transactions with optional filters."""
    q = (
        supabase.table("transactions")
        .select("*")
        .eq("user_id", user_id)
        .order("trade_date", desc=True)
    )
    if ticker:
        q = q.eq("ticker", ticker.upper())
    if from_date:
        q = q.gte("trade_date", from_date.isoformat())
    if to_date:
        q = q.lte("trade_date", to_date.isoformat())
    return q.execute().data or []


def add_transaction(user_id: str, payload: dict) -> dict:
    """
    Add a single transaction.
    payload keys: ticker, exchange, action, quantity, price, currency,
                  trade_date, broker, notes, source
    """
    data = {
        "user_id": user_id,
        **payload,
        "ticker":  payload["ticker"].upper(),
        "exchange": payload.get("exchange", "NSE").upper(),
        "action":  payload["action"].upper(),
    }
    res = supabase.table("transactions").insert(data).execute()
    return res.data[0] if res.data else {}


def bulk_insert_transactions(user_id: str, transactions: list[dict]) -> int:
    """Bulk insert transactions from CSV import."""
    rows = [
        {
            "user_id":    user_id,
            "ticker":     t["ticker"].upper(),
            "exchange":   t.get("exchange", "NSE").upper(),
            "action":     t["action"].upper(),
            "quantity":   t["quantity"],
            "price":      t["price"],
            "currency":   t.get("currency", "INR"),
            "trade_date": t["trade_date"],
            "broker":     t.get("broker"),
            "notes":      t.get("notes"),
            "source":     t.get("source", "csv_import"),
        }
        for t in transactions
    ]
    res = supabase.table("transactions").insert(rows).execute()
    logger.info(f"Bulk inserted {len(res.data or [])} transactions for user {user_id}")
    return len(res.data or [])


# ══════════════════════════════════════════
# TARGET ALLOCATIONS
# ══════════════════════════════════════════

def get_target_allocations(user_id: str) -> list[dict]:
    res = (
        supabase.table("target_allocations")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )
    return res.data or []


def set_target_allocation(user_id: str, asset_class: str, target_pct: float) -> dict:
    data = {
        "user_id":    user_id,
        "asset_class": asset_class,
        "target_pct":  target_pct,
        "updated_at":  datetime.utcnow().isoformat(),
    }
    res = (
        supabase.table("target_allocations")
        .upsert(data, on_conflict="user_id,asset_class")
        .execute()
    )
    return res.data[0] if res.data else {}


# ══════════════════════════════════════════
# PRICE CACHE
# ══════════════════════════════════════════

def get_cached_price(ticker: str, exchange: str = "NSE") -> Optional[dict]:
    """Returns cached price if it exists (freshness check done in caller)."""
    res = (
        supabase.table("price_cache")
        .select("*")
        .eq("ticker", ticker.upper())
        .eq("exchange", exchange.upper())
        .execute()
    )
    return res.data[0] if res.data else None


def upsert_price_cache(ticker: str, exchange: str, price: float,
                       currency: str = "INR", change_pct: float = None) -> None:
    data = {
        "ticker":     ticker.upper(),
        "exchange":   exchange.upper(),
        "price":      price,
        "currency":   currency,
        "change_pct": change_pct,
        "fetched_at": datetime.utcnow().isoformat(),
    }
    supabase.table("price_cache").upsert(data, on_conflict="ticker,exchange").execute()


def bulk_upsert_prices(prices: list[dict]) -> None:
    """Batch update price cache. Each dict: ticker, exchange, price, currency, change_pct."""
    rows = [
        {
            "ticker":     p["ticker"].upper(),
            "exchange":   p.get("exchange", "NSE").upper(),
            "price":      p["price"],
            "currency":   p.get("currency", "INR"),
            "change_pct": p.get("change_pct"),
            "fetched_at": datetime.utcnow().isoformat(),
        }
        for p in prices
    ]
    supabase.table("price_cache").upsert(rows, on_conflict="ticker,exchange").execute()


# ══════════════════════════════════════════
# WATCHLIST
# ══════════════════════════════════════════

def get_watchlist(user_id: str) -> list[dict]:
    res = (
        supabase.table("watchlist")
        .select("*")
        .eq("user_id", user_id)
        .order("added_at", desc=True)
        .execute()
    )
    return res.data or []


def add_to_watchlist(user_id: str, ticker: str, exchange: str = "NSE",
                     name: str = None, notes: str = None) -> dict:
    data = {
        "user_id":  user_id,
        "ticker":   ticker.upper(),
        "exchange": exchange.upper(),
        "name":     name,
        "notes":    notes,
    }
    res = (
        supabase.table("watchlist")
        .upsert(data, on_conflict="user_id,ticker,exchange")
        .execute()
    )
    return res.data[0] if res.data else {}


def remove_from_watchlist(user_id: str, ticker: str, exchange: str = "NSE") -> bool:
    res = (
        supabase.table("watchlist")
        .delete()
        .eq("user_id", user_id)
        .eq("ticker", ticker.upper())
        .eq("exchange", exchange.upper())
        .execute()
    )
    return bool(res.data)


# ══════════════════════════════════════════
# AI CONVERSATIONS
# ══════════════════════════════════════════

def save_message(user_id: str, session_id: str, role: str,
                 content: str, model: str = "gemini-2.0-flash",
                 tokens_used: int = None) -> dict:
    data = {
        "user_id":    user_id,
        "session_id": session_id,
        "role":       role,
        "content":    content,
        "model":      model,
        "tokens_used":tokens_used,
    }
    res = supabase.table("ai_conversations").insert(data).execute()
    return res.data[0] if res.data else {}


def get_conversation(session_id: str, limit: int = 50) -> list[dict]:
    """Fetch recent messages for a session, oldest first."""
    res = (
        supabase.table("ai_conversations")
        .select("role, content, created_at")
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .limit(limit)
        .execute()
    )
    return res.data or []


# ══════════════════════════════════════════
# UPLOAD SESSIONS
# ══════════════════════════════════════════

def create_upload_session(user_id: str, file_name: str, file_type: str) -> dict:
    data = {
        "user_id":   user_id,
        "file_name": file_name,
        "file_type": file_type,
        "status":    "pending",
    }
    res = supabase.table("upload_sessions").insert(data).execute()
    return res.data[0] if res.data else {}


def update_upload_session(session_id: str, status: str,
                          rows_imported: int = 0,
                          error_message: str = None,
                          ocr_raw_result: dict = None) -> dict:
    data = {
        "status":         status,
        "rows_imported":  rows_imported,
        "error_message":  error_message,
        "ocr_raw_result": ocr_raw_result,
    }
    res = (
        supabase.table("upload_sessions")
        .update(data)
        .eq("id", session_id)
        .execute()
    )
    return res.data[0] if res.data else {}


# ══════════════════════════════════════════
# PORTFOLIO SNAPSHOTS
# ══════════════════════════════════════════

def save_portfolio_snapshot(user_id: str, total_value: float,
                            total_invested: float, pnl_pct: float = None,
                            snapshot_date: date = None) -> dict:
    data = {
        "user_id":       user_id,
        "snapshot_date": (snapshot_date or date.today()).isoformat(),
        "total_value":   total_value,
        "total_invested":total_invested,
        "pnl_pct":       pnl_pct,
    }
    res = (
        supabase.table("portfolio_snapshots")
        .upsert(data, on_conflict="user_id,snapshot_date")
        .execute()
    )
    return res.data[0] if res.data else {}


def get_portfolio_history(user_id: str, days: int = 365) -> list[dict]:
    """Fetch daily portfolio value history for charting."""
    from_date = date.today().replace(year=date.today().year - 1)
    res = (
        supabase.table("portfolio_snapshots")
        .select("snapshot_date, total_value, total_invested, total_pnl, pnl_pct")
        .eq("user_id", user_id)
        .gte("snapshot_date", from_date.isoformat())
        .order("snapshot_date", desc=False)
        .execute()
    )
    return res.data or []


# ══════════════════════════════════════════
# PROFILE
# ══════════════════════════════════════════

def get_profile(user_id: str) -> Optional[dict]:
    res = (
        supabase.table("profiles")
        .select("*")
        .eq("id", user_id)
        .single()
        .execute()
    )
    return res.data


def update_profile(user_id: str, payload: dict) -> dict:
    res = (
        supabase.table("profiles")
        .update({**payload, "updated_at": datetime.utcnow().isoformat()})
        .eq("id", user_id)
        .execute()
    )
    return res.data[0] if res.data else {}
