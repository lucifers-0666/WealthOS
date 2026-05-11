-- ============================================================
-- WealthOS PostgreSQL Schema
-- Full financial portfolio management database
-- ============================================================

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for fuzzy ticker search
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- for date range constraints

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           TEXT UNIQUE NOT NULL,
    display_name    TEXT,
    currency        CHAR(3) NOT NULL DEFAULT 'INR',  -- ISO 4217
    timezone        TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PORTFOLIOS  (one user can have multiple: "Main", "Retirement", etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS portfolios (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    currency        CHAR(3) NOT NULL DEFAULT 'INR',
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, name)
);

-- ============================================================
-- ASSET UNIVERSE  (master list of all tradable instruments)
-- ============================================================
CREATE TABLE IF NOT EXISTS assets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker          TEXT NOT NULL,          -- e.g. RELIANCE, VTI, INDA
    exchange        TEXT NOT NULL,          -- NSE, BSE, NYSE, NASDAQ, etc.
    yf_ticker       TEXT,                   -- Yahoo Finance symbol (RELIANCE.NS)
    name            TEXT NOT NULL,
    asset_class     TEXT NOT NULL           -- EQUITY, ETF, MUTUAL_FUND, BOND, GOLD, CRYPTO, CASH
        CHECK (asset_class IN ('EQUITY','ETF','MUTUAL_FUND','BOND','GOLD','CRYPTO','CASH')),
    sector          TEXT,                   -- Technology, Financial, etc.
    country         CHAR(2),                -- ISO 3166-1 alpha-2 (IN, US, etc.)
    currency        CHAR(3) NOT NULL DEFAULT 'INR',
    isin            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (ticker, exchange)
);

