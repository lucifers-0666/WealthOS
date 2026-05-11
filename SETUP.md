# WealthOS — Setup Guide

## Prerequisites
- Python 3.11+
- pip
- Git

---

## Step-by-Step Setup

### 1. Clone the repo
```powershell
git clone https://github.com/lucifers-0666/WealthOS.git
cd WealthOS
```

### 2. Create virtual environment
```powershell
python -m venv venv
.\venv\Scripts\activate
```

### 3. Install dependencies
```powershell
pip install -r requirements.txt
```

### 4. Configure environment variables
```powershell
copy .env.example .env
# Now edit .env in VS Code or Notepad and add your API keys
```

### 5. Run the app
```powershell
streamlit run app.py
```
Open http://localhost:8501 in your browser.

---

## API Keys (All Free)

| Key | Where to get | Used for |
|-----|-------------|----------|
| `GOOGLE_API_KEY` | https://aistudio.google.com | AI Advisor (Gemini 1.5 Flash) |
| `NEWSAPI_KEY` | https://newsapi.org | Live market news |
| `ALPHA_VANTAGE_KEY` | https://alphavantage.co | Optional backup prices |

---

## Quick Test (No API Keys Needed)

1. Run the app: `streamlit run app.py`
2. Click **Upload** in the sidebar
3. Click **Load Demo Portfolio**
4. Go to **Dashboard** — you will see live prices loaded from yfinance (no key needed)

---

## Troubleshooting

### "Failed to fetch" / blank dashboard
- Make sure you are on the **Upload** page first and have loaded a portfolio
- Or click **Load Demo Portfolio** on the Upload page

### "Add NEWSAPI_KEY to .env"
- Open `.env`, add: `NEWSAPI_KEY=your_key_here`
- Restart: `streamlit run app.py`

### "Add GOOGLE_API_KEY to .env"
- Open `.env`, add: `GOOGLE_API_KEY=your_key_here`
- Restart: `streamlit run app.py`

### Module not found errors
```powershell
pip install -r requirements.txt
```

### yfinance rate limit / prices show 0
- Wait 5 minutes and refresh — yfinance has rate limits
- NSE stocks: symbol must be like `RELIANCE` (auto-appends `.NS`)
- US ETFs: use bare symbol like `VTI`, `QQQ`

### Port already in use
```powershell
streamlit run app.py --server.port 8502
```
