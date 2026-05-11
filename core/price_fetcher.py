"""
WealthOS — Price Fetcher with Supabase Cache
Fetches live prices via yfinance, caches in Supabase price_cache table.
Falls back to Alpha Vantage if yfinance fails.
"""

import os
import time
from typing import Optional
from datetime import datetime, timezone

import yfinance as yf

try:
    from database.crud import get_cached_prices, upsert_prices, is_price_stale
    DB_AVAILABLE = True
except Exception:
    DB_AVAILABLE = False

PRICE_TTL_MINUTES = 5


def _get_inr_rate() -> float:
    """Fetch USD/INR rate. Cached in price_cache as 'USDINR=X'."""
    if DB_AVAILABLE:
        cached = get_cached_prices(["USDINR=X"])
        if cached and not is_price_stale(cached["USDINR=X"].get("fetched_at", "")):
            return float(cached["USDINR=X"]["price"])
    try:
        t = yf.Ticker("USDINR=X")
        rate = t.fast_info.last_price
        if DB_AVAILABLE and rate:
            upsert_prices([{"ticker": "USDINR=X", "price": rate, "price_inr": rate, "currency": "INR"}])
        return float(rate) if rate else 84.0
    except Exception:
        return 84.0  # fallback rate


def fetch_prices(tickers: list[str], force_refresh: bool = False) -> dict[str, dict]:
    """
    Fetch live prices for a list of tickers.
    Returns dict: { ticker -> { price, price_inr, change_pct, change_abs, currency, fetched_at } }

    - NSE tickers must end with .NS  (e.g. RELIANCE.NS)
    - BSE tickers must end with .BO  (e.g. RELIANCE.BO)
    - US tickers are bare (e.g. AAPL, VTI, QQQ)
    """
    if not tickers:
        return {}

    results = {}

    # Check cache first
    if DB_AVAILABLE and not force_refresh:
        cached = get_cached_prices(tickers)
        fresh_tickers = []
        for t in tickers:
            if t in cached and not is_price_stale(cached[t].get("fetched_at", ""), PRICE_TTL_MINUTES):
                results[t] = cached[t]
            else:
                fresh_tickers.append(t)
        tickers = fresh_tickers

    if not tickers:
        return results

    inr_rate = _get_inr_rate()
    to_cache = []

    # Batch fetch via yfinance
    try:
        tickers_str = " ".join(tickers)
        data = yf.download(
            tickers_str,
            period="2d",
            interval="1d",
            group_by="ticker",
            auto_adjust=True,
            progress=False,
            threads=True
        )
    except Exception as e:
        print(f"[price_fetcher] yfinance batch error: {e}")
        data = None

    for ticker in tickers:
        try:
            t_obj = yf.Ticker(ticker)
            info = t_obj.fast_info
            price = info.last_price
            prev_close = info.previous_close or price
            currency = getattr(info, "currency", "INR") or "INR"

            if price is None:
                continue

            change_abs = price - prev_close if prev_close else 0
            change_pct = (change_abs / prev_close * 100) if prev_close else 0
            price_inr = price * inr_rate if currency == "USD" else price

            row = {
                "ticker": ticker,
                "price": round(price, 4),
                "price_inr": round(price_inr, 4),
                "change_pct": round(change_pct, 4),
                "change_abs": round(change_abs, 4),
                "currency": currency,
                "fetched_at": datetime.now(timezone.utc).isoformat()
            }
            results[ticker] = row
            to_cache.append(row)

        except Exception as e:
            print(f"[price_fetcher] Error for {ticker}: {e}")
            # Try Alpha Vantage fallback for critical tickers
            fallback = _alpha_vantage_fallback(ticker, inr_rate)
            if fallback:
                results[ticker] = fallback
                to_cache.append(fallback)

    # Write back to Supabase cache
    if DB_AVAILABLE and to_cache:
        try:
            upsert_prices(to_cache)
        except Exception as e:
            print(f"[price_fetcher] Cache write error: {e}")

    return results


def _alpha_vantage_fallback(ticker: str, inr_rate: float) -> Optional[dict]:
    """Fallback to Alpha Vantage for a single ticker."""
    api_key = os.getenv("ALPHA_VANTAGE_KEY")
    if not api_key:
        return None
    try:
        import requests
        url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={ticker}&apikey={api_key}"
        r = requests.get(url, timeout=5)
        q = r.json().get("Global Quote", {})
        price = float(q.get("05. price", 0))
        prev = float(q.get("08. previous close", price))
        change_abs = price - prev
        change_pct = (change_abs / prev * 100) if prev else 0
        currency = "USD" if not ticker.endswith((".NS", ".BO")) else "INR"
        price_inr = price * inr_rate if currency == "USD" else price
        return {
            "ticker": ticker,
            "price": round(price, 4),
            "price_inr": round(price_inr, 4),
            "change_pct": round(change_pct, 4),
            "change_abs": round(change_abs, 4),
            "currency": currency,
            "fetched_at": datetime.now(timezone.utc).isoformat()
        }
    except Exception:
        return None


def get_price(ticker: str) -> Optional[float]:
    """Convenience: get just the price for one ticker in INR."""
    res = fetch_prices([ticker])
    return res.get(ticker, {}).get("price_inr")
