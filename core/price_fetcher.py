import yfinance as yf
import pandas as pd
from datetime import datetime
import streamlit as st
import time

# ---------- helpers ----------

def _safe_ticker(symbol: str) -> str:
    """Ensure NSE tickers end with .NS, BSE with .BO, leave others alone."""
    s = symbol.strip().upper()
    if s in ("GOLDBEES", "LIQUIDBEES", "NIFTYBEES"):
        return s + ".NS"
    # already qualified
    if "." in s:
        return s
    # international ETFs / US stocks — leave bare
    intl = {"VTI", "QQQ", "SPY", "IVV", "INDA", "EEM", "GLD", "IAU", "TLT", "AGG"}
    if s in intl:
        return s
    # default: assume NSE
    return s + ".NS"


@st.cache_data(ttl=300, show_spinner=False)
def fetch_price(symbol: str) -> dict:
    """Fetch latest price data for one symbol. Returns dict with price, change, pct."""
    ticker_sym = _safe_ticker(symbol)
    try:
        t = yf.Ticker(ticker_sym)
        info = t.fast_info
        price = float(info.last_price) if info.last_price else None
        if price is None:
            hist = t.history(period="2d")
            if not hist.empty:
                price = float(hist["Close"].iloc[-1])
        prev = float(info.previous_close) if info.previous_close else price
        change = (price - prev) if (price and prev) else 0.0
        pct = (change / prev * 100) if prev else 0.0
        currency = getattr(info, "currency", "INR")
        return {
            "symbol": symbol,
            "ticker": ticker_sym,
            "price": round(price, 2) if price else 0.0,
            "change": round(change, 2),
            "pct_change": round(pct, 2),
            "currency": currency,
            "error": None,
        }
    except Exception as e:
        return {
            "symbol": symbol,
            "ticker": ticker_sym,
            "price": 0.0,
            "change": 0.0,
            "pct_change": 0.0,
            "currency": "INR",
            "error": str(e),
        }


@st.cache_data(ttl=300, show_spinner=False)
def fetch_prices_bulk(symbols: list) -> dict:
    """Fetch prices for multiple symbols. Returns {symbol: price_dict}."""
    result = {}
    for sym in symbols:
        result[sym] = fetch_price(sym)
        time.sleep(0.05)  # gentle rate limit
    return result


@st.cache_data(ttl=3600, show_spinner=False)
def fetch_history(symbol: str, period: str = "1y") -> pd.DataFrame:
    """Fetch OHLCV history for a symbol."""
    ticker_sym = _safe_ticker(symbol)
    try:
        t = yf.Ticker(ticker_sym)
        hist = t.history(period=period)
        if hist.empty:
            return pd.DataFrame()
        hist.index = pd.to_datetime(hist.index)
        return hist[["Open", "High", "Low", "Close", "Volume"]]
    except Exception:
        return pd.DataFrame()


@st.cache_data(ttl=3600, show_spinner=False)
def get_inr_usd_rate() -> float:
    """Return INR per 1 USD."""
    try:
        d = fetch_price("USDINR=X")
        return d["price"] or 83.5
    except Exception:
        return 83.5
