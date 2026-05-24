# WealthOS — Deployment Guide

This project supports **4 deployment targets** out of the box.
Choose ONE backend host + optionally a separate frontend host.

---

## Architecture

```
React (frontend/dist)  ←  built into  →  FastAPI serves it as static files
                                          Single URL, single service
```

FastAPI (`api.py`) serves:
- All `/api/*`, `/health`, `/holdings`, `/portfolio` etc. routes
- The compiled React SPA from `frontend/dist` (production only)

---

## Option 1 — Railway (RECOMMENDED)

1. Go to https://railway.app → New Project → Deploy from GitHub
2. Select `lucifers-0666/WealthOS`
3. Railway auto-detects `railway.json` + `Dockerfile`
4. Add Environment Variables (Settings → Variables):
   ```
   SUPABASE_URL=
   SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   GOOGLE_API_KEY=
   NEWSAPI_KEY=
   SECRET_KEY=
   DEFAULT_CURRENCY=INR
   DEFAULT_EXCHANGE=NSE
   GEMINI_MODEL=gemini-2.5-flash
   FRONTEND_URL=https://your-railway-app.up.railway.app
   ```
5. Deploy → one URL serves everything ✅

---

## Option 2 — Render

1. Go to https://render.com → New → Web Service
2. Connect GitHub → select `WealthOS`
3. Render auto-detects `render.yaml`
4. Fill in env vars marked `sync: false` in the Render dashboard
5. Deploy → free tier (spins down after 15min inactivity)

---

## Option 3 — Vercel (frontend only) + Railway (backend)

Set Root Directory to `frontend` in Vercel project settings.

Then update `vercel.json` — replace the backend proxy URL:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR-RAILWAY-URL.up.railway.app/api/:path*"
    }
  ]
}
```

Frontend env var in Vercel:
```
VITE_API_URL=https://YOUR-RAILWAY-URL.up.railway.app
```

---

## Option 4 — Docker (self-host / VPS / Fly.io / Koyeb)

```bash
# Build
docker build -t wealthos .

# Run
docker run -p 8000:8000 \
  -e SUPABASE_URL=... \
  -e SUPABASE_ANON_KEY=... \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  -e GOOGLE_API_KEY=... \
  -e NEWSAPI_KEY=... \
  -e SECRET_KEY=... \
  -e DEFAULT_CURRENCY=INR \
  -e DEFAULT_EXCHANGE=NSE \
  wealthos
```

Open http://localhost:8000

---

## Local Development

```bash
# Terminal 1 — Backend
cd D:\wealthOS\WealthOS
..\.venv\Scripts\Activate.ps1
uvicorn api:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev   # runs on http://localhost:3000
```

Frontend talks to backend via `VITE_API_URL=http://localhost:8000`

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key |
| `GOOGLE_API_KEY` | ✅ | Gemini AI key |
| `NEWSAPI_KEY` | ✅ | NewsAPI key |
| `SECRET_KEY` | ✅ | App secret (any random string) |
| `DEFAULT_CURRENCY` | ➖ | Default: `INR` |
| `DEFAULT_EXCHANGE` | ➖ | Default: `NSE` |
| `GEMINI_MODEL` | ➖ | Default: `gemini-2.5-flash` |
| `FRONTEND_URL` | ➖ | CORS origin (your deployed frontend URL) |
| `DEV_USER_ID` | ➖ | Dev bypass user UUID (local only) |
| `PORT` | ➖ | Auto-set by Railway/Render |
