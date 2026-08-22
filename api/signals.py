import uuid
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
import pandas as pd
import yfinance as yf

from api.auth import get_user_id
from database import get_holdings, get_watchlist

logger = logging.getLogger("wealthos-signals")

router = APIRouter(prefix="/api/signals")

# In-memory cache store: { user_id: { "expires_at": datetime, "signals": [...] } }
SIGNALS_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_MINUTES = 15

def compute_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    if len(series) < period + 1:
        return pd.Series(dtype=float)
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    # Use standard Wilder's smoothing for RSI
    avg_gain = gain.ewm(alpha=1/period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1/period, adjust=False).mean()

    rs = avg_gain / (avg_loss + 1e-9)
    rsi = 100 - (100 / (1 + rs))
    return rsi

def compute_macd(series: pd.Series) -> tuple[pd.Series, pd.Series]:
    if len(series) < 35:  # Require enough history for standard EMA convergence
        return pd.Series(dtype=float), pd.Series(dtype=float)
    ema12 = series.ewm(span=12, adjust=False).mean()
    ema26 = series.ewm(span=26, adjust=False).mean()
    macd_line = ema12 - ema26
    signal_line = macd_line.ewm(span=9, adjust=False).mean()
    return macd_line, signal_line

def scan_symbol_signals(ticker: str) -> List[Dict[str, Any]]:
    ticker_clean = ticker.upper().strip()
    # If it is an Indian stock, yfinance expects .NS extension if it doesn't already have it
    yf_symbol = ticker_clean
    if not ("." in yf_symbol) and not yf_symbol.endswith("=X") and not yf_symbol.startswith("^"):
        yf_symbol = f"{ticker_clean}.NS"

    triggered = []

    try:
        # Download 60 days of daily data
        df = yf.download(yf_symbol, period="60d", interval="1d", progress=False)
        if df.empty or len(df) < 20:
            return []

        # Flatten MultiIndex columns if present (e.g. from yfinance v0.2.x download format)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        closes = df["Close"]
        volumes = df["Volume"]

        if len(closes) < 2:
            return []

        today_close = float(closes.iloc[-1])
        yesterday_close = float(closes.iloc[-2])

        # 1. RSI-14 Scan
        rsi_series = compute_rsi(closes, period=14)
        if not rsi_series.empty and len(rsi_series) > 0:
            today_rsi = float(rsi_series.iloc[-1])
            if today_rsi < 35:
                strength = "Strong" if today_rsi < 25 else "Moderate"
                triggered.append({
                    "id": str(uuid.uuid4()),
                    "ticker": ticker_clean,
                    "signal_type": "RSI_OVERSOLD",
                    "direction": "BUY",
                    "strength": strength,
                    "price": round(today_close, 2),
                    "message": f"RSI is oversold at {today_rsi:.1f} (Threshold < 35). Potential bullish reversal.",
                    "created_at": datetime.now().isoformat()
                })
            elif today_rsi > 70:
                strength = "Strong" if today_rsi > 78 else "Moderate"
                triggered.append({
                    "id": str(uuid.uuid4()),
                    "ticker": ticker_clean,
                    "signal_type": "RSI_OVERSOLD",
                    "direction": "SELL",
                    "strength": strength,
                    "price": round(today_close, 2),
                    "message": f"RSI is overbought at {today_rsi:.1f} (Threshold > 70). Potential bearish exhaustion.",
                    "created_at": datetime.now().isoformat()
                })

        # 2. MACD Crossover Scan (crossover within last 2 days)
        macd_line, signal_line = compute_macd(closes)
        if not macd_line.empty and not signal_line.empty and len(macd_line) >= 2:
            today_macd, today_sig = macd_line.iloc[-1], signal_line.iloc[-1]
            yest_macd, yest_sig = macd_line.iloc[-2], signal_line.iloc[-2]

            # Bullish crossover (MACD crosses above Signal Line)
            if yest_macd <= yest_sig and today_macd > today_sig:
                triggered.append({
                    "id": str(uuid.uuid4()),
                    "ticker": ticker_clean,
                    "signal_type": "MACD_CROSSOVER",
                    "direction": "BUY",
                    "strength": "Moderate",
                    "price": round(today_close, 2),
                    "message": f"MACD line ({today_macd:.2f}) crossed above Signal line ({today_sig:.2f}). Bullish momentum indicator.",
                    "created_at": datetime.now().isoformat()
                })
            # Bearish crossover (MACD crosses below Signal Line)
            elif yest_macd >= yest_sig and today_macd < today_sig:
                triggered.append({
                    "id": str(uuid.uuid4()),
                    "ticker": ticker_clean,
                    "signal_type": "MACD_CROSSOVER",
                    "direction": "SELL",
                    "strength": "Moderate",
                    "price": round(today_close, 2),
                    "message": f"MACD line ({today_macd:.2f}) crossed below Signal line ({today_sig:.2f}). Bearish momentum indicator.",
                    "created_at": datetime.now().isoformat()
                })

        # 3. Volume Breakout Scan
        if len(volumes) >= 21:
            today_vol = float(volumes.iloc[-1])
            avg_20_vol = float(volumes.iloc[-21:-1].mean())
            if avg_20_vol > 0 and today_vol > 2 * avg_20_vol:
                mult = today_vol / avg_20_vol
                strength = "Strong" if mult > 3.5 else "Moderate"
                triggered.append({
                    "id": str(uuid.uuid4()),
                    "ticker": ticker_clean,
                    "signal_type": "VOLUME_BREAKOUT",
                    "direction": "BUY",
                    "strength": strength,
                    "price": round(today_close, 2),
                    "message": f"Volume spike detected: Today's volume ({today_vol:,.0f}) is {mult:.1f}x the 20-day average ({avg_20_vol:,.0f}).",
                    "created_at": datetime.now().isoformat()
                })

    except Exception as e:
        logger.warning(f"Error scanning signals for {yf_symbol}: {e}")

    return triggered

