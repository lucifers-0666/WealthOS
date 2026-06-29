import pytest
from datetime import date, timedelta
from core.greeks_calculator import (
    black_scholes, calculate_greeks, get_option_chain, days_to_expiry
)

def test_bs_call_price():
    # NIFTY at 22000, strike 22000, T=7/365, sigma=0.14
    S = 22000
    K = 22000
    T = 7/365
    r = 0.065
    sigma = 0.14
    
    prem = black_scholes(S, K, T, r, sigma, "CE")
    assert 80 <= prem <= 200, f"CE Premium {prem} is out of expected range"

def test_delta_call_range():
    S = 22000
    T = 7/365
    r = 0.065
    sigma = 0.14
    
    for K in [21000, 22000, 23000]:
        greeks = calculate_greeks(S, K, T, r, sigma, "CE")
        delta = greeks["delta"]
        assert 0 <= delta <= 1, f"CE Delta {delta} out of range [0,1] for strike {K}"

def test_delta_put_range():
    S = 22000
    T = 7/365
    r = 0.065
    sigma = 0.14
    
    for K in [21000, 22000, 23000]:
        greeks = calculate_greeks(S, K, T, r, sigma, "PE")
        delta = greeks["delta"]
        assert -1 <= delta <= 0, f"PE Delta {delta} out of range [-1,0] for strike {K}"

def test_theta_negative():
    S = 22000
    K = 22000
    T = 7/365
    r = 0.065
    sigma = 0.14
    
    ce_greeks = calculate_greeks(S, K, T, r, sigma, "CE")
    pe_greeks = calculate_greeks(S, K, T, r, sigma, "PE")
    
    assert ce_greeks["theta"] < 0, f"CE Theta {ce_greeks['theta']} should be negative"
    assert pe_greeks["theta"] < 0, f"PE Theta {pe_greeks['theta']} should be negative"

def test_chain_length():
    expiry = date.today() + timedelta(days=7)
    chain = get_option_chain("NIFTY", 22000, expiry, num_strikes=11)
    
    assert len(chain) == 23, f"Expected 23 strikes, got {len(chain)}"
