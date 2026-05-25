"""
WealthOS DB Price Layer — upsert_prices(), snapshot helpers
Works with Supabase via the existing database client.
"""
import logging
from datetime import datetime
from typing import List, Dict, Any
from zoneinfo import ZoneInfo

logger = logging.getLogger("wealthos.db_prices")
IST = ZoneInfo("Asia/Kolkata")


def upsert_prices(supabase, prices: List[Dict[str, Any]]) -> bool:
    """
    Upsert live prices into the `prices` table.
    Deduplicates by symbol, keeps latest LTP + timestamp.
    Creates table-safe records — skips rows with missing symbol or ltp.
    """
    if not prices:
        return True
    try:
        rows = []
        for p in prices:
            sym = p.get("symbol")
            ltp = p.get("ltp")
            if not sym or ltp is None:
                continue
            rows.append({
                "symbol": str(sym),
                "ltp": float(ltp),
                "prev_close": float(p.get("prev_close", 0)),
                "change": float(p.get("change", 0)),
                "change_pct": float(p.get("change_pct", 0)),
                "day_high": float(p.get("day_high", 0)),
                "day_low": float(p.get("day_low", 0)),
                "week_52_high": float(p.get("week_52_high", 0)),
                "week_52_low": float(p.get("week_52_low", 0)),
                "volume": int(p.get("volume", 0)),
                "market_cap": int(p.get("market_cap", 0)),
                "updated_at": datetime.now(IST).isoformat(),
            })
        if rows:
            supabase.table("prices").upsert(rows, on_conflict="symbol").execute()
        return True
    except Exception as e:
        logger.warning("upsert_prices failed: %s", e)
        return False


def save_portfolio_snapshot(supabase, user_id: str, total_value: float,
                             total_invested: float, total_pnl: float) -> bool:
    """Save a portfolio snapshot for historical P&L tracking."""
    try:
        supabase.table("portfolio_snapshots").insert({
            "user_id": user_id,
            "total_value": round(total_value, 2),
            "total_invested": round(total_invested, 2),
            "total_pnl": round(total_pnl, 2),
            "timestamp": datetime.now(IST).isoformat(),
        }).execute()
        return True
    except Exception as e:
        logger.warning("save_portfolio_snapshot failed: %s", e)
        return False


def get_portfolio_history(supabase, user_id: str, days: int = 30) -> List[Dict]:
    """Fetch portfolio snapshot history for charts."""
    try:
        from datetime import timedelta
        since = (datetime.now(IST) - timedelta(days=days)).isoformat()
        res = (
            supabase.table("portfolio_snapshots")
            .select("total_value,total_invested,total_pnl,timestamp")
            .eq("user_id", user_id)
            .gte("timestamp", since)
            .order("timestamp", desc=False)
            .execute()
        )
        return res.data or []
    except Exception as e:
        logger.warning("get_portfolio_history failed: %s", e)
        return []
