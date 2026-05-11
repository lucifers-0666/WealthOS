import streamlit as st
import os
from pathlib import Path
from dotenv import load_dotenv

# ── Load .env before anything else ─────────────────────────────────────────────
load_dotenv(Path(__file__).parent / ".env")

# ── Page config ────────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="WealthOS",
    page_icon="W",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Global dark luxury CSS ──────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700&f[]=cabinet-grotesk@700,800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap');

/* ─── Base Reset ──────────────────────────────────────────────────────────── */
html, body, [class*="css"] {
    font-family: 'Satoshi', 'Inter', -apple-system, sans-serif;
    background-color: #020617 !important;
    color: #F3F4F6;
}

/* ─── Sidebar ─────────────────────────────────────────────────────────────── */
[data-testid="stSidebar"] {
    background: #07111F !important;
    border-right: 1px solid rgba(148,163,184,0.10) !important;
    padding-top: 1rem;
}
[data-testid="stSidebar"] .block-container { padding: 0.5rem 0.75rem; }
[data-testid="stSidebarNav"] a {
    color: #94A3B8 !important;
    font-size: 0.875rem !important;
    font-weight: 500;
    border-radius: 8px;
    padding: 0.45rem 0.75rem !important;
    transition: all 0.18s ease;
    display: block;
    text-decoration: none;
}
[data-testid="stSidebarNav"] a:hover {
    color: #F3F4F6 !important;
    background: rgba(125,211,252,0.07) !important;
}
[data-testid="stSidebarNav"] a[aria-current="page"] {
    color: #7DD3FC !important;
    background: rgba(125,211,252,0.10) !important;
    border-left: 2px solid #7DD3FC;
}

/* ─── Main content area ───────────────────────────────────────────────────── */
.main .block-container {
    padding: 2rem 2.5rem 3rem !important;
    max-width: 1400px;
    background: transparent !important;
}