CREATE INDEX IF NOT EXISTS idx_assets_ticker ON assets USING gin (ticker gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_assets_yf_ticker ON assets (yf_ticker);

-- ============================================================
-- HOLDINGS  (current snapshot — denormalised for fast reads)
-- ============================================================
CREATE TABLE IF NOT EXISTS holdings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id        UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    asset_id            UUID NOT NULL REFERENCES assets(id),
    quantity            NUMERIC(18, 6) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    avg_cost_price      NUMERIC(18, 4) NOT NULL DEFAULT 0,  -- in portfolio currency
    invested_amount     NUMERIC(18, 2) NOT NULL DEFAULT 0,
    -- live fields updated by price_fetcher
    current_price       NUMERIC(18, 4),
    current_value       NUMERIC(18, 2),
    unrealised_pnl      NUMERIC(18, 2),
    unrealised_pnl_pct  NUMERIC(8, 4),
    last_price_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (portfolio_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_holdings_portfolio ON holdings (portfolio_id);

-- ============================================================
-- TRANSACTIONS  (immutable ledger — never update, only insert)
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id    UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    asset_id        UUID NOT NULL REFERENCES assets(id),
    txn_type        TEXT NOT NULL
        CHECK (txn_type IN ('BUY','SELL','DIVIDEND','SPLIT','BONUS','SIP','REDEMPTION')),
    txn_date        DATE NOT NULL,
    quantity        NUMERIC(18, 6) NOT NULL,
    price           NUMERIC(18, 4) NOT NULL,   -- per unit, in portfolio currency
    amount          NUMERIC(18, 2) NOT NULL,   -- quantity * price (gross)
    fees            NUMERIC(18, 2) NOT NULL DEFAULT 0,
    taxes           NUMERIC(18, 2) NOT NULL DEFAULT 0,
    net_amount      NUMERIC(18, 2) GENERATED ALWAYS AS (amount + fees + taxes) STORED,
    notes           TEXT,
    source          TEXT DEFAULT 'MANUAL'      -- MANUAL, CSV_IMPORT, BROKER_API
        CHECK (source IN ('MANUAL','CSV_IMPORT','BROKER_API')),
    broker          TEXT,                      -- Zerodha, Groww, HDFC Sec, etc.
    external_ref    TEXT,                      -- broker order/trade ID
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_txn_portfolio ON transactions (portfolio_id);
CREATE INDEX IF NOT EXISTS idx_txn_asset ON transactions (asset_id);
CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions (txn_date DESC);
CREATE INDEX IF NOT EXISTS idx_txn_type ON transactions (txn_type);

-- ============================================================
-- TARGET ALLOCATION  (per portfolio, per asset class or ticker)
-- ============================================================
CREATE TABLE IF NOT EXISTS target_allocations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id    UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    label           TEXT NOT NULL,   -- "Indian Equity", "US ETF", "Gold", etc.
    asset_class     TEXT,            -- maps to assets.asset_class
    country         CHAR(2),         -- optional country filter
    target_pct      NUMERIC(5, 2) NOT NULL CHECK (target_pct >= 0 AND target_pct <= 100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (portfolio_id, label)
);

-- Ensure all targets per portfolio sum to <= 100
CREATE OR REPLACE FUNCTION check_target_sum()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT SUM(target_pct) FROM target_allocations WHERE portfolio_id = NEW.portfolio_id) > 100 THEN
        RAISE EXCEPTION 'Target allocations exceed 100%% for portfolio %', NEW.portfolio_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_target_sum
    AFTER INSERT OR UPDATE ON target_allocations
    FOR EACH ROW EXECUTE FUNCTION check_target_sum();

-- ============================================================
-- PRICE HISTORY  (daily OHLCV fetched from yfinance)
-- ============================================================
CREATE TABLE IF NOT EXISTS price_history (
    id          BIGSERIAL PRIMARY KEY,
    asset_id    UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    price_date  DATE NOT NULL,
    open        NUMERIC(18, 4),
    high        NUMERIC(18, 4),
    low         NUMERIC(18, 4),
    close       NUMERIC(18, 4) NOT NULL,
    volume      BIGINT,
    currency    CHAR(3) NOT NULL DEFAULT 'INR',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (asset_id, price_date)
);

CREATE INDEX IF NOT EXISTS idx_price_asset_date ON price_history (asset_id, price_date DESC);

-- ============================================================
-- WATCHLIST
-- ============================================================
CREATE TABLE IF NOT EXISTS watchlist (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_id        UUID NOT NULL REFERENCES assets(id),
    alert_above     NUMERIC(18, 4),  -- price alert trigger
    alert_below     NUMERIC(18, 4),
    notes           TEXT,
    added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, asset_id)
);

-- ============================================================
-- AI ADVISOR CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_conversations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portfolio_id    UUID REFERENCES portfolios(id) ON DELETE SET NULL,
    title           TEXT,            -- auto-generated from first message
    model_used      TEXT,            -- gemini-1.5-pro, gpt-4o, etc.
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
    content         TEXT NOT NULL,
    tokens_used     INTEGER,
    latency_ms      INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON ai_messages (conversation_id, created_at);

