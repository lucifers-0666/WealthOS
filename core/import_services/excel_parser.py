"""
excel_parser.py — Parse Excel (.xlsx/.xls) portfolio files using openpyxl.
Auto-detects header row and column mapping.
"""

import io
import re
from typing import Optional

# Reuse column aliases from csv_parser
from core.import_services.csv_parser import COLUMN_ALIASES


def _clean_number(val) -> Optional[float]:
    if val is None:
        return None
    cleaned = re.sub(r"[^0-9.-]", "", str(val))
    try:
        return float(cleaned)
    except ValueError:
        return None


def _find_col_index(headers: list, canonical: str) -> Optional[int]:
    aliases = COLUMN_ALIASES.get(canonical, [])
    for i, h in enumerate(headers):
        if str(h).lower().strip() in aliases:
            return i
    return None


def parse_excel_bytes(data: bytes) -> list:
    """
    Parse Excel bytes (.xlsx) into a list of holding dicts.
    Finds the first row that contains recognisable column headers.
    """
    try:
        import openpyxl
    except ImportError:
        raise ImportError("openpyxl is required: pip install openpyxl")

    wb = openpyxl.load_workbook(io.BytesIO(data), data_only=True)
    ws = wb.active

    all_rows = list(ws.iter_rows(values_only=True))
    if not all_rows:
        return []

    # Find header row — first row that has a recognisable alias
    header_row_idx = 0
    for i, row in enumerate(all_rows):
        row_lower = [str(c).lower().strip() if c else "" for c in row]
        all_aliases = [a for aliases in COLUMN_ALIASES.values() for a in aliases]
        if any(cell in all_aliases for cell in row_lower):
            header_row_idx = i
            break

    headers = [str(c).strip() if c else "" for c in all_rows[header_row_idx]]

    i_ticker = _find_col_index(headers, "ticker")
    i_name   = _find_col_index(headers, "company_name")
    i_qty    = _find_col_index(headers, "quantity")
    i_buy    = _find_col_index(headers, "avg_buy_price")
    i_ltp    = _find_col_index(headers, "current_price")
    i_pnl    = _find_col_index(headers, "pnl")

    holdings = []
    for row in all_rows[header_row_idx + 1:]:
        ticker = str(row[i_ticker]).strip().upper() if i_ticker is not None and row[i_ticker] else ""
        if not ticker or ticker == "NONE":
            continue
        qty = _clean_number(row[i_qty] if i_qty is not None else None)
        if qty is None or qty <= 0:
            continue

        holdings.append({
            "ticker":        ticker,
            "company_name":  str(row[i_name]).strip() if i_name is not None and row[i_name] else None,
            "quantity":      qty,
            "avg_buy_price": _clean_number(row[i_buy] if i_buy is not None else None),
            "current_price": _clean_number(row[i_ltp] if i_ltp is not None else None),
            "pnl":           _clean_number(row[i_pnl] if i_pnl is not None else None),
            "pnl_percent":   None,
        })
    return holdings
