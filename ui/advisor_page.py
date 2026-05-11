"""WealthOS AI Advisor — premium cinematic financial analyst terminal."""

from __future__ import annotations
import streamlit as st
from frontend.design_system import render_topbar

try:
    from ai.cfo_advisor import get_cfo_response
except Exception:
    get_cfo_response = None


SUGGESTED = [
    "Should I rebalance my IT exposure?",
    "What is my LTCG exposure this FY?",
    "Calculate SIP needed for ₹1 crore in 10 years at 12% CAGR",
    "Which holdings have the highest drawdown risk?",
    "Give me a full portfolio health score with reasoning",
    "How can I reduce concentration risk?",
]

SYSTEM_FALLBACK = (
    "As WealthOS AI CFO, I analyse your portfolio with focus on Indian market dynamics, "
    "SEBI regulations, LTCG/STCG implications, and global ETF exposure. "
    "I combine quantitative data with qualitative insight to deliver institutional-grade guidance."
)


def _call_ai(prompt: str, history: list) -> str:
    if get_cfo_response is not None:
        try:
            holdings = st.session_state.get("holdings", None)
            return get_cfo_response(prompt, history, holdings)
        except Exception as e:
            return f"AI service error: {e}\n\n_{SYSTEM_FALLBACK}_"
    # Offline demo response
    if "ltcg" in prompt.lower():
        return (
            "**LTCG Analysis — FY 2025-26**\n\n"
            "Based on your demo portfolio, all 9 holdings appear to have been acquired within the current "
            "financial year. **Zero LTCG liability** is expected at year end.\n\n"
            "- Equity LTCG threshold: ₹1,25,000 at 12.5% (post Budget 2024)\n"
            "- Recommend: Hold TCS and Reliance past 12 months to qualify for LTCG rate\n"
            "- Flag: GOLDBEES ETF gains taxed as debt if held under 36 months\n\n"
            "_Source: Income Tax Act 1961 / Budget 2024 amendments_"
        )
    if "sip" in prompt.lower() or "crore" in prompt.lower():
        return (
            "**SIP Calculator — ₹1 Crore Goal**\n\n"
            "At **12% CAGR** for **10 years**:\n\n"
            "```\nMonthly SIP required: ₹4,347\nTotal invested:       ₹5,21,640\nWealth created:       ₹4,78,360\nCorpus at year 10:    ₹1,00,00,000\n```\n\n"
            "Recommendation: Split SIP across Nifty 50 index fund (60%) + Small Cap (25%) + International ETF (15%) "
            "for diversification aligned with your current portfolio structure."
        )
    if "health" in prompt.lower() or "score" in prompt.lower():
        return (
            "**Portfolio Health Score: 7.2 / 10**\n\n"
            "| Dimension | Score | Note |\n"
            "|---|---|---|\n"
            "| Diversification | 7/10 | 3 sectors, 9 holdings — moderate spread |\n"
            "| Return Quality | 8/10 | +14.8% vs benchmark +10.4% |\n"
            "| Concentration Risk | 6/10 | IT at 38.1% — watch threshold |\n"
            "| Liquidity | 9/10 | All holdings are highly liquid |\n"
            "| Tax Efficiency | 7/10 | No LTCG yet; review in Q3 FY26 |\n\n"
            "**Top recommendation:** Trim IT by ~8% and increase Banking allocation. "
            "Consider adding a debt component (G-Sec ETF) for volatility buffering."
        )
    return (
        "**WealthOS AI CFO — Portfolio Analysis**\n\n"
        f"Regarding your query: *{prompt}*\n\n"
        "Your portfolio shows a healthy return profile with concentrated IT exposure. "
        "I recommend diversifying into Banking and International ETFs for better risk-adjusted returns. "
        "Enable the `GOOGLE_API_KEY` in your `.env` file to unlock full Gemini 1.5 Pro analysis with "
        "real-time reasoning, SEBI compliance checks, and personalised rebalancing recommendations."
    )


