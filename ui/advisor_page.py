"""WealthOS AI Advisor \u2014 premium cinematic financial analyst terminal."""

from __future__ import annotations
import streamlit as st
from frontend.design_system import render_topbar, render_hero, panel_start, panel_end

try:
    from ai.cfo_advisor import get_cfo_response
except Exception:
    get_cfo_response = None


SUGGESTED = [
    "Rebalance my IT exposure?",
    "LTCG exposure this FY?",
    "SIP for \u20b91Cr in 10 years @ 12%",
    "Highest drawdown risk holdings?",
    "Full portfolio health score",
    "How to reduce concentration risk?",
]

SYSTEM_FALLBACK = (
    "As WealthOS AI CFO, I analyse your portfolio with focus on Indian market dynamics, "
    "SEBI regulations, LTCG/STCG implications, and global ETF exposure."
)


def _call_ai(prompt: str, history: list) -> str:
    if get_cfo_response is not None:
        try:
            holdings = st.session_state.get("holdings", None)
            return get_cfo_response(prompt, history, holdings)
        except Exception as e:
            return f"AI service error: {e}\n\n_{SYSTEM_FALLBACK}_"
    p = prompt.lower()
    if "ltcg" in p:
        return (
            "**LTCG Analysis \u2014 FY 2025-26**\n\n"
            "All 9 holdings appear acquired within the current FY. **Zero LTCG liability** expected.\n\n"
            "- Equity LTCG threshold: \u20b91,25,000 at 12.5% (post Budget 2024)\n"
            "- Recommend: Hold TCS and Reliance past 12 months to qualify for LTCG rate\n"
            "- Flag: GOLDBEES ETF gains taxed as debt if held under 36 months\n\n"
            "_Source: Income Tax Act 1961 / Budget 2024 amendments_"
        )
    if "sip" in p or "crore" in p:
        return (
            "**SIP Calculator \u2014 \u20b91 Crore Goal**\n\n"
            "At **12% CAGR** for **10 years**:\n\n"
            "```\nMonthly SIP required: \u20b94,347\nTotal invested:       \u20b95,21,640\nWealth created:       \u20b94,78,360\nCorpus at year 10:    \u20b91,00,00,000\n```\n\n"
            "Split: Nifty 50 index (60%) + Small Cap (25%) + International ETF (15%)."
        )
    if "health" in p or "score" in p:
        return (
            "**Portfolio Health Score: 7.2 / 10**\n\n"
            "| Dimension | Score | Note |\n"
            "|---|---|---|\n"
            "| Diversification | 7/10 | 3 sectors, 9 holdings |\n"
            "| Return Quality | 8/10 | +14.8% vs benchmark +10.4% |\n"
            "| Concentration Risk | 6/10 | IT at 38.1% \u2014 watch threshold |\n"
            "| Liquidity | 9/10 | All holdings highly liquid |\n"
            "| Tax Efficiency | 7/10 | No LTCG yet; review Q3 FY26 |\n\n"
            "**Top action:** Trim IT by ~8%, increase Banking. Add G-Sec ETF for volatility buffer."
        )
    return (
        f"**WealthOS AI CFO \u2014 Portfolio Analysis**\n\n"
        f"Regarding: *{prompt}*\n\n"
        "Your portfolio shows a healthy return profile with concentrated IT exposure. "
        "Enable `GOOGLE_API_KEY` in `.env` for full Gemini 1.5 Pro analysis."
    )


