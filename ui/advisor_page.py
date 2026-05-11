"""WealthOS AI Advisor — cinematic premium CFO terminal interface."""

from __future__ import annotations

import streamlit as st

from frontend.design_system import render_topbar

try:
    from ai.cfo_advisor import get_cfo_response
except Exception:
    get_cfo_response = None


_SUGGESTIONS = [
    "Analyse my portfolio concentration risk and suggest rebalancing steps",
    "Which holdings have the highest LTCG tax exposure this financial year?",
    "Calculate what monthly SIP I need to reach a \u20b91 crore corpus in 8 years",
    "Compare my IT sector allocation versus a NIFTY IT benchmark weight",
    "What is my effective portfolio beta and how should I hedge it?",
    "Identify the weakest positions I should consider exiting",
]


def render_advisor_page() -> None:
    render_topbar("AI Financial Advisor", "CFO intelligence terminal")

    # ── Context panel ────────────────────────────────────────────────────────
    st.markdown(
        """
        <section class="wo-panel" style="margin-bottom:1.1rem;">
            <div class="wo-panel-header">
                <div>
                    <div class="wo-kicker">Intelligence Layer</div>
                    <div class="wo-panel-title">AI Chief Financial Officer</div>
                    <div class="wo-panel-subtitle">
                        Powered by Gemini 1.5 Pro with RAG-augmented market context.
                        Trained on Indian market microstructure, SEBI regulations, LTCG tax rules,
                        and global portfolio theory.
                    </div>
                </div>
                <div class="wo-terminal-box" style="max-width:220px;font-size:0.78rem;">
                    <div style="color:#8EE7B8;">Model &nbsp;&nbsp;: Gemini 1.5 Pro</div>
                    <div>Context &nbsp;: Portfolio + News RAG</div>
                    <div>Persona &nbsp;: Indian CFO Analyst</div>
                    <div style="margin-top:0.4rem;color:#67E8F9;">Status &nbsp;&nbsp;: Online</div>
                </div>
            </div>
        </section>
        """,
        unsafe_allow_html=True,
    )

    # ── Suggested prompts ────────────────────────────────────────────────────
    st.markdown(
        "<div class='wo-kicker' style='margin-bottom:0.5rem;'>Suggested Queries</div>",
        unsafe_allow_html=True,
    )
    prompt_cols = st.columns(3)
    for i, sug in enumerate(_SUGGESTIONS):
        with prompt_cols[i % 3]:
            if st.button(sug, key=f"sug_{i}", use_container_width=True):
                if "messages" not in st.session_state:
                    st.session_state.messages = []
                st.session_state.messages.append({"role": "user", "content": sug})
                st.rerun()

    st.markdown("<div style='height:0.8rem'></div>", unsafe_allow_html=True)

    # ── Message history ──────────────────────────────────────────────────────
    if "messages" not in st.session_state:
        st.session_state.messages = []

    if not st.session_state.messages:
        st.markdown(
            """
            <div class="wo-terminal-box" style="text-align:center;padding:2.5rem 1rem;">
                <div style="font-size:0.9rem;color:#64748B;">ADVISOR TERMINAL READY</div>
                <div style="margin-top:0.5rem;font-size:0.78rem;color:#475569;">
                    Select a suggested query above or type your own financial question below.
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    else:
        for msg in st.session_state.messages:
            role_class = "user" if msg["role"] == "user" else "ai"
            role_label = "You" if msg["role"] == "user" else "WealthOS CFO"
            role_color = "#D6C7A1" if msg["role"] == "user" else "#7DD3FC"
            st.markdown(
                f"""
                <div class="wo-chat-bubble {role_class}">
                    <div class="wo-kicker" style="color:{role_color};margin-bottom:0.5rem;">{role_label}</div>
                    <div style="color:#E2E8F0;line-height:1.7;white-space:pre-wrap;">{msg['content']}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

        # Auto-reply to last user message if no assistant reply yet
        if st.session_state.messages[-1]["role"] == "user":
            last_q = st.session_state.messages[-1]["content"]
            with st.spinner("Analysing your portfolio..."):
                if get_cfo_response is not None:
                    try:
                        reply = get_cfo_response(
                            last_q,
                            portfolio_context=st.session_state.get("holdings_df"),
                        )
                    except Exception as exc:
                        reply = _fallback_response(last_q)
                else:
                    reply = _fallback_response(last_q)
            st.session_state.messages.append({"role": "assistant", "content": reply})
            st.rerun()

    # ── Input box ────────────────────────────────────────────────────────────
    st.markdown("<div style='height:0.6rem'></div>", unsafe_allow_html=True)
    with st.form(key="chat_form", clear_on_submit=True):
        col_in, col_btn = st.columns([5, 1])
        with col_in:
            user_input = st.text_input(
                "Ask your CFO advisor",
                placeholder="e.g. Should I increase my IT allocation given the current macro?",
                label_visibility="collapsed",
            )
        with col_btn:
            submitted = st.form_submit_button("Send", use_container_width=True)

    if submitted and user_input.strip():
        st.session_state.messages.append({"role": "user", "content": user_input.strip()})
        st.rerun()

    if st.button("Clear conversation", use_container_width=False):
        st.session_state.messages = []
        st.rerun()


def _fallback_response(question: str) -> str:
    return (
        f"I've received your query: '{question}'.\n\n"
        "To unlock live AI responses, add your GOOGLE_API_KEY to the .env file and restart the app.\n\n"
        "In the meantime, here is a general framework for this type of question:\n"
        "1. Review your current sector and instrument allocation\n"
        "2. Compare against your stated risk tolerance and investment horizon\n"
        "3. Check LTCG/STCG implications before any rebalancing trade\n"
        "4. Consult SEBI-registered investment advisor for regulated advice"
    )
