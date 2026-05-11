-- ============================================================
-- WealthOS — Migration 001: Initial Schema
-- ============================================================
-- Run Order: 1st
-- Description: Core tables, indexes, triggers, RLS
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name         TEXT,
    avatar_url        TEXT,
    email             TEXT,
    phone             TEXT,
    currency          TEXT NOT NULL DEFAULT 'INR' CHECK (currency IN ('INR','USD','EUR','GBP','JPY')),
    risk_profile      TEXT NOT NULL DEFAULT 'moderate' CHECK (risk_profile IN ('conservative','moderate','aggressive')),
    investment_goal   TEXT,
    target_corpus     DECIMAL(20,2),
    monthly_sip       DECIMAL(14,2) DEFAULT 0,
    broker_name       TEXT,
    pan_last4         TEXT,
    timezone          TEXT DEFAULT 'Asia/Kolkata',
    onboarded         BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Extended user profiles linked to Supabase Auth';

-- ============================================================
-- HOLDINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.holdings (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ticker        TEXT NOT NULL,
    company_name  TEXT,
    quantity      DECIMAL(18,6) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    avg_buy_price DECIMAL(18,4) NOT NULL DEFAULT 0 CHECK (avg_buy_price >= 0),
    exchange      TEXT NOT NULL DEFAULT 'NSE' CHECK (exchange IN ('NSE','BSE','NYSE','NASDAQ','MCX','OTHER')),
    asset_class   TEXT NOT NULL DEFAULT 'equity' CHECK (asset_class IN ('equity','etf','mutual_fund','gold','crypto','bond','cash','reit','commodity')),
    currency      TEXT NOT NULL DEFAULT 'INR' CHECK (currency IN ('INR','USD','EUR','GBP')),
    sector        TEXT,
    isin          TEXT,
    folio_number  TEXT,
    dp_id         TEXT,
    notes         TEXT,
    tags          TEXT[] DEFAULT '{}',
    source        TEXT DEFAULT 'manual' CHECK (source IN ('manual','csv_upload','ocr_scan','api_sync','broker_import')),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    first_bought  DATE,
    last_bought   DATE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, ticker, exchange)
);

