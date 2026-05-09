import streamlit as st
from ai.rag_engine import fetch_news_for_symbols, build_rag_vectorstore, query_rag
from ui.components import section_header


def render_news_page():
    section_header("📰 News & Market Insights", "RAG-powered news relevant to your holdings")

    if st.session_state.portfolio_data is None:
        st.info("Load your portfolio first to see relevant news.")
        return

    symbols = st.session_state.portfolio_data['Symbol'].tolist()

    col1, col2 = st.columns([3, 1])
    with col1:
        news_query = st.text_input(
            "Ask a question about market news:",
            placeholder="e.g. What's the outlook for Indian IT sector?"
        )
    with col2:
        refresh = st.button("🔄 Refresh News", use_container_width=True)

    if refresh or 'news_articles' not in st.session_state:
        with st.spinner("Fetching latest financial news..."):
            st.session_state.news_articles = fetch_news_for_symbols(tuple(symbols))
            st.session_state.rag_vectorstore = build_rag_vectorstore(st.session_state.news_articles)

    articles = st.session_state.get('news_articles', [])

    if news_query and st.session_state.get('rag_vectorstore'):
        with st.spinner("Searching news..."):
            context = query_rag(st.session_state.rag_vectorstore, news_query)
        if context:
            st.markdown("### 🔍 Relevant News Excerpts")
            st.markdown(context)
        else:
            st.info("No relevant articles found for your query.")

    # Display articles
    if articles:
        st.markdown(f"### 📋 Latest Articles ({len(articles)} found)")
        for article in articles[:15]:
            with st.expander(f"📌 {article.get('title', 'No Title')}"):
                col_a, col_b = st.columns([3, 1])
                with col_a:
                    st.write(article.get('description', 'No description'))
                with col_b:
                    st.caption(f"📰 {article.get('source', {}).get('name', 'Unknown')}")
                    st.caption(f"📅 {article.get('publishedAt', '')[:10]}")
                if article.get('url'):
                    st.markdown(f"[Read Full Article]({article['url']})")
    else:
        st.warning("No news articles found. Check your NewsAPI key in .env file.")
        st.info("Get a free NewsAPI key at [newsapi.org](https://newsapi.org)")