def render_advisor_page() -> None:
    render_topbar("AI CFO Advisor", "Financial Intelligence Terminal")

    # ── Layout ─────────────────────────────────────────────────────────────
    col_chat, col_panel = st.columns([5, 2], gap="small")

    with col_chat:
        st.markdown("""
        <section class='wo-hero' style='margin-bottom:1rem;'>
            <div style='position:relative;z-index:2;'>
                <div class='wo-kicker'>Gemini 1.5 Pro · RAG-Enhanced</div>
                <h1 style='font-family:Space Grotesk,sans-serif;font-size:clamp(1.6rem,2.2vw,2.4rem);
                           letter-spacing:-0.04em;color:#F3F4F6;margin:0.2rem 0 0.7rem;'>
                    Your AI <span style='color:#A78BFA;'>CFO</span>
                </h1>
                <p style='color:#94A3B8;font-size:0.95rem;max-width:56ch;'>
                    Ask anything about your portfolio — rebalancing, tax exposure, SIP planning,
                    drawdown risk, sector rotation, or market insights.
                </p>
            </div>
        </section>
        """, unsafe_allow_html=True)

        # Chat history init
        if "advisor_history" not in st.session_state:
            st.session_state["advisor_history"] = []

        # Suggested prompts
        st.markdown("""
        <div class='wo-panel-header' style='margin-bottom:0.6rem;'>
            <div class='wo-kicker'>Suggested Queries</div>
        </div>""", unsafe_allow_html=True)

        cols = st.columns(3, gap="small")
        for i, prompt in enumerate(SUGGESTED):
            with cols[i % 3]:
                if st.button(prompt, key=f"sug_{i}", use_container_width=True):
                    st.session_state["pending_prompt"] = prompt

        st.markdown("<div style='margin:0.6rem 0'></div>", unsafe_allow_html=True)

        # Chat messages
        if st.session_state["advisor_history"]:
            st.markdown("""
            <div class='wo-panel-header'>
                <div class='wo-kicker'>Conversation</div>
            </div>""", unsafe_allow_html=True)

            for msg in st.session_state["advisor_history"]:
                role_cls = "ai" if msg["role"] == "assistant" else "user"
                role_label = "WealthOS AI" if msg["role"] == "assistant" else "You"
                role_colour = "#A78BFA" if msg["role"] == "assistant" else "#D6C7A1"
                st.markdown(f"""
                <div class='wo-chat-bubble {role_cls}'>
                    <div style='color:{role_colour};font-size:0.72rem;letter-spacing:0.14em;
                                text-transform:uppercase;font-weight:700;margin-bottom:0.5rem;'>
                        {role_label}
                    </div>
                    <div style='color:#F3F4F6;font-size:0.95rem;line-height:1.7;'>
                """, unsafe_allow_html=True)
                st.markdown(msg["content"])
                st.markdown("</div></div>", unsafe_allow_html=True)

        # Input
        st.markdown("<div style='margin:0.5rem 0'></div>", unsafe_allow_html=True)
        default_val = st.session_state.pop("pending_prompt", "")
        user_input = st.text_area(
            "Ask your AI CFO",
            value=default_val,
            placeholder="e.g. What is my LTCG exposure this financial year?",
            height=90,
            label_visibility="collapsed",
            key="advisor_input",
        )

        send_col, clear_col = st.columns([5, 1], gap="small")
        with send_col:
            send = st.button("Send to AI CFO", use_container_width=True)
        with clear_col:
            if st.button("Clear", use_container_width=True):
                st.session_state["advisor_history"] = []
                st.rerun()

        if send and user_input.strip():
            with st.spinner("AI CFO is analysing…"):
                reply = _call_ai(user_input.strip(), st.session_state["advisor_history"])
            st.session_state["advisor_history"].append({"role": "user",    "content": user_input.strip()})
            st.session_state["advisor_history"].append({"role": "assistant", "content": reply})
            st.rerun()

    with col_panel:
        # Contextual intelligence sidebar
        st.markdown("""
        <div class='wo-panel' style='margin-bottom:1rem;'>
            <div class='wo-kicker'>Portfolio Vitals</div>
            <div class='wo-panel-title' style='margin-bottom:0.8rem;'>Live Context</div>
            <div class='wo-divider'></div>
        """, unsafe_allow_html=True)

        holdings = st.session_state.get("holdings", None)
        if holdings is not None:
            st.markdown(f"""
            <div class='wo-mono' style='line-height:2;'>
                Holdings: {len(holdings)} positions<br>
                Session: Active
            </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown("""
            <div class='wo-mono' style='color:#64748B;'>No holdings loaded.<br>Go to Upload tab.</div>
            """, unsafe_allow_html=True)

        st.markdown("""
        </div>
        <div class='wo-panel'>
            <div class='wo-kicker'>AI Capabilities</div>
            <div class='wo-panel-title' style='margin-bottom:0.7rem;'>What I can do</div>
            <div class='wo-divider'></div>
            <ul style='color:#94A3B8;font-size:0.84rem;line-height:2.1;list-style:none;padding:0;'>
                <li style='color:#8EE7B8;'>&#10003; Portfolio health scoring</li>
                <li style='color:#8EE7B8;'>&#10003; LTCG / STCG tax analysis</li>
                <li style='color:#8EE7B8;'>&#10003; Rebalancing recommendations</li>
                <li style='color:#8EE7B8;'>&#10003; SIP / goal planning</li>
                <li style='color:#8EE7B8;'>&#10003; Drawdown risk flagging</li>
                <li style='color:#8EE7B8;'>&#10003; Market news RAG context</li>
                <li style='color:#D6C7A1;'>&#9654; Gemini 1.5 Pro (with API key)</li>
            </ul>
        </div>
        """, unsafe_allow_html=True)
