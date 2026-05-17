"""
import_service.py — Orchestrator: routes uploaded file to the correct parser,
validates tickers, and returns a normalised preview list ready for DB insert.
"""

import logging
from typing import Tuple

from core.import_services.ocr_service import extract_text_from_image, clean_ocr_text
from core.import_services.ai_parser import parse_text_to_holdings
from core.import_services.csv_parser import parse_csv_bytes
from core.import_services.excel_parser import parse_excel_bytes
from core.import_services.pdf_parser import parse_pdf_bytes
from core.import_services.stock_validator import validate_holdings_list

logger = logging.getLogger("wealthos-import")

IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


def detect_broker(raw_text: str) -> str:
    """Heuristic broker detection from OCR text."""
    text_lower = raw_text.lower()
    if "groww" in text_lower:
        return "Groww"
    if "zerodha" in text_lower or "kite" in text_lower:
        return "Zerodha"
    if "upstox" in text_lower:
        return "Upstox"
    if "angel" in text_lower:
        return "Angel One"
    if "indmoney" in text_lower or "ind money" in text_lower:
        return "INDmoney"
    if "paytm" in text_lower:
        return "Paytm Money"
    return "Unknown"


def process_upload(file_bytes: bytes, content_type: str, filename: str) -> dict:
    """
    Main import pipeline. Returns:
    {
        holdings: [...],
        broker: str,
        parser_used: str,
        ocr_confidence: int,
        raw_text: str,
        file_type: str,
        error: str | None,
    }
    """
    if len(file_bytes) > MAX_FILE_SIZE:
        return {"error": "File too large. Maximum size is 20 MB.", "holdings": []}

    # ── Image / Screenshot ────────────────────────────────────────────────
    if content_type in IMAGE_TYPES or any(
        filename.lower().endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"]
    ):
        ocr_result = extract_text_from_image(file_bytes)
        raw_text = clean_ocr_text(ocr_result.get("raw_text", ""))
        ocr_confidence = ocr_result.get("avg_confidence", 0)

        if not raw_text.strip():
            return {"error": "OCR could not extract any text from the image.", "holdings": [], "ocr_confidence": ocr_confidence}

        parse_result = parse_text_to_holdings(raw_text)
        holdings = parse_result.get("holdings", [])
        broker = detect_broker(raw_text)

        holdings = validate_holdings_list(holdings)
        return {
            "holdings": holdings,
            "broker": broker,
            "parser_used": parse_result.get("parser_used"),
            "ocr_confidence": ocr_confidence,
            "raw_text": raw_text[:2000],
            "file_type": "image",
            "error": None,
        }

    # ── CSV ───────────────────────────────────────────────────────────────
    if content_type == "text/csv" or filename.lower().endswith(".csv"):
        holdings = parse_csv_bytes(file_bytes)
        holdings = validate_holdings_list(holdings)
        return {
            "holdings": holdings,
            "broker": "CSV Export",
            "parser_used": "csv",
            "ocr_confidence": 100,
            "raw_text": "",
            "file_type": "csv",
            "error": None,
        }

    # ── Excel ─────────────────────────────────────────────────────────────
    if content_type in {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
    } or filename.lower().endswith((".xlsx", ".xls")):
        holdings = parse_excel_bytes(file_bytes)
        holdings = validate_holdings_list(holdings)
        return {
            "holdings": holdings,
            "broker": "Excel Export",
            "parser_used": "excel",
            "ocr_confidence": 100,
            "raw_text": "",
            "file_type": "excel",
            "error": None,
        }

    # ── PDF ───────────────────────────────────────────────────────────────
    if content_type == "application/pdf" or filename.lower().endswith(".pdf"):
        holdings = parse_pdf_bytes(file_bytes)
        holdings = validate_holdings_list(holdings)
        return {
            "holdings": holdings,
            "broker": "PDF Statement",
            "parser_used": "pdf",
            "ocr_confidence": 85,
            "raw_text": "",
            "file_type": "pdf",
            "error": None,
        }

    return {"error": f"Unsupported file type: {content_type}", "holdings": []}
