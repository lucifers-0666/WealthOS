import streamlit as st
from ai.cfo_advisor       import chat_with_cfo, run_full_portfolio_analysis, format_portfolio_for_prompt
from ai.rag_engine        import fetch_news_for_symbols, build_rag_vectorstore, query_rag
from core.portfolio_engine import compute_portfolio_metrics, get_summary_stats
from ui.components        import page_header, section_title


QUICK_QUESTIONS = [
    "Score my portfolio health out of 10",
    "Which holdings should I rebalance first?",
    "What is my LTCG/STCG tax exposure?",
    "Suggest a SIP strategy to reach ₹1 Crore in 10 years",
    "Identify concentration risks in my portfolio",
    "Which sector is most overweight?",
]


def render_advisor_page():
    page_header("🤖", "AI CFO Advisor",
                "Gemini-powered portfolio analysis, tax insights & personalised rebalancing advice")

    # ---- Build portfolio context ----
    ctx = ""
    df = st.session_state.get("portfolio_data")
    if df is not None:
        prices = st.session_state.get("live_prices", {})
        if prices:
            from core.price_fetcher import fetch_live_prices
            from core.portfolio_engine import compute_portfolio_metrics
            df = compute_portfolio_metrics(df, prices)
        stats = get_summary_stats(df)
        ctx = format_portfolio_for_prompt(df, stats)
        st.session_state.cfo_context = ctx

    tab1, tab2, tab3 = st.tabs(["  💬  Chat with CFO  ", "  📊  Full Analysis  ", "  📰  RAG News Context  "])

    # ---- Tab 1: Chat ----
    with tab1:
        section_title("💬", "Ask Your AI CFO")

        if not st.session_state.get("chat_history"):
            st.markdown("""
            <div class="w-panel" style="text-align:center;padding:1.75rem">
              <div style="font-size:2rem;margin-bottom:.75rem">🤖</div>
              <p style="font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:1rem;margin:0 0 .3rem;color:#F8FAFC">
                Your Personal CFO is Ready
              </p>
              <p style="color:#94A3B8;font-size:.85rem;margin:0">
                Ask about rebalancing, tax, SIP goals, risk — anything about your portfolio.
              </p>
            </div>
            """, unsafe_allow_html=True)

        # Quick questions
        section_title("⚡", "Quick Questions")
        cols = st.columns(3)
        for i, q in enumerate(QUICK_QUESTIONS):
            if cols[i % 3].button(q, key=f"qq_{i}", use_container_width=True):
                st.session_state.chat_history.append({"role": "user", "content": q})
                with st.spinner("Thinking..."):
                    reply = chat_with_cfo(q, ctx, st.session_state.chat_history)
                st.session_state.chat_history.append({"role": "assistant", "content": reply})
                st.rerun()

        # Chat history
        for msg in st.session_state.chat_history:
            with st.chat_message(msg["role"]):
                st.markdown(msg["content"])

        # Input
        if prompt := st.chat_input("Ask your CFO anything about your portfolio..."):
            st.session_state.chat_history.append({"role": "user", "content": prompt})
            with st.chat_message("user"):
                st.markdown(prompt)
            with st.chat_message("assistant"):
                with st.spinner("Analysing..."):
                    reply = chat_with_cfo(prompt, ctx, st.session_state.chat_history)
                st.markdown(reply)
            st.session_state.chat_history.append({"role": "assistant", "content": reply})

        if st.session_state.chat_history:
            if st.button("🗑️  Clear Chat", use_container_width=False):
                st.session_state.chat_history = []
                st.rerun()

    # ---- Tab 2: Full Analysis ----
    with tab2:
        section_title("📊", "Auto Portfolio Analysis")
        st.markdown("<p style='color:#94A3B8;font-size:.88rem'>Gemini will score your portfolio, flag risks, suggest rebalancing & tax planning in one report.</p>",
                    unsafe_allow_html=True)

        if df is None:
            st.warning("Load a portfolio first from the Upload Data page.")
        else:
            if st.button("🤖  Run Full Analysis", type="primary", use_container_width=False):
                with st.spinner("Gemini is analysing your portfolio..."):
                    report = run_full_portfolio_analysis(df, get_summary_stats(df))
                st.markdown(f'<div class="w-panel">{report}</div>', unsafe_allow_html=True)

    # ---- Tab 3: RAG News ----
    with tab3:
        section_title("📰", "News-Aware Portfolio Insights")
        st.markdown("<p style='color:#94A3B8;font-size:.88rem'>Fetch live financial news and ask questions grounded in real market context.</p>",
                    unsafe_allow_html=True)

        if df is None:
            st.warning("Load a portfolio first to fetch relevant news.")
            return

        if st.button("📰  Fetch Latest News for My Holdings", use_container_width=False):
            symbols = df['Symbol'].str.replace(r'\.(NS|BO)$', '', regex=True).tolist()
            with st.spinner("Fetching news and building knowledge base..."):
                articles = fetch_news_for_symbols(symbols)
                if articles:
                    vectorstore = build_rag_vectorstore(articles)
                    st.session_state['rag_vectorstore'] = vectorstore
                    st.session_state['rag_articles'] = articles
                    st.success(f"✓ Fetched {len(articles)} articles, knowledge base ready.")
                else:
                    st.warning("No news found. Check your NewsAPI key.")

        if 'rag_vectorstore' in st.session_state:
            rag_q = st.text_input("🔍 Ask a question grounded in today's news:",
                                   placeholder="e.g. What's the outlook for Indian IT stocks?")
            if rag_q:
                with st.spinner("Searching knowledge base..."):
                    answer = query_rag(rag_q, st.session_state['rag_vectorstore'],
                                       st.session_state.get('rag_articles', []))
                st.markdown(f'<div class="w-panel">{answer}</div>', unsafe_allow_html=True)
