"""Market data service with provider fallbacks and cache support."""

from __future__ import annotations

from dataclasses import dataclass
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


def _safe_float(value, default=0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return float(default)


class MarketService:
    """Fetches prices with a provider fallback chain."""

    def __init__(self, *, alpha_vantage_key: str | None = None, twelve_data_key: str | None = None, finnhub_key: str | None = None):
        self.alpha_vantage_key = alpha_vantage_key or ALPHA_VANTAGE_KEY or ""
        self.twelve_data_key = twelve_data_key or TWELVE_DATA_KEY or ""
        self.finnhub_key = finnhub_key or FINNHUB_KEY or ""

    def fetch_prices(self, symbols: Iterable[dict]) -> dict[str, PriceQuote]:
        """Fetch quotes for a list of symbols.

        symbols: Iterable of dicts with keys: ticker, exchange, currency (optional)
        """
        symbols = list(symbols)
        tickers = [s.get("ticker") for s in symbols if s.get("ticker")]
        cached = get_cached_prices(tickers) if tickers else {}
        results: dict[str, PriceQuote] = {}

        for item in symbols:
            ticker = (item.get("ticker") or "").strip().upper()
            if not ticker:
                continue
            exchange = item.get("exchange") or None
            currency = (item.get("currency") or "INR").upper()

            quote = (
                self._from_yfinance(ticker, exchange, currency)
                or self._from_alpha_vantage(ticker, exchange, currency)
                or self._from_twelve_data(ticker, exchange, currency)
                or self._from_finnhub(ticker, exchange, currency)
            )

            if not quote:
                cached_row = cached.get(ticker)
                if cached_row:
                    results[ticker] = PriceQuote(
                        ticker=ticker,
                        exchange=cached_row.get("exchange") or exchange,
                        price=_safe_float(cached_row.get("price"), 0.0),
                        price_inr=_safe_float(cached_row.get("price_inr"), 0.0),
                        change_pct=_safe_float(cached_row.get("change_pct"), 0.0),
                        change_abs=_safe_float(cached_row.get("change_abs"), 0.0),
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
                continue

            results[ticker] = quote

        return results

    def _from_yfinance(self, ticker: str, exchange: str | None, currency: str) -> PriceQuote | None:
        yf_symbol = _normalize_symbol(ticker, exchange)
        try:
            info = yf.Ticker(yf_symbol).fast_info
            price = _safe_float(getattr(info, "last_price", None))
            if not price:
                hist = yf.Ticker(yf_symbol).history(period="2d")
                if not hist.empty:
                    price = _safe_float(hist["Close"].iloc[-1])
            if not price:
                return None
            prev = _safe_float(getattr(info, "previous_close", None), price)
            change_abs = price - prev
            change_pct = (change_abs / prev * 100) if prev else 0.0
            currency_val = getattr(info, "currency", None) or currency
            price_inr = _convert_to_inr(price, currency_val)
            return PriceQuote(
                ticker=ticker,
                exchange=exchange,
                price=round(price, 4),
                price_inr=round(price_inr, 4),
                change_pct=round(change_pct, 4),
                change_abs=round(change_abs, 4),
                currency=currency_val,
                source="yfinance",
                fetched_at=_now_iso(),
                is_stale=False,
            )
        except Exception:
            return None

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
                currency=currency,
                source="finnhub",
                fetched_at=_now_iso(),
                is_stale=False,
            )
        except Exception:
            return None
