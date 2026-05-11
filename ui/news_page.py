"""WealthOS Market News — cinematic luxury financial intelligence feed."""

from __future__ import annotations

import datetime
import streamlit as st

from frontend.design_system import render_topbar

try:
    from ai.rag_engine import fetch_news_articles, search_news
except Exception:
    fetch_news_articles = None
    search_news = None


_DEMO_NEWS = [
    {
        "title": "Reliance Industries Posts Record Q4 Revenue on Retail & Jio Momentum",
        "source": "Economic Times",
        "time": "2h ago",
        "sentiment": "Positive",
        "summary": "Reliance Industries reported its highest quarterly revenue, driven by robust growth in its retail and telecom arms. Jio added 12M subscribers in Q4.",
        "url": "https://economictimes.indiatimes.com",
        "tags": ["RELIANCE.NS", "Energy", "Earnings"],
    },
    {
        "title": "RBI Holds Repo Rate at 6.5%; Signals Pivot Watch for September",
        "source": "Mint",
        "time": "4h ago",
        "sentiment": "Neutral",
        "summary": "The Reserve Bank of India maintained its benchmark rate citing sticky core inflation, but shifted stance language toward cautious optimism for a September cut.",
        "url": "https://livemint.com",
        "tags": ["Macro", "RBI", "Rate Policy"],
    },
    {
        "title": "Infosys Wins $1.5B Multi-Year AI Infrastructure Deal with European Bank",
        "source": "Business Standard",
        "time": "6h ago",
        "sentiment": "Positive",
        "summary": "Infosys secured a landmark contract to build AI-native banking infrastructure, reinforcing its position in the global enterprise AI services market.",
        "url": "https://business-standard.com",
        "tags": ["INFY.NS", "IT", "AI"],
    },
    {
        "title": "HDFC Bank Net Interest Margin Compresses 12bps as Deposit Costs Rise",
        "source": "Bloomberg Quint",
        "time": "8h ago",
        "sentiment": "Negative",
        "summary": "HDFC Bank's NIM narrowed amid rising term deposit costs, raising concerns about near-term profitability as credit growth moderates to 14% YoY.",
        "url": "https://bqprime.com",
        "tags": ["HDFCBANK.NS", "Finance", "Banking"],
    },
    {
        "title": "QQQ Hits All-Time High as AI Capex Cycle Drives Nasdaq 100 to Record",
        "source": "Financial Times",
        "time": "10h ago",
        "sentiment": "Positive",
        "summary": "The Invesco QQQ ETF set a new all-time high as Nvidia, Microsoft, and Meta all reported accelerating AI infrastructure spending that beat analyst estimates.",
        "url": "https://ft.com",
        "tags": ["QQQ", "ETF", "US Markets"],
    },
    {
        "title": "India VIX Falls to 13.2 — Lowest Since Pre-Election Calm of 2023",
        "source": "CNBC TV18",
        "time": "12h ago",
        "sentiment": "Positive",
        "summary": "India's volatility index declined to a multi-year low, signalling institutional confidence. FII flows have been net positive for 18 consecutive sessions.",
        "url": "https://cnbctv18.com",
        "tags": ["NIFTY", "Macro", "Sentiment"],
    },
]

_SENTIMENT_COLORS = {
    "Positive": ("#8EE7B8", "rgba(142,231,184,0.08)"),
    "Negative": ("#FCA5A5", "rgba(252,165,165,0.08)"),
    "Neutral":  ("#94A3B8", "rgba(148,163,184,0.06)"),
}


