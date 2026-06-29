import math
import random
from datetime import date, datetime
from scipy.stats import norm

def days_to_expiry(expiry_date: date) -> float:
    """
    Returns float: calendar days until expiry / 365
    If expiry is today or past: return 0.001 (avoid division by zero)
    """
    today = date.today()
    delta = (expiry_date - today).days
    if delta <= 0:
        return 0.001
    return delta / 365.0

def black_scholes(S: float, K: float, T: float, r: float, sigma: float, option_type: str = "CE") -> float:
    """
    Calculate option premium.
    S: current underlying price
    K: strike price
    T: time to expiry in years
    r: risk-free rate
    sigma: implied volatility (decimal)
    """
    d1 = (math.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)

    if option_type == "CE":
        premium = S * norm.cdf(d1) - K * math.exp(-r * T) * norm.cdf(d2)
    else:  # PE
        premium = K * math.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)
    
    return max(0.05, round(premium, 2))  # Base minimum premium

def calculate_greeks(S: float, K: float, T: float, r: float, sigma: float, option_type: str = "CE") -> dict:
    """
    Calculate Greeks (Delta, Gamma, Theta, Vega).
    """
    d1 = (math.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)

    # Gamma is same for CE and PE
    gamma = norm.pdf(d1) / (S * sigma * math.sqrt(T))
    
    # Vega is same for CE and PE (represented per 1% change in IV)
    vega = S * norm.pdf(d1) * math.sqrt(T) * 0.01

    if option_type == "CE":
        delta = norm.cdf(d1)
        theta = (- (S * norm.pdf(d1) * sigma) / (2 * math.sqrt(T)) 
                 - r * K * math.exp(-r * T) * norm.cdf(d2)) / 365
    else:
        delta = norm.cdf(d1) - 1
        theta = (- (S * norm.pdf(d1) * sigma) / (2 * math.sqrt(T)) 
                 + r * K * math.exp(-r * T) * norm.cdf(-d2)) / 365

    return {
        "delta": round(delta, 4),
        "gamma": round(gamma, 4),
        "theta": round(theta, 4),
        "vega": round(vega, 4),
        "iv": round(sigma, 4)
    }

def get_implied_volatility(underlying: str) -> float:
    """
    Returns realistic base IV for Indian indices
    """
    u = underlying.upper().strip()
    if u == "NIFTY": return 0.14
    if u == "BANKNIFTY": return 0.18
    if u == "FINNIFTY": return 0.16
    return 0.22

def get_option_chain(underlying: str, current_price: float, expiry_date: date, num_strikes: int = 11) -> list:
    """
    Returns full option chain around ATM strike.
    """
    u = underlying.upper().strip()
    
    # Determine strike interval
    if u == "NIFTY" or u == "FINNIFTY":
        interval = 50
    elif u == "BANKNIFTY":
        interval = 100
    else:
        interval = 50
        
    atm_strike = round(current_price / interval) * interval
    
    T = days_to_expiry(expiry_date)
    r = 0.065
    base_iv = get_implied_volatility(u)
    
    chain = []
    
    # Generate num_strikes below, ATM, num_strikes above
    for i in range(-num_strikes, num_strikes + 1):
        strike = atm_strike + (i * interval)
        
        # Slight IV smile (OTM options have slightly higher IV)
        iv_modifier = abs(i) * 0.002
        strike_iv = base_iv + iv_modifier
        
        # CE Data
        ce_prem = black_scholes(current_price, strike, T, r, strike_iv, "CE")
        ce_greeks = calculate_greeks(current_price, strike, T, r, strike_iv, "CE")
        
        # PE Data
        pe_prem = black_scholes(current_price, strike, T, r, strike_iv, "PE")
        pe_greeks = calculate_greeks(current_price, strike, T, r, strike_iv, "PE")
        
        # Deterministic random for OI/Volume
        random.seed(strike + current_price)
        
        chain.append({
            "strike": strike,
            "ce": {
                "premium": ce_prem,
                **ce_greeks,
                "oi": random.randint(1000, 50000) * abs(15 - abs(i)),
                "volume": random.randint(500, 20000) * abs(15 - abs(i))
            },
            "pe": {
                "premium": pe_prem,
                **pe_greeks,
                "oi": random.randint(1000, 50000) * abs(15 - abs(i)),
                "volume": random.randint(500, 20000) * abs(15 - abs(i))
            }
        })
        
    return chain
