-- ============================================================
-- WealthOS — Supabase PostgreSQL Schema
-- Run this entire file in Supabase SQL Editor once
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- Enable UUID extension (already enabled on Supabase by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        TEXT,
  email            TEXT UNIQUE NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'INR',
  default_exchange TEXT NOT NULL DEFAULT 'NSE',
  risk_profile     TEXT CHECK (risk_profile IN ('conservative','moderate','aggressive')) DEFAULT 'moderate',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. HOLDINGS — Current portfolio positions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.holdings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticker          TEXT NOT NULL,                        -- e.g. RELIANCE, TCS, VTI
  name            TEXT,                                 -- e.g. Reliance Industries Ltd
  exchange        TEXT NOT NULL DEFAULT 'NSE',          -- NSE | BSE | NYSE | NASDAQ
  asset_class     TEXT NOT NULL DEFAULT 'equity_IN',   -- equity_IN | equity_US | etf | gold | debt | crypto
  quantity        NUMERIC(18, 4) NOT NULL DEFAULT 0,
  avg_buy_price   NUMERIC(18, 4) NOT NULL DEFAULT 0,   -- in DEFAULT_CURRENCY
  currency        TEXT NOT NULL DEFAULT 'INR',
  sector          TEXT,                                 -- e.g. Technology, Finance
  notes           TEXT,
  source          TEXT DEFAULT 'manual',               -- manual | csv_import | ocr_image
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, ticker, exchange)
);

-- ============================================================
-- 3. TRANSACTIONS — Full buy/sell history
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticker          TEXT NOT NULL,
  exchange        TEXT NOT NULL DEFAULT 'NSE',
  action          TEXT NOT NULL CHECK (action IN ('BUY', 'SELL', 'DIVIDEND', 'SPLIT', 'BONUS')),
  quantity        NUMERIC(18, 4) NOT NULL,
  price           NUMERIC(18, 4) NOT NULL,             -- per unit price
  total_amount    NUMERIC(18, 4) GENERATED ALWAYS AS (quantity * price) STORED,
  brokerage       NUMERIC(18, 4) DEFAULT 0,
  tax             NUMERIC(18, 4) DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'INR',
  trade_date      DATE NOT NULL,
  broker          TEXT,                                -- Zerodha | Groww | Upstox | etc
  notes           TEXT,
  source          TEXT DEFAULT 'manual',              -- manual | csv_import | ocr_image
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. TARGET ALLOCATION — User's desired portfolio mix
-- ============================================================
CREATE TABLE IF NOT EXISTS public.target_allocations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asset_class     TEXT NOT NULL,                       -- matches holdings.asset_class
  target_pct      NUMERIC(5, 2) NOT NULL,             -- 0.00 to 100.00
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, asset_class),
  CONSTRAINT valid_percentage CHECK (target_pct >= 0 AND target_pct <= 100)
);

-- ============================================================
-- 5. PRICE CACHE — Live price snapshots (TTL managed in app)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.price_cache (
  ticker          TEXT NOT NULL,
  exchange        TEXT NOT NULL DEFAULT 'NSE',
  price           NUMERIC(18, 4) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'INR',
  change_pct      NUMERIC(8, 4),                      -- % change today
  volume          BIGINT,
  market_cap      NUMERIC(24, 2),
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (ticker, exchange)
);

-- ============================================================
-- 6. WATCHLIST — Tickers user is researching
-- ============================================================
CREATE TABLE IF NOT EXISTS public.watchlist (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticker          TEXT NOT NULL,
  exchange        TEXT NOT NULL DEFAULT 'NSE',
  name            TEXT,
  added_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes           TEXT,
  UNIQUE(user_id, ticker, exchange)
);

-- ============================================================
-- 7. AI CONVERSATIONS — CFO advisor chat history
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id      TEXT NOT NULL,                      -- group messages by session
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT NOT NULL,
  model           TEXT DEFAULT 'gemini-2.0-flash',
  tokens_used     INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. UPLOAD SESSIONS — Track CSV/image upload history
-- ============================================================
CREATE TABLE IF NOT EXISTS public.upload_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name       TEXT NOT NULL,
  file_type       TEXT NOT NULL CHECK (file_type IN ('csv_holdings', 'csv_transactions', 'image_screenshot')),
  file_url        TEXT,                               -- Supabase Storage URL
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  rows_imported   INTEGER DEFAULT 0,
  error_message   TEXT,
  ocr_raw_result  JSONB,                              -- raw AI OCR response stored as JSON
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. PORTFOLIO SNAPSHOTS — Daily portfolio value history
-- ============================================================
CREATE TABLE IF NOT EXISTS public.portfolio_snapshots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  snapshot_date   DATE NOT NULL,
  total_value     NUMERIC(18, 2) NOT NULL,            -- INR value of entire portfolio
  total_invested  NUMERIC(18, 2) NOT NULL,
  total_pnl       NUMERIC(18, 2) GENERATED ALWAYS AS (total_value - total_invested) STORED,
  pnl_pct         NUMERIC(8, 4),
  currency        TEXT NOT NULL DEFAULT 'INR',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, snapshot_date)
);

-- ============================================================
-- INDEXES — for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_holdings_user      ON public.holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_ticker    ON public.holdings(ticker);
CREATE INDEX IF NOT EXISTS idx_transactions_user  ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date  ON public.transactions(trade_date);
CREATE INDEX IF NOT EXISTS idx_transactions_ticker ON public.transactions(ticker);
CREATE INDEX IF NOT EXISTS idx_price_cache_ticker ON public.price_cache(ticker);
CREATE INDEX IF NOT EXISTS idx_ai_conv_session    ON public.ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_date ON public.portfolio_snapshots(user_id, snapshot_date);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — users only see their own data
-- ============================================================
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.target_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;
-- price_cache is public read, no RLS needed

-- profiles
CREATE POLICY "Users manage own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id);

-- holdings
CREATE POLICY "Users manage own holdings"
  ON public.holdings FOR ALL
  USING (auth.uid() = user_id);

-- transactions
CREATE POLICY "Users manage own transactions"
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id);

-- target_allocations
CREATE POLICY "Users manage own allocations"
  ON public.target_allocations FOR ALL
  USING (auth.uid() = user_id);

-- watchlist
CREATE POLICY "Users manage own watchlist"
  ON public.watchlist FOR ALL
  USING (auth.uid() = user_id);

-- ai_conversations
CREATE POLICY "Users manage own AI conversations"
  ON public.ai_conversations FOR ALL
  USING (auth.uid() = user_id);

-- upload_sessions
CREATE POLICY "Users manage own uploads"
  ON public.upload_sessions FOR ALL
  USING (auth.uid() = user_id);

-- portfolio_snapshots
CREATE POLICY "Users manage own snapshots"
  ON public.portfolio_snapshots FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS — auto-update updated_at timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_holdings_updated_at
  BEFORE UPDATE ON public.holdings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_allocations_updated_at
  BEFORE UPDATE ON public.target_allocations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE on new Supabase Auth signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
