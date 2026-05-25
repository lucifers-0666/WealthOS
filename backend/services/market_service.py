"""Market data service with provider fallbacks, batch yfinance, and cache support."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Iterable

import requests
import yfinance as yf

from config import ALPHA_VANTAGE_KEY, TWELVE_DATA_KEY, FINNHUB_KEY, INR_USD_FALLBACK, EXCHANGE_SUFFIX
from core.price_fetcher import get_inr_usd_rate
from database import get_cached_prices


@dataclass
class PriceQuote:
    ticker: str
    exchange: str | None
    price: float
    price_inr: float
    change_pct: float
    change_abs: float
    currency: str
    source: str
    fetched_at: str
    is_stale: bool
    volume: float = 0.0
    day_high: float = 0.0
    day_low: float = 0.0
    week_52_high: float = 0.0
    week_52_low: float = 0.0
    market_cap: float = 0.0


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_symbol(ticker: str, exchange: str | None) -> str:
    base = ticker.strip().upper()
    if "." in base:
        return base
    suffix = EXCHANGE_SUFFIX.get((exchange or "").upper(), "")
    return f"{base}{suffix}"


def _twelve_data_symbol(ticker: str, exchange: str | None) -> str:
    base = ticker.strip().upper()
    if exchange and exchange.upper() in {"NSE", "BSE"}:
        return f"{exchange.upper()}:{base}"
    return base


def _alphavantage_symbol(ticker: str, exchange: str | None) -> str:
    base = ticker.strip().upper()
    if exchange and exchange.upper() == "NSE":
        return f"{base}.NS"
    if exchange and exchange.upper() == "BSE":
        return f"{base}.BSE"
    return base


def _convert_to_inr(price: float, currency: str) -> float:
    if currency.upper() == "INR":
        return price
    if currency.upper() == "USD":
        rate = get_inr_usd_rate() or INR_USD_FALLBACK
        return price * rate
    return price


def _safe_float(value, default: float = 0.0) -> float:
    try:
        v = float(value)
        return v if v == v else default  # NaN guard
    except (TypeError, ValueError):
        return float(default)


class MarketService:
    """Fetches prices with batch yfinance and a provider fallback chain."""

    def __init__(
        self,
        *,
        alpha_vantage_key: str | None = None,
        twelve_data_key: str | None = None,
        finnhub_key: str | None = None,
    ):
        self.alpha_vantage_key = alpha_vantage_key or ALPHA_VANTAGE_KEY or ""
        self.twelve_data_key = twelve_data_key or TWELVE_DATA_KEY or ""
        self.finnhub_key = finnhub_key or FINNHUB_KEY or ""

    # ── Public API ──────────────────────────────────────────────────

    def fetch_prices(self, symbols: Iterable[dict]) -> dict[str, PriceQuote]:
        """
        Fetch quotes for a list of symbol dicts: {ticker, exchange, currency}.
        Uses batch yfinance first, then falls back per-ticker to other providers.
        """
        symbols = list(symbols)
        if not symbols:
            return {}

        # Deduplicate by ticker
        seen: set[str] = set()
        unique: list[dict] = []
        for s in symbols:
            t = (s.get("ticker") or "").strip().upper()
            if t and t not in seen:
                seen.add(t)
                unique.append({**s, "ticker": t})

        tickers = [s["ticker"] for s in unique]
        try:
            cached = get_cached_prices(tickers)
        except Exception:
            cached = {}

        # --- Batch yfinance fetch ---
        yf_results = self._batch_yfinance(unique)

        results: dict[str, PriceQuote] = {}
        fallback_needed: list[dict] = []

        for item in unique:
            ticker = item["ticker"]
            quote = yf_results.get(ticker)
            if quote:
                results[ticker] = quote
            else:
                fallback_needed.append(item)

        # --- Per-ticker fallback for misses ---
        for item in fallback_needed:
            ticker = item["ticker"]
            exchange = item.get("exchange") or None
            currency = (item.get("currency") or "INR").upper()

            quote = (
                self._from_alpha_vantage(ticker, exchange, currency)
                or self._from_twelve_data(ticker, exchange, currency)
                or self._from_finnhub(ticker, exchange, currency)
            )

            if not quote:
                cached_row = cached.get(ticker)
                if cached_row:
                    results[ticker] = PriceQuote(
                        ticker=ticker,
                        exchange=cached_row.get("exchange") or exchange,
                        price=_safe_float(cached_row.get("price")),
                        price_inr=_safe_float(cached_row.get("price_inr")),
                        change_pct=_safe_float(cached_row.get("change_pct")),
                        change_abs=_safe_float(cached_row.get("change_abs")),
                        volume=_safe_float(cached_row.get("volume")),
                        day_high=_safe_float(cached_row.get("day_high")),
                        day_low=_safe_float(cached_row.get("day_low")),
                        week_52_high=_safe_float(cached_row.get("week_52_high")),
                        week_52_low=_safe_float(cached_row.get("week_52_low")),
                        market_cap=_safe_float(cached_row.get("market_cap")),
                        currency=cached_row.get("currency") or currency,
                        source="cache",
                        fetched_at=cached_row.get("fetched_at") or _now_iso(),
                        is_stale=True,
                    )
                else:
                    results[ticker] = PriceQuote(
                        ticker=ticker,
                        exchange=exchange,
                        price=0.0,
                        price_inr=0.0,
                        change_pct=0.0,
                        change_abs=0.0,
                        currency=currency,
                        source="unavailable",
                        fetched_at=_now_iso(),
                        is_stale=True,
                    )
            else:
                results[ticker] = quote

        return results

    # ── Batch yfinance (single network round-trip for all tickers) ──

    def _batch_yfinance(self, items: list[dict]) -> dict[str, PriceQuote]:
        """
        Download all tickers in one yf.download() call.
        Returns a dict of ticker -> PriceQuote for successfully fetched tickers.
        """
        if not items:
            return {}

        # Build yf_symbol -> original ticker mapping
        sym_map: dict[str, dict] = {}
        for item in items:
            ticker = item["ticker"]
            exchange = item.get("exchange")
            yf_sym = _normalize_symbol(ticker, exchange)
            sym_map[yf_sym] = item

        yf_symbols = list(sym_map.keys())
        results: dict[str, PriceQuote] = {}

        try:
            # Use Tickers for batch info (non-blocking per symbol, but single session)
            tickers_obj = yf.Tickers(" ".join(yf_symbols))

            for yf_sym, item in sym_map.items():
                ticker = item["ticker"]
                exchange = item.get("exchange")
                currency = (item.get("currency") or "INR").upper()
                try:
                    t = tickers_obj.tickers.get(yf_sym)
                    if t is None:
                        continue
                    info = t.fast_info
                    price = _safe_float(getattr(info, "last_price", None))
                    if not price:
                        # fallback to 2-day history
                        hist = t.history(period="2d")
                        if not hist.empty:
                            price = _safe_float(hist["Close"].iloc[-1])
                    if not price:
                        continue

                    prev = _safe_float(getattr(info, "previous_close", None), price)
                    change_abs = price - prev
                    change_pct = (change_abs / prev * 100) if prev else 0.0
                    currency_val = getattr(info, "currency", None) or currency
                    price_inr = _convert_to_inr(price, currency_val)

                    results[ticker] = PriceQuote(
                        ticker=ticker,
                        exchange=exchange,
                        price=round(price, 4),
                        price_inr=round(price_inr, 4),
                        change_pct=round(change_pct, 4),
                        change_abs=round(change_abs, 4),
                        volume=_safe_float(getattr(info, "three_month_average_volume", None)),
                        day_high=_safe_float(getattr(info, "day_high", None)),
                        day_low=_safe_float(getattr(info, "day_low", None)),
                        week_52_high=_safe_float(getattr(info, "year_high", None)),
                        week_52_low=_safe_float(getattr(info, "year_low", None)),
                        market_cap=_safe_float(getattr(info, "market_cap", None)),
                        currency=currency_val,
                        source="yfinance",
                        fetched_at=_now_iso(),
                        is_stale=False,
                    )
                except Exception:
                    continue
        except Exception:
            pass

        return results

    # ── Fallback providers (per-ticker) ────────────────────────────

    def _from_alpha_vantage(self, ticker: str, exchange: str | None, currency: str) -> PriceQuote | None:
        if not self.alpha_vantage_key:
            return None
        symbol = _alphavantage_symbol(ticker, exchange)
        try:
            resp = requests.get(
                "https://www.alphavantage.co/query",
                params={"function": "GLOBAL_QUOTE", "symbol": symbol, "apikey": self.alpha_vantage_key},
                timeout=6,
            )
            data = resp.json() if resp.ok else {}
            quote = data.get("Global Quote") or {}
            price = _safe_float(quote.get("05. price"))
            prev = _safe_float(quote.get("08. previous close"), price)
            if not price:
                return None
            change_abs = price - prev
            change_pct = (change_abs / prev * 100) if prev else 0.0
            price_inr = _convert_to_inr(price, currency)
            return PriceQuote(
                ticker=ticker,
                exchange=exchange,
                price=round(price, 4),
                price_inr=round(price_inr, 4),
                change_pct=round(change_pct, 4),
                change_abs=round(change_abs, 4),
                volume=_safe_float(quote.get("06. volume")),
                day_high=_safe_float(quote.get("03. high")),
                day_low=_safe_float(quote.get("04. low")),
                currency=currency,
                source="alpha_vantage",
                fetched_at=_now_iso(),
                is_stale=False,
            )
        except Exception:
            return None

    def _from_twelve_data(self, ticker: str, exchange: str | None, currency: str) -> PriceQuote | None:
        if not self.twelve_data_key:
            return None
        symbol = _twelve_data_symbol(ticker, exchange)
        try:
            resp = requests.get(
                "https://api.twelvedata.com/quote",
                params={"symbol": symbol, "apikey": self.twelve_data_key},
                timeout=6,
            )
            data = resp.json() if resp.ok else {}
            price = _safe_float(data.get("close"))
            if not price:
                return None
            prev = _safe_float(data.get("previous_close"), price)
            change_abs = price - prev
            change_pct = (change_abs / prev * 100) if prev else 0.0
            price_inr = _convert_to_inr(price, currency)
            return PriceQuote(
                ticker=ticker,
                exchange=exchange,
                price=round(price, 4),
                price_inr=round(price_inr, 4),
                change_pct=round(change_pct, 4),
                change_abs=round(change_abs, 4),
                volume=_safe_float(data.get("volume")),
                day_high=_safe_float(data.get("high")),
                day_low=_safe_float(data.get("low")),
                week_52_high=_safe_float(data.get("fifty_two_week", {}).get("high") if isinstance(data.get("fifty_two_week"), dict) else 0),
                week_52_low=_safe_float(data.get("fifty_two_week", {}).get("low") if isinstance(data.get("fifty_two_week"), dict) else 0),
                currency=currency,
                source="twelvedata",
                fetched_at=_now_iso(),
                is_stale=False,
            )
        except Exception:
            return None

    def _from_finnhub(self, ticker: str, exchange: str | None, currency: str) -> PriceQuote | None:
        if not self.finnhub_key:
            return None
        try:
            resp = requests.get(
                "https://finnhub.io/api/v1/quote",
                params={"symbol": ticker, "token": self.finnhub_key},
                timeout=6,
            )
            data = resp.json() if resp.ok else {}
            price = _safe_float(data.get("c"))
            prev = _safe_float(data.get("pc"), price)
            if not price:
                return None
            change_abs = price - prev
            change_pct = (change_abs / prev * 100) if prev else 0.0
            price_inr = _convert_to_inr(price, currency)
            return PriceQuote(
                ticker=ticker,
                exchange=exchange,
                price=round(price, 4),
                price_inr=round(price_inr, 4),
                change_pct=round(change_pct, 4),
                change_abs=round(change_abs, 4),
                day_high=_safe_float(data.get("h")),
                day_low=_safe_float(data.get("l")),
                currency=currency,
                source="finnhub",
                fetched_at=_now_iso(),
                is_stale=False,
            )
        except Exception:
            return None
