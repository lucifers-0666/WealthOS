"""
WealthOS — Import Engine
Handles file parsing, broker detection, normalization, symbol resolution,
and produces a preview payload consumed by the React ImportPortfolio page.
"""

import io
import re
import pandas as pd
from typing import List, Dict, Any, Optional, Tuple

# ── Column alias maps ─────────────────────────────────────────────────────────
_HOLDINGS_ALIASES: Dict[str, str] = {
    "ticker": "symbol", "stock": "symbol", "scrip": "symbol",
    "isin": "symbol", "instrument": "symbol", "name": "company_name",
    "company": "company_name", "qty": "quantity", "shares": "quantity",
    "units": "quantity", "avg_cost": "avg_price", "average_price": "avg_price",
    "buy_price": "avg_price", "purchase_price": "avg_price",
    "cost": "avg_price", "invested_price": "avg_price",
    "ltp": "current_price", "last_price": "current_price", "cmp": "current_price",
    "market_price": "current_price",
}

_REQUIRED = {"symbol", "quantity", "avg_price"}

_COMPANY_TO_TICKER = {
    "SUZLON ENERGY": "SUZLON",
    "BHARAT COKING COAL": "BCCL",
    "EMMVEE PHOTOVOLTAIC": "EMMVEE",
    "ASHOK LEYLAND": "ASHOKLEY",
    "IOCL": "IOC",
    "BHARAT ELECTRONICS": "BEL",
    "ADANI POWER": "ADANIPOWER",
    "SBISENSEX": "SBISENSEX",
    "SBI MF - SBI GOLD": "SETFGOLD",
    "NIPPON ETF HANGSENG": "HNGSNGBEES",
    "MIRAE ASSET NYSE FANG+": "MAFANG",
}


# ── Broker fingerprinting ─────────────────────────────────────────────────────
_BROKER_SIGNATURES: List[Tuple[str, List[str]]] = [
    ("Zerodha",     ["tradingsymbol", "kite", "zerodha"]),
    ("Groww",       ["groww", "folio_no"]),
    ("Upstox",      ["upstox", "token"]),
    ("AngelOne",    ["angelone", "angel broking", "scripcode"]),
    ("5paisa",      ["5paisa"]),
    ("ICICI Direct",["icicidirect", "icici direct"]),
    ("HDFC Sec",    ["hdfc securities", "hdfcsec"]),
    ("Kotak Sec",   ["kotak securities"]),
    ("Fyers",       ["fyers"]),
    ("Dhan",        ["dhan"]),
]


def _detect_broker(raw_text: str, columns: List[str]) -> str:
    """Sniff broker name from column names and/or file text."""
    combined = " ".join(columns + [raw_text]).lower()
    for broker, sigs in _BROKER_SIGNATURES:
        if any(s in combined for s in sigs):
            return broker
    return "Unknown Broker"


