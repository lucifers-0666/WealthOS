"""Live market engine with scheduler + websocket broadcasting."""

from __future__ import annotations

import asyncio
import time
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from backend.services.market_service import MarketService
from core.market_status import get_market_status
from database import get_holdings, get_portfolio_summary, get_watchlist, upsert_prices


_PRICE_FIELDS = {
    "ticker",
    "price",
    "price_inr",
    "change_pct",
    "change_abs",
    "volume",
    "market_cap",
    "day_high",
    "day_low",
    "week_52_high",
    "week_52_low",
    "currency",
    "exchange",
    "fetched_at",
}


class LiveMarketEngine:
    def __init__(self, market_service: MarketService | None = None) -> None:
        self.market_service = market_service or MarketService()
        self.scheduler = AsyncIOScheduler()
        self.connections: dict[str, set] = defaultdict(set)
        self._lock = asyncio.Lock()
        self._last_refresh: dict[str, float] = {}

    async def start(self) -> None:
        if self.scheduler.running:
            return
        self.scheduler.add_job(self.refresh_all, "interval", seconds=15, id="market-refresh", max_instances=1)
        self.scheduler.start()

    async def stop(self) -> None:
        if self.scheduler.running:
            self.scheduler.shutdown(wait=False)

    async def connect(self, websocket, user_id: str) -> None:
        await websocket.accept()
        async with self._lock:
            self.connections[user_id].add(websocket)
        await self.push_snapshot(user_id, websocket)

    async def disconnect(self, websocket, user_id: str) -> None:
        async with self._lock:
            if user_id in self.connections:
                self.connections[user_id].discard(websocket)
                if not self.connections[user_id]:
                    self.connections.pop(user_id, None)

    async def refresh_all(self) -> None:
        user_ids = list(self.connections.keys())
        if not user_ids:
            return
        await asyncio.gather(*(self.refresh_user(uid) for uid in user_ids))

    async def refresh_user(self, user_id: str, force: bool = False) -> None:
        now = time.time()
        status = get_market_status()
        cadence = 15 if status.get("is_open") else 300
        if not force and now - self._last_refresh.get(user_id, 0) < cadence:
            return

        holdings = get_holdings(user_id)
        watchlist = get_watchlist(user_id)

        symbols = []
        for h in holdings:
            symbols.append({
                "ticker": h.get("ticker"),
                "exchange": h.get("exchange"),
                "currency": h.get("currency"),
            })
        for w in watchlist:
            symbols.append({
                "ticker": w.get("ticker"),
                "exchange": w.get("exchange"),
                "currency": "INR",
            })

        quotes = self.market_service.fetch_prices(symbols)
        upsert_payload = [
            {k: v for k, v in vars(q).items() if k in _PRICE_FIELDS}
            for q in quotes.values()
        ]
        prices_persisted = False
        if upsert_payload:
            try:
                upsert_prices(upsert_payload)
                prices_persisted = True
            except Exception:
                pass

        portfolio_rows = self._merge_quotes_into_holdings(get_portfolio_summary(user_id), holdings, quotes)
        stale_tickers = [q.ticker for q in quotes.values() if q.is_stale]

        payload = {
            "type": "market_update",
            "market_status": status,
            "updated_at": time.time(),
            "holdings": portfolio_rows,
            "watchlist": watchlist,
            "stale_tickers": stale_tickers,
            "sources": {q.ticker: q.source for q in quotes.values()},
            "prices_persisted": prices_persisted,
        }

        await self.broadcast(user_id, payload)
        self._last_refresh[user_id] = now

    async def push_snapshot(self, user_id: str, websocket) -> None:
        await self.refresh_user(user_id, force=True)
        await self._send_safe(websocket, {"type": "snapshot_ready"})

    async def broadcast(self, user_id: str, payload: dict[str, Any]) -> None:
        sockets = list(self.connections.get(user_id, set()))
        if not sockets:
            return
        await asyncio.gather(*(self._send_safe(ws, payload) for ws in sockets))

    async def _send_safe(self, websocket, payload: dict[str, Any]) -> None:
        try:
            await websocket.send_json(payload)
        except Exception:
            pass

    def _merge_quotes_into_holdings(self, portfolio_rows: list[dict], raw_holdings: list[dict], quotes: dict[str, Any]) -> list[dict]:
        """Return rows with fresh quote math even when price_cache persistence is blocked."""
        source_rows = portfolio_rows if portfolio_rows else raw_holdings
        merged = []
        total_value = 0.0

        for row in source_rows:
            ticker = (row.get("ticker") or "").upper()
            quote = quotes.get(ticker)
            quantity = _to_float(row.get("quantity"))
            avg = _to_float(row.get("avg_buy_price") or row.get("avg_price"))
            invested = _to_float(row.get("invested_amount"), quantity * avg)

            price = _to_float(row.get("current_price_inr") or row.get("current_price"), avg)
            change_pct = _to_float(row.get("change_pct") or row.get("price_change_pct"))
            fetched_at = row.get("price_updated_at")

            if quote and quote.price:
                price = quote.price_inr or quote.price
                change_pct = quote.change_pct
                fetched_at = quote.fetched_at

            current_value = quantity * price if quantity and price else invested
            pnl = current_value - invested
            total_value += current_value

            merged.append({
                **row,
                "current_price": round(price, 4),
                "current_price_inr": round(price, 4),
                "current_value": round(current_value, 2),
                "invested_amount": round(invested, 2),
                "unrealized_pnl": round(pnl, 2),
                "unrealised_pnl": round(pnl, 2),
                "change_pct": round(change_pct, 4),
                "price_change_pct": round(change_pct, 4),
                "price_updated_at": fetched_at or datetime.now(timezone.utc).isoformat(),
            })

        for row in merged:
            if total_value:
                row["weight_pct"] = round((_to_float(row.get("current_value")) / total_value) * 100, 4)

        return merged


def _to_float(value, default=0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return float(default)
