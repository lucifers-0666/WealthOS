"""
ocr_service.py — Image OCR using pytesseract + Pillow preprocessing.
Handles screenshots from Groww, Zerodha, Upstox, Angel One, etc.
"""

import re
import io
from typing import Optional
from PIL import Image, ImageFilter, ImageEnhance
import pytesseract


def preprocess_image(img: Image.Image) -> Image.Image:
    """Enhance image contrast and sharpness for better OCR accuracy."""
    # Convert to grayscale
    img = img.convert("L")
    # Sharpen
    img = img.filter(ImageFilter.SHARPEN)
    # Boost contrast
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.0)
    # Scale up for small images
    w, h = img.size
    if w < 1000:
        img = img.resize((w * 2, h * 2), Image.LANCZOS)
    return img


def extract_text_from_image(image_bytes: bytes) -> dict:
    """
    Run Tesseract OCR on uploaded image.
    Returns raw text + confidence metadata.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img = preprocess_image(img)

        # Tesseract config: PSM 6 = uniform block of text
        custom_config = r"--oem 3 --psm 6"
        data = pytesseract.image_to_data(
            img, config=custom_config, output_type=pytesseract.Output.DICT
        )

        # Collect words with confidence > 40
        words = []
        confidences = []
        for i, word in enumerate(data["text"]):
            word = word.strip()
            conf = int(data["conf"][i])
            if word and conf > 40:
                words.append(word)
                confidences.append(conf)

        raw_text = " ".join(words)
        avg_confidence = int(sum(confidences) / len(confidences)) if confidences else 0

        return {
            "raw_text": raw_text,
            "avg_confidence": avg_confidence,
            "word_count": len(words),
        }

    except Exception as e:
        return {"raw_text": "", "avg_confidence": 0, "word_count": 0, "error": str(e)}


def clean_ocr_text(text: str) -> str:
    """Remove noise characters common in financial screenshot OCR."""
    # Remove non-printable chars
    text = re.sub(r"[^\x20-\x7E\u20B9\u20AC]", " ", text)
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    # Fix common OCR digit/letter confusions in ticker context
    text = re.sub(r"(?<=[A-Z])0(?=[A-Z])", "O", text)  # S0BI -> SOBI
    text = re.sub(r"(?<=[A-Z])1(?=[A-Z])", "I", text)  # INF1 -> INFI
    return text
