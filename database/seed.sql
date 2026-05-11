-- ============================================================
-- WealthOS — Demo Seed Data
-- Run AFTER schema.sql in Supabase SQL Editor
-- Replace 'YOUR_USER_UUID' with your actual auth.users UUID
-- (find it in Supabase Dashboard → Authentication → Users)
-- ============================================================

-- Demo profile
INSERT INTO public.profiles (id, full_name, currency, risk_profile, investment_goal, target_corpus)
VALUES (
    'YOUR_USER_UUID',
    'Demo Investor',
    'INR',
    'moderate',
    'Wealth accumulation + early retirement by 45',
    10000000.00
) ON CONFLICT (id) DO NOTHING;

-- Demo Indian equity holdings
INSERT INTO public.holdings (user_id, ticker, company_name, quantity, avg_buy_price, exchange, asset_class, sector, currency)
VALUES
    ('YOUR_USER_UUID', 'RELIANCE.NS',  'Reliance Industries',    10, 2450.00, 'NSE', 'equity', 'Energy',          'INR'),
    ('YOUR_USER_UUID', 'INFY.NS',      'Infosys',                20, 1420.00, 'NSE', 'equity', 'Technology',      'INR'),
    ('YOUR_USER_UUID', 'HDFCBANK.NS',  'HDFC Bank',              15, 1580.00, 'NSE', 'equity', 'Banking',         'INR'),
    ('YOUR_USER_UUID', 'TCS.NS',       'Tata Consultancy',       8,  3400.00, 'NSE', 'equity', 'Technology',      'INR'),
    ('YOUR_USER_UUID', 'WIPRO.NS',     'Wipro',                  25, 420.00,  'NSE', 'equity', 'Technology',      'INR'),
    ('YOUR_USER_UUID', 'GOLDBEES.NS',  'Nippon Gold BeES ETF',   50, 55.00,   'NSE', 'gold',   'Commodity',       'INR'),
    ('YOUR_USER_UUID', 'LIQUIDBEES.NS','Nippon Liquid BeES',     10, 1000.00, 'NSE', 'etf',    'Liquid',          'INR')
ON CONFLICT (user_id, ticker, exchange) DO NOTHING;

-- Demo international holdings
INSERT INTO public.holdings (user_id, ticker, company_name, quantity, avg_buy_price, exchange, asset_class, sector, currency)
VALUES
    ('YOUR_USER_UUID', 'VTI',   'Vanguard Total Market ETF', 5,  220.00, 'NYSE',   'etf',    'Index',      'USD'),
    ('YOUR_USER_UUID', 'QQQ',   'Invesco QQQ Trust',         3,  380.00, 'NASDAQ', 'etf',    'Technology', 'USD'),
    ('YOUR_USER_UUID', 'INDA',  'iShares India ETF',         10, 42.00,  'NYSE',   'etf',    'India',      'USD')
ON CONFLICT (user_id, ticker, exchange) DO NOTHING;

-- Demo target allocation
INSERT INTO public.target_allocations (user_id, asset_class, target_pct)
VALUES
    ('YOUR_USER_UUID', 'equity',       60.0),
    ('YOUR_USER_UUID', 'etf',          20.0),
    ('YOUR_USER_UUID', 'gold',          5.0),
    ('YOUR_USER_UUID', 'mutual_fund',  10.0),
    ('YOUR_USER_UUID', 'cash',          5.0)
ON CONFLICT (user_id, asset_class) DO UPDATE SET target_pct = EXCLUDED.target_pct;

-- Demo transactions
INSERT INTO public.transactions (user_id, ticker, action, quantity, price, transaction_date, exchange, broker)
VALUES
    ('YOUR_USER_UUID', 'RELIANCE.NS', 'BUY',  5,  2300.00, '2024-01-15', 'NSE', 'Zerodha'),
    ('YOUR_USER_UUID', 'RELIANCE.NS', 'BUY',  5,  2600.00, '2024-06-10', 'NSE', 'Zerodha'),
    ('YOUR_USER_UUID', 'INFY.NS',     'BUY',  20, 1420.00, '2024-02-20', 'NSE', 'Zerodha'),
    ('YOUR_USER_UUID', 'TCS.NS',      'BUY',  8,  3400.00, '2024-03-05', 'NSE', 'Zerodha'),
    ('YOUR_USER_UUID', 'VTI',         'BUY',  5,  220.00,  '2024-04-12', 'NYSE', 'INDmoney'),
    ('YOUR_USER_UUID', 'QQQ',         'BUY',  3,  380.00,  '2024-05-18', 'NASDAQ', 'INDmoney'),
    ('YOUR_USER_UUID', 'WIPRO.NS',    'SELL', 5,  480.00,  '2024-08-22', 'NSE', 'Zerodha'),
    ('YOUR_USER_UUID', 'HDFCBANK.NS', 'DIVIDEND', 15, 19.50, '2024-09-01', 'NSE', 'Zerodha')
ON CONFLICT DO NOTHING;

-- Demo watchlist
INSERT INTO public.watchlist (user_id, ticker, company_name, exchange, target_price)
VALUES
    ('YOUR_USER_UUID', 'BAJFINANCE.NS', 'Bajaj Finance',       'NSE',    7500.00),
    ('YOUR_USER_UUID', 'NIFTY50.NS',    'Nifty 50 Index',      'NSE',    NULL),
    ('YOUR_USER_UUID', 'NVDA',          'NVIDIA Corporation',  'NASDAQ', 1000.00),
    ('YOUR_USER_UUID', 'AAPL',          'Apple Inc.',          'NASDAQ', 190.00)
ON CONFLICT (user_id, ticker) DO NOTHING;
