import streamlit as st
import os
import requests
from datetime import datetime, timedelta


def render_news_page():
    st.markdown("""
    <style>
    .news-card {
        background: #0B1728;
        border: 1px solid rgba(148,163,184,0.14);
        border-radius: 12px;
        padding: 1.2rem 1.4rem;
        margin-bottom: 1rem;
        transition: border-color 0.2s;
    }
    .news-card:hover { border-color: rgba(125,211,252,0.3); }
    .news-source {
        font-size: 0.72rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #7DD3FC;
        font-weight: 600;
        margin-bottom: 0.3rem;
    }
    .news-title {
        font-size: 0.98rem;
        font-weight: 600;
        color: #F3F4F6;
        line-height: 1.45;
        margin-bottom: 0.4rem;
    }
    .news-desc {
        font-size: 0.85rem;
        color: #94A3B8;
        line-height: 1.55;
        margin-bottom: 0.6rem;
    }
    .news-meta {
        font-size: 0.75rem;
        color: #64748B;
    }
    .news-link a {
        color: #7DD3FC;
        font-size: 0.8rem;
        text-decoration: none;
    }
    </style>
    """, unsafe_allow_html=True)

    st.markdown("## Market Intelligence")
    st.markdown(
        "<p style='color:#94A3B8;font-size:0.9rem;'>News contextualised for your portfolio positions</p>",
        unsafe_allow_html=True
    )

    # Category tabs
    tabs = st.tabs(["All", "Markets", "Economy", "Stocks", "Mutual Funds", "Global"])
    categories = {
        "All": "indian stock market OR NSE OR BSE OR Sensex OR Nifty",
        "Markets": "Nifty50 OR Sensex OR NSE OR BSE market",
        "Economy": "India economy OR RBI OR inflation OR GDP",
        "Stocks": "Indian stocks OR equity OR IPO OR earnings",
        "Mutual Funds": "mutual funds India OR SIP OR NAV OR AMC",
        "Global": "global markets OR US Fed OR dollar OR crude oil",
    }

    newsapi_key = os.environ.get("NEWSAPI_KEY", "").strip()

    for i, (tab_name, query) in enumerate(categories.items()):
        with tabs[i]:
            if not newsapi_key:
                st.info(
                    "Add **NEWSAPI_KEY** to your `.env` file to load live news.  "
                    "Get a free key at [newsapi.org](https://newsapi.org)",
                    icon="ℹ️"
                )
                _render_placeholder_news()
                break  # same message for all tabs

            articles = _fetch_news(newsapi_key, query)
            if not articles:
                st.warning("No articles found for this category.")
                continue

            for article in articles:
                _render_article_card(article)


def _fetch_news(api_key: str, query: str, page_size: int = 10) -> list:
    """Fetch articles from NewsAPI. Returns list of article dicts."""
    try:
        from_date = (datetime.utcnow() - timedelta(days=2)).strftime("%Y-%m-%d")
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": query,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": page_size,
            "from": from_date,
            "apiKey": api_key,
        }
        resp = requests.get(url, params=params, timeout=8)
        if resp.status_code == 401:
            st.error("NewsAPI key is invalid. Check your NEWSAPI_KEY in .env")
            return []
        if resp.status_code == 426:
            st.warning("NewsAPI free plan limit reached. Try again tomorrow.")
            return []
        data = resp.json()
        return data.get("articles", [])[:page_size]
    except requests.exceptions.ConnectionError:
        st.error("Cannot reach NewsAPI — check internet connection.")
        return []
    except Exception as e:
        st.error(f"News fetch error: {e}")
        return []


def _render_article_card(article: dict):
    title = article.get("title") or "Untitled"
    desc = article.get("description") or ""
    source = (article.get("source") or {}).get("name", "Unknown")
    published = article.get("publishedAt", "")
    article_url = article.get("url", "")

    # Format date
    try:
        dt = datetime.strptime(published[:10], "%Y-%m-%d")
        date_str = dt.strftime("%d %b %Y")
    except Exception:
        date_str = published[:10] if published else ""

    # Build link HTML — NO backslash escapes inside f-string
    if article_url:
        link_html = (
            '<div class="news-link">'
            f'<a href="{article_url}" target="_blank" rel="noopener noreferrer">'
            'Read full article &rarr;</a></div>'
        )
    else:
        link_html = ""

    card_html = (
        '<div class="news-card">'
        f'<div class="news-source">{source}</div>'
        f'<div class="news-title">{title}</div>'
        f'<div class="news-desc">{desc}</div>'
        f'<div class="news-meta">{date_str}</div>'
        f'{link_html}'
        '</div>'
    )
    st.markdown(card_html, unsafe_allow_html=True)


def _render_placeholder_news():
    """Show static sample cards when no API key is configured."""
    samples = [
        {
            "title": "Nifty 50 closes at record high amid strong FII inflows",
            "desc": "Indian benchmark indices surged as foreign institutional investors poured in over ₹12,000 crore in a single session, driven by positive global cues.",
            "source": "Economic Times",
            "date": "Sample Article",
            "url": "",
        },
        {
            "title": "RBI holds repo rate steady at 6.5% in June policy meeting",
            "desc": "The Monetary Policy Committee voted unanimously to keep the repo rate unchanged, citing sticky core inflation and global uncertainty.",
            "source": "Mint",
            "date": "Sample Article",
            "url": "",
        },
        {
            "title": "IT sector outlook: TCS, Infosys set for double-digit growth in FY26",
            "desc": "Analysts upgrade Indian IT majors after strong Q4 results and improving deal pipelines from North American clients.",
            "source": "Business Standard",
            "date": "Sample Article",
            "url": "",
        },
        {
            "title": "Gold prices near all-time high — should you rebalance your portfolio?",
            "desc": "Domestic gold prices touched ₹78,400 per 10g as global uncertainty drives safe-haven demand. Advisors suggest capping gold at 10-15% of portfolio.",
            "source": "Moneycontrol",
            "date": "Sample Article",
            "url": "",
        },
    ]
    for s in samples:
        card_html = (
            '<div class="news-card" style="opacity:0.7;">'
            f'<div class="news-source">{s["source"]}</div>'
            f'<div class="news-title">{s["title"]}</div>'
            f'<div class="news-desc">{s["desc"]}</div>'
            f'<div class="news-meta">{s["date"]}</div>'
            '</div>'
        )
        st.markdown(card_html, unsafe_allow_html=True)
    st.caption("These are sample articles. Add NEWSAPI_KEY to .env for live news.")
