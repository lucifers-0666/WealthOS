# WealthOS — PostgreSQL Database

## Quick Setup

### 1. Install PostgreSQL (Windows)
```powershell
# Using winget
winget install PostgreSQL.PostgreSQL
# OR download from https://www.postgresql.org/download/windows/
```

### 2. Create database & user
```sql
-- Open psql as postgres superuser
psql -U postgres

CREATE DATABASE wealthos;
CREATE USER wealthos WITH PASSWORD 'wealthos';
GRANT ALL PRIVILEGES ON DATABASE wealthos TO wealthos;
\c wealthos
GRANT ALL ON SCHEMA public TO wealthos;
\q
```

### 3. Add to your .env
```
DATABASE_URL=postgresql://wealthos:wealthos@localhost:5432/wealthos
```

### 4. Run migration
```bash
# Apply schema (creates all tables + seed data)
python -m database.migrate

# Test connection
python -m database.migrate --check

# Reset everything (DEV only)
python -m database.migrate --reset
```

### 5. Install Python drivers
```bash
pip install psycopg2-binary asyncpg sqlalchemy
```

---

## Schema Overview

| Table | Purpose |
|---|---|
| `users` | User accounts |
| `portfolios` | One user → many portfolios |
| `assets` | Master ticker registry (NSE, NYSE, etc.) |
| `holdings` | Live snapshot per ticker per portfolio |
| `transactions` | Immutable buy/sell/dividend ledger |
| `target_allocations` | Target % per asset class |
| `price_history` | Daily OHLCV (populated by price_fetcher) |
| `watchlist` | Per-user watchlist with price alerts |
| `ai_conversations` | CFO advisor chat sessions |
| `ai_messages` | Individual messages within a conversation |
| `news_cache` | Cached news articles with sentiment |
| `portfolio_snapshots` | Daily NAV for performance charts |
| `import_logs` | CSV/XLSX upload audit trail |

---

## Using in Streamlit

```python
from database.crud import holdings_to_df, transactions_to_df
from database.db import health_check

# Check connection
if health_check():
    df = holdings_to_df(portfolio_id)
    st.dataframe(df)
```

## Using in FastAPI

```python
from database.db import db_dependency
from database.models import Holding
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

@app.get("/holdings")
async def get_holdings(db: AsyncSession = Depends(db_dependency)):
    result = await db.execute(select(Holding))
    return result.scalars().all()
```
