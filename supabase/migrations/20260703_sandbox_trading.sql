-- Sandbox accounts (one per user)
CREATE TABLE IF NOT EXISTS sandbox_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance NUMERIC(15,2) NOT NULL DEFAULT 1000000.00,
  initial_balance NUMERIC(15,2) NOT NULL DEFAULT 1000000.00,
  total_pnl NUMERIC(15,2) DEFAULT 0,
  trades_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Open / closed sandbox positions
CREATE TABLE IF NOT EXISTS sandbox_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol VARCHAR(50) NOT NULL,           -- e.g. "RELIANCE", "NIFTY25JULFUT"
  trade_type VARCHAR(10) NOT NULL,       -- 'intraday' | 'futures' | 'options'
  direction VARCHAR(5) NOT NULL,         -- 'buy' | 'sell'
  quantity INTEGER NOT NULL,
  entry_price NUMERIC(12,2) NOT NULL,
  exit_price NUMERIC(12,2),
  ltp NUMERIC(12,2),                     -- live price at last check
  pnl NUMERIC(12,2) DEFAULT 0,
  status VARCHAR(10) DEFAULT 'open',     -- 'open' | 'closed' | 'squared'
  strategy_tag VARCHAR(60),              -- optional: e.g. "Bull Call Spread"
  option_strike NUMERIC(10,2),           -- only for options
  option_expiry DATE,
  option_type VARCHAR(4),                -- 'CE' | 'PE'
  lot_size INTEGER DEFAULT 1,
  margin_used NUMERIC(12,2) DEFAULT 0,
  opened_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  notes TEXT
);

-- Strategy backtest results (cached, per user per strategy)
CREATE TABLE IF NOT EXISTS sandbox_strategy_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_name VARCHAR(80) NOT NULL,
  symbol VARCHAR(50) NOT NULL DEFAULT 'NIFTY',
  parameters JSONB DEFAULT '{}',
  result JSONB,                          -- { total_return, win_rate, max_drawdown, trades: [...] }
  run_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, strategy_name, symbol)
);

-- RLS
ALTER TABLE sandbox_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_strategy_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own sandbox account" ON sandbox_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users own sandbox trades" ON sandbox_trades FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users own strategy results" ON sandbox_strategy_results FOR ALL USING (auth.uid() = user_id);

-- Trigger: auto-create sandbox account on user sign-up
CREATE OR REPLACE FUNCTION create_sandbox_account()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO sandbox_accounts (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_user_created_sandbox
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_sandbox_account();

-- Revoke direct call access (trigger-only function)
REVOKE EXECUTE ON FUNCTION create_sandbox_account() FROM anon, authenticated;
