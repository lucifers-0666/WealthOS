import pandas as pd
import numpy as np
from io import StringIO, BytesIO
from loguru import logger
from typing import Optional

REQUIRED_HOLDINGS_COLS = ["Symbol", "Quantity", "Avg_Buy_Price"]
REQUIRED_TRANSACTION_COLS = ["Date", "Symbol", "Type", "Quantity", "Price"]

def load_holdings(file) -> Optional[pd.DataFrame]:
    """Load holdings from uploaded CSV or XLSX file."""
    try:
        if hasattr(file, 'name') and file.name.endswith('.xlsx'):
            df = pd.read_excel(file)
        else:
            df = pd.read_csv(file)

        # Normalize column names
        df.columns = [c.strip().replace(' ', '_') for c in df.columns]

        # Validate required columns
        missing = [c for c in REQUIRED_HOLDINGS_COLS if c not in df.columns]
        if missing:
            raise ValueError(f"Missing required columns: {missing}")

        # Data type coercion
        df['Quantity'] = pd.to_numeric(df['Quantity'], errors='coerce')
        df['Avg_Buy_Price'] = pd.to_numeric(df['Avg_Buy_Price'], errors='coerce')
        df.dropna(subset=['Symbol', 'Quantity', 'Avg_Buy_Price'], inplace=True)

        # Add defaults
        if 'Asset_Type' not in df.columns:
            df['Asset_Type'] = 'Equity'
        if 'Exchange' not in df.columns:
            df['Exchange'] = 'NSE'
        if 'Name' not in df.columns:
            df['Name'] = df['Symbol']

        # Compute invested amount
        df['Invested_Amount'] = df['Quantity'] * df['Avg_Buy_Price']

        logger.info(f"Loaded {len(df)} holdings successfully.")
        return df

    except Exception as e:
        logger.error(f"Error loading holdings: {e}")
        raise e


def load_transactions(file) -> Optional[pd.DataFrame]:
    """Load transaction history from uploaded CSV or XLSX file."""
    try:
        if hasattr(file, 'name') and file.name.endswith('.xlsx'):
            df = pd.read_excel(file)
        else:
            df = pd.read_csv(file)

        df.columns = [c.strip().replace(' ', '_') for c in df.columns]

        missing = [c for c in REQUIRED_TRANSACTION_COLS if c not in df.columns]
        if missing:
            raise ValueError(f"Missing required columns: {missing}")

        df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
        df['Quantity'] = pd.to_numeric(df['Quantity'], errors='coerce')
        df['Price'] = pd.to_numeric(df['Price'], errors='coerce')
        df['Fees'] = pd.to_numeric(df.get('Fees', 0), errors='coerce').fillna(0)
        df.dropna(subset=['Date', 'Symbol', 'Type', 'Quantity', 'Price'], inplace=True)
        df.sort_values('Date', inplace=True)

        logger.info(f"Loaded {len(df)} transactions successfully.")
        return df

    except Exception as e:
        logger.error(f"Error loading transactions: {e}")
        raise e


def get_sample_holdings() -> pd.DataFrame:
    """Return sample holdings for demo purposes."""
    data = {
        'Symbol': ['RELIANCE.NS', 'INFY.NS', 'HDFCBANK.NS', 'TCS.NS', 'WIPRO.NS',
                   'VTI', 'QQQ', 'INDA', 'GOLDBEES.NS', 'LIQUIDBEES.NS'],
        'Name': ['Reliance Industries', 'Infosys Ltd', 'HDFC Bank', 'TCS', 'Wipro',
                 'Vanguard Total Market', 'Invesco QQQ Trust', 'iShares MSCI India',
                 'Nippon Gold BeES', 'Nippon Liquid BeES'],
        'Quantity': [10, 25, 15, 8, 30, 5, 3, 20, 50, 100],
        'Avg_Buy_Price': [2400, 1500, 1600, 3800, 480, 220, 430, 45, 58, 1000],
        'Asset_Type': ['Equity', 'Equity', 'Equity', 'Equity', 'Equity',
                       'ETF', 'ETF', 'ETF', 'Gold ETF', 'Liquid ETF'],
        'Exchange': ['NSE', 'NSE', 'NSE', 'NSE', 'NSE',
                     'NYSE', 'NASDAQ', 'NYSE', 'NSE', 'NSE'],
        'Sector': ['Energy', 'IT', 'Banking', 'IT', 'IT',
                   'US Market', 'US Tech', 'India Index', 'Gold', 'Liquid']
    }
    df = pd.DataFrame(data)
    df['Invested_Amount'] = df['Quantity'] * df['Avg_Buy_Price']
    return df


def get_sample_transactions() -> pd.DataFrame:
    """Return sample transactions for demo."""
    data = {
        'Date': ['2024-01-15', '2024-02-20', '2024-03-10', '2024-04-05', '2024-05-12',
                 '2024-06-18', '2024-07-22', '2024-08-14', '2024-09-30', '2024-11-05'],
        'Symbol': ['RELIANCE.NS', 'INFY.NS', 'HDFCBANK.NS', 'VTI', 'TCS.NS',
                   'QQQ', 'GOLDBEES.NS', 'WIPRO.NS', 'INDA', 'LIQUIDBEES.NS'],
        'Type': ['BUY', 'BUY', 'BUY', 'BUY', 'BUY',
                 'BUY', 'BUY', 'BUY', 'BUY', 'BUY'],
        'Quantity': [10, 25, 15, 5, 8, 3, 50, 30, 20, 100],
        'Price': [2400, 1500, 1600, 220, 3800, 430, 58, 480, 45, 1000],
        'Fees': [20, 15, 18, 5, 25, 8, 10, 12, 6, 3]
    }
    df = pd.DataFrame(data)
    df['Date'] = pd.to_datetime(df['Date'])
    return df
