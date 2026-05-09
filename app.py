import streamlit as st
from config import APP_NAME, APP_ICON, APP_VERSION

st.set_page_config(
    page_title=APP_NAME,
    page_icon=APP_ICON,
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%);
        padding: 1.5rem 2rem;
        border-radius: 12px;
        margin-bottom: 1.5rem;
        color: white;
    }
    .metric-card {
        background: #1E1E2E;
        border-radius: 10px;
        padding: 1rem;
        border-left: 4px solid #7C3AED;
    }
    .profit { color: #00C851; font-weight: bold; }
    .loss { color: #FF4444; font-weight: bold; }
    .sidebar-nav-item {
        padding: 0.5rem 1rem;
        border-radius: 8px;
        margin-bottom: 4px;
    }
    [data-testid="stSidebar"] {
        background: #0F0F1A;
    }
</style>
""", unsafe_allow_html=True)

from ui.dashboard import render_dashboard
from ui.upload_page import render_upload_page
from ui.advisor_page import render_advisor_page
from ui.news_page import render_news_page

# Initialize session state
if "portfolio_data" not in st.session_state:
    st.session_state.portfolio_data = None
if "transactions_data" not in st.session_state:
    st.session_state.transactions_data = None
if "live_prices" not in st.session_state:
    st.session_state.live_prices = {}
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

# Sidebar Navigation
with st.sidebar:
    st.markdown(f"## {APP_ICON} {APP_NAME}")
    st.markdown(f"*v{APP_VERSION} — AI Finance Dashboard*")
    st.divider()

    page = st.radio(
        "Navigate",
        ["📊 Dashboard", "📂 Upload Data", "🤖 AI CFO Advisor", "📰 News & Insights"],
        label_visibility="collapsed"
    )

    st.divider()
    if st.session_state.portfolio_data is not None:
        st.success(f"✅ Portfolio loaded: {len(st.session_state.portfolio_data)} holdings")
    else:
        st.info("📂 Upload holdings to get started")

    st.caption("Built with ❤️ for lucifers-0666")

# Route pages
if page == "📊 Dashboard":
    render_dashboard()
elif page == "📂 Upload Data":
    render_upload_page()
elif page == "🤖 AI CFO Advisor":
    render_advisor_page()
elif page == "📰 News & Insights":
    render_news_page()
