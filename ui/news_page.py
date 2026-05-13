"""WealthOS Market News \u2014 luxury financial intelligence feed."""

from __future__ import annotations
import streamlit as st
from frontend.design_system import render_topbar, render_hero, panel_start, panel_end
import datetime

try:
    from ai.rag_engine import search_news, get_top_articles
    RAG_AVAILABLE = True
    RAG_ERROR = ""
except Exception as e:
    RAG_AVAILABLE = False
    RAG_ERROR = str(e)
    search_news = get_top_articles = None


DEMO_ARTICLES = [
    {
        "title": "Nifty 50 closes above 23,800 for third consecutive session",
        "source": "Economic Times",
        "publishedAt": "2026-05-11T12:00:00Z",
        "description": "Indian equity benchmarks closed higher for the third straight session as FII inflows accelerated amid easing global rate expectations.",
        "url": "https://economictimes.indiatimes.com",
        "sentiment": "Bullish",
        "tags": ["Nifty", "FII", "Macro"],
    },
    {
        "title": "RBI holds repo rate at 6.25% \u2014 MPC unanimous",
        "source": "Mint",
        "publishedAt": "2026-05-10T10:30:00Z",
        "description": "The Reserve Bank of India kept the benchmark repo rate unchanged at 6.25% with a unanimous vote, citing stable inflation and resilient growth.",
        "url": "https://livemint.com",
        "sentiment": "Neutral",
        "tags": ["RBI", "MPC", "Rates"],
    },
    {
        "title": "Infosys raises FY27 revenue guidance to 8-10%",
        "source": "Bloomberg Quint",
        "publishedAt": "2026-05-09T07:15:00Z",
        "description": "Infosys raised its full-year revenue growth guidance citing deal wins in AI-led transformation and cloud migration contracts across Europe.",
        "url": "https://www.bqprime.com",
        "sentiment": "Bullish",
        "tags": ["Infosys", "IT", "Earnings"],
    },
    {
        "title": "Global ETFs see record inflows as Fed signals rate pivot",
        "source": "Reuters",
        "publishedAt": "2026-05-09T05:00:00Z",
        "description": "VTI, QQQ, and broad US equity ETFs attracted over $18 billion in a single week as markets priced in a September rate cut by the Federal Reserve.",
        "url": "https://reuters.com",
        "sentiment": "Bullish",
        "tags": ["ETF", "Fed", "Global"],
    },
    {
        "title": "Gold ETFs surge 3.2% on safe-haven demand",
        "source": "NDTV Profit",
        "publishedAt": "2026-05-08T14:45:00Z",
        "description": "GOLDBEES and SGB investors saw strong gains as gold prices rose to \u20b972,400 per 10g, driven by geopolitical tensions and USD weakness.",
        "url": "https://profit.ndtv.com",
        "sentiment": "Bullish",
        "tags": ["Gold", "ETF", "Safe Haven"],
    },
    {
        "title": "HDFC Bank Q4 net profit misses estimates by 4%",
        "source": "Moneycontrol",
        "publishedAt": "2026-05-07T16:20:00Z",
        "description": "HDFC Bank reported Q4 FY26 net profit of \u20b915,200 crore, slightly below analyst estimates of \u20b915,800 crore, as loan growth moderated.",
        "url": "https://moneycontrol.com",
        "sentiment": "Bearish",
        "tags": ["HDFC Bank", "Banking", "Earnings"],
    },
]

SENTIMENT_COLOUR = {
    "Bullish": ("#8EE7B8", "rgba(142,231,184,0.08)"),
    "Bearish": ("#FCA5A5", "rgba(252,165,165,0.08)"),
    "Neutral": ("#D6C7A1", "rgba(214,199,161,0.08)"),
}


def _fmt_date(iso: str) -> str:
    try:
        dt = datetime.datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return dt.strftime("%d %b %Y, %H:%M")
    except Exception:
        return iso


