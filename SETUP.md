# WealthOS — Complete Setup Guide

A cinematic AI-powered personal finance operating system.

---

## Architecture

```
frontend/       React + Vite + Recharts (cinematic dark UI)
api.py          FastAPI backend (all endpoints)
database/       SQLAlchemy models + Supabase CRUD
core/           Price fetcher, data loader, OCR, cache
ai/             Gemini CFO advisor + RAG news engine
ui/             Streamlit layer (legacy, optional)
```

---

## 1. Supabase Setup (Free)

1. Go to [supabase.com](https://supabase.com) → Create new project
2. Go to **SQL Editor** → paste contents of `database/schema.sql` → Run
3. Go to **SQL Editor** → paste contents of `database/seed.sql` → Run (optional demo data)
4. Go to **Settings → Database** → copy the **Transaction pooler** connection string → put in `.env` as `DATABASE_URL`
5. Go to **Settings → API** → copy `Project URL` and `anon public` key → put in `.env` and `frontend/.env`

---

## 2. Backend Setup

```bash
cd WealthOS
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt

# Copy and fill environment variables
cp .env.example .env
# Edit .env with your keys

# Run FastAPI backend
uvicorn api:app --reload --port 8000
```

---

## 3. Frontend Setup

```bash
cd frontend
npm install

# Copy and fill frontend environment variables
cp .env.example .env
# Edit frontend/.env with your Supabase + API keys

npm run dev
# Open http://localhost:5173
```

---

## 4. Redis Cache (Optional — Recommended)

1. Go to [upstash.com](https://upstash.com) → Create Redis database (free tier)
2. Copy the **Redis URL** (starts with `rediss://`) → put in `.env` as `REDIS_URL`
3. Prices will now be cached for 5 minutes — much faster refreshes

If `REDIS_URL` is blank, WealthOS uses an in-memory fallback automatically.

---

## 5. API Keys Summary

| Key | Where to get | Used for |
|---|---|---|
| `GOOGLE_API_KEY` | [aistudio.google.com](https://aistudio.google.com) | AI CFO (Gemini 1.5 Pro) |
| `NEWSAPI_KEY` | [newsapi.org](https://newsapi.org) | Live news + RAG |
| `ALPHA_VANTAGE_KEY` | [alphavantage.co](https://www.alphavantage.co) | Backup price data |
| `SUPABASE_URL` | supabase.com → Settings → API | Auth + DB |
| `SUPABASE_ANON_KEY` | supabase.com → Settings → API | Auth + DB |
| `REDIS_URL` | upstash.com | Price caching (optional) |

All services have **free tiers** — no credit card needed to start.

---

## 6. Local Dev Without Supabase Auth

For rapid local testing without creating a Supabase account:

1. Add `DEV_USER_ID=any-uuid-string` to `.env`
2. All API calls will use this fixed user ID — no JWT required
3. Remove `DEV_USER_ID` before deploying to production

---

## 7. Run Both Servers

```bash
# Terminal 1 — Backend
uvicorn api:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — create an account and start importing your portfolio.
