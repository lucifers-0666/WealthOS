import pandas as pd
import numpy as np
from io import StringIO, BytesIO
from loguru import logger
from typing import Optional

# ─────────────────────────────────────────────
# Canonical column names — ALL LOWERCASE
# This eliminates the 'column "symbol" does not exist'
# error caused by PascalCase vs lowercase mismatches
# in SQL queries and pandas groupby operations.
# ─────────────────────────────────────────────
REQUIRED_HOLDINGS_COLS  = ["symbol", "quantity", "avg_buy_price"]
REQUIRED_TRANSACTION_COLS = ["date", "symbol", "type", "quantity", "price"]


def _normalise_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Strip whitespace, replace spaces with underscores, force lowercase."""
    df.columns = [c.strip().replace(' ', '_').lower() for c in df.columns]
    return df


def load_holdings(file) -> Optional[pd.DataFrame]:
    """Load holdings from uploaded CSV or XLSX file."""
    try:
        if hasattr(file, 'name') and file.name.endswith('.xlsx'):
            df = pd.read_excel(file)
        else:
            df = pd.read_csv(file)

        df = _normalise_columns(df)

        missing = [c for c in REQUIRED_HOLDINGS_COLS if c not in df.columns]
        if missing:
            raise ValueError(f"Missing required columns: {missing}")

        df['quantity']      = pd.to_numeric(df['quantity'],      errors='coerce')
        df['avg_buy_price'] = pd.to_numeric(df['avg_buy_price'], errors='coerce')
        df.dropna(subset=['symbol', 'quantity', 'avg_buy_price'], inplace=True)

        # Add defaults if absent
        if 'asset_type' not in df.columns:
            df['asset_type'] = 'Equity'
        if 'exchange' not in df.columns:
            df['exchange'] = 'NSE'
        if 'name' not in df.columns:
            df['name'] = df['symbol']
        if 'sector' not in df.columns:
            df['sector'] = 'Unknown'

        df['invested_amount'] = df['quantity'] * df['avg_buy_price']

        logger.info(f"Loaded {len(df)} holdings successfully.")
        return df

    except Exception as e:
        logger.error(f"Error loading holdings: {e}")
        raise e


# Alias used by upload_page.py
load_holdings_from_file = load_holdings


def load_transactions(file) -> Optional[pd.DataFrame]:
    """Load transaction history from uploaded CSV or XLSX file."""
    try:
        if hasattr(file, 'name') and file.name.endswith('.xlsx'):
            df = pd.read_excel(file)
        else:
            df = pd.read_csv(file)

        df = _normalise_columns(df)

        missing = [c for c in REQUIRED_TRANSACTION_COLS if c not in df.columns]
        if missing:
            raise ValueError(f"Missing required columns: {missing}")

        df['date']     = pd.to_datetime(df['date'],     errors='coerce')
        df['quantity'] = pd.to_numeric(df['quantity'],  errors='coerce')
        df['price']    = pd.to_numeric(df['price'],     errors='coerce')
        df['fees']     = pd.to_numeric(df.get('fees', 0), errors='coerce').fillna(0)
        df.dropna(subset=['date', 'symbol', 'type', 'quantity', 'price'], inplace=True)
        df.sort_values('date', inplace=True)

        logger.info(f"Loaded {len(df)} transactions successfully.")
        return df

    except Exception as e:
        logger.error(f"Error loading transactions: {e}")
        raise e


# Alias for consistency
load_transactions_from_file = load_transactions


def get_sample_holdings() -> pd.DataFrame:
    """Return sample holdings for demo purposes (lowercase columns)."""
    data = {
        'symbol':        ['RELIANCE.NS', 'INFY.NS', 'HDFCBANK.NS', 'TCS.NS', 'WIPRO.NS',
                          'VTI', 'QQQ', 'INDA', 'GOLDBEES.NS', 'LIQUIDBEES.NS'],
        'name':          ['Reliance Industries', 'Infosys Ltd', 'HDFC Bank', 'TCS', 'Wipro',
                          'Vanguard Total Market', 'Invesco QQQ Trust', 'iShares MSCI India',
                          'Nippon Gold BeES', 'Nippon Liquid BeES'],
        'quantity':      [10, 25, 15, 8, 30, 5, 3, 20, 50, 100],
        'avg_buy_price': [2400, 1500, 1600, 3800, 480, 220, 430, 45, 58, 1000],
        'asset_type':    ['Equity', 'Equity', 'Equity', 'Equity', 'Equity',
                          'ETF', 'ETF', 'ETF', 'Gold ETF', 'Liquid ETF'],
        'exchange':      ['NSE', 'NSE', 'NSE', 'NSE', 'NSE',
                          'NYSE', 'NASDAQ', 'NYSE', 'NSE', 'NSE'],
        'sector':        ['Energy', 'IT', 'Banking', 'IT', 'IT',
                          'US Market', 'US Tech', 'India Index', 'Gold', 'Liquid'],
    }
    df = pd.DataFrame(data)
    df['invested_amount'] = df['quantity'] * df['avg_buy_price']
    return df


def get_sample_transactions() -> pd.DataFrame:
    """Return sample transactions for demo (lowercase columns)."""
    data = {
        'date':     ['2024-01-15', '2024-02-20', '2024-03-10', '2024-04-05', '2024-05-12',
                     '2024-06-18', '2024-07-22', '2024-08-14', '2024-09-30', '2024-11-05'],
        'symbol':   ['RELIANCE.NS', 'INFY.NS', 'HDFCBANK.NS', 'VTI', 'TCS.NS',
                     'QQQ', 'GOLDBEES.NS', 'WIPRO.NS', 'INDA', 'LIQUIDBEES.NS'],
        'type':     ['BUY', 'BUY', 'BUY', 'BUY', 'BUY',
                     'BUY', 'BUY', 'BUY', 'BUY', 'BUY'],
        'quantity': [10, 25, 15, 5, 8, 3, 50, 30, 20, 100],
        'price':    [2400, 1500, 1600, 220, 3800, 430, 58, 480, 45, 1000],
        'fees':     [20, 15, 18, 5, 25, 8, 10, 12, 6, 3],
    }
    df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['date'])
    return df
