"""Live market engine — async scheduler + WebSocket broadcasting."""

from __future__ import annotations

import asyncio
import logging
import time
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from backend.services.market_service import MarketService
from core.market_status import get_market_status
from database import get_holdings, get_portfolio_summary, get_watchlist

logger = logging.getLogger("wealthos.live_market")

_PRICE_FIELDS = {
    "ticker", "price", "price_inr", "change_pct", "change_abs",
    "volume", "market_cap", "day_high", "day_low",
    "week_52_high", "week_52_low", "currency", "exchange", "fetched_at",
}


class LiveMarketEngine:
    def __init__(self, market_service: MarketService | None = None) -> None:
        self.market_service = market_service or MarketService()
        self.scheduler = AsyncIOScheduler()
        # user_id -> set of live WebSocket connections
        self.connections: dict[str, set] = defaultdict(set)
        self._lock = asyncio.Lock()
        self._last_refresh: dict[str, float] = {}


def get_engine_status() -> dict[str, Any]:
    """Return live market engine health status."""
    return {"status": "ok", "engine": "live_market_engine"}


    # ── Lifecycle ──────────────────────────────────────────────────

    async def start(self) -> None:
        if self.scheduler.running:
            return
        self.scheduler.add_job(
            self.refresh_all,
            "interval",
            seconds=15,
            id="market-refresh",
            max_instances=1,
            coalesce=True,
        )
        self.scheduler.start()
        logger.info("LiveMarketEngine started")

    async def stop(self) -> None:
        if self.scheduler.running:
            self.scheduler.shutdown(wait=False)
        logger.info("LiveMarketEngine stopped")

    # ── Connection management ───────────────────────────────────────

    async def connect(self, websocket, user_id: str) -> None:
        """Accept a new WebSocket and immediately push a snapshot."""
        await websocket.accept()
        async with self._lock:
            self.connections[user_id].add(websocket)
        logger.debug("WS connected: user=%s total=%d", user_id, len(self.connections[user_id]))
        # Push snapshot in background so accept() returns fast
        asyncio.create_task(self.push_snapshot(user_id, websocket))

    async def disconnect(self, websocket, user_id: str) -> None:
        async with self._lock:
            self.connections.get(user_id, set()).discard(websocket)
            if not self.connections.get(user_id):
                self.connections.pop(user_id, None)
        logger.debug("WS disconnected: user=%s", user_id)

    # ── Refresh cycle ───────────────────────────────────────────────

    async def refresh_all(self) -> None:
        """Called by scheduler every 15 s. Refreshes all connected users."""
        user_ids = list(self.connections.keys())
        if not user_ids:
            return
        await asyncio.gather(*(self._safe_refresh(uid) for uid in user_ids))

    async def _safe_refresh(self, user_id: str) -> None:
        try:
            await self.refresh_user(user_id)
        except Exception as exc:
            logger.warning("refresh_user(%s) failed: %s", user_id, exc)

    async def refresh_user(self, user_id: str, force: bool = False) -> None:
        now = time.time()
        status = get_market_status()
        # During market hours refresh every 15 s; after hours every 5 min
        cadence = 15 if status.get("is_open") else 300
        if not force and now - self._last_refresh.get(user_id, 0) < cadence:
            return

        # Fetch holdings + watchlist in the thread pool to avoid blocking event loop
        loop = asyncio.get_running_loop()
        holdings, watchlist = await asyncio.gather(
            loop.run_in_executor(None, get_holdings, user_id),
            loop.run_in_executor(None, get_watchlist, user_id),
        )

        symbols: list[dict] = []
        for h in holdings:
            symbols.append({
                "ticker": h.get("ticker"),
                "exchange": h.get("exchange"),
                "currency": h.get("currency") or "INR",
            })
        for w in watchlist:
            symbols.append({
                "ticker": w.get("ticker"),
                "exchange": w.get("exchange"),
                "currency": "INR",
            })

        if not symbols:
            return

        # Run synchronous price fetch in thread pool
        quotes = await loop.run_in_executor(
            None, self.market_service.fetch_prices, symbols
        )

        # Persist prices (best-effort, don't crash if DB unavailable)
        upsert_payload = [
            {k: v for k, v in vars(q).items() if k in _PRICE_FIELDS}
            for q in quotes.values()
        ]
        if upsert_payload:
            try:
                from database import upsert_prices
                await loop.run_in_executor(None, upsert_prices, upsert_payload)
            except Exception as exc:
                logger.debug("upsert_prices skipped: %s", exc)

        # Build enriched portfolio rows
        portfolio_rows = await loop.run_in_executor(
            None, get_portfolio_summary, user_id
        )
        merged = self._merge_quotes_into_holdings(portfolio_rows, holdings, quotes)
        stale_tickers = [q.ticker for q in quotes.values() if q.is_stale]

        payload = {
            "type": "market_update",
            "market_status": status,
            "updated_at": time.time(),
            "holdings": merged,
            "watchlist": _enrich_watchlist(watchlist, quotes),
            "stale_tickers": stale_tickers,
            "sources": {q.ticker: q.source for q in quotes.values()},
        }

        await self.broadcast(user_id, payload)
        self._last_refresh[user_id] = now

    async def push_snapshot(self, user_id: str, websocket) -> None:
        """Push an immediate snapshot to a freshly connected socket.

        Use the safe refresh wrapper to ensure exceptions from per-user
        refreshes (DB/network issues) are caught and logged — avoid
        unhandled task exceptions bubbling out of background tasks.
        """
        # Use the safe wrapper which logs and swallows exceptions
        await self._safe_refresh(user_id)

        # Notify the socket that a snapshot is ready; _send_safe already
        # handles send failures and returns False on error.
        try:
            await self._send_safe(websocket, {"type": "snapshot_ready"})
        except Exception:
            # Defensive: _send_safe shouldn't raise, but guard anyway.
            logger.debug("push_snapshot: failed to send snapshot_ready to user=%s", user_id)

    # ── Broadcasting ────────────────────────────────────────────────

    async def broadcast(self, user_id: str, payload: dict[str, Any]) -> None:
        sockets = list(self.connections.get(user_id, set()))
        if not sockets:
            return
        dead: list = []
        for ws in sockets:
            ok = await self._send_safe(ws, payload)
            if not ok:
                dead.append(ws)
        # Prune dead sockets
        if dead:
            async with self._lock:
                live = self.connections.get(user_id, set())
                for ws in dead:
                    live.discard(ws)
                if not live:
                    self.connections.pop(user_id, None)
            logger.debug("Pruned %d dead socket(s) for user=%s", len(dead), user_id)

    async def _send_safe(self, websocket, payload: dict[str, Any]) -> bool:
        """Returns True if send succeeded, False if socket is dead."""
        try:
            await websocket.send_json(payload)
            return True
        except Exception:
            return False

    # ── Quote merging ───────────────────────────────────────────────

    def _merge_quotes_into_holdings(
        self,
        portfolio_rows: list[dict],
        raw_holdings: list[dict],
        quotes: dict[str, Any],
    ) -> list[dict]:
        """Overlay fresh quotes onto portfolio rows and recompute P&L."""
        source_rows = portfolio_rows if portfolio_rows else raw_holdings
        merged: list[dict] = []
        total_value = 0.0

        for row in source_rows:
            ticker = (row.get("ticker") or "").upper()
            quote = quotes.get(ticker)
            quantity = _to_float(row.get("quantity"))
            avg = _to_float(row.get("avg_buy_price") or row.get("avg_price"))
            invested = _to_float(row.get("invested_amount"), quantity * avg)

            price = _to_float(row.get("current_price_inr") or row.get("current_price"), avg)
            change_pct = _to_float(row.get("change_pct") or row.get("price_change_pct"))
            change_abs = _to_float(row.get("change_abs"))
            day_high = day_low = volume = week_52_high = week_52_low = market_cap = 0.0
            fetched_at = row.get("price_updated_at")
            source = row.get("price_source", "cached")

            if quote and quote.price:
                price = quote.price_inr or quote.price
                change_pct = quote.change_pct
                change_abs = quote.change_abs
                day_high = quote.day_high
                day_low = quote.day_low
                volume = quote.volume
                week_52_high = quote.week_52_high
                week_52_low = quote.week_52_low
                market_cap = quote.market_cap
                fetched_at = quote.fetched_at
                source = quote.source

            current_value = quantity * price if quantity and price else invested
            pnl = current_value - invested
            pnl_pct = (pnl / invested * 100) if invested else 0.0
            day_change = quantity * change_abs if quantity else 0.0
            day_change_pct = change_pct
            total_value += current_value

            merged.append({
                **row,
                "current_price": round(price, 4),
                "current_price_inr": round(price, 4),
                "current_value": round(current_value, 2),
                "invested_amount": round(invested, 2),
                "unrealized_pnl": round(pnl, 2),
                "unrealised_pnl": round(pnl, 2),
                "pnl_pct": round(pnl_pct, 4),
                "change_pct": round(change_pct, 4),
                "change_abs": round(change_abs, 4),
                "price_change_pct": round(change_pct, 4),
                "day_change": round(day_change, 2),
                "day_change_pct": round(day_change_pct, 4),
                "day_high": round(day_high, 4),
                "day_low": round(day_low, 4),
                "volume": round(volume, 0),
                "week_52_high": round(week_52_high, 4),
                "week_52_low": round(week_52_low, 4),
                "market_cap": round(market_cap, 0),
                "price_updated_at": fetched_at or datetime.now(timezone.utc).isoformat(),
                "price_source": source,
            })

        # Compute weight_pct after knowing total
        for row in merged:
            row["weight_pct"] = round(
                (_to_float(row.get("current_value")) / total_value * 100) if total_value else 0.0, 4
            )

        return merged


# ── Helpers ─────────────────────────────────────────────────────────

def _to_float(value, default: float = 0.0) -> float:
    try:
        v = float(value)
        return v if v == v else default  # NaN guard
    except (TypeError, ValueError):
        return float(default)


def _enrich_watchlist(watchlist: list[dict], quotes: dict[str, Any]) -> list[dict]:
    """Attach live price fields to watchlist items."""
    enriched = []
    for item in watchlist:
        ticker = (item.get("ticker") or "").upper()
        q = quotes.get(ticker)
        if q and q.price:
            enriched.append({
                **item,
                "current_price": round(q.price_inr or q.price, 4),
                "change_pct": round(q.change_pct, 4),
                "change_abs": round(q.change_abs, 4),
                "day_high": round(q.day_high, 4),
                "day_low": round(q.day_low, 4),
                "price_source": q.source,
                "price_updated_at": q.fetched_at,
                "is_stale": q.is_stale,
            })
        else:
            enriched.append(item)
    return enriched
