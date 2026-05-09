import os
from dotenv import load_dotenv

load_dotenv()

# App Info
APP_NAME = "WealthOS"
APP_VERSION = "1.0.0"
APP_ICON = "💰"

# API Keys
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
NEWSAPI_KEY = os.getenv("NEWSAPI_KEY", "")
ALPHA_VANTAGE_KEY = os.getenv("ALPHA_VANTAGE_KEY", "")
HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_TOKEN", "")

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
COLOR_PROFIT = "#00C851"
COLOR_LOSS = "#FF4444"
COLOR_NEUTRAL = "#AAAAAA"
COLOR_PRIMARY = "#7C3AED"
COLOR_SECONDARY = "#3B82F6"

# News RAG Settings
NEWS_LOOKBACK_DAYS = 7
NEWS_MAX_ARTICLES = 20
RAG_CHUNK_SIZE = 500
RAG_CHUNK_OVERLAP = 50
RAG_TOP_K = 5

# Gemini Model
GEMINI_MODEL = "gemini-1.5-pro"
GEMINI_MAX_TOKENS = 2048
GEMINI_TEMPERATURE = 0.3

# Cache TTL (seconds)
PRICE_CACHE_TTL = 300  # 5 minutes
NEWS_CACHE_TTL = 1800  # 30 minutes
