import yfinance as yf
import pandas as pd
from typing import Dict, List, Optional
from loguru import logger

try:
    import streamlit as st
    _STREAMLIT = True
except ImportError:
    _STREAMLIT = False


def _cache(fn):
    """Apply st.cache_data when Streamlit is available, else no-op."""
    if _STREAMLIT:
        return st.cache_data(ttl=300)(fn)
    return fn


@_cache
def fetch_live_prices(symbols: tuple) -> Dict[str, float]:
    """
    Fetch latest prices for a tuple of ticker symbols via yfinance.
    symbols must be a tuple (not list) so Streamlit cache can hash it.
    Returns dict: {symbol: price}.
    """
    prices: Dict[str, float] = {}
    for sym in symbols:
        try:
            ticker = yf.Ticker(sym)
            hist   = ticker.history(period='1d')
            if not hist.empty:
                prices[sym] = round(float(hist['Close'].iloc[-1]), 4)
            else:
                logger.warning(f"No price data for {sym}")
        except Exception as e:
            logger.error(f"Price fetch error for {sym}: {e}")
    return prices


def get_prices_for_holdings(holdings_df: pd.DataFrame) -> Dict[str, float]:
    """
    Convenience wrapper — extracts symbols from a holdings DataFrame
    (tolerates both 'symbol' and 'Symbol' column names) and fetches prices.
    """
    # Normalise column names defensively
    col_map = {c.lower(): c for c in holdings_df.columns}
    sym_col = col_map.get('symbol', None)
    if sym_col is None:
        logger.error("Holdings DataFrame has no 'symbol' column.")
        return {}

    symbols = tuple(holdings_df[sym_col].dropna().unique().tolist())
    return fetch_live_prices(symbols)


@_cache
def fetch_inr_usd_rate() -> float:
    """Fetch current INR/USD exchange rate."""
    try:
        ticker = yf.Ticker('USDINR=X')
        hist   = ticker.history(period='1d')
        if not hist.empty:
            return round(float(hist['Close'].iloc[-1]), 4)
    except Exception as e:
        logger.error(f"FX rate fetch error: {e}")
    return 83.5  # fallback


def get_ticker_info(symbol: str) -> dict:
    """Return basic info dict for a single ticker."""
    try:
        return yf.Ticker(symbol).info or {}
    except Exception as e:
        logger.error(f"Ticker info error for {symbol}: {e}")
        return {}
