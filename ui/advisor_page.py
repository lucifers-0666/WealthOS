import streamlit as st
import os
from core.data_loader import load_portfolio_from_session
from core.portfolio_engine import enrich_portfolio, compute_portfolio_summary


def _get_portfolio_context() -> str:
    df = load_portfolio_from_session()
    if df is None or df.empty:
        return "No portfolio loaded. User has not uploaded any holdings yet."
    try:
        enriched = enrich_portfolio(df)
        summary = compute_portfolio_summary(enriched)
        lines = [
            f"Total portfolio value: INR {summary['total_value']:,.0f}",
            f"Total invested: INR {summary['total_invested']:,.0f}",
            f"Total P&L: INR {summary['total_pnl']:,.0f} ({summary['total_pnl_pct']:.2f}%)",
            f"Number of holdings: {summary['num_holdings']}",
            f"Winners: {summary['num_winners']}, Losers: {summary['num_losers']}",
            "",
            "Holdings:",
        ]
        for _, row in enriched.iterrows():
            lines.append(
                f"  {row['symbol']}: {row['quantity']} units @ avg "
                f"INR {row['avg_price']:.2f}, current INR {row['live_price']:.2f}, "
                f"P&L {row['pnl_pct']:.1f}%, weight {row['weight_pct']:.1f}%"
            )
        return "\n".join(lines)
    except Exception as e:
        return f"Portfolio loaded but enrichment failed: {e}"


def render_advisor_page():
    st.markdown("## AI Financial Advisor")
    st.markdown(
        "<p style='color:#94A3B8;font-size:0.9rem;'>"
        "Your personal CFO — ask about portfolio health, rebalancing, tax planning, or market outlook."
        "</p>",
        unsafe_allow_html=True,
    )

    google_key = os.environ.get("GOOGLE_API_KEY", "").strip()

    if not google_key:
        st.warning(
            "Add **GOOGLE_API_KEY** to your `.env` file to enable the AI Advisor.  \n"
            "Get a free key at [aistudio.google.com](https://aistudio.google.com)",
        )
        st.divider()
        st.markdown("**Try these questions once the advisor is connected:**")
        suggestions = [
            "What is my portfolio health score and what should I improve?",
            "Am I overexposed to any sector? Suggest rebalancing steps.",
            "How much LTCG tax will I owe this financial year?",
            "If I want ₹1 Crore in 10 years, how much should I SIP monthly?",
            "What is the outlook for Indian IT stocks given current macro conditions?",
        ]
        for s in suggestions:
            st.markdown(f"- {s}")
        return

    # ── Initialise chat history ─────────────────────────────────────────────────
    if "advisor_messages" not in st.session_state:
        st.session_state.advisor_messages = []

    # ── Suggested prompts ───────────────────────────────────────────────────────
    if not st.session_state.advisor_messages:
        st.markdown("**Suggested questions:**")
        suggestions = [
            "What is my portfolio health score?",
            "Suggest a rebalancing plan for my holdings.",
            "How much LTCG tax am I liable for?",
            "Which holding has the highest concentration risk?",
        ]
        cols = st.columns(2)
        for idx, s in enumerate(suggestions):
            with cols[idx % 2]:
                if st.button(s, key=f"suggest_{idx}", use_container_width=True):
                    st.session_state.advisor_messages.append({"role": "user", "content": s})
                    st.rerun()

    # ── Render chat history ─────────────────────────────────────────────────────
    for msg in st.session_state.advisor_messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

    # ── User input ──────────────────────────────────────────────────────────────
    user_input = st.chat_input("Ask your financial advisor...")
    if user_input:
        st.session_state.advisor_messages.append({"role": "user", "content": user_input})
        with st.chat_message("user"):
            st.markdown(user_input)

        # ── AI response ─────────────────────────────────────────────────────────
        with st.chat_message("assistant"):
            with st.spinner("Analysing your portfolio..."):
                response = _call_gemini(
                    google_key,
                    st.session_state.advisor_messages,
                    _get_portfolio_context(),
                )
            st.markdown(response)
        st.session_state.advisor_messages.append({"role": "assistant", "content": response})

    # ── Clear chat ──────────────────────────────────────────────────────────────
    if st.session_state.advisor_messages:
        if st.button("Clear conversation", key="clear_chat"):
            st.session_state.advisor_messages = []
            st.rerun()


def _call_gemini(api_key: str, messages: list, portfolio_context: str) -> str:
    """Call Gemini 1.5 Flash via google-generativeai SDK."""
    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=(
                "You are WealthOS CFO — an elite AI financial advisor specialising in Indian markets (NSE/BSE), "
                "taxation (LTCG, STCG, Section 80C), mutual funds, SIP planning, and global ETF allocation. "
                "You have access to the user's live portfolio data below. Be specific, cite numbers from the portfolio, "
                "give actionable advice in clear steps. Never give generic responses. Always consider Indian tax laws. "
                "Format responses with headers and bullet points for clarity.\n\n"
                f"LIVE PORTFOLIO DATA:\n{portfolio_context}"
            ),
        )
        history = []
        for msg in messages[:-1]:  # all but last (which is current user msg)
            role = "user" if msg["role"] == "user" else "model"
            history.append({"role": role, "parts": [msg["content"]]})

        chat = model.start_chat(history=history)
        resp = chat.send_message(messages[-1]["content"])
        return resp.text

    except ImportError:
        return (
            "google-generativeai package not installed. "
            "Run: `pip install google-generativeai` then restart."
        )
    except Exception as e:
        err = str(e)
        if "API_KEY_INVALID" in err or "401" in err:
            return "Invalid GOOGLE_API_KEY. Check your .env file."
        if "quota" in err.lower():
            return "Gemini API quota exceeded. Try again later."
        return f"AI advisor error: {err}"
