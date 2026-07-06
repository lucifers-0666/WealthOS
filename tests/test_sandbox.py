import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Create a mock app and router for testing
from fastapi import FastAPI
from api.sandbox_routes import router, SandboxEquityOrder, SandboxOptionOrder, _get_user_id

app = FastAPI()
# Override dependency
async def override_get_user_id(): return "test-user-id"
app.dependency_overrides[_get_user_id] = override_get_user_id
app.include_router(router)

client = TestClient(app)

@pytest.fixture
def mock_supabase():
    with patch("api.sandbox_routes.get_supabase") as mock_sb:
        yield mock_sb

@pytest.fixture
def mock_fetch_price():
    with patch("api.sandbox_routes.fetch_price") as mock_fp:
        mock_fp.return_value = {"price": 2000.0, "change": 0, "pct_change": 0}
        yield mock_fp

def test_wallet_creation_on_new_user():
    # TEST 1 - tests get_wallet when user account is queried
    with patch("api.sandbox_routes.get_supabase") as mock_sb:
        mock_sb.return_value.table().select().eq().execute.return_value.data = [
            {"balance": 1000000.00, "initial_balance": 1000000.00, "trades_count": 0}
        ]
        # mock open trades
        mock_sb.return_value.table().select().eq().eq().execute.return_value.data = []
        # mock closed trades
        mock_sb.return_value.table().select().eq().neq().execute.return_value.data = []
        
        res = client.get("/api/sandbox/wallet")
        assert res.status_code == 200
        assert res.json()["balance"] == 1000000.00

def test_buy_order_deducts_balance(mock_supabase, mock_fetch_price):
    # TEST 2
    mock_supabase.return_value.table().select().eq().execute.return_value.data = [
        {"balance": 1000000.00, "initial_balance": 1000000.00, "trades_count": 0}
    ]
    # No existing opposite open positions
    mock_supabase.return_value.table().select().eq().eq().eq().eq().eq().order().execute.return_value.data = []
    
    res = client.post("/api/sandbox/order/equity", json={"ticker": "RELIANCE", "action": "BUY", "quantity": 10})
    assert res.status_code == 200
    assert res.json()["new_balance"] == 980000.0

def test_sell_order_adds_to_balance(mock_supabase, mock_fetch_price):
    # TEST 3 - Selling equity squares off open buy position
    mock_fetch_price.return_value = {"price": 2100.0}
    mock_supabase.return_value.table().select().eq().execute.return_value.data = [
        {"balance": 980000.00, "initial_balance": 1000000.00, "trades_count": 1}
    ]
    # Opposite open buy position exists
    mock_supabase.return_value.table().select().eq().eq().eq().eq().eq().order().execute.return_value.data = [
        {"id": "test-trade", "quantity": 10, "entry_price": 2000.0, "direction": "buy", "trade_type": "intraday", "symbol": "RELIANCE"}
    ]
    
    # Mock update calls for balance and open positions
    update_mock = mock_supabase.return_value.table().update
    
    res = client.post("/api/sandbox/order/equity", json={"ticker": "RELIANCE", "action": "SELL", "quantity": 10})
    assert res.status_code == 200
    assert res.json()["new_balance"] == 1001000.0

def test_insufficient_balance_rejected(mock_supabase, mock_fetch_price):
    # TEST 4
    mock_fetch_price.return_value = {"price": 3000.0}
    mock_supabase.return_value.table().select().eq().execute.return_value.data = [
        {"balance": 1000.00, "initial_balance": 1000000.00, "trades_count": 0}
    ]
    mock_supabase.return_value.table().select().eq().eq().eq().eq().eq().order().execute.return_value.data = []
    
    res = client.post("/api/sandbox/order/equity", json={"ticker": "RELIANCE", "action": "BUY", "quantity": 1000})
    assert res.status_code == 400
    assert "Insufficient balance" in res.json()["detail"]

def test_selling_more_than_held_rejected(mock_supabase, mock_fetch_price):
    # TEST 5 - Enforcing equity selling constraints
    mock_supabase.return_value.table().select().eq().execute.return_value.data = [
        {"balance": 1000000.00, "initial_balance": 1000000.00, "trades_count": 0}
    ]
    # user only has 10 shares of INFY
    mock_supabase.return_value.table().select().eq().eq().eq().eq().eq().order().execute.return_value.data = [
        {"id": "test-trade", "quantity": 10, "entry_price": 2000.0, "direction": "buy", "trade_type": "intraday", "symbol": "INFY"}
    ]
    
    # trying to sell 15 shares
    res = client.post("/api/sandbox/order/equity", json={"ticker": "INFY", "action": "SELL", "quantity": 15})
    assert res.status_code == 400
    assert "Insufficient holdings" in res.json()["detail"]

def test_bs_price_realistic():
    # TEST 6
    from core.greeks_calculator import black_scholes
    prem = black_scholes(22000, 22000, 7/365, 0.065, 0.14)
    assert 80 <= prem <= 250

def test_reset_clears_data(mock_supabase):
    # TEST 7
    res = client.post("/api/sandbox/wallet/reset")
    assert res.status_code == 200
    mock_supabase.return_value.table("sandbox_accounts").update.assert_called()
    mock_supabase.return_value.table("sandbox_trades").delete.assert_called()

def test_option_premium_decreases():
    # TEST 8
    from core.greeks_calculator import black_scholes
    p30 = black_scholes(22000, 22000, 30/365, 0.065, 0.14)
    p1 = black_scholes(22000, 22000, 1/365, 0.065, 0.14)
    assert p1 < p30

def test_delta_deep_itm():
    # TEST 9
    from core.greeks_calculator import calculate_greeks
    greeks = calculate_greeks(22000, 18000, 7/365, 0.065, 0.14)
    assert greeks["delta"] > 0.90