CREATE INDEX IF NOT EXISTS idx_holdings_user_id     ON public.holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_ticker      ON public.holdings(ticker);
CREATE INDEX IF NOT EXISTS idx_holdings_asset_class ON public.holdings(asset_class);
CREATE INDEX IF NOT EXISTS idx_holdings_is_active   ON public.holdings(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_holdings_exchange    ON public.holdings(exchange);

COMMENT ON TABLE public.holdings IS 'Current portfolio holdings per user';

-- ============================================================
-- TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    holding_id       UUID REFERENCES public.holdings(id) ON DELETE SET NULL,
    ticker           TEXT NOT NULL,
    company_name     TEXT,
    action           TEXT NOT NULL CHECK (action IN ('BUY','SELL','DIVIDEND','SPLIT','BONUS','SIP','REDEMPTION','SWITCH_IN','SWITCH_OUT')),
    quantity         DECIMAL(18,6) NOT NULL CHECK (quantity > 0),
    price            DECIMAL(18,4) NOT NULL CHECK (price >= 0),
    total_amount     DECIMAL(20,4) GENERATED ALWAYS AS (quantity * price) STORED,
    brokerage        DECIMAL(12,4) NOT NULL DEFAULT 0 CHECK (brokerage >= 0),
    stt              DECIMAL(12,4) NOT NULL DEFAULT 0,
    gst              DECIMAL(12,4) NOT NULL DEFAULT 0,
    stamp_duty       DECIMAL(12,4) NOT NULL DEFAULT 0,
    other_charges    DECIMAL(12,4) NOT NULL DEFAULT 0,
    net_amount       DECIMAL(20,4) GENERATED ALWAYS AS (
                         CASE 
                             WHEN action IN ('BUY','SIP') THEN (quantity * price) + brokerage + stt + gst + stamp_duty + other_charges
                             ELSE (quantity * price) - brokerage - stt - gst - stamp_duty - other_charges
                         END
                     ) STORED,
    transaction_date DATE NOT NULL,
    settlement_date  DATE,
    exchange         TEXT DEFAULT 'NSE',
    segment          TEXT DEFAULT 'EQ' CHECK (segment IN ('EQ','FO','CD','COM','MF')),
    broker           TEXT,
    order_id         TEXT,
    trade_id         TEXT,
    isin             TEXT,
    currency         TEXT DEFAULT 'INR',
    notes            TEXT,
    source           TEXT DEFAULT 'manual' CHECK (source IN ('manual','csv_upload','ocr_scan','broker_api')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_txn_user_id  ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_txn_ticker   ON public.transactions(ticker);
CREATE INDEX IF NOT EXISTS idx_txn_date     ON public.transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_txn_action   ON public.transactions(action);
CREATE INDEX IF NOT EXISTS idx_txn_holding  ON public.transactions(holding_id);
CREATE INDEX IF NOT EXISTS idx_txn_user_date ON public.transactions(user_id, transaction_date DESC);

COMMENT ON TABLE public.transactions IS 'Full transaction history — buy/sell/dividend/split/bonus';

-- ============================================================
-- PRICE CACHE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.price_cache (
    ticker          TEXT PRIMARY KEY,
    price           DECIMAL(18,4),
    price_inr       DECIMAL(18,4),
    open_price      DECIMAL(18,4),
    prev_close      DECIMAL(18,4),
    change_pct      DECIMAL(8,4),
    change_abs      DECIMAL(12,4),
    volume          BIGINT,
    avg_volume      BIGINT,
    market_cap      DECIMAL(24,4),
    pe_ratio        DECIMAL(10,4),
    pb_ratio        DECIMAL(10,4),
    div_yield       DECIMAL(8,4),
    eps             DECIMAL(12,4),
    day_high        DECIMAL(18,4),
    day_low         DECIMAL(18,4),
    week_52_high    DECIMAL(18,4),
    week_52_low     DECIMAL(18,4),
    beta            DECIMAL(8,4),
    currency        TEXT DEFAULT 'INR',
    exchange        TEXT,
    company_name    TEXT,
    sector          TEXT,
    industry        TEXT,
    fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_cache_fetched ON public.price_cache(fetched_at DESC);

COMMENT ON TABLE public.price_cache IS 'Live price cache — refreshed every 5 min by price_refresh Edge Function';

-- ============================================================
-- TARGET ALLOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.target_allocations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_class TEXT NOT NULL,
    target_pct  DECIMAL(5,2) NOT NULL CHECK (target_pct >= 0 AND target_pct <= 100),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, asset_class)
);

CREATE INDEX IF NOT EXISTS idx_target_alloc_user ON public.target_allocations(user_id);

-- ============================================================
-- UPLOAD SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.upload_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name       TEXT,
    file_type       TEXT CHECK (file_type IN ('csv_holdings','csv_transactions','image_screenshot','pdf','xlsx')),
    storage_path    TEXT,
    file_size_bytes BIGINT,
    mime_type       TEXT,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','cancelled')),
    recognized_data JSONB,
    import_summary  JSONB,
    error_message   TEXT,
    rows_imported   INTEGER DEFAULT 0,
    rows_skipped    INTEGER DEFAULT 0,
    rows_failed     INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_upload_user   ON public.upload_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_status ON public.upload_sessions(status);

-- ============================================================
-- AI CFO CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id          UUID NOT NULL DEFAULT uuid_generate_v4(),
    role                TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
    content             TEXT NOT NULL,
    portfolio_snapshot  JSONB,
    rag_context         JSONB,
    tokens_used         INTEGER DEFAULT 0,
    latency_ms          INTEGER,
    model               TEXT DEFAULT 'gemini-1.5-pro',
    feedback            TEXT CHECK (feedback IN ('positive','negative','neutral')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conv_user_session ON public.ai_conversations(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conv_created      ON public.ai_conversations(created_at DESC);

-- ============================================================
-- WATCHLIST
-- ============================================================
CREATE TABLE IF NOT EXISTS public.watchlist (
    id              UUID PRIMARY KEY DEF