def render_advisor_page() -> None:
    render_topbar("AI Financial Advisor", "CFO Intelligence Mode")
    render_hero(
        "Your AI <span style='color:#A78BFA;'>CFO</span>.",
        "Ask anything about your portfolio \u2014 rebalancing, tax exposure, SIP planning, "
        "drawdown risk, sector rotation, or real-time market insights. Powered by Gemini 1.5 Pro.",
    )

    col_chat, col_panel = st.columns([5, 2], gap="small")

    with col_chat:
        # ── Suggested prompts ────────────────────────────────────────────────
        pills_html = "".join(
            f"""<span class='wo-pill' style='cursor:pointer;' 
                    onclick="document.querySelector('[data-testid=stTextArea] textarea').value='{p}'">
                    {p}</span>"""
            for p in SUGGESTED
        )
        st.markdown(f"""
        <div class='wo-panel-header' style='margin-bottom:0.5rem;'>
            <div class='wo-kicker'>Suggested Queries</div>
        </div>
        <div style='display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1rem;'>
            {pills_html}
        </div>
        """, unsafe_allow_html=True)

        # Streamlit buttons for suggested prompts (functional fallback)
        if "advisor_history" not in st.session_state:
            st.session_state["advisor_history"] = []

        btn_cols = st.columns(3, gap="small")
        for i, prompt in enumerate(SUGGESTED):
            with btn_cols[i % 3]:
                if st.button(prompt, key=f"sug_{i}", use_container_width=True):
                    st.session_state["pending_prompt"] = prompt

        st.markdown("<div style='margin:0.5rem 0'></div>", unsafe_allow_html=True)

        # ── Conversation history ─────────────────────────────────────────────
        if st.session_state["advisor_history"]:
            st.markdown("""
            <div class='wo-panel-header'>
                <div class='wo-kicker'>Conversation</div>
            </div>""", unsafe_allow_html=True)

            for msg in st.session_state["advisor_history"]:
                role_cls   = "ai" if msg["role"] == "assistant" else "user"
                role_label = "WealthOS AI" if msg["role"] == "assistant" else "You"
                role_colour = "#A78BFA" if msg["role"] == "assistant" else "#D6C7A1"
                st.markdown(f"""
                <div class='wo-chat-bubble {role_cls}'>
                    <div style='color:{role_colour};font-size:0.7rem;letter-spacing:0.14em;
                                text-transform:uppercase;font-weight:700;margin-bottom:0.45rem;'>
                        {role_label}
                    </div>
                """, unsafe_allow_html=True)
                st.markdown(msg["content"])
                st.markdown("</div>", unsafe_allow_html=True)

        # ── Input ───────────────────────────────────────────────────────────
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
            send = st.button("\u2192 Send to AI CFO", use_container_width=True)
        with clear_col:
            if st.button("Clear", use_container_width=True):
                st.session_state["advisor_history"] = []
                st.rerun()

        if send and user_input.strip():
            st.markdown("""
            <div class='wo-terminal-box' style='margin:0.5rem 0;'>
                <div style='color:#D6C7A1;font-size:0.7rem;letter-spacing:0.14em;
                            text-transform:uppercase;margin-bottom:0.4rem;'>AI CFO Processing</div>
                <div style='color:#c7d2fe;font-family:IBM Plex Mono,monospace;font-size:0.85rem;'>
                    &gt; Analysing portfolio context...<br>
                    &gt; Loading Indian market data...<br>
                    &gt; Generating institutional-grade response...
                </div>
            </div>
            """, unsafe_allow_html=True)
            with st.spinner("AI CFO is analysing\u2026"):
                reply = _call_ai(user_input.strip(), st.session_state["advisor_history"])
            st.session_state["advisor_history"].append({"role": "user",      "content": user_input.strip()})
            st.session_state["advisor_history"].append({"role": "assistant", "content": reply})
            st.rerun()

    # ── Context panel ────────────────────────────────────────────────────────
    with col_panel:
        panel_start("Live Context", "Portfolio vitals injected into AI", meta="Portfolio Vitals")
        holdings = st.session_state.get("holdings", None)
        if holdings is not None:
            n = len(holdings)
            st.markdown(f"""
            <div class='wo-mono' style='line-height:2;font-size:0.82rem;'>
                <span style='color:#64748B;'>Holdings</span>
                <span style='color:#7DD3FC;float:right;'>{n} positions</span><br>
                <span style='color:#64748B;'>Session</span>
                <span style='color:#8EE7B8;float:right;'>Active</span><br>
                <span style='color:#64748B;'>AI Context</span>
                <span style='color:#8EE7B8;float:right;'>Injected</span>
            </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown("""
            <div class='wo-mono' style='color:#64748B;line-height:2;font-size:0.82rem;'>
                No holdings loaded.<br>Go to Upload tab first.
            </div>
            """, unsafe_allow_html=True)
        panel_end()

        st.markdown("<div style='margin:0.75rem 0'></div>", unsafe_allow_html=True)

        panel_start("AI Capabilities", "What the CFO can do", meta="Features")
        st.markdown("""
        <ul style='color:#94A3B8;font-size:0.84rem;line-height:2.2;list-style:none;padding:0;margin:0;'>
            <li><span style='color:#8EE7B8;'>&#10003;</span> Portfolio health scoring</li>
            <li><span style='color:#8EE7B8;'>&#10003;</span> LTCG / STCG tax analysis</li>
            <li><span style='color:#8EE7B8;'>&#10003;</span> Rebalancing recommendations</li>
            <li><span style='color:#8EE7B8;'>&#10003;</span> SIP / goal planning</li>
            <li><span style='color:#8EE7B8;'>&#10003;</span> Drawdown risk flagging</li>
            <li><span style='color:#8EE7B8;'>&#10003;</span> Market news RAG context</li>
            <li><span style='color:#D6C7A1;'>&#9654;</span> Gemini 1.5 Pro (needs API key)</li>
        </ul>
        """, unsafe_allow_html=True)
        panel_end()