-- ============================================================
-- NEWS CACHE  (fetched articles, avoids re-fetching)
-- ============================================================
CREATE TABLE IF NOT EXISTS news_cache (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source          TEXT,
    title           TEXT NOT NULL,
    description     TEXT,
    url             TEXT UNIQUE NOT NULL,
    published_at    TIMESTAMPTZ,
    sentiment       TEXT CHECK (sentiment IN ('POSITIVE','NEGATIVE','NEUTRAL')),
    sentiment_score NUMERIC(4, 3),   -- -1.000 to +1.000
    related_tickers TEXT[],          -- e.g. {"RELIANCE", "INFY"}
    fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_published ON news_cache (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_tickers ON news_cache USING GIN (related_tickers);

-- ============================================================
-- PORTFOLIO SNAPSHOTS  (daily NAV history for performance charts)
-- ============================================================
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id              BIGSERIAL PRIMARY KEY,
    portfolio_id    UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    snapshot_date   DATE NOT NULL,
    total_value     NUMERIC(18, 2) NOT NULL,
    invested_amount NUMERIC(18, 2) NOT NULL,
    total_pnl       NUMERIC(18, 2),
    total_pnl_pct   NUMERIC(8, 4),
    day_change      NUMERIC(18, 2),
    day_change_pct  NUMERIC(8, 4),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (portfolio_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_snapshot_portfolio_date ON portfolio_snapshots (portfolio_id, snapshot_date DESC);

-- ============================================================
-- IMPORT LOGS  (track every CSV/XLSX upload)
-- ============================================================
CREATE TABLE IF NOT EXISTS import_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id    UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    filename        TEXT NOT NULL,
    file_size_bytes INTEGER,
    rows_total      INTEGER,
    rows_imported   INTEGER,
    rows_failed     INTEGER,
    status          TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING','PROCESSING','SUCCESS','PARTIAL','FAILED')),
    error_log       JSONB,           -- array of {row, error} objects
    imported_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- UTILITY: auto-update updated_at columns
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['users','portfolios','holdings','ai_conversations']
    LOOP
        EXECUTE format('
            CREATE TRIGGER trg_updated_at_%I
            BEFORE UPDATE ON %I
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t, t);
    END LOOP;
END;
$$;

-- ============================================================
-- SEED: default asset universe (NSE blue-chips + popular ETFs)
-- ============================================================
INSERT INTO assets (ticker, exchange, yf_ticker, name, asset_class, sector, country, currency) VALUES
  ('RELIANCE',   'NSE', 'RELIANCE.NS',   'Reliance Industries Ltd',   'EQUITY', 'Energy',        'IN', 'INR'),
  ('INFY',       'NSE', 'INFY.NS',       'Infosys Ltd',               'EQUITY', 'Technology',    'IN', 'INR'),
  ('HDFCBANK',   'NSE', 'HDFCBANK.NS',   'HDFC Bank Ltd',             'EQUITY', 'Financial',     'IN', 'INR'),
  ('TCS',        'NSE', 'TCS.NS',        'Tata Consultancy Services', 'EQUITY', 'Technology',    'IN', 'INR'),
  ('WIPRO',      'NSE', 'WIPRO.NS',      'Wipro Ltd',                 'EQUITY', 'Technology',    'IN', 'INR'),
  ('ICICIBANK',  'NSE', 'ICICIBANK.NS',  'ICICI Bank Ltd',            'EQUITY', 'Financial',     'IN', 'INR'),
  ('KOTAKBANK',  'NSE', 'KOTAKBANK.NS',  'Kotak Mahindra Bank',       'EQUITY', 'Financial',     'IN', 'INR'),
  ('BAJFINANCE', 'NSE', 'BAJFINANCE.NS', 'Bajaj Finance Ltd',         'EQUITY', 'Financial',     'IN', 'INR'),
  ('ASIANPAINT', 'NSE', 'ASIANPAINT.NS', 'Asian Paints Ltd',          'EQUITY', 'Consumer',      'IN', 'INR'),
  ('GOLDBEES',   'NSE', 'GOLDBEES.NS',   'Nippon Gold ETF',           'ETF',    'Commodities',   'IN', 'INR'),
  ('LIQUIDBEES', 'NSE', 'LIQUIDBEES.NS', 'Nippon Liquid ETF',         'ETF',    'Liquid',        'IN', 'INR'),
  ('VTI',        'NYSE','VTI',           'Vanguard Total Stock ETF',  'ETF',    'Broad Market',  'US', 'USD'),
  ('QQQ',        'NASDAQ','QQQ',         'Invesco QQQ Trust',         'ETF',    'Technology',    'US', 'USD'),
  ('INDA',       'NYSE','INDA',          'iShares MSCI India ETF',    'ETF',    'Broad Market',  'US', 'USD'),
  ('GLD',        'NYSE','GLD',           'SPDR Gold Shares',          'ETF',    'Commodities',   'US', 'USD')
ON CONFLICT (ticker, exchange) DO NOTHING;
