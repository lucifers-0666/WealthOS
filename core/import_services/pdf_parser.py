"""
pdf_parser.py — Extract text from PDF broker statements using pdfminer.six.
Then routes extracted text through ai_parser for structured extraction.
"""

import io
import logging

logger = logging.getLogger("wealthos-import")


def extract_text_from_pdf(data: bytes) -> str:
    """
    Extract raw text from PDF bytes using pdfminer.six.
    Returns concatenated text from all pages.
    """
    try:
        from pdfminer.high_level import extract_text_to_fp
        from pdfminer.layout import LAParams

        output = io.StringIO()
        extract_text_to_fp(
            io.BytesIO(data),
            output,
            laparams=LAParams(),
            output_type="text",
            codec="utf-8",
        )
        return output.getvalue()
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        return ""


def parse_pdf_bytes(data: bytes) -> list:
    """Extract text from PDF and parse holdings via ai_parser."""
    from core.import_services.ai_parser import parse_text_to_holdings

    text = extract_text_from_pdf(data)
    if not text.strip():
        return []
    result = parse_text_to_holdings(text)
    return result.get("holdings", [])
