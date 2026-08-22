# 🏛️ WealthOS — Private Wealth Intelligence Terminal

[![Python 3.10-3.14](https://img.shields.io/badge/Python-3.10--3.14-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Google Gemini](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-8E75B2?style=flat&logo=google&logoColor=white)](https://ai.google.dev)
[![ChromaDB](https://img.shields.io/badge/Vector%20DB-ChromaDB-FF6F00?style=flat)](https://trychroma.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**WealthOS** is an institutional-grade wealth management and portfolio intelligence workspace designed for Indian (NSE/BSE) and Global markets. It merges traditional quantitative financial mathematics (Black-Scholes Options Greeks, technical indicators, portfolio return metrics) with **State-of-the-Art AI / ML** capabilities—including **RAG (Retrieval-Augmented Generation)**, **Multimodal Vision OCR**, and **LLM Financial CFO Advisory**.

---

## 💻 Comprehensive Technology Stack

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                          WEALTHOS TECH STACK                            │
├───────────────────┬───────────────────┬─────────────────────────────────┤
│ Frontend Web App  │ React 18, Vite 5, Tailwind CSS, Framer Motion,      │
│                   │ Zustand, Recharts, Phosphor Icons, Fuse.js          │
├───────────────────┼───────────────────┼─────────────────────────────────┤
│ Backend API       │ Python 3.10–3.14 (ABI3 PyO3), FastAPI, Uvicorn,     │
│                   │ SlowAPI Rate Limiter, WebSockets, APScheduler       │
├───────────────────┼───────────────────┼─────────────────────────────────┤
│ AI & ML Engine    │ Google Gemini 2.5 Flash (gemini-2.5-flash),            │
│                   │ RAG (ChromaDB + LangChain + sentence-transformers), │
│                   │ Multimodal Vision OCR (Pillow + Gemini Vision)      │
├───────────────────┼───────────────────┼─────────────────────────────────┤
│ Financial Math    │ SciPy & NumPy (Black-Scholes Options Greeks),       │
│                   │ Technical Indicators (Wilder's RSI, EMA, MACD),     │
│                   │ Multi-Currency INR/USD Conversion Engine            │
├───────────────────┼───────────────────┼─────────────────────────────────┤
│ Database & Feeds  │ Supabase PostgreSQL (Row Level Security),           │
│                   │ Real-time yFinance API, NewsAPI, NSE/BSE Hours      │
└───────────────────┴───────────────────┴─────────────────────────────────┘
```

### Detailed Tech Stack Breakdown:

* **Frontend Architecture**:
  * **React 18.3**: Modern single-page application structure using functional components & hooks.
  * **Vite 5.4**: Lightning-fast build tool and HMR development server.
  * **Tailwind CSS 3.4**: Responsive styling & design system tokens.
  * **Framer Motion**: Hardware-accelerated layout transitions and micro-animations.
  * **Zustand**: Fast, unopinionated client state management.
  * **Recharts**: Interactive financial candlestick, line, pie, and area charts.

* **Backend & Microservices**:
  * **FastAPI 0.115+**: Async Python REST backend with automatic OpenAPI/Swagger docs (`/docs`).
  * **Python 3.14 Compatibility**: Uses `$env:PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1` for binary wheel compilation.
  * **WebSockets**: Real-time ticker price streaming and market status notifications.
  * **SlowAPI**: Rate limiting middleware to protect endpoints from abuse.

* **Artificial Intelligence & Machine Learning**:
  * **Google Gemini 2.5 Flash**: Contextual financial advisor trained for portfolio rebalancing, risk assessment, and tax analysis.
  * **RAG Engine (ChromaDB + LangChain)**: Semantic vector store embedding broker statements and financial news with `sentence-transformers/all-MiniLM-L6-v2`.
  * **Multimodal Computer Vision OCR**: Extracts portfolio holdings directly from uploaded broker statement screenshots or PDFs.

* **Quantitative Finance & Data**:
  * **Black-Scholes Model (SciPy/NumPy)**: Calculates Call/Put premiums and Options Greeks ($\Delta, \Gamma, \Theta, \nu$).
  * **Technical Analysis Engine**: Wilder's smoothing RSI, Exponential Moving Averages (EMA 20/50/200), and trend signals.
  * **Supabase PostgreSQL**: Scalable database with Row Level Security (RLS).

---

## 🌟 Key System Features

### 🤖 1. AI CFO Advisor & RAG Engine
* **Contextual Portfolio Reasoning**: Ingests holdings, asset allocation weights, sector exposures, and best/worst performers into Gemini's system instructions.
* **Vector Semantic Search**: Uploaded financial documents are split into 500-character chunks, vectorized into 384-dimensional dense embeddings, and stored in ChromaDB for zero-hallucination answers.

### 📈 2. Quantitative Financial Mathematics
* **Options Pricing & Greeks**: Computes Black-Scholes sensitivities:
  $$\Delta = N(d_1), \quad \Gamma = \frac{N'(d_1)}{S \sigma \sqrt{T}}, \quad \Theta, \quad \nu = S N'(d_1) \sqrt{T}$$
* **Portfolio Return Engine**: Calculates P&L %, concentration risk, diversification scores, and multi-currency USD/INR conversions.

### 🇮🇳 3. Real-Time Indian Stock Market (NSE/BSE) Hours Engine
* **IST Timezone Scheduler**: Real-time tracking of:
  * Pre-Market Session: **09:00 AM – 09:15 AM IST**
  * Regular Trading: **09:15 AM – 03:30 PM IST**
  * After-Hours: **03:30 PM – 04:00 PM IST**
  * Weekends & Holidays: Displays gray/red `MARKET CLOSED` badge with live countdown (e.g. `Opens in 49h 17m`).

### 📱 4. Full Mobile & Tablet Responsiveness
* **Slide-out Navigation Drawer**: Touch-friendly hamburger menu button for mobile screens ($< 980\text{px}$).
* **Touch-scroll Tables**: Financial ledgers and options chains scroll horizontally without cutting off data.

---

## 🏗️ Repository Structure

```text
WealthOS/
├── api.py                     # Primary FastAPI REST & WebSocket Backend (Port 8000)
├── app.py                     # Streamlit Quantitative Analytics Dashboard (Port 8501)
├── config.py                  # Centralized configuration & environment validation
├── requirements.txt           # Python dependencies (Python 3.10–3.14 compatible)
├── setup.bat / run.bat        # One-click launcher scripts for Windows
├── setup.ps1 / start.ps1      # Automated PowerShell setup scripts
│
├── ai/                        # Artificial Intelligence & ML Modules
│   ├── cfo_advisor.py         # Google Gemini 2.5 Flash Financial Advisor
│   ├── rag_engine.py          # RAG Engine (ChromaDB + LangChain + sentence-transformers)
│   └── prompts.py             # CFO financial prompt engineering templates
│
├── api/                       # Modular FastAPI Routes
│   ├── auth.py                # Centralized authentication & user dependency injection
│   ├── broker.py              # Broker integration routes
│   ├── sandbox_routes.py      # Paper trading sandbox lab (With automatic fallback handling)
│   └── signals.py             # Quantitative TA signals routes
│
├── backend/                   # Microservice Infrastructure
│   ├── health.py              # System Liveness & Readiness Probes (/health & /health/deep)
│   └── services/              # Live market engine & WebSocket broadcaster
│
├── core/                      # Financial Mathematics & Domain Engines
│   ├── greeks_calculator.py   # Black-Scholes Options Greeks Model
│   ├── portfolio_engine.py    # Portfolio Return & P&L Enrichment
│   ├── market_status.py       # NSE/BSE Market Schedule & Holiday Engine
│   ├── price_fetcher.py       # Cached Market Data Fetcher (yFinance)
│   └── image_ocr.py           # Broker Statement OCR Extractor
│
├── database/                  # Storage Layer (Supabase PostgreSQL Client)
│
└── frontend/                  # React 18 / Vite SPA Web Application (Port 3001)
    ├── package.json           # Vite, React 18, Tailwind CSS, Framer Motion, Zustand
    └── src/                   # 19 pages, UI components, custom design system
```

---

## ⚡ Step-by-Step Installation & Quick Start

### 1. Prerequisites
* **Python**: `3.10` or higher (Fully tested on `Python 3.14`)
* **Node.js**: `v18` or higher & `npm`

---

### 2. One-Click Quick Start (Windows)

#### First-time Setup:
Double-click `setup.bat` or run in PowerShell:
```powershell
.\setup.bat
```

#### Launch Application:
Double-click `run.bat` or run in PowerShell:
```powershell
.\run.bat
```

This automatically starts all 3 services:
* 🟢 **FastAPI Backend**: `http://localhost:8000` (Docs: `http://localhost:8000/docs`)
* 📊 **Streamlit Dashboard**: `http://localhost:8501`
* 💻 **React Web Application**: `http://localhost:3001`

---

### 3. Manual Setup (Linux / macOS / Windows)

#### Step 1: Clone Repository
```bash
git clone https://github.com/lucifers-0666/WealthOS.git
cd WealthOS
```

#### Step 2: Virtual Environment & Python Dependencies
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .\.venv\Scripts\activate

# Install backend dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

#### Step 3: Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

#### Step 4: Environment Variables Setup
Copy `.env.example` to `.env` and fill in your keys:
```env
GOOGLE_API_KEY="your-gemini-api-key"
NEWSAPI_KEY="your-news-api-key"
SUPABASE_URL="https://your-supabase-url.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
```

#### Step 5: Start Services
```bash
# Terminal 1: FastAPI Backend
uvicorn api:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Streamlit Cockpit
streamlit run app.py --server.port 8501

# Terminal 3: React Web Frontend
cd frontend
npm run dev
```

---

## 🔑 Environment Variables Reference

| Variable | Type | Description |
| :--- | :--- | :--- |
| `GOOGLE_API_KEY` | Backend | API Key for Google Gemini 2.5 Flash LLM & Vision OCR |
| `NEWSAPI_KEY` | Backend | API Key for fetching market news articles |
| `SUPABASE_URL` | Shared | Supabase PostgreSQL project URL |
| `SUPABASE_ANON_KEY` | Shared | Supabase client anonymous API key |
| `VITE_API_URL` | Frontend | URL of FastAPI backend (`http://localhost:8000`) |
| `DEV_USER_ID` | Backend | Default User ID for offline local development |

---

## 📡 API Endpoints Overview

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/health` | `GET` | System Liveness Probe |
| `/health/deep` | `GET` | Deep Readiness Probe (Database, Market Engine, WebSockets) |
| `/prices` | `GET` | Batch price quote fetcher |
| `/api/market/status` | `GET` | Real-time NSE/BSE market session status & countdown |
| `/api/market/indices` | `GET` | Live indices feeds (Nifty 50, Sensex, S&P 500, Nasdaq, Gold, Oil) |
| `/holdings` | `GET` | Read portfolio holdings |
| `/api/portfolio/summary` | `GET` | Portfolio total value, gain/loss %, and sector concentration |
| `/api/signals` | `GET` | Technical indicators & RSI trading signals |
| `/api/sandbox/wallet` | `GET` | Sandbox paper trading wallet (With fallback support) |

---

## 🐳 Docker Container Deployment

To launch WealthOS using Docker:

```bash
docker-compose up --build
```

---

## 🧪 System Integration Verification

WealthOS includes a built-in automated test suite:

```bash
python scratch/test_wealthos_inprocess.py
```

Runs 11 automated verification checks across APIs, database fallback handlers, Black-Scholes math engines, and market quote feeds.

---

## 📄 License
MIT License. Built for private wealth managers, retail investors, and quantitative fintech developers.