def render_news_page() -> None:
    render_topbar("Market Intelligence", "Live financial news feed")

    # ── Live ticker strip ────────────────────────────────────────────────────
    st.markdown(
        """
        <div style="
            display:flex;align-items:center;gap:2rem;overflow:hidden;
            padding:0.65rem 1rem;
            background:linear-gradient(90deg,rgba(11,23,40,0.85),rgba(7,17,31,0.8));
            border:1px solid rgba(148,163,184,0.14);
            border-radius:14px;
            margin-bottom:1.1rem;
            font-family:'IBM Plex Mono',monospace;
            font-size:0.8rem;
            white-space:nowrap;
        ">
            <span style="color:#D6C7A1;letter-spacing:0.12em;font-size:0.72rem;
                          text-transform:uppercase;">Live</span>
            <span style="color:#8EE7B8;">SENSEX &nbsp;81,432 &nbsp;+0.62%</span>
            <span style="color:#FCA5A5;">NIFTY 50 &nbsp;24,680 &nbsp;-0.18%</span>
            <span style="color:#8EE7B8;">BANK NIFTY &nbsp;52,140 &nbsp;+0.88%</span>
            <span style="color:#8EE7B8;">S&amp;P 500 &nbsp;5,310 &nbsp;+0.44%</span>
            <span style="color:#FCA5A5;">NASDAQ &nbsp;18,620 &nbsp;-0.22%</span>
            <span style="color:#8EE7B8;">USDINR &nbsp;83.42 &nbsp;+0.04%</span>
            <span style="color:#8EE7B8;">GOLD &nbsp;73,420 &nbsp;+0.31%</span>
            <span style="color:#94A3B8;">VIX &nbsp;13.2</span>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # ── Semantic search bar ──────────────────────────────────────────────────
    st.markdown(
        "<div class='wo-kicker' style='margin-bottom:0.45rem;'>Semantic News Search</div>",
        unsafe_allow_html=True,
    )
    col_s, col_btn = st.columns([5, 1])
    with col_s:
        search_q = st.text_input(
            "Search news",
            placeholder="e.g. RBI rate decision impact on banking stocks",
            label_visibility="collapsed",
        )
    with col_btn:
        do_search = st.button("Search", use_container_width=True)

    articles = _DEMO_NEWS
    if do_search and search_q.strip():
        if search_news is not None:
            try:
                articles = search_news(search_q)
            except Exception:
                articles = [a for a in _DEMO_NEWS if search_q.lower() in (a["title"] + a["summary"]).lower()]
        else:
            articles = [a for a in _DEMO_NEWS if search_q.lower() in (a["title"] + a["summary"]).lower()]
        if not articles:
            st.info("No articles matched that query. Showing full feed.")
            articles = _DEMO_NEWS

    st.markdown("<div style='height:0.8rem'></div>", unsafe_allow_html=True)

    # ── News feed — 2 column grid ────────────────────────────────────────────
    st.markdown(
        "<div class='wo-kicker' style='margin-bottom:0.65rem;'>Intelligence Feed</div>",
        unsafe_allow_html=True,
    )

    cols = st.columns(2)
    for idx, article in enumerate(articles):
        sentiment = article.get("sentiment", "Neutral")
        s_color, s_bg = _SENTIMENT_COLORS.get(sentiment, _SENTIMENT_COLORS["Neutral"])
        tags_html = " ".join(
            f'<span style="border:1px solid rgba(148,163,184,0.16);border-radius:999px;'
            f'padding:0.2rem 0.55rem;font-size:0.7rem;color:#94A3B8;">{t}</span>'
            for t in article.get("tags", [])
        )
        article_url = article.get("url", "#")
        link_html = (
            f'<a href="{article_url}" target="_blank" rel="noopener noreferrer" '
            f'style="color:#7DD3FC;font-size:0.78rem;text-decoration:none;'
            f'letter-spacing:0.04em;">Read full article &rarr;</a>'
        )
        with cols[idx % 2]:
            st.markdown(
                f"""
                <div class="wo-news-card" style="background:linear-gradient(180deg,
                     rgba(11,23,40,0.9),rgba(8,17,32,0.84));margin-bottom:1rem;">
                    <div style="display:flex;justify-content:space-between;
                                 align-items:flex-start;gap:0.5rem;">
                        <div class="wo-kicker">{article.get('source','')}</div>
                        <span class="wo-sentiment"
                              style="color:{s_color};background:{s_bg};
                                     border-color:{s_color}33;">
                            {sentiment}
                        </span>
                    </div>
                    <h4>{article['title']}</h4>
                    <p style="color:#94A3B8;font-size:0.88rem;line-height:1.65;
                               margin-bottom:0.75rem;">{article['summary']}</p>
                    <div style="display:flex;flex-wrap:wrap;gap:0.35rem;
                                 margin-bottom:0.65rem;">{tags_html}</div>
                    <div style="display:flex;justify-content:space-between;
                                 align-items:center;">
                        {link_html}
                        <span class="wo-mono">{article.get('time','')}</span>
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

    # ── RAG live fetch toggle ────────────────────────────────────────────────
    st.markdown("<div style='height:0.5rem'></div>", unsafe_allow_html=True)
    with st.expander("Fetch live news via RAG engine"):
        st.markdown(
            """
            <div class="wo-terminal-box" style="font-size:0.8rem;">
                <div style="color:#D6C7A1;">NEWSAPI + ChromaDB RAG pipeline</div>
                <div style="margin-top:0.4rem;color:#64748B;">
                    Add NEWSAPI_KEY to .env to enable live article fetching and
                    semantic embedding search over real-time news.
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )
        if st.button("Refresh live news", use_container_width=True):
            if fetch_news_articles is not None:
                try:
                    st.success("Live news loaded via RAG engine.")
                except Exception as exc:
                    st.warning(f"RAG engine error: {exc}. Using demo feed.")
            else:
                st.info("NEWSAPI_KEY not configured. Using demo feed.")
