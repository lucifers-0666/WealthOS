import streamlit as st
from ai.cfo_advisor import chat_with_cfo, run_full_portfolio_analysis, format_portfolio_for_prompt
from ai.rag_engine import fetch_news_for_symbols, build_rag_vectorstore, query_rag
from core.portfolio_engine import compute_portfolio_metrics, get_summary_stats
from ui.components import section_header


def render_advisor_page():
    section_header("🤖 AI CFO Advisor", "Your personal Chief Financial Officer powered by Gemini 1.5 Pro")

    # Sidebar analysis button
    with st.sidebar:
        st.divider()
        if st.button("🔍 Run Full Analysis", use_container_width=True):
            _run_full_analysis()

    # Chat interface
    st.markdown("**Ask your CFO anything about your portfolio:**")

    # Display chat history
    for msg in st.session_state.chat_history:
        with st.chat_message(msg['role']):
            st.markdown(msg['content'])

    # Input
    if prompt := st.chat_input("e.g. Should I rebalance my portfolio? What's my LTCG exposure?"):
        st.session_state.chat_history.append({'role': 'user', 'content': prompt})
        with st.chat_message('user'):
            st.markdown(prompt)

        # Build portfolio context
        portfolio_context = _build_context(prompt)

        with st.chat_message('assistant'):
            with st.spinner("CFO is analyzing..."):
                response = chat_with_cfo(
                    prompt,
                    portfolio_context,
                    st.session_state.chat_history[:-1]
                )
            st.markdown(response)

        st.session_state.chat_history.append({'role': 'assistant', 'content': response})

    # Suggested questions
    if not st.session_state.chat_history:
        st.markdown("### 💡 Suggested Questions")
        questions = [
            "Analyze my overall portfolio health and give me a score",
            "Which stocks are at risk and should I exit?",
            "How should I rebalance to reduce concentration risk?",
            "What is my LTCG and STCG tax exposure?",
            "Should I add international ETFs to my portfolio?",
            "How much should I invest monthly via SIP to reach ₹1 Crore in 10 years?"
        ]
        cols = st.columns(2)
        for i, q in enumerate(questions):
            if cols[i % 2].button(q, use_container_width=True, key=f"q_{i}"):
                st.session_state.chat_history.append({'role': 'user', 'content': q})
                st.rerun()


def _build_context(prompt: str) -> str:
    if st.session_state.portfolio_data is None:
        return ""

    df = st.session_state.portfolio_data
    live_prices = st.session_state.live_prices or {}
    portfolio_df = compute_portfolio_metrics(df, live_prices)
    summary = get_summary_stats(portfolio_df)
    portfolio_context = format_portfolio_for_prompt(portfolio_df, summary)

    # Try to add RAG news context
    try:
        symbols = df['Symbol'].tolist()
        articles = fetch_news_for_symbols(tuple(symbols))
        if articles:
            vectorstore = build_rag_vectorstore(articles)
            news_context = query_rag(vectorstore, prompt)
            if news_context:
                portfolio_context += f"\n\n[Recent News Context]\n{news_context[:1500]}"
    except Exception:
        pass

    return portfolio_context


def _run_full_analysis():
    if st.session_state.portfolio_data is None:
        st.sidebar.error("Load portfolio first")
        return

    df = st.session_state.portfolio_data
    live_prices = st.session_state.live_prices or {}
    portfolio_df = compute_portfolio_metrics(df, live_prices)
    summary = get_summary_stats(portfolio_df)

    with st.spinner("Running comprehensive portfolio analysis..."):
        analysis = run_full_portfolio_analysis(portfolio_df, summary)

    st.session_state.chat_history.append({'role': 'assistant', 'content': analysis})
    st.rerun()
