import yfinance as yf
import pandas as pd
import streamlit as st
from datetime import datetime, timedelta
from loguru import logger
from config import PRICE_CACHE_TTL, EXCHANGE_SUFFIX


@st.cache_data(ttl=PRICE_CACHE_TTL)
def fetch_live_prices(symbols: list) -> dict:
    """
    Fetch live prices for a list of symbols using yfinance.
    Handles NSE (.NS), BSE (.BO), and international tickers.
    Returns dict: {symbol: current_price}
    """
    prices = {}
    for symbol in symbols:
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="2d")
            if not hist.empty:
                prices[symbol] = round(hist['Close'].iloc[-1], 2)
                logger.debug(f"{symbol}: ₹{prices[symbol]}")
            else:
                prices[symbol] = None
                logger.warning(f"No data for {symbol}")
        except Exception as e:
            prices[symbol] = None
            logger.error(f"Error fetching {symbol}: {e}")
    return prices


@st.cache_data(ttl=PRICE_CACHE_TTL)
def fetch_historical_prices(symbols: list, period: str = "1y") -> pd.DataFrame:
    """
    Fetch historical closing prices for multiple symbols.
    Returns DataFrame with dates as index, symbols as columns.
    """
    try:
        data = yf.download(symbols, period=period, auto_adjust=True, progress=False)
        if len(symbols) == 1:
            return data[['Close']].rename(columns={'Close': symbols[0]})
        return data['Close']
    except Exception as e:
        logger.error(f"Error fetching historical data: {e}")
        return pd.DataFrame()


@st.cache_data(ttl=PRICE_CACHE_TTL)
def fetch_ticker_info(symbol: str) -> dict:
    """Fetch detailed info for a single ticker (name, sector, market cap, etc.)."""
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        return {
            'name': info.get('longName', symbol),
            'sector': info.get('sector', 'Unknown'),
            'industry': info.get('industry', 'Unknown'),
            'market_cap': info.get('marketCap', 0),
            'pe_ratio': info.get('trailingPE', None),
            'dividend_yield': info.get('dividendYield', None),
            '52w_high': info.get('fiftyTwoWeekHigh', None),
            '52w_low': info.get('fiftyTwoWeekLow', None),
            'currency': info.get('currency', 'INR'),
        }
    except Exception as e:
        logger.error(f"Error fetching info for {symbol}: {e}")
        return {}


def get_inr_usd_rate() -> float:
    """Fetch current INR/USD exchange rate."""
    try:
        ticker = yf.Ticker("USDINR=X")
        hist = ticker.history(period="2d")
        if not hist.empty:
            return round(hist['Close'].iloc[-1], 2)
    except Exception:
        pass
    return 83.5  # fallback


def normalize_symbol(symbol: str, exchange: str) -> str:
    """Ensure symbol has correct exchange suffix for yfinance."""
    suffix = EXCHANGE_SUFFIX.get(exchange.upper(), "")
    if suffix and not symbol.endswith(suffix):
        return f"{symbol}{suffix}"
    return symbol
