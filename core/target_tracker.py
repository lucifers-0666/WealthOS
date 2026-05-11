import pandas as pd
from typing import Dict

DEFAULT_TARGET = {
    'Equity':    50.0,
    'ETF':       25.0,
    'Gold ETF':  10.0,
    'Liquid ETF': 5.0,
    'Bonds':     10.0,
}


def compute_deviation(actual: pd.Series, target: Dict[str, float]) -> pd.DataFrame:
    """
    Compare actual allocation (%) against target allocation (%).
    Returns DataFrame with columns: asset_type, actual_pct, target_pct, deviation_pct, status.
    """
    rows = []
    all_types = set(actual.index) | set(target.keys())

    for asset_type in sorted(all_types):
        actual_pct = actual.get(asset_type, 0.0)
        target_pct = target.get(asset_type, 0.0)
        deviation  = actual_pct - target_pct

        if deviation > 3:
            status = 'Overweight'
        elif deviation < -3:
            status = 'Underweight'
        else:
            status = 'On Target'

        rows.append({
            'asset_type':   asset_type,
            'actual_pct':   round(actual_pct,  2),
            'target_pct':   round(target_pct,  2),
            'deviation_pct': round(deviation,  2),
            'status':       status,
        })

    return pd.DataFrame(rows)


def rebalance_suggestions(deviation_df: pd.DataFrame, total_value: float) -> pd.DataFrame:
    """
    Calculate the rupee/dollar amount to buy or sell per asset type to rebalance.
    """
    df = deviation_df.copy()
    df['action_amount'] = -(df['deviation_pct'] / 100) * total_value
    df['action'] = df['action_amount'].apply(
        lambda x: 'BUY' if x > 0 else ('SELL' if x < 0 else 'HOLD')
    )
    df['action_amount'] = df['action_amount'].abs().round(2)
    return df[['asset_type', 'actual_pct', 'target_pct', 'deviation_pct', 'action', 'action_amount']]
