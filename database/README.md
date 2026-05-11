# WealthOS — Database Layer

This folder contains everything related to the Supabase PostgreSQL integration.

## Files

| File | Purpose |
|------|---------|
| `schema.sql` | Full database schema — run once in Supabase SQL Editor |
| `seed.sql` | Demo data for development — optional |
| `db.py` | Python CRUD layer — import from anywhere in the app |
| `__init__.py` | Re-exports all public functions |

---

## Setup (5 minutes)

### Step 1 — Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) → Sign up (free)
2. Click **New Project** → Choose a name `wealthos` → Set a DB password → Select region `ap-south-1` (Mumbai)
3. Wait ~2 minutes for provisioning

### Step 2 — Run the Schema
1. In your Supabase project → **SQL Editor** → **New Query**
2. Paste the entire contents of `database/schema.sql`
3. Click **Run** — all 9 tables + indexes + RLS policies + triggers are created

### Step 3 — Add env variables to `.env`
```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
Get both from: **Project Settings → API → Project URL + anon public key**

### Step 4 — Install Python client
```bash
pip install supabase
```
(Already added to requirements.txt)

### Step 5 — (Optional) Load demo data
1. Go to **Authentication → Users** → copy your user UUID
2. Open `database/seed.sql` → replace `YOUR-USER-UUID-HERE` with your UUID
3. Run in SQL Editor

---

## Usage in Python

```python
from database import get_holdings, upsert_holding, bulk_insert_transactions

# Get all holdings for a user
holdings = get_holdings(user_id="uuid-here")

# Upsert a holding
upsert_holding(
    user_id="uuid-here",
    ticker="RELIANCE",
    exchange="NSE",
    payload={
        "quantity": 10,
        "avg_buy_price": 2450.00,
        "asset_class": "equity_IN",
        "currency": "INR",
        "sector": "Energy",
    }
)

# Bulk import from CSV
bulk_insert_transactions(user_id="uuid-here", transactions=parsed_rows)
```

---

## Table Overview

| Table | What it stores |
|-------|----------------|
| `profiles` | User settings, currency preference, risk profile |
| `holdings` | Current portfolio positions (ticker, qty, avg price) |
| `transactions` | Full buy/sell/dividend history |
| `target_allocations` | User's desired portfolio asset mix (%) |
| `price_cache` | Last fetched live prices (TTL managed in app) |
| `watchlist` | Tickers being researched |
| `ai_conversations` | CFO advisor chat history |
| `upload_sessions` | CSV/image upload tracking + OCR results |
| `portfolio_snapshots` | Daily total portfolio value for charting |

---

## Security

All tables have **Row Level Security (RLS)** enabled — users can only read/write their own data. The `price_cache` table is public read (no auth needed for price lookups).
