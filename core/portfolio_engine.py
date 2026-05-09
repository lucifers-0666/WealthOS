import pandas as pd
import numpy as np
from typing import Dict, Tuple
from loguru import logger


def compute_portfolio_metrics(holdings_df: pd.DataFrame, live_prices: dict) -> pd.DataFrame:
    """
    Compute current value, P&L, P&L%, and weight for each holding.
    Returns enriched DataFrame.
    """
    df = holdings_df.copy()

    # Map live prices
    df['Current_Price'] = df['Symbol'].map(live_prices)
    df['Current_Price'] = pd.to_numeric(df['Current_Price'], errors='coerce')

    # Fallback to avg buy price if live price unavailable
    df['Current_Price'] = df['Current_Price'].fillna(df['Avg_Buy_Price'])

    # Core metrics
    df['Current_Value'] = df['Quantity'] * df['Current_Price']
    df['Invested_Amount'] = df['Quantity'] * df['Avg_Buy_Price']
    df['Unrealized_PnL'] = df['Current_Value'] - df['Invested_Amount']
    df['PnL_Pct'] = (df['Unrealized_PnL'] / df['Invested_Amount'] * 100).round(2)

    total_value = df['Current_Value'].sum()
    df['Weight_Pct'] = (df['Current_Value'] / total_value * 100).round(2)

    logger.info(f"Portfolio total value: {total_value:.2f}")
    return df


def compute_allocation_by_type(df: pd.DataFrame) -> pd.Series:
    """Compute allocation % grouped by Asset_Type."""
    grouped = df.groupby('Asset_Type')['Current_Value'].sum()
    return (grouped / grouped.sum() * 100).round(2)


def compute_allocation_by_sector(df: pd.DataFrame) -> pd.Series:
    """Compute allocation % grouped by Sector."""
    if 'Sector' not in df.columns:
        return pd.Series()
    grouped = df.groupby('Sector')['Current_Value'].sum()
    return (grouped / grouped.sum() * 100).round(2)


def compute_drawdown(price_series: pd.Series) -> pd.Series:
    """
    Compute drawdown series from a price time series.
    Drawdown = (price - running_max) / running_max
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
    Returns DataFrame with Date and Portfolio_Value columns.
    """
    if transactions_df is None or transactions_df.empty:
        return pd.DataFrame()

    # Build holdings state over time
    transactions_df = transactions_df.sort_values('Date')
    dates = pd.date_range(transactions_df['Date'].min(), pd.Timestamp.today(), freq='W')
    portfolio_values = []

    current_holdings = {}
    txn_idx = 0
    txns = transactions_df.to_dict('records')

    for date in dates:
        # Apply all transactions up to this date
        while txn_idx < len(txns) and txns[txn_idx]['Date'] <= date:
            t = txns[txn_idx]
            sym = t['Symbol']
            qty = t['Quantity'] if t['Type'].upper() == 'BUY' else -t['Quantity']
            current_holdings[sym] = current_holdings.get(sym, 0) + qty
            txn_idx += 1

        # Estimate value using current live prices (approximation)
        value = sum(
            qty * live_prices.get(sym, 0)
            for sym, qty in current_holdings.items()
            if qty > 0
        )
        portfolio_values.append({'Date': date, 'Portfolio_Value': value})

    return pd.DataFrame(portfolio_values)


def get_summary_stats(df: pd.DataFrame) -> Dict:
    """Return key summary statistics for the portfolio."""
    total_invested = df['Invested_Amount'].sum()
    total_current = df['Current_Value'].sum()
    total_pnl = df['Unrealized_PnL'].sum()
    total_pnl_pct = (total_pnl / total_invested * 100) if total_invested > 0 else 0

    best = df.loc[df['PnL_Pct'].idxmax()]
    worst = df.loc[df['PnL_Pct'].idxmin()]

    return {
        'total_invested': round(total_invested, 2),
        'total_current_value': round(total_current, 2),
        'total_pnl': round(total_pnl, 2),
        'total_pnl_pct': round(total_pnl_pct, 2),
        'num_holdings': len(df),
        'best_performer': f"{best['Symbol']} ({best['PnL_Pct']:+.1f}%)",
        'worst_performer': f"{worst['Symbol']} ({worst['PnL_Pct']:+.1f}%)",
    }
