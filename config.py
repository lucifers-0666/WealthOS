import os
from dotenv import load_dotenv

load_dotenv()

# App Info
APP_NAME = "WealthOS"
APP_VERSION = "1.0.0"
APP_ICON = "W"

# ── Supabase Configuration ──────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# API Keys
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
NEWSAPI_KEY = os.getenv("NEWSAPI_KEY", "")
ALPHA_VANTAGE_KEY = os.getenv("ALPHA_VANTAGE_KEY", "")
TWELVE_DATA_KEY = os.getenv("TWELVE_DATA_KEY", "")
FINNHUB_KEY = os.getenv("FINNHUB_KEY", "")
HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_TOKEN", "")
DATABASE_URL = os.getenv("DATABASE_URL", "")
SECRET_KEY = os.getenv("SECRET_KEY", "")

def get_missing_keys():
    missing = []
    if not SUPABASE_URL: missing.append("SUPABASE_URL")
    if not SUPABASE_ANON_KEY: missing.append("SUPABASE_ANON_KEY")
    if not SUPABASE_SERVICE_ROLE_KEY: missing.append("SUPABASE_SERVICE_ROLE_KEY")
    if not GOOGLE_API_KEY: missing.append("GOOGLE_API_KEY")
    if not NEWSAPI_KEY: missing.append("NEWSAPI_KEY")
    if not ALPHA_VANTAGE_KEY: missing.append("ALPHA_VANTAGE_KEY")
    if not TWELVE_DATA_KEY: missing.append("TWELVE_DATA_KEY")
    if not FINNHUB_KEY: missing.append("FINNHUB_KEY")
    if not SECRET_KEY: missing.append("SECRET_KEY")
    return missing


def get_setup_status() -> dict:
    """Return a small dict describing availability of key features for the Setup page."""
    import sys
    python_version = f"{sys.version_info.major}.{sys.version_info.minor}"
    pytorch_ok = sys.version_info.major == 3 and sys.version_info.minor in (11, 12)

    return {
        "streamlit": True,
        "fastapi": "http://127.0.0.1:8000",
        "supabase": bool(SUPABASE_URL and SUPABASE_ANON_KEY),
        "google_ai": bool(GOOGLE_API_KEY),
        "news_api": bool(NEWSAPI_KEY),
        "pytorch_ok": pytorch_ok,
        "python_version": python_version,
    }

def is_feature_available(feature: str) -> bool:
    if feature == "database":
        return bool(SUPABASE_URL and SUPABASE_ANON_KEY)
    if feature == "ai":
        return bool(GOOGLE_API_KEY)
    if feature == "news":
        return bool(NEWSAPI_KEY)
    return False


def render_sidebar_warnings():
    """If Streamlit is available, render helpful warnings in the sidebar for missing keys.

    This is a best-effort helper that will not raise if Streamlit isn't importable (e.g., in tests).
    """
    try:
        import streamlit as st
    except Exception:
        return

    missing = get_missing_keys()
    if not missing:
        return

    with st.sidebar:
        st.markdown("### Setup issues detected")
        for k in missing:
            if k.startswith("SUPABASE"):
                st.warning("Supabase not configured — database features disabled.")
                break
        if "GOOGLE_API_KEY" in missing:
            st.warning("Google AI key missing — AI Advisor disabled.")
        if "NEWSAPI_KEY" in missing:
            st.warning("News API key missing — Market News feed disabled.")

# ── AI Configuration ────────────────────────────────────────
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_MAX_TOKENS = int(os.getenv("GEMINI_MAX_TOKENS", "2048"))
GEMINI_TEMPERATURE = float(os.getenv("GEMINI_TEMPERATURE", "0.3"))
GEMINI_VISION_MODEL = os.getenv("GEMINI_VISION_MODEL", "gemini-2.0-flash")

# ── RAG Configuration ──────────────────────────────────────
RAG_CHUNK_SIZE = int(os.getenv("RAG_CHUNK_SIZE", "500"))
RAG_CHUNK_OVERLAP = int(os.getenv("RAG_CHUNK_OVERLAP", "50"))
RAG_TOP_K = int(os.getenv("RAG_TOP_K", "5"))
NEWS_CACHE_TTL = int(os.getenv("NEWS_CACHE_TTL", "1800"))

# Finance Settings
DEFAULT_CURRENCY = os.getenv("DEFAULT_CURRENCY", "INR")
DEFAULT_EXCHANGE = os.getenv("DEFAULT_EXCHANGE", "NSE")
INR_USD_FALLBACK = 83.5  # fallback rate if API unavailable

# NSE suffix map for yfinance
EXCHANGE_SUFFIX = {
    "NSE": ".NS",
    "BSE": ".BO",
    "NYSE": "",
    "NASDAQ": "",
    "LSE": ".L",
}

# Target Allocation defaults (user can override in UI)
DEFAULT_TARGET_ALLOCATION = {
    "Indian Equity Large Cap": 30.0,
    "Indian Equity Mid/Small Cap": 15.0,
    "International ETF": 25.0,
    "Debt/Bonds": 15.0,
    "Gold": 10.0,
    "Cash": 5.0,
}

# Chart Colors
COLOR_PROFIT = "#86EFAC"
COLOR_LOSS = "#FDA4AF"
COLOR_NEUTRAL = "#64748B"
COLOR_PRIMARY = "#7DD3FC"
COLOR_SECONDARY = "#D6C7A1"

# News RAG Settings
NEWS_LOOKBACK_DAYS = int(os.getenv("NEWS_LOOKBACK_DAYS", "7"))
NEWS_MAX_ARTICLES = int(os.getenv("NEWS_MAX_ARTICLES", "20"))
PRICE_CACHE_TTL = 300   # 5 minutes
