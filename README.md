# WealthOS

WealthOS is a premium personal finance and portfolio intelligence workspace for Indian and global investors. The platform lets you upload holdings and transaction exports, refresh live market prices, visualize allocation and drawdowns, and consult an AI-powered financial advisor inside one cinematic dashboard experience.

## Experience Upgrade

This repository now includes a cinematic premium design system for Streamlit with:
- Dark luxury fintech surfaces and layered ambient backgrounds
- Editorial typography using Space Grotesk, Inter, and IBM Plex Mono
- Premium dock-style sidebar, floating topbar, and structured analytics panels
- Refined cards, upload workspaces, advisor terminal blocks, and luxury news feed layouts
- Consistent radius, spacing, borders, and chart framing for a cohesive operating-system feel

## Core Features

- Upload holdings and transactions from broker exports
- Fetch live prices for Indian equities and international ETFs
- Monitor allocation, gains, and drawdowns
- Compare current allocation with target mix
- Read market news linked to your watchlist
- Ask the AI CFO advisor for portfolio guidance

## Project Structure

- `app.py` — main Streamlit entrypoint
- `frontend/design_system.py` — premium WealthOS visual system
- `ui/` — page modules for dashboard, uploads, advisor, and news
- `core/` — data and portfolio engines
- `ai/` — advisor and RAG support
- `charts/` — reusable chart builders

## Local Setup

```bash
git clone https://github.com/lucifers-0666/WealthOS.git
cd WealthOS
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
streamlit run app.py
```

## Environment Variables

Configure these in `.env` as needed:
- `GOOGLE_API_KEY`
- `NEWSAPI_KEY`
- `ALPHA_VANTAGE_KEY`
- `HUGGINGFACE_TOKEN`

## Design Direction

The UI is intentionally designed as a cinematic wealth intelligence operating system inspired by premium product references such as Linear, Stripe, Arc, Apple motion principles, and luxury terminal aesthetics.
