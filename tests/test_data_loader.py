import pytest
import pandas as pd



import tempfile
import os
from core.data_loader import parse_holdings_csv, parse_transactions_csv, detect_broker

def test_detect_broker_groww():
    df = pd.DataFrame(columns=["Symbol", "Quantity", "Average Price", "LTP", "Current Value"])
    broker = detect_broker(df)
    assert broker == "groww"

def test_parse_groww_holdings():
    csv_content = "Symbol,Quantity,Average Price,LTP,Current Value,P&L,Net Change (%)\nRELIANCE,10,2400.0,2500.0,25000.0,1000.0,4.16\n"
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv') as f:
        f.write(csv_content)
        f_path = f.name
    try:
        res = parse_holdings_csv(f_path)
        assert len(res) == 1
        assert "ticker" in res[0]
        assert "quantity" in res[0]
        assert "avg_buy_price" in res[0]
        assert "current_price" in res[0]
        assert res[0]["ticker"] == "RELIANCE"
        assert res[0]["quantity"] == 10.0
        assert res[0]["avg_buy_price"] == 2400.0
    finally:
        os.remove(f_path)

def test_parse_groww_transactions():
    csv_content = "Trade Date,Symbol,Trade Type,Quantity,Price,Trade Value\n2024-01-01,INFY,B,5,1500.0,7500.0\n"
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv') as f:
        f.write(csv_content)
        f_path = f.name
    try:
        res = parse_transactions_csv(f_path)
        assert len(res) == 1
        assert "date" in res[0]
        assert "ticker" in res[0]
        assert "type" in res[0]
        assert "quantity" in res[0]
        assert "price" in res[0]
        assert res[0]["ticker"] == "INFY"
        assert res[0]["type"] == "BUY"
    finally:
        os.remove(f_path)
