"""
WealthOS — CRUD Operations for Supabase
All database operations go through these functions.
Import get_supabase() and call these helpers from api.py.
"""

from __future__ import annotations
from typing import Optional
from datetime import datetime, date
from uuid import UUID
import pandas as pd

from database.supabase_client import get_supabase, get_supabase_service


# ============================================================
# PROFILES
# ============================================================

def get_or_create_profile(user_id: str, full_name: str = None) -> dict:
    sb = get_supabase()
    res = sb.table("profiles").select("*").eq("id", user_id).maybe_single().execute()
    if res.data:
        return res.data
    new_profile = {"id": user_id, "full_name": full_name}
    ins = sb.table("profiles").insert(new_profile).execute()
    return ins.data[0]


def update_profile(user_id: str, updates: dict) -> dict:
    sb = get_supabase()
    res = sb.table("profiles").update(updates).eq("id", user_id).execute()
    return res.data[0] if res.data else {}


# ============================================================
# HOLDINGS
# ============================================================

def get_holdings(user_id: str, active_only: bool = True) -> list[dict]:
    sb = get_supabase()
    q = sb.table("holdings").select("*").eq("user_id", user_id)
    if active_only:
        q = q.eq("is_active", True)
    res = q.order("created_at", desc=True).execute()
    return res.data or []


def get_portfolio_summary(user_id: str) -> list[dict]:
    """Returns holdings joined with live prices via the portfolio_summary view."""
    sb = get_supabase()
    res = (
        sb.table("portfolio_summary")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )
    return res.data or []


def upsert_holding(user_id: str, holding: dict) -> dict:
    """
    Insert or update a holding. Matches on (user_id, ticker, exchange).
    Pass full holding dict including: ticker, quantity, avg_buy_price, exchange, asset_class.
    """
    sb = get_supabase()
    payload = {**holding, "user_id": user_id}
    res = (
        sb.table("holdings")
        .upsert(payload, on_conflict="user_id,ticker,exchange")
        .execute()
    )
    return res.data[0] if res.data else {}


def bulk_upsert_holdings(user_id: str, holdings: list[dict]) -> list[dict]:
    """Bulk upsert from CSV/OCR uploads. Each dict must have ticker, quantity, avg_buy_price."""
    sb = get_supabase()
    payloads = [{**h, "user_id": user_id} for h in holdings]
    res = (
        sb.table("holdings")
        .upsert(payloads, on_conflict="user_id,ticker,exchange")
        .execute()
    )
    return res.data or []


def delete_holding(user_id: str, holding_id: str) -> bool:
    sb = get_supabase()
    res = (
        sb.table("holdings")
        .update({"is_active": False})
        .eq("id", holding_id)
        .eq("user_id", user_id)
        .execute()
    )
    return bool(res.data)


def holdings_to_dataframe(holdings: list[dict]) -> pd.DataFrame:
    """Convert holdings list to a pandas DataFrame for chart/analysis use."""
    if not holdings:
        return pd.DataFrame()
    df = pd.DataFrame(holdings)
    numeric_cols = ["quantity", "avg_buy_price", "current_price",
                    "current_price_inr", "unrealized_pnl", "invested_amount"]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


# ============================================================
# TRANSACTIONS
# ============================================================

def get_transactions(
    user_id: str,
    ticker: str = None,
    action: str = None,
    from_date: date = None,
    to_date: date = None,
    limit: int = 500
) -> list[dict]:
    sb = get_supabase()
    q = sb.table("transactions").select("*").eq("user_id", user_id)
    if ticker:
        q = q.eq("ticker", ticker)
    if action:
        q = q.eq("action", action)
    if from_date:
        q = q.gte("transaction_date", str(from_date))
    if to_date:
        q = q.lte("transaction_date", str(to_date))
    res = q.order("transaction_date", desc=True).limit(limit).execute()
    return res.data or []


def add_transaction(user_id: str, txn: dict) -> dict:
    sb = get_supabase()
    payload = {**txn, "user_id": user_id}
    res = sb.table("transactions").insert(payload).execute()
    return res.data[0] if res.data else {}


def bulk_add_transactions(user_id: str, txns: list[dict]) -> list[dict]:
    sb = get_supabase()
    payloads = [{**t, "user_id": user_id} for t in txns]
    res = sb.table("transactions").insert(payloads).execute()
    return res.data or []


