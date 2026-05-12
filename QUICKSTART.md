# WealthOS — Quick Start

## Prerequisites
- Python 3.11+
- Node.js 18+
- Git

---

## Setup (5 minutes)

### 1. Clone & Setup
```bash
git clone https://github.com/lucifers-0666/WealthOS.git
cd WealthOS
python -m venv .venv
.\.venv\Scripts\activate  # Windows
# or: source .venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cd WealthOS
# Your .env file is ready with Supabase pre-configured
# Edit .env and add your API keys:
```

Get API keys (all free):
- **Google**: https://aistudio.google.com
- **NewsAPI**: https://newsapi.org
- **Alpha Vantage**: https://www.alphavantage.co (optional)

### 3. Frontend Setup
```bash
cd frontend
npm install
```

---

## Run the App

### Option A: All-in-One (Easiest)
```powershell
cd WealthOS
.\start.ps1
```
- Streamlit: http://localhost:8501
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

### Option B: Manual Start
**Terminal 1:**
```bash
cd WealthOS
streamlit run app.py
```

**Terminal 2:**
```bash
cd WealthOS
python -m uvicorn api:app --port 8000 --reload
```

**Terminal 3:**
```bash
cd WealthOS/frontend
npm run dev
```

---

## Verify Setup
- ✅ Open http://localhost:8501 → Streamlit app loads
- ✅ Open http://localhost:3000 → Vite frontend loads  
- ✅ Open http://localhost:8000/docs → API documentation
- ⚠️ Dashboard loads but AI/News features show warnings (add API keys to fix)

---

## Troubleshooting

### 500 Error on Startup?
**Check:** Your `.env` file has `SUPABASE_URL` and `SUPABASE_ANON_KEY`
```bash
cat WealthOS/.env
```

### Module Not Found?
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

cd WealthOS/frontend
npm install
```

### Frontend Not Loading?
```bash
# Check if Vite is running on port 3000
netstat -ano | findstr :3000  # Windows

# Kill process and restart
cd WealthOS/frontend
npm run dev
```

**📖 Full troubleshooting guide:** [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)

---

## Architecture

```
WealthOS/
├── WealthOS/                 # Python backend
│   ├── app.py               # Streamlit main app
│   ├── api.py               # FastAPI endpoints
│   ├── config.py            # Configuration
│   ├── .env                 # Environment variables ← EDIT THIS
│   ├── core/                # Portfolio logic
│   ├── ai/                  # AI/LLM features
│   ├── database/            # Supabase CRUD
│   └── ui/                  # Streamlit pages
│
├── frontend/                # React + Vite
│   ├── src/                 # React components
│   ├── .env                 # Frontend config
│   ├── package.json
│   └── vite.config.js
│
└── data/                    # Sample CSVs
```

---

## Features

- 📊 **Portfolio Dashboard** — Real-time holdings, P&L, allocation
- 🤖 **AI Advisor** — Gemini-powered portfolio analysis
- 📰 **Market News** — Semantic search with ChromaDB RAG
- 📁 **Data Upload** — CSV/Excel/Image import with OCR
- 💾 **Cloud Sync** — All data stored in Supabase PostgreSQL
- 📱 **Modern UI** — Streamlit + React/Vite frontend

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/health` | Health check |
| `GET` | `/portfolio` | Portfolio summary with live prices |
| `GET` | `/holdings` | List all holdings |
| `POST` | `/holdings` | Add/update holding |
| `POST` | `/holdings/bulk` | Bulk upload holdings |
| `POST` | `/chat` | Send message to AI CFO |
| `GET` | `/news` | Get market news with RAG |

Full docs: http://localhost:8000/docs

---

## Support

📖 Docs: https://github.com/lucifers-0666/WealthOS
🐛 Issues: https://github.com/lucifers-0666/WealthOS/issues
💬 Discord: [Join community]

**Happy investing! 🚀**