# ── Column normalizer ─────────────────────────────────────────────────────────
def _normalise_columns(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = [c.strip().lower().replace(" ", "_").replace("-", "_") for c in df.columns]
    df.rename(columns=_HOLDINGS_ALIASES, inplace=True)
    return df


# ── Row normalizer ────────────────────────────────────────────────────────────
def _normalise_rows(df: pd.DataFrame) -> pd.DataFrame:
    df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce")
    df["avg_price"] = pd.to_numeric(df["avg_price"], errors="coerce")
    df.dropna(subset=["symbol", "quantity", "avg_price"], inplace=True)
    df = df[df["quantity"] > 0].copy()
    df["symbol"] = df["symbol"].astype(str).str.strip().str.upper()

    # Optional numeric columns
    for col in ("current_price",):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Fill optional string columns
    for col in ("company_name", "sector", "exchange", "asset_class", "currency"):
        if col not in df.columns:
            df[col] = ""
        else:
            df[col] = df[col].fillna("").astype(str).str.strip()

    # Defaults
    df.loc[df["exchange"] == "", "exchange"] = "NSE"
    df.loc[df["asset_class"] == "", "asset_class"] = "equity"
    df.loc[df["currency"] == "", "currency"] = "INR"

    df.reset_index(drop=True, inplace=True)
    return df


# ── Symbol resolution (basic .NS / .BO suffix stripper) ──────────────────────
def _resolve_symbol(sym: str) -> str:
    """Strip exchange suffixes from Yahoo/NSE symbols."""
    raw = (sym or "").strip().upper()
    if raw in _COMPANY_TO_TICKER:
        return _COMPANY_TO_TICKER[raw]
    base = re.sub(r"\.(NS|BO|BSE|NSE)$", "", raw).strip()
    return re.sub(r"[^A-Z0-9&+-]+", "", base)[:24]


# ── Chunked CSV parser ────────────────────────────────────────────────────────
def _parse_csv_chunked(file_bytes: bytes, chunksize: int = 500) -> Tuple[pd.DataFrame, str]:
    """Read CSV in chunks to handle large files. Returns (df, raw_header_text)."""
    chunks = []
    header_text = ""
    try:
        reader = pd.read_csv(io.BytesIO(file_bytes), chunksize=chunksize)
        for i, chunk in enumerate(reader):
            if i == 0:
                header_text = " ".join(chunk.columns.tolist()).lower()
            chunks.append(chunk)
        df = pd.concat(chunks, ignore_index=True)
    except Exception as e:
        raise ValueError(f"Could not parse CSV: {e}")
    return df, header_text


# ── XLSX parser ───────────────────────────────────────────────────────────────
def _parse_xlsx(file_bytes: bytes) -> Tuple[pd.DataFrame, str]:
    try:
        df = pd.read_excel(io.BytesIO(file_bytes))
    except Exception as e:
        raise ValueError(f"Could not parse Excel file: {e}")
    header_text = " ".join(df.columns.tolist()).lower()
    return df, header_text


# ── Insights builder ──────────────────────────────────────────────────────────
def _build_insights(df: pd.DataFrame) -> Dict[str, Any]:
    """Build basic portfolio insights dict from the normalised holdings df."""
    df = df.copy()
    df["invested"] = df["quantity"] * df["avg_price"]
    total = df["invested"].sum()

    sector_breakdown: Dict[str, float] = {}
    for _, row in df.iterrows():
        sec = row.get("sector") or "Unknown"
        sector_breakdown[sec] = sector_breakdown.get(sec, 0) + row["invested"]

    asset_breakdown: Dict[str, float] = {}
    for _, row in df.iterrows():
        ac = row.get("asset_class") or "equity"
        asset_breakdown[ac] = asset_breakdown.get(ac, 0) + row["invested"]

    top = df.nlargest(3, "invested")[["symbol", "invested"]].to_dict(orient="records")

    return {
        "total_invested": round(float(total), 2),
        "num_holdings": len(df),
        "sector_breakdown": {k: round(float(v), 2) for k, v in sector_breakdown.items()},
        "asset_breakdown": {k: round(float(v), 2) for k, v in asset_breakdown.items()},
        "top_holdings": [{"symbol": r["symbol"], "invested": round(float(r["invested"]), 2)} for r in top],
    }


# ── Public API ────────────────────────────────────────────────────────────────
def process_import_file(
    file_bytes: bytes,
    filename: str,
) -> Dict[str, Any]:
    """
    Entry-point called by /api/import/upload.
    Returns a preview payload:
    {
        broker, parser_used, count, ocr_confidence,
        holdings: [{ticker, company_name, quantity, avg_buy_price,
                    exchange, asset_class, currency, sector}],
        insights: {...}
    }
    """
    name_lower = filename.lower()

    # ── Parse file by type ────────────────────────────────────────
    if name_lower.endswith(".csv"):
        df, header_text = _parse_csv_chunked(file_bytes)
        parser_used = "csv"
    elif name_lower.endswith((".xlsx", ".xls")):
        df, header_text = _parse_xlsx(file_bytes)
        parser_used = "excel"
    else:
        raise ValueError(f"Unsupported file type: {filename}. Upload CSV or XLSX.")

    broker = _detect_broker(header_text, list(df.columns))

    # ── Normalise columns & rows ──────────────────────────────────
    df = _normalise_columns(df)
    missing = _REQUIRED - set(df.columns)
    if missing:
        raise ValueError(
            f"Missing required columns: {missing}. "
            f"Found: {list(df.columns)}. "
            "Ensure the file has symbol/ticker, quantity, and avg_price columns."
        )
    df = _normalise_rows(df)

    if df.empty:
        raise ValueError("No valid holdings found after parsing. Check the file format.")

    # ── Symbol resolution ─────────────────────────────────────────
    df["symbol"] = df["symbol"].apply(_resolve_symbol)

    # ── Build holdings list ───────────────────────────────────────
    holdings = []
    for _, row in df.iterrows():
        holdings.append({
            "ticker":        row["symbol"],
            "company_name":  row.get("company_name", "") or "",
            "quantity":      float(row["quantity"]),
            "avg_buy_price": float(row["avg_price"]),
            "exchange":      str(row.get("exchange", "NSE") or "NSE"),
            "asset_class":   str(row.get("asset_class", "equity") or "equity"),
            "currency":      str(row.get("currency", "INR") or "INR"),
            "sector":        str(row.get("sector", "") or ""),
        })

    insights = _build_insights(df)

    return {
        "broker":         broker,
        "parser_used":    parser_used,
        "count":          len(holdings),
        "ocr_confidence": 0,   # 0 = no OCR (CSV/Excel path)
        "holdings":       holdings,
        "insights":       insights,
    }


def apply_confirm(
    user_id: str,
    holdings: List[Dict[str, Any]],
    merge_strategy: str,
    broker: Optional[str],
    bulk_upsert_fn,
    get_holdings_fn,
    upsert_holding_fn,
) -> Dict[str, Any]:
    """
    Entry-point called by /api/import/confirm.
    Applies merge strategy and persists holdings to Supabase.
    Returns summary: {message, total_saved, saved, updated, skipped}
    """
    # Filter out deleted rows (frontend may mark _deleted=true)
    active = [h for h in holdings if not h.get("_deleted", False)]

    saved_list = []
    updated_list = []
    skipped_list = []

    if merge_strategy == "always_add":
        # Always insert as new rows — no dedup
        result = bulk_upsert_fn(user_id, active)
        saved_list = active
    elif merge_strategy in ("skip", "update"):
        existing = get_holdings_fn(user_id)
        existing_tickers = {h["ticker"].upper(): h for h in existing}

        to_insert = []
        for h in active:
            t = h["ticker"].upper()
            if t in existing_tickers:
                if merge_strategy == "update":
                    # Merge: add quantities, recalculate avg
                    ex = existing_tickers[t]
                    old_qty = float(ex.get("quantity", 0))
                    new_qty = float(h["quantity"])
                    old_avg = float(ex.get("avg_buy_price", 0))
                    new_avg = float(h["avg_buy_price"])
                    combined_qty = old_qty + new_qty
                    combined_avg = ((old_qty * old_avg) + (new_qty * new_avg)) / combined_qty if combined_qty else new_avg
                    merged = {**h, "quantity": combined_qty, "avg_buy_price": round(combined_avg, 4)}
                    upsert_holding_fn(user_id, merged)
                    updated_list.append(t)
                else:
                    skipped_list.append(t)
            else:
                to_insert.append(h)
                saved_list.append(t)

        if to_insert:
            bulk_upsert_fn(user_id, to_insert)
    else:
        # Fallback: bulk upsert all
        bulk_upsert_fn(user_id, active)
        saved_list = [h["ticker"] for h in active]

    total_saved = len(saved_list) + len(updated_list)
    return {
        "message":     f"Import complete. {total_saved} holdings processed.",
        "total_saved": total_saved,
        "saved":       saved_list,
        "updated":     updated_list,
        "skipped":     skipped_list,
        "broker":      broker or "Unknown",
    }
