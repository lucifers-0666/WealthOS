"""
ai_parser.py — Uses Google Gemini Flash to parse raw OCR/text into structured
stock holdings JSON. Falls back to regex heuristic parser if Gemini unavailable.
"""

import re
import os
import json
import logging
from typing import Optional

logger = logging.getLogger("wealthos-import")


# ── Gemini-powered parser ─────────────────────────────────────────────────
def parse_with_gemini(raw_text: str) -> Optional[list]:
    """Send OCR text to Gemini Flash and get back structured JSON."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    try:
        from core.ai_client import GeminiClient
        client = GeminiClient(api_key=api_key)

        prompt = f"""You are a financial data extraction AI. Extract all stock holdings from the following text.
Return ONLY a valid JSON array. Each object must have these fields:
- ticker: string (NSE/BSE stock symbol, uppercase)
- company_name: string or null
- quantity: number
- avg_buy_price: number or null
- current_price: number or null
- pnl: number or null (profit/loss amount)
- pnl_percent: number or null

Rules:
- If a field is missing, set it to null
- Do NOT include any explanation, only the JSON array
- Ticker must be uppercase letters only (e.g. TCS, INFY, RELIANCE)
- Numbers must be plain numbers, no commas or currency symbols

Text to parse:
{raw_text}

JSON:"""

        text = client.ask(prompt).strip()
        if text == client.FALLBACK_MESSAGE:
            return None

        # Strip markdown code blocks if present
        text = re.sub(r"```json|```", "", text).strip()

        data = json.loads(text)
        if isinstance(data, list):
            return data
        return None

    except Exception as e:
        logger.warning(f"Gemini parsing failed: {e}")
        return None


# ── Regex heuristic fallback parser ──────────────────────────────────────
def _parse_number(s: str) -> Optional[float]:
    """Extract float from string like '₹3,200.50' or '3200'."""
    if s is None:
        return None
    cleaned = re.sub(r"[^0-9.]", "", str(s))
    try:
        return float(cleaned) if cleaned else None
    except ValueError:
        return None


def parse_with_regex(raw_text: str) -> list:
    """
    Heuristic regex parser. Handles common broker screenshot formats:
    - "TCS 10 3200 3500"
    - "INFY Qty:15 Avg:1400 LTP:1500"
    - "Reliance Industries 5 shares @ ₹2800"
    """
    holdings = []
    lines = raw_text.split("\n")
    if len(lines) < 3:
        lines = re.split(r"(?=[A-Z]{2,6}\b)", raw_text)

    # Pattern: TICKER followed by numbers
    pattern = re.compile(
        r"(?P<ticker>[A-Z][A-Z0-9&-]{1,14})"
        r".*?"
        r"(?:qty|quantity|shares|units)?[:\s]*(?P<qty>[0-9]+(?:\.[0-9]+)?)"
        r".*?"
        r"(?:avg|buy|invested|purchase|cost)?[:\s]*(?:[₹$])?(?P<buy>[0-9,]+(?:\.[0-9]{1,2})?)"
        r"(?:.*?(?:ltp|cmp|current|price)?[:\s]*(?:[₹$])?(?P<ltp>[0-9,]+(?:\.[0-9]{1,2})?))?$",
        re.IGNORECASE,
    )

    seen = set()
    for line in lines:
        line = line.strip()
        if len(line) < 4:
            continue
        m = pattern.search(line)
        if m:
            ticker = m.group("ticker").upper()
            if ticker in seen or len(ticker) < 2:
                continue
            qty = _parse_number(m.group("qty"))
            buy = _parse_number(m.group("buy"))
            ltp = _parse_number(m.group("ltp"))

            if qty and qty > 0:
                seen.add(ticker)
                holdings.append({
                    "ticker": ticker,
                    "company_name": None,
                    "quantity": qty,
                    "avg_buy_price": buy,
                    "current_price": ltp,
                    "pnl": None,
                    "pnl_percent": None,
                })

    return holdings


def parse_text_to_holdings(raw_text: str) -> dict:
    """
    Main entry point. Try Gemini first, fall back to regex.
    Returns {holdings: [...], parser_used: 'gemini'|'regex', raw_text: str}
    """
    # Try Gemini
    gemini_result = parse_with_gemini(raw_text)
    if gemini_result and len(gemini_result) > 0:
        return {
            "holdings": gemini_result,
            "parser_used": "gemini",
            "raw_text": raw_text,
        }

    # Fall back to regex
    regex_result = parse_with_regex(raw_text)
    return {
        "holdings": regex_result,
        "parser_used": "regex",
        "raw_text": raw_text,
    }
