# WealthOS — Database Layer (Supabase PostgreSQL)

This folder contains the full database layer: schema, CRUD helpers, migration runner, and seed data.

## Stack

| Layer | Technology |
|---|---|
| Primary DB | Supabase (PostgreSQL 15) |
| ORM | supabase-py (REST client, no heavy ORM) |
| Auth | Supabase Auth (built-in) |
| File Storage | Supabase Storage |
| Price Cache | `price_cache` table (5-min TTL) |

## Setup — 3 Steps

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → New Project (free tier)
2. Copy your project URL and anon key from **Settings → API**
3. Add to `.env`:
```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # from Settings → API → service_role
SUPABASE_DB_URL=postgresql://postgres:<password>@db.xxxx.supabase.co:5432/postgres
```

### 2. Run Schema
```bash
# Option A — direct migration (requires psycopg2)
pip install psycopg2-binary
python -m database.migrate

# Option B — paste schema.sql manually
# Supabase Dashboard → SQL Editor → New Query → paste schema.sql → Run
```

### 3. Seed Demo Data (optional)
```bash
# Get your user UUID from Supabase Dashboard → Authentication → Users
python -m database.migrate --seed --user-id YOUR_UUID_HERE
```

## Files

| File | Purpose |
|---|---|
| `schema.sql` | Full PostgreSQL schema with RLS policies, indexes, views, triggers |
| `seed.sql` | Demo holdings (NSE + NYSE), transactions, watchlist, target allocation |
| `supabase_client.py` | Singleton client factory (anon + service role) |
| `crud.py` | All CRUD operations — import these in `api.py` |
| `__init__.py` | Package exports |
| `migrate.py` | CLI migration runner |

## Tables

| Table | Description |
|---|---|
| `profiles` | User settings, risk profile, target corpus |
| `holdings` | Current portfolio positions |
| `transactions` | Full trade history (BUY/SELL/DIVIDEND/SPLIT) |
| `price_cache` | Live prices with 5-min TTL (fetched by yfinance) |
| `target_allocations` | User's desired asset class percentages |
| `upload_sessions` | CSV / OCR upload tracking |
| `ai_conversations` | CFO chat history per session |
| `watchlist` | Tracked tickers with target prices |

## Key Design Decisions

- **RLS (Row Level Security)** enabled on all tables — users can only see their own data
- **No heavy ORM** (no SQLAlchemy) — supabase-py REST client is simpler and works with Supabase's PostgREST layer
- **`portfolio_summary` view** — joins holdings + price_cache for one-query dashboard data
- **`total_amount` is a computed column** — never store derived data manually
- **`is_active` soft deletes** on holdings — never hard delete financial records

## Usage in api.py

```python
from database import get_holdings, bulk_upsert_holdings, get_portfolio_summary

# Get all active holdings for a user
holdings = get_holdings(user_id="uuid-here")

# Get portfolio with live prices joined
summary = get_portfolio_summary(user_id="uuid-here")

# Bulk upsert from CSV upload
bulk_upsert_holdings(user_id="uuid", holdings=[
    {"ticker": "RELIANCE.NS", "quantity": 10, "avg_buy_price": 2450, "exchange": "NSE", "asset_class": "equity"}
])
```
