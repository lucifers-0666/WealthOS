import pytest
import pandas as pd
from io import StringIO
from core.data_loader import load_holdings, load_transactions, get_sample_holdings


def test_get_sample_holdings():
    df = get_sample_holdings()
    assert isinstance(df, pd.DataFrame)
    assert len(df) > 0
    assert 'Symbol' in df.columns
    assert 'Quantity' in df.columns
    assert 'Avg_Buy_Price' in df.columns
    assert 'Invested_Amount' in df.columns


def test_load_holdings_from_csv():
    csv_content = "Symbol,Quantity,Avg_Buy_Price,Asset_Type,Exchange\nRELIANCE.NS,10,2400.00,Equity,NSE\nINFY.NS,5,1500.00,Equity,NSE"
    file = StringIO(csv_content)
    file.name = 'test.csv'
    df = load_holdings(file)
    assert len(df) == 2
    assert df['Symbol'].iloc[0] == 'RELIANCE.NS'
    assert df['Invested_Amount'].iloc[0] == 24000.0


def test_load_holdings_missing_columns():
    csv_content = "Symbol,Name\nRELIANCE.NS,Reliance"
    file = StringIO(csv_content)
    file.name = 'test.csv'
    with pytest.raises(ValueError):
        load_holdings(file)