def render_news_page() -> None:
    render_topbar("Market Intelligence", "Live News Feed")
    render_hero(
        "Market <span style='color:#67E8F9;'>Intelligence</span>.",
        "Curated financial news linked to your holdings. Ask semantic questions "
        "across articles using the RAG search panel. Powered by NewsAPI + ChromaDB.",
    )

    if not RAG_AVAILABLE:
        st.warning("News intelligence unavailable — install PyTorch for Python 3.11")

    # ── Live ticker band ──────────────────────────────────────────────────
    st.markdown("""
    <div style='border:1px solid rgba(148,163,184,0.12);border-radius:14px;
                padding:0.65rem 1.1rem;background:rgba(255,255,255,0.015);
                margin-bottom:1.25rem;overflow-x:auto;white-space:nowrap;
                display:flex;align-items:center;gap:1.5rem;'>
        <span class='wo-pill' style='background:rgba(103,232,249,0.08);border-color:rgba(103,232,249,0.2);'>
            <span style='color:#67E8F9;'>NIFTY 50</span>
            <strong style='color:#8EE7B8;margin-left:0.4rem;'>23,852</strong>
            <span style='color:#8EE7B8;font-size:0.72rem;margin-left:0.2rem;'>+1.2%</span>
        </span>
        <span class='wo-pill' style='background:rgba(103,232,249,0.08);border-color:rgba(103,232,249,0.2);'>
            <span style='color:#67E8F9;'>SENSEX</span>
            <strong style='color:#8EE7B8;margin-left:0.4rem;'>78,421</strong>
            <span style='color:#8EE7B8;font-size:0.72rem;margin-left:0.2rem;'>+1.1%</span>
        </span>
        <span class='wo-pill' style='background:rgba(103,232,249,0.08);border-color:rgba(103,232,249,0.2);'>
            <span style='color:#67E8F9;'>NIFTY IT</span>
            <strong style='color:#8EE7B8;margin-left:0.4rem;'>34,110</strong>
            <span style='color:#8EE7B8;font-size:0.72rem;margin-left:0.2rem;'>+1.8%</span>
        </span>
        <span class='wo-pill' style='background:rgba(214,199,161,0.06);border-color:rgba(214,199,161,0.2);'>
            <span style='color:#D6C7A1;'>GOLD</span>
            <strong style='color:#D6C7A1;margin-left:0.4rem;'>\u20b972,400</strong>
            <span style='color:#8EE7B8;font-size:0.72rem;margin-left:0.2rem;'>+3.2%</span>
        </span>
        <span class='wo-pill'>
            <span style='color:#94A3B8;'>USD/INR</span>
            <strong style='color:#F3F4F6;margin-left:0.4rem;'>84.12</strong>
        </span>
        <span class='wo-pill' style='background:rgba(252,165,165,0.06);border-color:rgba(252,165,165,0.15);'>
            <span style='color:#94A3B8;'>US 10Y</span>
            <strong style='color:#FCA5A5;margin-left:0.4rem;'>4.38%</strong>
            <span style='color:#FCA5A5;font-size:0.72rem;margin-left:0.2rem;'>+0.06</span>
        </span>
    </div>
    """, unsafe_allow_html=True)

    # ── RAG search panel ──────────────────────────────────────────────────
    panel_start("RAG News Query", "Ask natural-language questions across today\u2019s articles", meta="Semantic Search")

    q = st.text_input(
        "Search news",
        placeholder="e.g. What is the outlook for Indian IT sector?",
        label_visibility="collapsed",
        key="news_search",
    )

    if q.strip():
        if search_news is not None:
            try:
                results = search_news(q)
                if results:
                    st.markdown(f"<div class='wo-mono' style='margin:0.5rem 0;color:#67E8F9;'>"
                                f"RAG found {len(results)} relevant passages</div>", unsafe_allow_html=True)
                    for r in results[:3]:
                        st.markdown(f"<div class='wo-terminal-box' style='margin-bottom:0.5rem;'>{r}</div>",
                                    unsafe_allow_html=True)
                else:
                    st.info("No relevant articles found. Enable NEWSAPI_KEY for live data.")
            except Exception as e:
                st.warning(f"RAG engine: {e}")
        else:
            st.markdown("""
            <div class='wo-terminal-box' style='margin-top:0.5rem;'>
                <div style='color:#D6C7A1;font-size:0.7rem;letter-spacing:0.14em;
                            text-transform:uppercase;margin-bottom:0.45rem;'>RAG Demo Response</div>
                <div style='color:#c7d2fe;line-height:1.8;font-size:0.88rem;'>
                    Indian IT sector outlook remains robust for FY27. Infosys raised guidance to 8-10%.<br>
                    TCS and Wipro benefit from rising cloud migration demand.<br>
                    Key risk: USD/INR volatility and potential US visa restrictions.<br>
                    <span style='color:#64748B;'>Enable NEWSAPI_KEY + ChromaDB for live semantic RAG.</span>
                </div>
            </div>
            """, unsafe_allow_html=True)

    panel_end()

    # ── Filter bar ────────────────────────────────────────────────────────
    st.markdown("<div style='margin:0.75rem 0'></div>", unsafe_allow_html=True)
    st.markdown("""
    <div class='wo-panel-header'>
        <div>
            <div class='wo-kicker'>Intelligence Feed</div>
            <div class='wo-panel-title'>Latest Market News</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    filter_col, _ = st.columns([2, 3])
    with filter_col:
        sentiment_filter = st.selectbox(
            "Filter by sentiment",
            ["All", "Bullish", "Bearish", "Neutral"],
            label_visibility="collapsed",
            key="news_filter",
        )

    articles = DEMO_ARTICLES
    if get_top_articles is not None:
        try:
            live = get_top_articles()
            if live:
                articles = live
        except Exception:
            pass

    if sentiment_filter != "All":
        articles = [a for a in articles if a.get("sentiment") == sentiment_filter]

    # ── News grid ─────────────────────────────────────────────────────────
    for i in range(0, len(articles), 3):
        row_articles = articles[i:i+3]
        cols = st.columns(len(row_articles), gap="small")
        for col, article in zip(cols, row_articles):
            with col:
                s_colour, s_bg = SENTIMENT_COLOUR.get(
                    article.get("sentiment", "Neutral"), ("#94A3B8", "rgba(148,163,184,0.06)")
                )
                tags_html = " ".join(
                    f"<span style='border:1px solid rgba(148,163,184,0.16);border-radius:999px;"
                    f"padding:0.18rem 0.52rem;font-size:0.7rem;color:#64748B;'>{t}</span>"
                    for t in article.get("tags", [])
                )
                article_url = article.get("url", "")
                link_html = ""
                if article_url:
                    link_html = (
                        f'<a href="{article_url}" target="_blank" rel="noopener noreferrer" '
                        f'style="color:#7DD3FC;font-size:0.8rem;">Read Full Article &rarr;</a>'
                    )
                title_text = article.get("title", "")
                desc_text = article.get("description", "")
                source_text = article.get("source", "")
                sent_text = article.get("sentiment", "")
                pub_text = _fmt_date(article.get("publishedAt", ""))
                st.markdown(f"""
                <div class='wo-news-card'>
                    <div style='display:flex;justify-content:space-between;
                                align-items:center;margin-bottom:0.35rem;'>
                        <span class='wo-mono' style='color:#64748B;font-size:0.7rem;'>{source_text}</span>
                        <span style='display:inline-flex;align-items:center;gap:0.35rem;
                                     padding:0.22rem 0.55rem;border-radius:999px;font-size:0.7rem;
                                     background:{s_bg};border:1px solid {s_colour}33;color:{s_colour};'>
                            {sent_text}
                        </span>
                    </div>
                    <h4 style='font-family:Space Grotesk,sans-serif;font-size:0.98rem;
                               font-weight:600;color:#F3F4F6;margin:0.3rem 0 0.55rem;
                               line-height:1.35;'>
                        {title_text}
                    </h4>
                    <p style='color:#64748B;font-size:0.82rem;line-height:1.65;
                              margin-bottom:0.7rem;'>
                        {desc_text}
                    </p>
                    <div style='display:flex;flex-wrap:wrap;gap:0.35rem;
                                margin-bottom:0.6rem;'>{tags_html}</div>
                    <div style='display:flex;justify-content:space-between;align-items:center;'>
                        <span class='wo-mono' style='font-size:0.7rem;color:#64748B;'>{pub_text}</span>
                        {link_html}
                    </div>
                </div>
                """, unsafe_allow_html=True)
