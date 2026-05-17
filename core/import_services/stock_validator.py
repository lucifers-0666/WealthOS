"""
stock_validator.py — Validates extracted tickers against a known NSE/BSE symbol list.
Uses fuzzy matching to correct OCR errors like TGS->TCS, INF1->INFY.
"""

import re
from difflib import get_close_matches

# ── Comprehensive NSE symbol list (top 200 liquid stocks) ──────────────────
NSE_SYMBOLS = {
    "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "HINDUNILVR",
    "SBIN", "BHARTIARTL", "KOTAKBANK", "BAJFINANCE", "AXISBANK", "WIPRO",
    "LT", "ASIANPAINT", "MARUTI", "HCLTECH", "ULTRACEMCO", "TITAN",
    "SUNPHARMA", "NESTLEIND", "TECHM", "POWERGRID", "NTPC", "ONGC",
    "COALINDIA", "ADANIPORTS", "ADANIENT", "ADANIGREEN", "ADANITRANS",
    "BAJAJFINSV", "BAJAJ-AUTO", "HEROMOTOCO", "TATAMOTORS", "TATAPOWER",
    "TATASTEEL", "TATACONSUM", "M&M", "INDUSINDBK", "DIVISLAB",
    "CIPLA", "DRREDDY", "EICHERMOT", "APOLLOHOSP", "GRASIM",
    "HINDALCO", "JSWSTEEL", "BPCL", "IOC", "HPCL",
    "VEDL", "ZOMATO", "NYKAA", "PAYTM", "POLICYBZR",
    "IRCTC", "DMART", "PIDILITIND", "MUTHOOTFIN", "CHOLAFIN",
    "SBILIFE", "HDFCLIFE", "ICICIGI", "BAJFINANCE", "SHREECEM",
    "AMBUJACEM", "GAIL", "BRITANNIA", "HAVELLS", "VOLTAS",
    "BERGEPAINT", "COLPAL", "DABUR", "MARICO", "GODREJCP",
    "ITC", "HINDPETRO", "RECLTD", "PFC", "NHPC",
    "IRFC", "HAL", "BEL", "BHEL", "CONCOR",
    "SIEMENS", "ABB", "BOSCHLTD", "CUMMINSIND", "THERMAX",
    "PIIND", "SRF", "DEEPAKNTR", "ATUL", "NAVINFLUOR",
    "LALPATHLAB", "METROPOLIS", "MAXHEALTH", "FORTIS", "NH",
    "BANKBARODA", "PNB", "CANBK", "UNIONBANK", "IDFCFIRSTB",
    "FEDERALBNK", "RBLBANK", "BANDHANBNK", "AUBANK", "CUB",
    "MFSL", "LTIM", "PERSISTENT", "COFORGE", "MPHASIS",
    "LTTS", "KPITTECH", "TATAELXSI", "ZENSARTECH", "HEXAWARE",
    "OBEROIRLTY", "DLF", "GODREJPROP", "PRESTIGE", "BRIGADE",
    "IBREALEST", "PHOENIXLTD", "NAUKRI", "JUSTDIAL", "INDIAMART",
    "ZYDUSLIFE", "TORNTPHARM", "ALKEM", "LUPIN", "BIOCON",
    "GLENMARK", "IPCA", "AUROPHARMA", "GRANULES", "SUVEN",
    "CHOLAHLDNG", "MANAPPURAM", "M&MFIN", "SUNDARMFIN", "LICHOUSGFIN",
    "ABCAPITAL", "IIFL", "5PAISA", "ANGELONE", "MOTILALOFS",
    "PAGEIND", "APLAPOLLO", "JINDALSAW", "RATNAMANI", "WELSPUNIND",
    "CEATLTD", "MRF", "APOLLOTYRE", "BALKRISIND", "AMARAJABAT",
    "EXIDEIND", "ESCORTS", "SUNDRMFAST", "MOTHERSON", "VARROC",
    "INDIANHOTEL", "LEMONTREE", "MAHINDCIE", "ASHOKLEY", "TVSMOTOR",
    "BAJAJELEC", "POLYCAB", "KAYNES", "DIXON", "AMBER",
    "AETHER", "FINEORG", "GALAXYSURF", "RELAXO", "BATA",
    "VGUARD", "CROMPTON", "ORIENTELEC", "FINOLEX", "KEI",
}

# Common OCR error corrections
OCR_CORRECTIONS = {
    "TGS": "TCS",
    "INF1": "INFY",
    "INFI": "INFY",
    "RELLANCE": "RELIANCE",
    "RELIANCF": "RELIANCE",
    "HDFC8ANK": "HDFCBANK",
    "HDFCBAMK": "HDFCBANK",
    "SBIN1": "SBIN",
    "WIFRO": "WIPRO",
    "TATAST": "TATASTEEL",
    "BAJFINANCF": "BAJFINANCE",
    "BHARTIARTL1": "BHARTIARTL",
    "1TC": "ITC",
    "ADANIPART": "ADANIPORTS",
}


def validate_and_correct_ticker(raw: str) -> dict:
    """
    Validate a raw OCR ticker.
    Returns {ticker, is_valid, corrected, confidence}.
    """
    if not raw:
        return {"ticker": raw, "is_valid": False, "corrected": None, "confidence": 0}

    clean = raw.upper().strip()
    clean = re.sub(r"[^A-Z0-9&-]", "", clean)

    # Direct match
    if clean in NSE_SYMBOLS:
        return {"ticker": clean, "is_valid": True, "corrected": clean, "confidence": 100}

    # Manual corrections dictionary
    if clean in OCR_CORRECTIONS:
        corrected = OCR_CORRECTIONS[clean]
        return {"ticker": clean, "is_valid": True, "corrected": corrected, "confidence": 90}

    # Fuzzy match
    matches = get_close_matches(clean, NSE_SYMBOLS, n=1, cutoff=0.75)
    if matches:
        return {"ticker": clean, "is_valid": True, "corrected": matches[0], "confidence": 75}

    # Unknown — still return it, user can edit
    return {"ticker": clean, "is_valid": False, "corrected": clean, "confidence": 30}


def validate_holdings_list(holdings: list) -> list:
    """Validate all tickers in an extracted holdings list."""
    validated = []
    for h in holdings:
        result = validate_and_correct_ticker(h.get("ticker", ""))
        h["ticker"] = result["corrected"] or h["ticker"]
        h["ocr_confidence"] = result["confidence"]
        h["ticker_valid"] = result["is_valid"]
        validated.append(h)
    return validated
