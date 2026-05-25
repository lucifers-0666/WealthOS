-- WealthOS Schema Additions
-- Run these in your Supabase SQL editor to add missing tables

-- 1. Live prices cache table (upserted every 15s)
CREATE TABLE IF NOT EXISTS prices (
  symbol TEXT PRIMARY KEY,
  ltp NUMERIC(12,4) DEFAULT 0,
  prev_close NUMERIC(12,4) DEFAULT 0,
  change NUMERIC(10,4) DEFAULT 0,
  change_pct NUMERIC(8,4) DEFAULT 0,
  day_high NUMERIC(12,4) DEFAULT 0,
  day_low NUMERIC(12,4) DEFAULT 0,
  week_52_high NUMERIC(12,4) DEFAULT 0,
  week_52_low NUMERIC(12,4) DEFAULT 0,
  volume BIGINT DEFAULT 0,
  market_cap BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Portfolio snapshots for historical P&L tracking
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_value NUMERIC(16,2) DEFAULT 0,
  total_invested NUMERIC(16,2) DEFAULT 0,
  total_pnl NUMERIC(16,2) DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_ts ON portfolio_snapshots(user_id, timestamp DESC);

-- 3. Watchlist alerts table
CREATE TABLE IF NOT EXISTS watchlist_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  target_price NUMERIC(12,4) NOT NULL,
  direction TEXT CHECK (direction IN ('above', 'below')) DEFAULT 'above',
  triggered BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON watchlist_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_symbol ON watchlist_alerts(symbol);

-- 4. Intraday price cache (optional, for detailed charting)
CREATE TABLE IF NOT EXISTS intraday_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  price NUMERIC(12,4) NOT NULL,
  volume BIGINT DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intraday_symbol_ts ON intraday_cache(symbol, timestamp DESC);

-- RLS Policies (enable RLS on all tables)
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own snapshots" ON portfolio_snapshots FOR ALL USING (auth.uid() = user_id);

ALTER TABLE watchlist_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own alerts" ON watchlist_alerts FOR ALL USING (auth.uid() = user_id);
