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

# Warn if Supabase not configured
if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    import warnings
    warnings.warn(
        "⚠️  SUPABASE_URL and SUPABASE_ANON_KEY not configured. "
        "Database features will not work. "
        "Add them to your .env file from https://supabase.com/dashboard"
    )

# API Keys
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
NEWSAPI_KEY = os.getenv("NEWSAPI_KEY", "")
ALPHA_VANTAGE_KEY = os.getenv("ALPHA_VANTAGE_KEY", "")
HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_TOKEN", "")

# ── AI Configuration ────────────────────────────────────────
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
GEMINI_MAX_TOKENS = int(os.getenv("GEMINI_MAX_TOKENS", "2000"))
GEMINI_TEMPERATURE = float(os.getenv("GEMINI_TEMPERATURE", "0.7"))
GEMINI_VISION_MODEL = os.getenv("GEMINI_VISION_MODEL", "gemini-1.5-flash")

# ── RAG Configuration ──────────────────────────────────────
RAG_CHUNK_SIZE = int(os.getenv("RAG_CHUNK_SIZE", "500"))
RAG_CHUNK_OVERLAP = int(os.getenv("RAG_CHUNK_OVERLAP", "100"))
RAG_TOP_K = int(os.getenv("RAG_TOP_K", "3"))
NEWS_CACHE_TTL = int(os.getenv("NEWS_CACHE_TTL", "3600"))

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
RAG_CHUNK_SIZE = 500
RAG_CHUNK_OVERLAP = 50
RAG_TOP_K = 5

# Gemini Model — gemini-2.0-flash is current stable on v1beta
# gemini-1.5-pro and gemini-1.5-flash were removed from v1beta API
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_VISION_MODEL = os.getenv("GEMINI_VISION_MODEL", "gemini-2.0-flash")  # used for image OCR
GEMINI_MAX_TOKENS = 2048
GEMINI_TEMPERATURE = 0.3

# Cache TTL (seconds)
PRICE_CACHE_TTL = 300   # 5 minutes
NEWS_CACHE_TTL = 1800   # 30 minutes
