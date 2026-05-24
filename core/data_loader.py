import io
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any

REQUIRED_COLS = {"symbol", "quantity", "avg_price"}
OPTIONAL_COLS = {"name", "sector", "asset_class", "exchange", "notes"}

REQUIRED_TXN_COLS = {"ticker", "action", "quantity", "price", "transaction_date"}


def _normalise_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Lower-case and strip column names, map common aliases."""
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    aliases = {
        # symbol aliases
        "ticker":           "symbol",
        "stock":            "symbol",
        "scrip":            "symbol",
        "isin":             "symbol",
        # Groww / broker exports use 'company' as the stock identifier
        "company":          "symbol",
        "company_name":     "symbol",
        "instrument":       "symbol",
        "security":         "symbol",
        "security_name":    "symbol",
        # quantity aliases
        "qty":              "quantity",
        "shares":           "quantity",
        "units":            "quantity",
        "no_of_shares":     "quantity",
        # avg price aliases
        "avg_cost":         "avg_price",
        "average_price":    "avg_price",
        "buy_price":        "avg_price",
        "purchase_price":   "avg_price",
        "cost":             "avg_price",
        "avg_buy_price":    "avg_price",
        # current/market price aliases
        "ltp":              "current_price",
        "last_price":       "current_price",
        "cmp":              "current_price",
        "market_price":     "current_price",
        "last_traded_price": "current_price",
        "price":            "current_price",
        # other common aliases
        "invested_value":   "invested_amount",
        "current_value":    "total_value",
        "returns_amount":   "unrealized_pnl",
        "p&l":              "unrealized_pnl",
        "gain_loss":        "unrealized_pnl",
    }
    df.rename(columns=aliases, inplace=True)
    return df


def load_from_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Validate and enrich a raw uploaded DataFrame."""
    df = _normalise_columns(df.copy())
    missing = REQUIRED_COLS - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {missing}. Found: {list(df.columns)}")

    df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce")
    df["avg_price"] = pd.to_numeric(df["avg_price"], errors="coerce")
    df.dropna(subset=["symbol", "quantity", "avg_price"], inplace=True)
    df = df[df["quantity"] > 0]
    df["symbol"] = df["symbol"].str.strip().str.upper()
    df["invested"] = (df["quantity"] * df["avg_price"]).round(2)

    for col in OPTIONAL_COLS:
        if col not in df.columns:
            df[col] = ""

    df["asset_class"] = df["asset_class"].replace("", "Equity")
    df.reset_index(drop=True, inplace=True)
    return df


def load_from_file(uploaded_file) -> pd.DataFrame:
    """Load holdings from Streamlit UploadedFile (CSV or XLSX)."""
    name = uploaded_file.name.lower()
    try:
        if name.endswith(".csv"):
            df = pd.read_csv(uploaded_file)
        elif name.endswith((".xlsx", ".xls")):
            df = pd.read_excel(uploaded_file)
        else:
            raise ValueError("Unsupported file type. Upload CSV or XLSX.")
        return load_from_dataframe(df)
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"Could not parse file: {e}")


def parse_holdings_csv(file_obj: io.BytesIO) -> List[Dict[str, Any]]:
    """
    Parse a holdings CSV file (BytesIO) into a list of dicts
    compatible with the FastAPI /upload/holdings-csv endpoint.

    Supported column formats:
      - Standard:  symbol/ticker, quantity/qty, avg_price/avg_cost
      - Groww:     Company, Shares, Average Price, Market Price
      - Zerodha:   Instrument, Qty, Avg cost, LTP
      - Upstox:    Symbol, Quantity, Avg Buy Price, LTP
    """
    try:
        df = pd.read_csv(file_obj)
    except Exception as e:
        raise ValueError(f"Could not read CSV: {e}")

    df = _normalise_columns(df)
    missing = REQUIRED_COLS - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {missing}. Found: {list(df.columns)}")

    df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce")
    df["avg_price"] = pd.to_numeric(df["avg_price"], errors="coerce")
    df.dropna(subset=["symbol", "quantity", "avg_price"], inplace=True)
    df = df[df["quantity"] > 0].copy()

    # Use original company/symbol value as both ticker and display name
    # Keep original casing for name, uppercase for ticker
    if "name" not in df.columns:
        df["name"] = df["symbol"].str.strip()  # preserve original casing for name
    df["symbol"] = df["symbol"].str.strip().str.upper()

    for col in OPTIONAL_COLS:
        if col not in df.columns:
            df[col] = ""
    if "exchange" not in df.columns or df["exchange"].eq("").all():
        df["exchange"] = "NSE"
    if "asset_class" not in df.columns or df["asset_class"].eq("").all():
        df["asset_class"] = "equity"
    if "currency" not in df.columns:
        df["currency"] = "INR"

    # current_price is optional — default to avg_price if not present
    if "current_price" not in df.columns:
        df["current_price"] = df["avg_price"]
    else:
        df["current_price"] = pd.to_numeric(df["current_price"], errors="coerce").fillna(df["avg_price"])

    holdings = []
    for _, row in df.iterrows():
        holdings.append({
            "ticker":        row["symbol"],
            "company_name":  str(row.get("name", "") or row["symbol"]),
            "quantity":      float(row["quantity"]),
            "avg_buy_price": float(row["avg_price"]),
            "current_price": float(row["current_price"]),
            "exchange":      str(row.get("exchange", "NSE") or "NSE"),
            "asset_class":   str(row.get("asset_class", "equity") or "equity"),
            "currency":      str(row.get("currency", "INR") or "INR"),
            "sector":        str(row.get("sector", "") or ""),
        })
    return holdings


