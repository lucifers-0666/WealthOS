"""
csv_parser.py — Parse CSV portfolio exports from brokers.
Auto-detects column names from common broker export formats.
"""

import io
import csv
import re
from typing import Optional

# Canonical column name mappings from various brokers
COLUMN_ALIASES = {
    "ticker":        ["symbol", "ticker", "stock", "scrip", "instrument", "isin", "stock symbol", "trading symbol"],
    "company_name":  ["name", "company", "stock name", "company name", "scrip name", "instrument name"],
    "quantity":      ["qty", "quantity", "shares", "units", "net qty", "net quantity", "holdings"],
    "avg_buy_price": ["avg price", "average price", "buy price", "avg buy price", "cost price",
                      "average cost", "avg cost", "invested price", "avg"],
    "current_price": ["ltp", "cmp", "current price", "last price", "market price", "price"],
    "pnl":           ["p&l", "pnl", "profit loss", "gain loss", "unrealised p&l", "p/l"],
}


def _find_column(headers: list, canonical: str) -> Optional[str]:
    """Find the actual CSV header that matches a canonical column name."""
    aliases = COLUMN_ALIASES.get(canonical, [])
    for h in headers:
        if h.lower().strip() in aliases:
            return h
    return None


def _clean_number(val: str) -> Optional[float]:
    if not val:
        return None
    cleaned = re.sub(r"[^0-9.-]", "", str(val))
    try:
        return float(cleaned)
    except ValueError:
        return None


def parse_csv_bytes(data: bytes) -> list:
    """
    Parse CSV bytes into a list of holding dicts.
    Auto-maps columns from any broker format.
    """
    text = data.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    headers = reader.fieldnames or []

    col_ticker   = _find_column(headers, "ticker")
    col_name     = _find_column(headers, "company_name")
    col_qty      = _find_column(headers, "quantity")
    col_buy      = _find_column(headers, "avg_buy_price")
    col_ltp      = _find_column(headers, "current_price")
    col_pnl      = _find_column(headers, "pnl")

    holdings = []
    for row in reader:
        ticker = row.get(col_ticker, "").strip().upper() if col_ticker else ""
        if not ticker:
            continue
        qty = _clean_number(row.get(col_qty, "") if col_qty else None)
        if qty is None or qty <= 0:
            continue

        holdings.append({
            "ticker":        ticker,
            "company_name":  row.get(col_name, "").strip() if col_name else None,
            "quantity":      qty,
            "avg_buy_price": _clean_number(row.get(col_buy, "") if col_buy else None),
            "current_price": _clean_number(row.get(col_ltp, "") if col_ltp else None),
            "pnl":           _clean_number(row.get(col_pnl, "") if col_pnl else None),
            "pnl_percent":   None,
        })
    return holdings
