"""
OCR pipeline to extract holdings data from uploaded portfolio screenshots.
Uses pytesseract (local) or falls back to Gemini Vision if available.
Extracted data is merged into session_state.portfolio_data.
"""
from __future__ import annotations

import re
import io
import pandas as pd
from PIL import Image
from loguru import logger


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _clean_rupee(text: str) -> str:
    """Strip ₹, commas, whitespace from a numeric string."""
    return re.sub(r'[₹,\s]', '', text)


def _try_tesseract(image: Image.Image) -> str | None:
    """Return OCR text using pytesseract, or None if not installed."""
    try:
        import pytesseract
        return pytesseract.image_to_string(image, lang='eng')
    except Exception as e:
        logger.debug(f"Tesseract unavailable: {e}")
        return None


def _try_gemini_vision(image: Image.Image) -> str | None:
    """Use Gemini Vision to extract text from the image."""
    try:
        from config import GOOGLE_API_KEY, GEMINI_VISION_MODEL
        if not GOOGLE_API_KEY:
            return None

        VISION_PROMPT = (
            "Extract all stock/ETF holdings from this portfolio screenshot. "
            "Return a plain table with columns: Symbol, Name, Quantity, AvgPrice, CurrentPrice, PnL. "
            "Use numbers only (no \u20b9 or commas). If a value is unknown write NA."
        )

        try:
            from google import genai
            from google.genai import types as gt
            client = genai.Client(api_key=GOOGLE_API_KEY)
            buf = io.BytesIO()
            image.save(buf, format='PNG')
            image_bytes = buf.getvalue()
            response = client.models.generate_content(
                model=GEMINI_VISION_MODEL,
                contents=[
                    gt.Part(inline_data=gt.Blob(mime_type="image/png", data=image_bytes)),
                    gt.Part(text=VISION_PROMPT)
                ]
            )
            return response.text
        except ImportError:
            import google.generativeai as genai_legacy
            genai_legacy.configure(api_key=GOOGLE_API_KEY)
            model = genai_legacy.GenerativeModel(GEMINI_VISION_MODEL)
            response = model.generate_content([image, VISION_PROMPT])
            return response.text

    except Exception as e:
        logger.error(f"Gemini Vision error: {e}")
        return None


# ---------------------------------------------------------------------------
# Parsers
# ---------------------------------------------------------------------------

def _parse_extracted_text(text: str) -> pd.DataFrame | None:
    """Try to parse a text table into a DataFrame."""
    rows = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.lower().startswith('symbol'):
            continue
        parts = re.split(r'\s{2,}|\t|\|', line)
        parts = [p.strip() for p in parts if p.strip()]
        if len(parts) >= 3:
            rows.append(parts)

    if not rows:
        return None

    cols = ['Symbol', 'Name', 'Quantity', 'Avg_Buy_Price', 'Current_Price', 'PnL_Raw']
    df_rows = []
    for r in rows:
        row_dict = {}
        for i, col in enumerate(cols):
            row_dict[col] = r[i] if i < len(r) else 'NA'
        df_rows.append(row_dict)

    df = pd.DataFrame(df_rows)
    for col in ['Quantity', 'Avg_Buy_Price', 'Current_Price']:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col].apply(_clean_rupee), errors='coerce')
    return df.dropna(subset=['Symbol'])


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def extract_holdings_from_image(image: Image.Image) -> pd.DataFrame | None:
    """
    Attempt to extract holdings from a portfolio screenshot.
    Returns a DataFrame with at least [Symbol, Quantity, Avg_Buy_Price] or None.
    """
    text = _try_gemini_vision(image)
    if not text:
        text = _try_tesseract(image)
    if not text:
        logger.warning("No OCR text extracted from image.")
        return None

    logger.info(f"OCR extracted {len(text)} chars")
    df = _parse_extracted_text(text)
    if df is not None and not df.empty:
        logger.info(f"Parsed {len(df)} holdings from image")
    return df
