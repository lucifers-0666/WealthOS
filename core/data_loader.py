import pandas as pd
import numpy as np
import streamlit as st
from pathlib import Path
from datetime import datetime

REQUIRED_COLS = {"symbol", "quantity", "avg_price"}
OPTIONAL_COLS = {"name", "sector", "asset_class", "exchange", "notes"}


def _normalise_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Lower-case and strip column names, map common aliases."""
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    aliases = {
        "ticker": "symbol",
        "stock": "symbol",
        "scrip": "symbol",
        "isin": "symbol",
        "qty": "quantity",
        "shares": "quantity",
        "units": "quantity",
        "avg_cost": "avg_price",
        "average_price": "avg_price",
        "buy_price": "avg_price",
        "purchase_price": "avg_price",
        "cost": "avg_price",
        "ltp": "current_price",
        "last_price": "current_price",
        "cmp": "current_price",
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


def get_demo_portfolio() -> pd.DataFrame:
    """Return a realistic demo portfolio for Indian + international holdings."""
    data = [
        {"symbol": "RELIANCE",  "name": "Reliance Industries",    "quantity": 25,   "avg_price": 2450.00, "sector": "Energy",          "asset_class": "Equity",    "exchange": "NSE"},
        {"symbol": "INFY",      "name": "Infosys Ltd",           "quantity": 40,   "avg_price": 1380.00, "sector": "IT",             "asset_class": "Equity",    "exchange": "NSE"},
        {"symbol": "HDFCBANK",  "name": "HDFC Bank",             "quantity": 30,   "avg_price": 1620.00, "sector": "Banking",        "asset_class": "Equity",    "exchange": "NSE"},
        {"symbol": "TCS",       "name": "Tata Consultancy Svcs", "quantity": 15,   "avg_price": 3480.00, "sector": "IT",             "asset_class": "Equity",    "exchange": "NSE"},
        {"symbol": "WIPRO",     "name": "Wipro Ltd",             "quantity": 60,   "avg_price": 420.00,  "sector": "IT",             "asset_class": "Equity",    "exchange": "NSE"},
        {"symbol": "TATAMOTORS","name": "Tata Motors",          "quantity": 50,   "avg_price": 580.00,  "sector": "Auto",           "asset_class": "Equity",    "exchange": "NSE"},
        {"symbol": "BAJFINANCE","name": "Bajaj Finance",        "quantity": 8,    "avg_price": 6800.00, "sector": "NBFC",           "asset_class": "Equity",    "exchange": "NSE"},
        {"symbol": "VTI",       "name": "Vanguard Total Mkt ETF","quantity": 10,   "avg_price": 220.00,  "sector": "Diversified",    "asset_class": "ETF",       "exchange": "NYSE"},
        {"symbol": "QQQ",       "name": "Invesco QQQ Trust",    "quantity": 5,    "avg_price": 380.00,  "sector": "Technology",     "asset_class": "ETF",       "exchange": "NASDAQ"},
        {"symbol": "GOLDBEES",  "name": "Nippon Gold ETF",       "quantity": 100,  "avg_price": 52.00,   "sector": "Gold",           "asset_class": "Gold ETF",  "exchange": "NSE"},
    ]
    df = pd.DataFrame(data)
    df["invested"] = (df["quantity"] * df["avg_price"]).round(2)
    return df


def save_portfolio_to_session(df: pd.DataFrame) -> None:
    st.session_state["portfolio_df"] = df
    st.session_state["portfolio_loaded"] = True
    st.session_state["portfolio_load_time"] = datetime.now()


def load_portfolio_from_session() -> pd.DataFrame | None:
    return st.session_state.get("portfolio_df", None)
