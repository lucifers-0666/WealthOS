import pandas as pd
import numpy as np
from typing import Dict
from loguru import logger


def compute_portfolio_metrics(holdings_df: pd.DataFrame, live_prices: dict) -> pd.DataFrame:
    """
    Compute current value, P&L, P&L%, and weight for each holding.
    All column references use lowercase (matching data_loader normalisation).
    """
    df = holdings_df.copy()

    # Ensure columns are lowercase (defensive — in case caller skipped normalisation)
    df.columns = [c.lower() for c in df.columns]

    # Map live prices using lowercase 'symbol'
    df['current_price'] = df['symbol'].map(live_prices)
    df['current_price'] = pd.to_numeric(df['current_price'], errors='coerce')
    df['current_price'] = df['current_price'].fillna(df['avg_buy_price'])

    df['current_value']   = df['quantity'] * df['current_price']
    df['invested_amount'] = df['quantity'] * df['avg_buy_price']
    df['unrealized_pnl']  = df['current_value'] - df['invested_amount']
    df['pnl_pct']         = (df['unrealized_pnl'] / df['invested_amount'] * 100).round(2)

    total_value = df['current_value'].sum()
    df['weight_pct'] = (df['current_value'] / total_value * 100).round(2)

    logger.info(f"Portfolio total value: {total_value:.2f}")
    return df


def compute_allocation_by_type(df: pd.DataFrame) -> pd.Series:
    """Compute allocation % grouped by asset_type."""
    df = df.copy()
    df.columns = [c.lower() for c in df.columns]
    grouped = df.groupby('asset_type')['current_value'].sum()
    return (grouped / grouped.sum() * 100).round(2)


def compute_allocation_by_sector(df: pd.DataFrame) -> pd.Series:
    """Compute allocation % grouped by sector."""
    df = df.copy()
    df.columns = [c.lower() for c in df.columns]
    if 'sector' not in df.columns:
        return pd.Series()
    grouped = df.groupby('sector')['current_value'].sum()
    return (grouped / grouped.sum() * 100).round(2)


def compute_drawdown(price_series: pd.Series) -> pd.Series:
    """
    Compute drawdown series from a price time series.
    Drawdown = (price - running_max) / running_max * 100
    """
    running_max = price_series.cummax()
    drawdown = (price_series - running_max) / running_max * 100
    return drawdown


def compute_portfolio_value_over_time(
    transactions_df: pd.DataFrame,
    live_prices: dict,
    end_date: str = None
) -> pd.DataFrame:
    """
    Reconstruct approximate portfolio value over time from transactions.
    Returns DataFrame with date and portfolio_value columns.
    """
    if transactions_df is None or transactions_df.empty:
        return pd.DataFrame()

    df = transactions_df.copy()
    df.columns = [c.lower() for c in df.columns]
    df = df.sort_values('date')

    dates = pd.date_range(df['date'].min(), pd.Timestamp.today(), freq='W')
    portfolio_values = []
    current_holdings: Dict[str, float] = {}
    txn_idx = 0
    txns = df.to_dict('records')

    for date in dates:
        while txn_idx < len(txns) and txns[txn_idx]['date'] <= date:
            t = txns[txn_idx]
            sym = t['symbol']
            qty = t['quantity'] if str(t['type']).upper() == 'BUY' else -t['quantity']
            current_holdings[sym] = current_holdings.get(sym, 0) + qty
            txn_idx += 1

        value = sum(
            qty * live_prices.get(sym, 0)
            for sym, qty in current_holdings.items()
            if qty > 0
        )
        portfolio_values.append({'date': date, 'portfolio_value': value})

    return pd.DataFrame(portfolio_values)


def get_summary_stats(df: pd.DataFrame) -> Dict:
    """Return key summary statistics for the portfolio."""
    df = df.copy()
    df.columns = [c.lower() for c in df.columns]

    total_invested = df['invested_amount'].sum()
    total_current  = df['current_value'].sum()
    total_pnl      = df['unrealized_pnl'].sum()
    total_pnl_pct  = (total_pnl / total_invested * 100) if total_invested > 0 else 0

    best  = df.loc[df['pnl_pct'].idxmax()]
    worst = df.loc[df['pnl_pct'].idxmin()]

    return {
        'total_invested':      round(total_invested, 2),
        'total_current_value': round(total_current, 2),
        'total_pnl':           round(total_pnl, 2),
        'total_pnl_pct':       round(total_pnl_pct, 2),
        'num_holdings':        len(df),
        'best_performer':      f"{best['symbol']} ({best['pnl_pct']:+.1f}%)",
        'worst_performer':     f"{worst['symbol']} ({worst['pnl_pct']:+.1f}%)",
    }
