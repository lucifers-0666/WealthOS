# WealthOS — Personal Finance Dashboard

> Your AI-powered CFO for managing Indian equities, international ETFs, and personal wealth.

![WealthOS Banner](https://img.shields.io/badge/WealthOS-AI%20Finance%20Dashboard-blueviolet?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.11+-blue?style=flat-square)
![Streamlit](https://img.shields.io/badge/Streamlit-1.35-red?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## What is WealthOS?

WealthOS is a full-featured personal finance dashboard that:
- Visualizes your **portfolio allocation**, **gains/losses**, and **drawdowns**
- Pulls **live prices** for NSE/BSE Indian equities and international ETFs
- Uses **AI (Gemini / HuggingFace)** as your personal CFO advisor
- Provides **RAG-powered news insights** from financial news sources
- Tracks **progress toward your target allocation mix**
- Supports **CSV/XLSX upload** of holdings and transaction exports

---

## 🗂️ Project Structure

```
WealthOS/
├── app.py                    # Main Streamlit app entry point
├── requirements.txt          # All Python dependencies
├── .env.example              # Environment variables template
├── config.py                 # App configuration & constants
│
├── core/
│   ├── __init__.py
│   ├── data_loader.py        # CSV/XLSX parser for holdings & transactions
│   ├── price_fetcher.py      # Live price fetcher (NSE, BSE, Yahoo Finance)
│   ├── portfolio_engine.py   # Allocation, gains, drawdown calculations
│   └── target_tracker.py    # Target mix vs actual allocation tracker
│
├── ai/
│   ├── __init__.py
│   ├── cfo_advisor.py        # AI CFO advisor using Gemini / HuggingFace
│   ├── rag_engine.py         # RAG pipeline for real-time financial news
│   └── prompts.py            # System prompts for CFO persona
│
├── ui/
│   ├── __init__.py
│   ├── dashboard.py          # Main dashboard page
│   ├── upload_page.py        # File upload & parsing UI
│   ├── advisor_page.py       # AI CFO chat interface
│   ├── news_page.py          # RAG news & insights page
│   └── components.py         # Reusable UI components
│
├── charts/
│   ├── __init__.py
│   ├── allocation_chart.py   # Pie/donut charts for allocation
│   ├── performance_chart.py  # Line charts for portfolio value over time
│   ├── gains_chart.py        # Bar charts for gains/losses by holding
│   └── drawdown_chart.py     # Drawdown visualization
│
├── data/
│   ├── sample_holdings.csv   # Sample holdings file for demo
│   └── sample_transactions.csv # Sample transactions for demo
│
└── tests/
    ├── test_data_loader.py
    ├── test_price_fetcher.py
    └── test_portfolio_engine.py
```

---

## Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/lucifers-0666/WealthOS.git
cd WealthOS
```

### 2. Create virtual environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 5. Run the app
```bash
streamlit run app.py
```

---

## 🔑 Required API Keys

| Key | Purpose | Free Tier? |
|-----|---------|------------|
| `GOOGLE_API_KEY` | Gemini (AI CFO) | Yes |
| `NEWSAPI_KEY` | Financial news for RAG | Yes |
| `ALPHA_VANTAGE_KEY` | Backup price data | Yes |

---

## 📂 Supported File Formats

### Holdings CSV format:
```
Symbol,Name,Quantity,Avg_Buy_Price,Asset_Type,Exchange
RELIANCE.NS,Reliance Industries,10,2400.00,Equity,NSE
INFY.NS,Infosys Ltd,25,1500.00,Equity,NSE
VTI,Vanguard Total Market ETF,5,220.00,ETF,NYSE
```

### Transactions CSV format:
```
Date,Symbol,Type,Quantity,Price,Fees
2024-01-15,RELIANCE.NS,BUY,10,2400.00,20.00
2024-03-20,INFY.NS,BUY,25,1500.00,15.00
```

---

## AI CFO Capabilities

- **Portfolio Analysis**: Deep analysis of your current allocation vs targets
- **Risk Assessment**: Identify concentration risk, sector exposure
- **Rebalancing Suggestions**: Step-by-step rebalancing recommendations
- **Tax Optimization**: LTCG/STCG guidance for Indian equities
- **Market Context**: RAG-powered news to contextualize your holdings
- **Goal Planning**: SIP planning, retirement corpus calculations

---

## Dashboard Sections

1. **Overview** — Net worth, day change, total returns
2. **Allocation** — Pie charts vs target mix with deviation alerts
3. **Performance** — Portfolio value over time with benchmark comparison
4. **Holdings** — Individual stock/ETF P&L table with live prices
5. **Drawdowns** — Max drawdown analysis per holding and overall
6. **AI CFO Chat** — Ask anything about your portfolio
7. **News & Insights** — RAG-powered relevant news for your holdings

---

## 📜 License
MIT License — feel free to fork and customize.