def transactions_to_dataframe(transactions: list[dict]) -> pd.DataFrame:
    if not transactions:
        return pd.DataFrame()
    df = pd.DataFrame(transactions)
    df["transaction_date"] = pd.to_datetime(df["transaction_date"])
    for col in ["quantity", "price", "total_amount", "brokerage", "tax"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


# ============================================================
# PRICE CACHE
# ============================================================

def get_cached_prices(tickers: list[str]) -> dict[str, dict]:
    """Fetch prices from cache. Returns dict keyed by ticker."""
    sb = get_supabase()
    res = sb.table("price_cache").select("*").in_("ticker", tickers).execute()
    return {row["ticker"]: row for row in (res.data or [])}


def upsert_prices(prices: list[dict]) -> None:
    """Write fetched prices back to cache. Use service role for writes."""
    sb = get_supabase_service()
    sb.table("price_cache").upsert(prices, on_conflict="ticker").execute()


def is_price_stale(fetched_at_str: str, ttl_minutes: int = 5) -> bool:
    """Check if a cached price is older than ttl_minutes."""
    from datetime import timezone
    if not fetched_at_str:
        return True
    fetched_at = datetime.fromisoformat(fetched_at_str.replace("Z", "+00:00"))
    age = datetime.now(timezone.utc) - fetched_at
    return age.total_seconds() > ttl_minutes * 60


# ============================================================
# TARGET ALLOCATIONS
# ============================================================

def get_target_allocation(user_id: str) -> list[dict]:
    sb = get_supabase()
    res = sb.table("target_allocations").select("*").eq("user_id", user_id).execute()
    return res.data or []


def set_target_allocation(user_id: str, allocations: list[dict]) -> list[dict]:
    """Full replace of target allocations. Pass list of {asset_class, target_pct}."""
    sb = get_supabase()
    payloads = [{**a, "user_id": user_id} for a in allocations]
    res = (
        sb.table("target_allocations")
        .upsert(payloads, on_conflict="user_id,asset_class")
        .execute()
    )
    return res.data or []


# ============================================================
# AI CONVERSATIONS
# ============================================================

def save_message(user_id: str, session_id: str, role: str, content: str,
                 portfolio_snapshot: dict = None, tokens: int = 0, model: str = "gemini-1.5-pro") -> dict:
    sb = get_supabase()
    payload = {
        "user_id": user_id,
        "session_id": session_id,
        "role": role,
        "content": content,
        "portfolio_snapshot": portfolio_snapshot,
        "tokens_used": tokens,
        "model": model
    }
    res = sb.table("ai_conversations").insert(payload).execute()
    return res.data[0] if res.data else {}


def get_conversation_history(user_id: str, session_id: str, limit: int = 50) -> list[dict]:
    sb = get_supabase()
    res = (
        sb.table("ai_conversations")
        .select("role, content, created_at")
        .eq("user_id", user_id)
        .eq("session_id", session_id)
        .order("created_at")
        .limit(limit)
        .execute()
    )
    return res.data or []


# ============================================================
# WATCHLIST
# ============================================================

def get_watchlist(user_id: str) -> list[dict]:
    sb = get_supabase()
    res = sb.table("watchlist").select("*").eq("user_id", user_id).execute()
    return res.data or []


def add_to_watchlist(user_id: str, ticker: str, exchange: str = "NSE",
                     company_name: str = None, target_price: float = None) -> dict:
    sb = get_supabase()
    payload = {
        "user_id": user_id,
        "ticker": ticker,
        "exchange": exchange,
        "company_name": company_name,
        "target_price": target_price
    }
    res = sb.table("watchlist").upsert(payload, on_conflict="user_id,ticker").execute()
    return res.data[0] if res.data else {}


def remove_from_watchlist(user_id: str, ticker: str) -> bool:
    sb = get_supabase()
    res = sb.table("watchlist").delete().eq("user_id", user_id).eq("ticker", ticker).execute()
    return bool(res.data)


# ============================================================
# UPLOAD SESSIONS
# ============================================================

def create_upload_session(user_id: str, file_name: str, file_type: str) -> dict:
    sb = get_supabase()
    payload = {"user_id": user_id, "file_name": file_name, "file_type": file_type, "status": "pending"}
    res = sb.table("upload_sessions").insert(payload).execute()
    return res.data[0] if res.data else {}


def update_upload_session(session_id: str, status: str,
                          recognized_data: dict = None, error: str = None) -> dict:
    sb = get_supabase()
    payload = {"status": status}
    if recognized_data:
        payload["recognized_data"] = recognized_data
    if error:
        payload["error_message"] = error
    if status == "completed":
        payload["completed_at"] = datetime.utcnow().isoformat()
    res = sb.table("upload_sessions").update(payload).eq("id", session_id).execute()
    return res.data[0] if res.data else {}
