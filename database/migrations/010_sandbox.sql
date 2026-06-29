-- Migration: 010_sandbox.sql

-- Virtual wallet per user
CREATE TABLE IF NOT EXISTS sandbox_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(15,2) NOT NULL DEFAULT 500000.00,
  initial_balance DECIMAL(15,2) NOT NULL DEFAULT 500000.00,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Paper equity holdings
CREATE TABLE IF NOT EXISTS sandbox_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  company_name TEXT,
  quantity DECIMAL(15,4) NOT NULL DEFAULT 0,
  avg_buy_price DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, ticker)
);

-- All sandbox orders (equity + options + futures)
CREATE TABLE IF NOT EXISTS sandbox_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_type TEXT NOT NULL CHECK (order_type IN ('EQUITY','OPTION','FUTURE')),
  action TEXT NOT NULL CHECK (action IN ('BUY','SELL')),
  ticker TEXT NOT NULL,
  quantity DECIMAL(15,4) NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  total_value DECIMAL(15,2) NOT NULL,
  
  -- Options-specific fields (null for equity/futures)
  strike_price DECIMAL(15,2),
  expiry_date DATE,
  option_type TEXT CHECK (option_type IN ('CE','PE', NULL)),
  lot_size INTEGER,
  premium DECIMAL(15,2),
  
  -- Futures-specific fields
  contract_size INTEGER,
  margin_used DECIMAL(15,2),
  
  status TEXT NOT NULL DEFAULT 'EXECUTED'
         CHECK (status IN ('EXECUTED','CANCELLED','PENDING')),
  executed_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

-- Options positions (open positions tracking)
CREATE TABLE IF NOT EXISTS sandbox_option_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  underlying TEXT NOT NULL,  -- e.g. "NIFTY", "BANKNIFTY"
  strike_price DECIMAL(15,2) NOT NULL,
  expiry_date DATE NOT NULL,
  option_type TEXT NOT NULL CHECK (option_type IN ('CE','PE')),
  lot_size INTEGER NOT NULL DEFAULT 50,
  lots_held INTEGER NOT NULL DEFAULT 0,
  avg_premium DECIMAL(15,4) NOT NULL,
  current_premium DECIMAL(15,4),
  delta DECIMAL(8,4),
  theta DECIMAL(8,4),
  gamma DECIMAL(8,4),
  iv DECIMAL(8,4),  -- Implied Volatility as decimal (0.18 = 18%)
  position_status TEXT DEFAULT 'OPEN' CHECK (position_status IN ('OPEN','CLOSED')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE sandbox_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_option_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies — users see only their own data
CREATE POLICY "sandbox_wallet_own" ON sandbox_wallet
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "sandbox_holdings_own" ON sandbox_holdings
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "sandbox_orders_own" ON sandbox_orders
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "sandbox_option_positions_own" ON sandbox_option_positions
  FOR ALL USING (auth.uid() = user_id);

-- Auto-create wallet when new user signs up
CREATE OR REPLACE FUNCTION create_sandbox_wallet()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO sandbox_wallet (user_id, balance, initial_balance)
  VALUES (NEW.id, 500000.00, 500000.00)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_sandbox ON auth.users;
CREATE TRIGGER on_auth_user_created_sandbox
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_sandbox_wallet();
