"""WealthOS — cinematic luxury financial operating system.
Main Streamlit entrypoint with premium sidebar and navigation.
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import streamlit as st

# ── Design system must be the VERY FIRST streamlit call ──────────────────────
from frontend.design_system import load_global_styles
load_global_styles()

# ── Page imports ─────────────────────────────────────────────────────────────
from ui.dashboard_page import render_dashboard_page
from ui.upload_page import render_upload_page
from ui.advisor_page import render_advisor_page
from ui.news_page import render_news_page

# ── Premium sidebar ───────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("""
    <div style="padding:1.2rem 0.5rem 0.5rem;">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="WealthOS logo">
            <rect width="32" height="32" rx="9" fill="#0B1728"/>
            <path d="M8 22L12 10L16 18L20 10L24 22" stroke="#7DD3FC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="16" cy="18" r="2" fill="#D6C7A1"/>
        </svg>
        <div style="margin-top:0.9rem;">
            <div style="color:#D6C7A1;font-size:0.68rem;letter-spacing:0.2em;font-weight:700;text-transform:uppercase;">WealthOS</div>
            <div style="color:#64748B;font-size:0.73rem;margin-top:0.2rem;">Cinematic Finance Terminal</div>
        </div>
    </div>
    <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(148,163,184,0.18),transparent);margin:1rem 0;"></div>
    """, unsafe_allow_html=True)

    pages = {
        "Dashboard": "dashboard",
        "Upload": "upload",
        "AI Advisor": "advisor",
        "Market News": "news",
    }

    icons = {
        "Dashboard": "◈",
        "Upload": "⤒",
        "AI Advisor": "◆",
        "Market News": "◉",
    }

    if "current_page" not in st.session_state:
        st.session_state["current_page"] = "Dashboard"

    for label, key in pages.items():
        is_active = st.session_state["current_page"] == label
        btn_style = """
            width:100%;text-align:left;padding:0.72rem 0.9rem;
            border-radius:14px;margin-bottom:0.3rem;cursor:pointer;
            font-size:0.88rem;font-weight:600;
            background:{bg};border:1px solid {border};color:{color};
            display:flex;align-items:center;gap:0.65rem;
        """.format(
            bg="linear-gradient(180deg,rgba(125,211,252,0.10),rgba(125,211,252,0.04))" if is_active else "transparent",
            border="rgba(125,211,252,0.22)" if is_active else "transparent",
            color="#F3F4F6" if is_active else "#94A3B8",
        )
        if st.button(f"{icons[label]}  {label}", key=f"nav_{key}",
                     use_container_width=True,
                     help=label):
            st.session_state["current_page"] = label
            st.rerun()

    st.markdown("""
    <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(148,163,184,0.18),transparent);margin:1rem 0;"></div>
    <div style="padding:0.6rem 0.5rem;">
        <div style="color:#64748B;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.14em;">Portfolio Health</div>
        <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.5rem;">
            <div style="flex:1;height:4px;border-radius:4px;background:rgba(255,255,255,0.06);overflow:hidden;">
                <div style="width:72%;height:100%;background:linear-gradient(90deg,#67E8F9,#7DD3FC);border-radius:4px;"></div>
            </div>
            <span style="color:#7DD3FC;font-size:0.75rem;font-weight:600;">72</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

# ── Route to page ─────────────────────────────────────────────────────────────
page = st.session_state.get("current_page", "Dashboard")

if page == "Dashboard":
    render_dashboard_page()
elif page == "Upload":
    render_upload_page()
elif page == "AI Advisor":
    render_advisor_page()
elif page == "Market News":
    render_news_page()
