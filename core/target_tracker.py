import pandas as pd
import numpy as np
from config import DEFAULT_TARGET_ALLOCATION
from typing import Dict


def compute_target_deviation(actual_allocation: pd.Series, target_allocation: Dict) -> pd.DataFrame:
    """
    Compare actual allocation vs target.
    Returns DataFrame with actual%, target%, deviation%, and rebalance amount.
    """
    target_series = pd.Series(target_allocation)

    # Align indices
    all_categories = set(actual_allocation.index) | set(target_series.index)
    actual = actual_allocation.reindex(all_categories, fill_value=0)
    target = target_series.reindex(all_categories, fill_value=0)

    result = pd.DataFrame({
        'Actual_%': actual.round(2),
        'Target_%': target.round(2),
        'Deviation_%': (actual - target).round(2),
        'Status': (actual - target).apply(
            lambda x: '🔴 Overweight' if x > 2 else ('🟡 Underweight' if x < -2 else '🟢 On Target')
        )
    })

    return result


def compute_rebalance_trades(df: pd.DataFrame, total_portfolio_value: float, target_allocation: Dict) -> pd.DataFrame:
    """
    Calculate how much to buy/sell to rebalance to target.
    Returns DataFrame with recommended trades.
    """
    trades = []
    for category, target_pct in target_allocation.items():
        target_value = (target_pct / 100) * total_portfolio_value
        current_row = df[df.index == category]
        current_value = current_row['Current_Value'].sum() if not current_row.empty else 0
        diff = target_value - current_value
        action = 'BUY' if diff > 0 else 'SELL'
        trades.append({
            'Category': category,
            'Current_Value': round(current_value, 2),
            'Target_Value': round(target_value, 2),
            'Difference': round(abs(diff), 2),
            'Action': action
        })
    return pd.DataFrame(trades)