@router.get("", response_model=List[Dict[str, Any]])
def get_signals(
    ticker: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    user_id: str = Depends(get_user_id)
):
    now = datetime.now()
    cached = SIGNALS_CACHE.get(user_id)

    # Use cache if valid
    if cached and cached["expires_at"] > now:
        all_signals = cached["signals"]
    else:
        # Load user symbols
        user_symbols = set()
        try:
            holdings = get_holdings(user_id)
            for h in holdings:
                t = (h.get("ticker") or h.get("symbol") or "").upper().strip()
                if t:
                    user_symbols.add(t)
        except Exception:
            pass

        try:
            watchlist = get_watchlist(user_id)
            for w in watchlist:
                t = (w.get("ticker") or w.get("symbol") or "").upper().strip()
                if t:
                    user_symbols.add(t)
        except Exception:
            pass

        # Fallback to major indexes/symbols if user has none
        if not user_symbols:
            user_symbols = {"RELIANCE", "TCS", "INFY", "HDFCBANK", "SBIN"}

        all_signals = []
        for symbol in user_symbols:
            signals = scan_symbol_signals(symbol)
            all_signals.extend(signals)

        # Sort descending by created_at
        all_signals.sort(key=lambda x: x["created_at"], reverse=True)

        # Cache results
        SIGNALS_CACHE[user_id] = {
            "expires_at": now + timedelta(minutes=CACHE_TTL_MINUTES),
            "signals": all_signals
        }

    # Apply filters
    filtered = all_signals
    if ticker:
        t_filter = ticker.upper().strip()
        filtered = [s for s in filtered if s["ticker"] == t_filter]
    if type:
        type_filter = type.upper().strip()
        filtered = [s for s in filtered if s["signal_type"] == type_filter]

    return filtered
