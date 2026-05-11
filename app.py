"""WealthOS — Cinematic Premium Financial Operating System."""

import streamlit as st

# ── Design system must be first ─────────────────────────────────────────────
from frontend.design_system import load_global_styles
load_global_styles()

# ── Page imports ─────────────────────────────────────────────────────────────
from ui.dashboard import render_dashboard
from ui.upload_page import render_upload_page
from ui.advisor_page import render_advisor_page
from ui.news_page import render_news_page

# ── Sidebar nav ──────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown(
        """
        <div style="
            display:flex;align-items:center;gap:10px;
            padding:1rem 0.5rem 1.4rem;
            border-bottom:1px solid rgba(148,163,184,0.14);
            margin-bottom:0.9rem;
        ">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
                 xmlns="http://www.w3.org/2000/svg" aria-label="WealthOS logo">
                <rect width="28" height="28" rx="7" fill="rgba(125,211,252,0.08)"
                      stroke="rgba(125,211,252,0.22)" stroke-width="1"/>
                <path d="M7 20 L10.5 11 L14 17 L17.5 11 L21 20"
                      stroke="#7DD3FC" stroke-width="1.6" fill="none"
                      stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="14" cy="9" r="2" fill="#D6C7A1"/>
            </svg>
            <div>
                <div style="color:#D6C7A1;font-family:'Space Grotesk',sans-serif;
                             font-size:1rem;font-weight:700;letter-spacing:0.06em;
                             line-height:1.1;">WealthOS</div>
                <div style="color:#64748B;font-size:0.72rem;letter-spacing:0.12em;
                             text-transform:uppercase;">Intelligence v2</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    pages = {
        "Dashboard": ("dashboard", "Portfolio overview & analytics"),
        "Upload": ("upload", "Import holdings & transactions"),
        "AI Advisor": ("advisor", "CFO-grade financial intelligence"),
        "Market News": ("news", "Live financial intelligence feed"),
    }

    if "page" not in st.session_state:
        st.session_state.page = "Dashboard"

    for label, (key, desc) in pages.items():
        active = st.session_state.page == label
        if st.button(
            label,
            key=f"nav_{key}",
            use_container_width=True,
            type="primary" if active else "secondary",
        ):
            st.session_state.page = label
            st.rerun()

    st.markdown(
        """
        <div style="margin-top:auto;padding:1.2rem 0.5rem 0.5rem;
                     border-top:1px solid rgba(148,163,184,0.10);">
            <div style="color:#64748B;font-size:0.72rem;letter-spacing:0.10em;
                         text-transform:uppercase;margin-bottom:0.5rem;">System Status</div>
            <div style="display:flex;align-items:center;gap:0.5rem;
                         color:#8EE7B8;font-size:0.82rem;">
                <span style="width:7px;height:7px;border-radius:999px;
                              background:#8EE7B8;display:inline-block;"></span>
                All systems nominal
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

# ── Route to page ─────────────────────────────────────────────────────────────
page = st.session_state.get("page", "Dashboard")
if page == "Dashboard":
    render_dashboard()
elif page == "Upload":
    render_upload_page()
elif page == "AI Advisor":
    render_advisor_page()
elif page == "Market News":
    render_news_page()