def parse_transactions_csv(file_obj: io.BytesIO) -> List[Dict[str, Any]]:
    """
    Parse a transactions CSV file (BytesIO) into a list of dicts
    compatible with the FastAPI /upload/transactions-csv endpoint.

    Expected columns:
        ticker, action (BUY/SELL), quantity, price, transaction_date
    Optional: exchange, broker, notes
    """
    try:
        df = pd.read_csv(file_obj)
    except Exception as e:
        raise ValueError(f"Could not read CSV: {e}")

    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    # Alias mapping for transactions
    txn_aliases = {
        "symbol":           "ticker",
        "stock":            "ticker",
        "scrip":            "ticker",
        "company":          "ticker",
        "type":             "action",
        "trade_type":       "action",
        "side":             "action",
        "qty":              "quantity",
        "shares":           "quantity",
        "trade_price":      "price",
        "execution_price":  "price",
        "date":             "transaction_date",
        "trade_date":       "transaction_date",
    }
    df.rename(columns=txn_aliases, inplace=True)

    missing = REQUIRED_TXN_COLS - set(df.columns)
    if missing:
        raise ValueError(f"Missing required transaction columns: {missing}. Found: {list(df.columns)}")

    df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce")
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df.dropna(subset=["ticker", "quantity", "price", "transaction_date"], inplace=True)
    df = df[df["quantity"] > 0].copy()
    df["ticker"] = df["ticker"].str.strip().str.upper()
    df["action"] = df["action"].str.strip().str.upper()

    if "exchange" not in df.columns:
        df["exchange"] = "NSE"
    if "broker" not in df.columns:
        df["broker"] = ""
    if "notes" not in df.columns:
        df["notes"] = ""

    transactions = []
    for _, row in df.iterrows():
        transactions.append({
            "ticker":           row["ticker"],
            "action":           row["action"],
            "quantity":         float(row["quantity"]),
            "price":            float(row["price"]),
            "transaction_date": str(row["transaction_date"]),
            "exchange":         str(row.get("exchange", "NSE") or "NSE"),
            "broker":           str(row.get("broker", "") or ""),
            "notes":            str(row.get("notes", "") or ""),
        })
    return transactions


def get_demo_portfolio() -> pd.DataFrame:
    """Return a realistic demo portfolio for Indian + international holdings."""
    data = [
        {"symbol": "RELIANCE",   "name": "Reliance Industries",     "quantity": 25,  "avg_price": 2450.00, "sector": "Energy",       "asset_class": "Equity",   "exchange": "NSE"},
        {"symbol": "INFY",       "name": "Infosys Ltd",            "quantity": 40,  "avg_price": 1380.00, "sector": "IT",          "asset_class": "Equity",   "exchange": "NSE"},
        {"symbol": "HDFCBANK",   "name": "HDFC Bank",              "quantity": 30,  "avg_price": 1620.00, "sector": "Banking",     "asset_class": "Equity",   "exchange": "NSE"},
        {"symbol": "TCS",        "name": "Tata Consultancy Svcs",  "quantity": 15,  "avg_price": 3480.00, "sector": "IT",          "asset_class": "Equity",   "exchange": "NSE"},
        {"symbol": "WIPRO",      "name": "Wipro Ltd",              "quantity": 60,  "avg_price": 420.00,  "sector": "IT",          "asset_class": "Equity",   "exchange": "NSE"},
        {"symbol": "TATAMOTORS", "name": "Tata Motors",            "quantity": 50,  "avg_price": 580.00,  "sector": "Auto",        "asset_class": "Equity",   "exchange": "NSE"},
        {"symbol": "BAJFINANCE", "name": "Bajaj Finance",          "quantity": 8,   "avg_price": 6800.00, "sector": "NBFC",        "asset_class": "Equity",   "exchange": "NSE"},
        {"symbol": "VTI",        "name": "Vanguard Total Mkt ETF", "quantity": 10,  "avg_price": 220.00,  "sector": "Diversified", "asset_class": "ETF",      "exchange": "NYSE"},
        {"symbol": "QQQ",        "name": "Invesco QQQ Trust",      "quantity": 5,   "avg_price": 380.00,  "sector": "Technology",  "asset_class": "ETF",      "exchange": "NASDAQ"},
        {"symbol": "GOLDBEES",   "name": "Nippon Gold ETF",        "quantity": 100, "avg_price": 52.00,   "sector": "Gold",        "asset_class": "Gold ETF", "exchange": "NSE"},
    ]
    df = pd.DataFrame(data)
    df["invested"] = (df["quantity"] * df["avg_price"]).round(2)
    return df


def save_portfolio_to_session(df: pd.DataFrame) -> None:
    try:
        import streamlit as st
        st.session_state["portfolio_df"] = df
        st.session_state["portfolio_loaded"] = True
        st.session_state["portfolio_load_time"] = datetime.now()
    except ImportError:
        pass  # Not running in Streamlit context


def load_portfolio_from_session() -> pd.DataFrame | None:
    try:
        import streamlit as st
        return st.session_state.get("portfolio_df", None)
    except ImportError:
        return None
