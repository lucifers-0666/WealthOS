import pandas as pd
import numpy as np
from core.price_fetcher import fetch_prices_bulk, fetch_history, get_inr_usd_rate


def enrich_portfolio(df: pd.DataFrame) -> pd.DataFrame:
    """
    Given a holdings DataFrame (from data_loader), fetch live prices
    and compute P&L, weight, drawdown etc.
    Returns enriched DataFrame. Never raises — bad prices show 0.
    """
    if df is None or df.empty:
        return pd.DataFrame()

    symbols = df["symbol"].tolist()
    prices = fetch_prices_bulk(symbols)
    inr_rate = get_inr_usd_rate()

    rows = []
    for _, row in df.iterrows():
        sym = row["symbol"]
        p = prices.get(sym, {})
        currency = p.get("currency", "INR")
        live_price = p.get("price", 0.0) or 0.0

        # Convert USD prices to INR for consistent totals
        if currency in ("USD", "GBP", "EUR") and live_price:
            multiplier = inr_rate if currency == "USD" else inr_rate  # simplified
            live_price_inr = live_price * multiplier
        else:
            live_price_inr = live_price

        avg = float(row["avg_price"])
        qty = float(row["quantity"])
        invested = avg * qty
        current_val = live_price_inr * qty if live_price_inr else invested
        pnl = current_val - invested
        pnl_pct = (pnl / invested * 100) if invested else 0.0

        rows.append({
            **row.to_dict(),
            "live_price": round(live_price_inr, 2),
            "live_price_raw": round(live_price, 2),
            "currency": currency,
            "current_value": round(current_val, 2),
            "invested": round(invested, 2),
            "pnl": round(pnl, 2),
            "pnl_pct": round(pnl_pct, 2),
            "price_change": p.get("change", 0.0),
            "price_change_pct": p.get("pct_change", 0.0),
            "fetch_error": p.get("error"),
        })

    result = pd.DataFrame(rows)
    total_val = result["current_value"].sum()
    result["weight_pct"] = (
        (result["current_value"] / total_val * 100).round(2)
        if total_val > 0 else 0.0
    )
    return result


def compute_portfolio_summary(enriched: pd.DataFrame) -> dict:
    """Return top-level KPIs from enriched portfolio."""
    if enriched is None or enriched.empty:
        return {
            "total_invested": 0,
            "total_value": 0,
            "total_pnl": 0,
            "total_pnl_pct": 0,
            "num_holdings": 0,
            "num_winners": 0,
            "num_losers": 0,
            "best_performer": None,
            "worst_performer": None,
        }
    total_invested = enriched["invested"].sum()
    total_value = enriched["current_value"].sum()
    total_pnl = total_value - total_invested
    total_pnl_pct = (total_pnl / total_invested * 100) if total_invested else 0.0

    winners = enriched[enriched["pnl"] >= 0]
    losers = enriched[enriched["pnl"] < 0]

    best = None
    worst = None
    if not enriched.empty:
        best_idx = enriched["pnl_pct"].idxmax()
        worst_idx = enriched["pnl_pct"].idxmin()
        best = enriched.loc[best_idx, "symbol"] if best_idx is not None else None
        worst = enriched.loc[worst_idx, "symbol"] if worst_idx is not None else None

    return {
        "total_invested": round(total_invested, 2),
        "total_value": round(total_value, 2),
        "total_pnl": round(total_pnl, 2),
        "total_pnl_pct": round(total_pnl_pct, 2),
        "num_holdings": len(enriched),
        "num_winners": len(winners),
        "num_losers": len(losers),
        "best_performer": best,
        "worst_performer": worst,
    }


def compute_drawdown(symbol: str, period: str = "1y") -> pd.Series:
    """Compute drawdown series for a single symbol."""
    hist = fetch_history(symbol, period)
    if hist.empty:
        return pd.Series(dtype=float)
    close = hist["Close"]
    rolling_max = close.cummax()
    drawdown = (close - rolling_max) / rolling_max * 100
    return drawdown.round(2)


def get_allocation_by(enriched: pd.DataFrame, by: str = "asset_class") -> pd.DataFrame:
    """Aggregate current value by asset_class / sector / symbol."""
    if enriched is None or enriched.empty:
        return pd.DataFrame()
    if by not in enriched.columns:
        by = "symbol"
    agg = (
        enriched.groupby(by)["current_value"]
        .sum()
        .reset_index()
        .rename(columns={"current_value": "value"})
        .sort_values("value", ascending=False)
    )
    agg["pct"] = (agg["value"] / agg["value"].sum() * 100).round(1)
    return agg
