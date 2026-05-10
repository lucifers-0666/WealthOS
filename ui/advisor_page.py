import streamlit as st
from ai.cfo_advisor import chat_with_cfo, run_full_portfolio_analysis, format_portfolio_for_prompt
from ai.rag_engine import fetch_news_for_symbols, build_rag_vectorstore, query_rag
from core.portfolio_engine import compute_portfolio_metrics, get_summary_stats
from ui.components import page_header, section_title


QUICK_QUESTIONS = [
    "Analyze my overall portfolio health and give a score out of 10",
    "Which holdings are at risk and should I consider exiting?",
    "How should I rebalance to reduce concentration risk?",
    "What is my LTCG and STCG tax exposure this year?",
    "Should I increase international ETF exposure?",
    "How much monthly SIP to reach Rs 1 Crore in 10 years?",
]


def render_advisor_page():
    page_header(
        "fa-solid fa-robot",
        "AI CFO Advisor",
        "Your personal Chief Financial Officer powered by Gemini 1.5 Pro"
    )

    col_main, col_side = st.columns([3, 1])

    with col_side:
        st.markdown("""
        <div class="wealth-card">
            <div class="section-title" style="border:none; padding:0; margin-bottom:1rem;">
                <i class="fa-solid fa-bolt" style="color:#C9A84C"></i>
                Quick Actions
            </div>
        </div>
        """, unsafe_allow_html=True)

        if st.button("Run Full Analysis", type="primary", use_container_width=True):
            _run_full_analysis()

        if st.button("Clear Chat", use_container_width=True):
            st.session_state.chat_history = []
            st.rerun()

        st.markdown("<br>", unsafe_allow_html=True)
        section_title("fa-solid fa-lightbulb", "Suggested Questions")
        for i, q in enumerate(QUICK_QUESTIONS):
            if st.button(q[:55] + ".." if len(q) > 55 else q, key=f"q_{i}", use_container_width=True):
                st.session_state.chat_history.append({'role': 'user', 'content': q})
                st.rerun()

    with col_main:
        # Chat history
        chat_container = st.container()
        with chat_container:
            for msg in st.session_state.chat_history:
                with st.chat_message(msg['role']):
                    st.markdown(msg['content'])

        if not st.session_state.chat_history:
            st.markdown("""
            <div class="wealth-card" style="text-align:center; padding:2.5rem;">
                <i class="fa-solid fa-robot" style="font-size:2.5rem; color:#C9A84C; opacity:0.5; display:block; margin-bottom:1rem;"></i>
                <h4 style="color:#F0EDE6; font-family:'Playfair Display',serif;">Your AI CFO is Ready</h4>
                <p style="color:#8A9BB5; font-size:0.875rem;">
                    Ask anything about your portfolio — rebalancing, tax optimization, risk assessment, SIP planning.
                </p>
            </div>
            """, unsafe_allow_html=True)

        # Input
        if prompt := st.chat_input("Ask your CFO anything about your investments..."):
            st.session_state.chat_history.append({'role': 'user', 'content': prompt})
            with st.chat_message('user'):
                st.markdown(prompt)

            portfolio_context = _build_context(prompt)
            with st.chat_message('assistant'):
                with st.spinner("CFO is analyzing your portfolio..."):
                    response = chat_with_cfo(prompt, portfolio_context, st.session_state.chat_history[:-1])
                st.markdown(response)

            st.session_state.chat_history.append({'role': 'assistant', 'content': response})


def _build_context(prompt: str) -> str:
    if st.session_state.portfolio_data is None:
        return ""
    df = st.session_state.portfolio_data
    live_prices = st.session_state.live_prices or {}
    portfolio_df = compute_portfolio_metrics(df, live_prices)
    summary = get_summary_stats(portfolio_df)
    context = format_portfolio_for_prompt(portfolio_df, summary)
    try:
        articles = fetch_news_for_symbols(tuple(df['Symbol'].tolist()))
        if articles:
            vs = build_rag_vectorstore(articles)
            news = query_rag(vs, prompt)
            if news:
                context += f"\n\n[Recent News]\n{news[:1500]}"
    except Exception:
        pass
    return context


def _run_full_analysis():
    if st.session_state.portfolio_data is None:
        st.error("Load a portfolio first")
        return
    df = st.session_state.portfolio_data
    live_prices = st.session_state.live_prices or {}
    portfolio_df = compute_portfolio_metrics(df, live_prices)
    summary = get_summary_stats(portfolio_df)
    with st.spinner("Running comprehensive portfolio analysis..."):
        analysis = run_full_portfolio_analysis(portfolio_df, summary)
    st.session_state.chat_history.append({'role': 'assistant', 'content': analysis})
    st.rerun()
