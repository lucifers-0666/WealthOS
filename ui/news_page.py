import streamlit as st
from ai.rag_engine import fetch_news_for_symbols, build_rag_vectorstore, query_rag
from ui.components import page_header, section_title


def render_news_page():
    page_header(
        "fa-solid fa-newspaper",
        "News & Market Insights",
        "RAG-powered financial news relevant to your holdings"
    )

    if st.session_state.portfolio_data is None:
        st.info("Load your portfolio first to see relevant news.")
        return

    symbols = st.session_state.portfolio_data['Symbol'].tolist()

    col1, col2 = st.columns([4, 1])
    with col1:
        news_query = st.text_input(
            "",
            placeholder="Ask about market news — e.g. What is the outlook for Indian IT sector?",
            label_visibility="collapsed"
        )
    with col2:
        refresh = st.button("Refresh News", use_container_width=True, type="primary")

    if refresh or 'news_articles' not in st.session_state:
        with st.spinner("Fetching latest financial news..."):
            st.session_state.news_articles = fetch_news_for_symbols(tuple(symbols))
            st.session_state.rag_vectorstore = build_rag_vectorstore(st.session_state.news_articles)

    if news_query and st.session_state.get('rag_vectorstore'):
        with st.spinner("Searching through news..."):
            context = query_rag(st.session_state.rag_vectorstore, news_query)
        if context:
            section_title("fa-solid fa-magnifying-glass", "Relevant Excerpts")
            st.markdown(f"""
            <div class="wealth-card">
                <p style="color:#8A9BB5; font-size:0.875rem; line-height:1.7;">{context}</p>
            </div>
            """, unsafe_allow_html=True)

    articles = st.session_state.get('news_articles', [])
    if articles:
        section_title("fa-solid fa-list", f"Latest Articles ({len(articles)} found)")
        for article in articles[:15]:
            with st.expander(article.get('title', 'No Title')):
                col_a, col_b = st.columns([3, 1])
                with col_a:
                    st.write(article.get('description', 'No description available.'))
                with col_b:
                    src = article.get('source', {}).get('name', 'Unknown')
                    pub = article.get('publishedAt', '')[:10]
                    st.markdown(f"""
                    <div style="text-align:right">
                        <div class="badge-gold"><i class="fa-solid fa-newspaper"></i> {src}</div><br><br>
                        <span style="color:#4A5A72; font-size:0.75rem;"><i class="fa-solid fa-calendar"></i> {pub}</span>
                    </div>
                    """, unsafe_allow_html=True)
                if article.get('url'):
                    st.markdown(f'<a href="{article[\"url\"]}" target="_blank" style="color:#C9A84C; font-size:0.8rem;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Read Full Article</a>', unsafe_allow_html=True)
    else:
        st.warning("No articles found. Check your NewsAPI key in the .env file.")