/* ─── Typography ──────────────────────────────────────────────────────────── */
h1, h2, h3 {
    font-family: 'Cabinet Grotesk', 'Satoshi', sans-serif !important;
    color: #F3F4F6 !important;
    letter-spacing: -0.02em;
    font-weight: 700;
}
h2 { font-size: 1.6rem !important; margin-bottom: 0.25rem; }
h3 { font-size: 1.15rem !important; color: #E2E8F0 !important; }
p { color: #94A3B8; }

/* ─── Metric cards ────────────────────────────────────────────────────────── */
[data-testid="stMetric"] {
    background: #0B1728;
    border: 1px solid rgba(148,163,184,0.13);
    border-radius: 12px;
    padding: 1rem 1.25rem 0.9rem !important;
    transition: border-color 0.2s;
}
[data-testid="stMetric"]:hover { border-color: rgba(125,211,252,0.25); }
[data-testid="stMetricLabel"] { font-size: 0.72rem !important; letter-spacing: 0.07em;
    text-transform: uppercase; color: #64748B !important; font-weight: 600; }
[data-testid="stMetricValue"] { font-size: 1.45rem !important; color: #F3F4F6 !important;
    font-family: 'IBM Plex Mono', monospace !important; font-weight: 500; }
[data-testid="stMetricDelta"] { font-size: 0.82rem !important; }

/* ─── Buttons ─────────────────────────────────────────────────────────────── */
.stButton > button {
    background: rgba(125,211,252,0.10) !important;
    color: #7DD3FC !important;
    border: 1px solid rgba(125,211,252,0.25) !important;
    border-radius: 8px !important;
    font-size: 0.85rem !important;
    font-weight: 500 !important;
    padding: 0.45rem 1rem !important;
    transition: all 0.18s ease !important;
    letter-spacing: 0.02em;
}
.stButton > button:hover {
    background: rgba(125,211,252,0.18) !important;
    border-color: rgba(125,211,252,0.5) !important;
}
.stButton > button[kind="primary"] {
    background: #7DD3FC !important;
    color: #020617 !important;
    border-color: #7DD3FC !important;
    font-weight: 600 !important;
}
.stButton > button[kind="primary"]:hover {
    background: #93C5FD !important;
}

/* ─── DataFrames ──────────────────────────────────────────────────────────── */
[data-testid="stDataFrame"] {
    border: 1px solid rgba(148,163,184,0.12) !important;
    border-radius: 12px !important;
    overflow: hidden;
}

/* ─── Tabs ────────────────────────────────────────────────────────────────── */
.stTabs [data-baseweb="tab-list"] {
    background: #07111F !important;
    border-bottom: 1px solid rgba(148,163,184,0.12);
    gap: 0;
}
.stTabs [data-baseweb="tab"] {
    color: #64748B !important;
    font-size: 0.84rem !important;
    font-weight: 500;
    padding: 0.6rem 1.1rem !important;
    border-radius: 0 !important;
    background: transparent !important;
    border-bottom: 2px solid transparent !important;
    transition: all 0.18s;
}
.stTabs [aria-selected="true"] {
    color: #7DD3FC !important;
    border-bottom-color: #7DD3FC !important;
    background: transparent !important;
}

/* ─── Inputs ──────────────────────────────────────────────────────────────── */
.stTextInput input, .stSelectbox select, .stTextArea textarea {
    background: #0B1728 !important;
    border: 1px solid rgba(148,163,184,0.15) !important;
    border-radius: 8px !important;
    color: #F3F4F6 !important;
    font-size: 0.9rem !important;
}
.stTextInput input:focus {
    border-color: rgba(125,211,252,0.4) !important;
    box-shadow: 0 0 0 3px rgba(125,211,252,0.08) !important;
}

/* ─── Chat ────────────────────────────────────────────────────────────────── */
[data-testid="stChatInput"] {
    background: #0B1728 !important;
    border: 1px solid rgba(148,163,184,0.15) !important;
    border-radius: 12px !important;
}
[data-testid="stChatMessageContent"] {
    background: #0B1728 !important;
    border: 1px solid rgba(148,163,184,0.10) !important;
    border-radius: 10px !important;
    color: #E2E8F0 !important;
}

/* ─── Divider ─────────────────────────────────────────────────────────────── */
hr { border-color: rgba(148,163,184,0.10) !important; margin: 1.5rem 0 !important; }

/* ─── Spinner ─────────────────────────────────────────────────────────────── */
[data-testid="stSpinner"] { color: #7DD3FC !important; }

/* ─── Alerts ──────────────────────────────────────────────────────────────── */
[data-testid="stAlert"] {
    background: rgba(11,23,40,0.8) !important;
    border-radius: 10px !important;
    border: 1px solid rgba(148,163,184,0.15) !important;
}

/* ─── File uploader ───────────────────────────────────────────────────────── */
[data-testid="stFileUploader"] {
    background: #0B1728 !important;
    border: 2px dashed rgba(125,211,252,0.25) !important;
    border-radius: 12px !important;
    padding: 1.5rem !important;
}
[data-testid="stFileUploader"]:hover {
    border-color: rgba(125,211,252,0.45) !important;
}

/* ─── Plotly charts transparent bg ───────────────────────────────────────── */
.js-plotly-plot .plotly .svg-container { background: transparent !important; }
</style>
""", unsafe_allow_html=True)

# ── Sidebar logo + nav ──────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("""
    <div style="padding:0.5rem 0.25rem 1.5rem; border-bottom:1px solid rgba(148,163,184,0.10); margin-bottom:1rem;">
        <div style="display:flex;align-items:center;gap:0.6rem;">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="WealthOS logo">
                <rect width="28" height="28" rx="7" fill="#7DD3FC" opacity="0.12"/>
                <path d="M6 8 L10 20 L14 11 L18 20 L22 8" stroke="#7DD3FC" stroke-width="2"
                      stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                <circle cx="14" cy="14" r="2" fill="#7DD3FC" opacity="0.5"/>
            </svg>
            <div>
                <div style="font-family:'Cabinet Grotesk',sans-serif;font-size:1rem;
                            font-weight:800;color:#F3F4F6;letter-spacing:-0.02em;">WealthOS</div>
                <div style="font-size:0.65rem;color:#64748B;letter-spacing:0.08em;
                            text-transform:uppercase;margin-top:-2px;">Portfolio Intelligence</div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Portfolio status badge
    df_status = st.session_state.get("portfolio_df")
    num_holdings = len(df_status) if df_status is not None else 0
    badge_color = "#4ADE80" if num_holdings > 0 else "#64748B"
    badge_text = f"{num_holdings} positions" if num_holdings > 0 else "No portfolio"
    st.markdown(
        f'<div style="background:rgba(11,23,40,0.8);border:1px solid rgba(148,163,184,0.12);'
        f'border-radius:8px;padding:0.5rem 0.75rem;margin-bottom:1rem;display:flex;'
        f'align-items:center;gap:0.5rem;">'
        f'<div style="width:7px;height:7px;border-radius:50%;background:{badge_color};"></div>'
        f'<span style="font-size:0.8rem;color:#94A3B8;">{badge_text}</span></div>',
        unsafe_allow_html=True,
    )

    page = st.radio(
        "Navigation",
        ["Dashboard", "Upload", "AI Advisor", "Market News"],
        label_visibility="collapsed",
        key="nav_page",
    )

    st.markdown("<div style='height:2rem'></div>", unsafe_allow_html=True)
    # Env status indicators
    google_ok = bool(os.environ.get("GOOGLE_API_KEY"))
    news_ok = bool(os.environ.get("NEWSAPI_KEY"))
    st.markdown(
        f'<div style="font-size:0.7rem;color:#64748B;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:0.4rem;">API Status</div>'
        f'<div style="font-size:0.78rem;color:{"#4ADE80" if google_ok else "#64748B"};margin-bottom:0.2rem;">'
        f'  {"●" if google_ok else "○"} Gemini AI {"Active" if google_ok else "Not configured"}</div>'
        f'<div style="font-size:0.78rem;color:{"#4ADE80" if news_ok else "#64748B"};margin-bottom:0.2rem;">'
        f'  {"●" if news_ok else "○"} NewsAPI {"Active" if news_ok else "Not configured"}</div>',
        unsafe_allow_html=True,
    )

# ── Route pages ─────────────────────────────────────────────────────────────────
if page == "Dashboard":
    from ui.dashboard import render_dashboard
    render_dashboard()
elif page == "Upload":
    from ui.upload_page import render_upload_page
    render_upload_page()
elif page == "AI Advisor":
    from ui.advisor_page import render_advisor_page
    render_advisor_page()
elif page == "Market News":
    from ui.news_page import render_news_page
    render_news_page()
