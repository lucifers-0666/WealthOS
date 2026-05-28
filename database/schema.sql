-- ============================================================
-- WealthOS — Supabase PostgreSQL Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    username TEXT,
    email TEXT,
    avatar_url TEXT,
    bio TEXT,
    currency TEXT DEFAULT 'INR' CHECK (currency IN ('INR', 'USD', 'EUR', 'GBP')),
    risk_profile TEXT DEFAULT 'moderate' CHECK (risk_profile IN ('conservative', 'moderate', 'aggressive')),
    investment_horizon TEXT,
    investment_goal TEXT,
    target_corpus DECIMAL(20, 2),
    preferred_sectors TEXT[],
    rebalance_frequency TEXT,
    investment_profile JSONB,
    notification_settings JSONB,
    ui_preferences JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id_unique ON public.profiles(user_id);

-- ============================================================
-- HOLDINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ticker TEXT NOT NULL,
    company_name TEXT,
    quantity DECIMAL(18, 6) NOT NULL DEFAULT 0,
    avg_buy_price DECIMAL(18, 4) NOT NULL DEFAULT 0,
    exchange TEXT NOT NULL DEFAULT 'NSE' CHECK (exchange IN ('NSE', 'BSE', 'NYSE', 'NASDAQ', 'OTHER')),
    asset_class TEXT NOT NULL DEFAULT 'equity' CHECK (asset_class IN ('equity', 'etf', 'mutual_fund', 'gold', 'crypto', 'bond', 'cash')),
    currency TEXT NOT NULL DEFAULT 'INR' CHECK (currency IN ('INR', 'USD', 'EUR', 'GBP')),
    sector TEXT,
    notes TEXT,
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'csv_upload', 'ocr_scan', 'api_sync')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, ticker, exchange)
);

CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON public.holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_ticker ON public.holdings(ticker);
CREATE INDEX IF NOT EXISTS idx_holdings_asset_class ON public.holdings(asset_class);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    holding_id UUID REFERENCES public.holdings(id) ON DELETE SET NULL,
    ticker TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('BUY', 'SELL', 'DIVIDEND', 'SPLIT', 'BONUS')),
    quantity DECIMAL(18, 6) NOT NULL,
    price DECIMAL(18, 4) NOT NULL,
    total_amount DECIMAL(20, 4) GENERATED ALWAYS AS (quantity * price) STORED,
    brokerage DECIMAL(12, 4) DEFAULT 0,
    tax DECIMAL(12, 4) DEFAULT 0,
    transaction_date DATE NOT NULL,
    exchange TEXT DEFAULT 'NSE',
    broker TEXT,
    notes TEXT,
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'csv_upload', 'ocr_scan')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_ticker ON public.transactions(ticker);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_action ON public.transactions(action);

-- ============================================================
-- PRICE CACHE (replaces Redis for Supabase-only setups)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.price_cache (
    ticker TEXT PRIMARY KEY,
    price DECIMAL(18, 4),
    price_inr DECIMAL(18, 4),
    change_pct DECIMAL(8, 4),
    change_abs DECIMAL(12, 4),
    volume BIGINT,
    market_cap DECIMAL(24, 4),
    day_high DECIMAL(18, 4),
    day_low DECIMAL(18, 4),
    week_52_high DECIMAL(18, 4),
    week_52_low DECIMAL(18, 4),
    currency TEXT DEFAULT 'INR',
    exchange TEXT,
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TARGET ALLOCATION
-- ============================================================
CREATE TABLE IF NOT EXISTS public.target_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_class TEXT NOT NULL,
    target_pct DECIMAL(5, 2) NOT NULL CHECK (target_pct >= 0 AND target_pct <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, asset_class)
);

-- ============================================================
-- OCR UPLOAD SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.upload_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT,
    file_type TEXT CHECK (file_type IN ('csv_holdings', 'csv_transactions', 'image_screenshot', 'pdf')),
    storage_path TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    recognized_data JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================================
-- AI CFO CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    portfolio_snapshot JSONB,
    tokens_used INTEGER,
    model TEXT DEFAULT 'gemini-1.5-pro',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conv_user_session ON public.ai_conversations(user_id, session_id);

-- ============================================================
-- WATCHLIST
-- ============================================================
CREATE TABLE IF NOT EXISTS public.watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ticker TEXT NOT NULL,
    company_name TEXT,
    exchange TEXT DEFAULT 'NSE',
    target_price DECIMAL(18, 4),
    alert_enabled BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, ticker)
);

-- ============================================================
-- USER ACTIVITY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_created ON public.user_activity(user_id, created_at DESC);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_holdings_updated
    BEFORE UPDATE ON public.holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_target_alloc_updated
    BEFORE UPDATE ON public.target_allocations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.target_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/edit their own
CREATE POLICY "profiles_self" ON public.profiles
    USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Holdings: users can only see/edit their own
CREATE POLICY "holdings_self" ON public.holdings
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Transactions: users can only see/edit their own
CREATE POLICY "transactions_self" ON public.transactions
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Target allocations: users own data
CREATE POLICY "target_alloc_self" ON public.target_allocations
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Upload sessions: users own data
CREATE POLICY "uploads_self" ON public.upload_sessions
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- AI conversations: users own data
CREATE POLICY "ai_conv_self" ON public.ai_conversations
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Watchlist: users own data
CREATE POLICY "watchlist_self" ON public.watchlist
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_activity_self" ON public.user_activity
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Price cache: readable by all authenticated users, writable by service role only
CREATE POLICY "price_cache_read" ON public.price_cache
    FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- VIEWS
-- ============================================================

-- Portfolio summary per user
CREATE OR REPLACE VIEW public.portfolio_summary AS
SELECT
    h.user_id,
    h.id AS holding_id,
    h.ticker,
    h.company_name,
    h.quantity,
    h.avg_buy_price,
    h.exchange,
    h.asset_class,
    h.sector,
    h.currency,
    (h.quantity * h.avg_buy_price) AS invested_amount,
    pc.price AS current_price,
    pc.price_inr AS current_price_inr,
    pc.change_pct,
    pc.fetched_at AS price_updated_at,
    CASE
        WHEN h.currency = 'INR' THEN (h.quantity * pc.price) - (h.quantity * h.avg_buy_price)
        ELSE (h.quantity * pc.price_inr) - (h.quantity * h.avg_buy_price)
    END AS unrealized_pnl
FROM public.holdings h
LEFT JOIN public.price_cache pc ON h.ticker = pc.ticker
WHERE h.is_active = TRUE;
