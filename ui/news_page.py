import streamlit as st
from ui.components import page_header, section_title


def render_news_page():
    page_header("📰", "Market News", "Live financial news for your watchlist and Indian markets")

    try:
        from ai.rag_engine import fetch_news_for_symbols
    except ImportError:
        st.error("RAG engine not available. Check your installation.")
        return

    col1, col2 = st.columns([3, 1])
    with col1:
        query = st.text_input(
            "Search topics",
            placeholder="e.g. Nifty, Infosys, RBI rate, US Fed, oil prices...",
            label_visibility="collapsed"
        )
    with col2:
        fetch_btn = st.button("🔄  Fetch News", type="primary", use_container_width=True)

    # Build symbols list
    symbols = ["NIFTY", "SENSEX", "RBI", "India"]
    if st.session_state.get("portfolio_data") is not None:
        port_symbols = st.session_state.portfolio_data['Symbol']\
            .str.replace(r'\.(NS|BO)$', '', regex=True).tolist()
        symbols = list(set(symbols + port_symbols))

    if query:
        symbols = [query] + symbols

    if fetch_btn or query:
        with st.spinner("Fetching latest market news..."):
            articles = fetch_news_for_symbols(symbols[:8])

        if not articles:
            st.markdown("""
            <div class="w-panel" style="text-align:center;padding:2.5rem">
              <div style="font-size:2.5rem;margin-bottom:.75rem">📰</div>
              <p style="font-family:'Space Grotesk',sans-serif;font-weight:600;color:#F8FAFC;margin:0 0 .4rem">
                No Articles Found
              </p>
              <p style="color:#94A3B8;font-size:.85rem;margin:0">
                Add your NewsAPI key to .env to enable live news.
              </p>
            </div>
            """, unsafe_allow_html=True)
        else:
            section_title("📰", f"{len(articles)} Articles Found")
            for article in articles:
                title   = article.get('title', 'No title')
                desc    = article.get('description', '') or ''
                source  = article.get('source', {}).get('name', 'Unknown')
                pub     = article.get('publishedAt', '')[:10]
                article_url = article.get('url', '')

                link_btn = ''
                if article_url:
                    link_btn = f'<a href="{article_url}" target="_blank" style="font-size:.75rem;color:#3B82F6;text-decoration:none;font-weight:500">↗ Read full article</a>'

                st.markdown(f"""
                <div class="news-card">
                  <div class="news-card-source">{source}</div>
                  <div class="news-card-title">{title}</div>
                  <div class="news-card-desc">{desc[:160]}{'...' if len(desc) > 160 else ''}</div>
                  <div class="news-card-meta">{pub} &nbsp;&bull;&nbsp; {link_btn}</div>
                </div>
                """, unsafe_allow_html=True)
    else:
        st.markdown("""
        <div class="w-panel" style="text-align:center;padding:3rem">
          <div style="font-size:2.5rem;margin-bottom:.75rem">📰</div>
          <p style="font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:1.05rem;color:#F8FAFC;margin:0 0 .5rem">
            Search for Financial News
          </p>
          <p style="color:#94A3B8;font-size:.88rem;margin:0">
            Enter a topic above or click Fetch News to load headlines for your portfolio holdings.
          </p>
        </div>
        """, unsafe_allow_html=True)
