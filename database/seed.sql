-- ============================================================
-- WealthOS — Seed Data (Demo Portfolio)
-- Only run this for development/testing purposes
-- Replace 'YOUR-USER-UUID' with your actual Supabase user ID
-- Get your user ID: Supabase Dashboard → Authentication → Users
-- ============================================================

-- NOTE: You must be signed in and have a profile row first.
-- Replace this UUID with your real user ID from Supabase Auth:
DO $$
DECLARE
  demo_user_id UUID := 'YOUR-USER-UUID-HERE';
BEGIN

-- Demo Holdings (Indian + International mix)
INSERT INTO public.holdings (user_id, ticker, name, exchange, asset_class, quantity, avg_buy_price, currency, sector, source)
VALUES
  (demo_user_id, 'RELIANCE',  'Reliance Industries Ltd',     'NSE', 'equity_IN', 10,  2450.00, 'INR', 'Energy',       'manual'),
  (demo_user_id, 'INFY',      'Infosys Ltd',                  'NSE', 'equity_IN', 15,  1520.00, 'INR', 'Technology',   'manual'),
  (demo_user_id, 'HDFCBANK',  'HDFC Bank Ltd',                'NSE', 'equity_IN', 8,   1680.00, 'INR', 'Finance',      'manual'),
  (demo_user_id, 'TCS',       'Tata Consultancy Services',    'NSE', 'equity_IN', 5,   3800.00, 'INR', 'Technology',   'manual'),
  (demo_user_id, 'WIPRO',     'Wipro Ltd',                    'NSE', 'equity_IN', 20,   520.00, 'INR', 'Technology',   'manual'),
  (demo_user_id, 'VTI',       'Vanguard Total Stock Market',  'NYSE','equity_US', 3,   220.00,  'USD', 'ETF',          'manual'),
  (demo_user_id, 'QQQ',       'Invesco QQQ Trust',            'NYSE','equity_US', 2,   430.00,  'USD', 'ETF',          'manual'),
  (demo_user_id, 'GOLDBEES',  'Nippon India Gold BeES ETF',   'NSE', 'gold',      50,   52.00, 'INR', 'Gold',         'manual'),
  (demo_user_id, 'LIQUIDBEES','Nippon Liquid BeES ETF',       'NSE', 'debt',      100,  1000.00,'INR', 'Debt',         'manual')
ON CONFLICT (user_id, ticker, exchange) DO NOTHING;

-- Demo Transactions
INSERT INTO public.transactions (user_id, ticker, exchange, action, quantity, price, currency, trade_date, broker, source)
VALUES
  (demo_user_id, 'RELIANCE', 'NSE', 'BUY', 10, 2450.00, 'INR', '2024-01-15', 'Zerodha', 'manual'),
  (demo_user_id, 'INFY',     'NSE', 'BUY', 15, 1520.00, 'INR', '2024-02-10', 'Zerodha', 'manual'),
  (demo_user_id, 'HDFCBANK', 'NSE', 'BUY',  8, 1680.00, 'INR', '2024-03-05', 'Groww',   'manual'),
  (demo_user_id, 'TCS',      'NSE', 'BUY',  5, 3800.00, 'INR', '2024-03-20', 'Zerodha', 'manual'),
  (demo_user_id, 'WIPRO',    'NSE', 'BUY', 20,  520.00, 'INR', '2024-04-01', 'Upstox',  'manual'),
  (demo_user_id, 'VTI',      'NYSE','BUY',  3,  220.00, 'USD', '2024-04-15', 'INDmoney','manual'),
  (demo_user_id, 'QQQ',      'NYSE','BUY',  2,  430.00, 'USD', '2024-05-01', 'INDmoney','manual'),
  (demo_user_id, 'GOLDBEES', 'NSE', 'BUY', 50,   52.00, 'INR', '2024-06-10', 'Groww',   'manual'),
  (demo_user_id, 'LIQUIDBEES','NSE','BUY', 100, 1000.00,'INR', '2024-07-01', 'Zerodha', 'manual')
ON CONFLICT DO NOTHING;

-- Demo Target Allocations
INSERT INTO public.target_allocations (user_id, asset_class, target_pct)
VALUES
  (demo_user_id, 'equity_IN', 50.00),
  (demo_user_id, 'equity_US', 20.00),
  (demo_user_id, 'etf',       10.00),
  (demo_user_id, 'gold',      10.00),
  (demo_user_id, 'debt',      10.00)
ON CONFLICT (user_id, asset_class) DO UPDATE SET target_pct = EXCLUDED.target_pct;

-- Demo Watchlist
INSERT INTO public.watchlist (user_id, ticker, exchange, name, notes)
VALUES
  (demo_user_id, 'INDA',    'NYSE', 'iShares MSCI India ETF',     'Considering for US exposure to India'),
  (demo_user_id, 'BAJFINANCE','NSE','Bajaj Finance Ltd',          'High growth NBFC, watching valuation'),
  (demo_user_id, 'NIFTYBEES','NSE','Nippon India Nifty 50 ETF',   'Index ETF alternative')
ON CONFLICT (user_id, ticker, exchange) DO NOTHING;

END $$;
