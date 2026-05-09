import pytest
import pandas as pd
from core.portfolio_engine import compute_portfolio_metrics, get_summary_stats, compute_drawdown
from core.data_loader import get_sample_holdings


def test_compute_portfolio_metrics():
    df = get_sample_holdings()
    live_prices = {
        'RELIANCE.NS': 2600.0, 'INFY.NS': 1700.0, 'HDFCBANK.NS': 1750.0,
        'TCS.NS': 4000.0, 'WIPRO.NS': 520.0, 'VTI': 240.0, 'QQQ': 480.0,
        'INDA': 50.0, 'GOLDBEES.NS': 65.0, 'LIQUIDBEES.NS': 1000.0
    }
    result = compute_portfolio_metrics(df, live_prices)
    assert 'Current_Value' in result.columns
    assert 'Unrealized_PnL' in result.columns
    assert 'PnL_Pct' in result.columns
    assert 'Weight_Pct' in result.columns
    assert result['Weight_Pct'].sum() == pytest.approx(100, abs=0.5)


def test_get_summary_stats():
    df = get_sample_holdings()
    live_prices = {'RELIANCE.NS': 2600.0, 'INFY.NS': 1700.0, 'HDFCBANK.NS': 1750.0}
    df_small = df[df['Symbol'].isin(live_prices.keys())]
    metrics = compute_portfolio_metrics(df_small, live_prices)
    stats = get_summary_stats(metrics)
    assert 'total_invested' in stats
    assert 'total_current_value' in stats
    assert 'total_pnl_pct' in stats


def test_compute_drawdown():
    prices = pd.Series([100, 110, 105, 120, 90, 95, 115, 125])
    dd = compute_drawdown(prices)
    assert dd.min() < 0  # should have at least one drawdown
    assert dd.max() == 0  # starts at peak
