import streamlit as st
from loguru import logger

st.set_page_config(
    page_title="WealthOS — Personal Finance Dashboard",
    page_icon="💰",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ===== SESSION STATE INIT =====
defaults = {
    "portfolio_data": None,
    "transactions_data": None,
    "live_prices": {},
    "portfolio_images": [],
    "chat_history": [],
    "cfo_context": ""
}
for k, v in defaults.items():
    if k not in st.session_state:
        st.session_state[k] = v

# ===== GLOBAL CSS =====
st.markdown("""
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  /* ---- Base ---- */
  [data-testid="stAppViewContainer"] { background:#0A0E1A; }
  [data-testid="stSidebar"]          { background:#0D1117; border-right:1px solid #1E2A3A; }
  .block-container { padding-top:1.5rem; max-width:1400px; }

  /* ---- Typography ---- */
  h1,h2,h3 { font-family:'Playfair Display',serif; }
  body, p, span, div, label { font-family:'Inter',sans-serif; }

  /* ---- Cards ---- */
  .wealth-card {
    background: linear-gradient(135deg,#0D1B2A 0%,#111827 100%);
    border:1px solid #1E2D42;
    border-radius:12px;
    padding:1.25rem 1.5rem;
    margin-bottom:1rem;
  }
  .metric-label  { font-size:.65rem; font-weight:600; letter-spacing:.12em; color:#5A7A9A; text-transform:uppercase; }
  .metric-value  { font-size:1.55rem; font-weight:700; color:#F0EDE6; font-family:'Playfair Display',serif; }
  .metric-delta-pos { font-size:.78rem; color:#00D4A0; margin-top:.15rem; }
  .metric-delta-neg { font-size:.78rem; color:#FF4D6A; margin-top:.15rem; }

  /* ---- Sidebar nav ---- */
  .sidebar-logo { text-align:center; padding:1.5rem 0 1rem; border-bottom:1px solid #1E2A3A; margin-bottom:1rem; }
  .sidebar-logo h2 { color:#C9A84C; font-family:'Playfair Display',serif; font-size:1.4rem; margin:0; }
  .sidebar-logo p  { color:#5A7A9A; font-size:.75rem; margin:0; }

  /* ---- Buttons ---- */
  .stButton > button {
    border-radius:8px !important;
    font-weight:500 !important;
    transition:all .2s ease !important;
  }
  .stButton > button[kind="primary"] {
    background:linear-gradient(135deg,#C9A84C,#A07830) !important;
    border:none !important;
    color:#0A0E1A !important;
  }

  /* ---- Tables / dataframes ---- */
  [data-testid="stDataFrame"] { border-radius:8px; overflow:hidden; }

  /* ---- Section title ---- */
  .section-title {
    display:flex; align-items:center; gap:.6rem;
    color:#C9A84C; font-family:'Playfair Display',serif;
    font-size:1.1rem; font-weight:600;
    border-bottom:1px solid #1E2D42; padding-bottom:.5rem; margin-bottom:1rem;
  }
</style>
""", unsafe_allow_html=True)

# ===== SIDEBAR =====
with st.sidebar:
    st.markdown("""
    <div class="sidebar-logo">
      <h2>&#x1F4B0; WealthOS</h2>
      <p>Personal Finance Dashboard</p>
    </div>
    """, unsafe_allow_html=True)

    page = st.radio(
        "Navigation",                   # non-empty label (required)
        ["📊 Dashboard", "📁 Upload Data", "🤖 AI CFO Advisor", "📰 Market News"],
        label_visibility="collapsed"    # hides it visually; satisfies accessibility
    )

    st.markdown("---")
    if st.session_state.portfolio_data is not None:
        n = len(st.session_state.portfolio_data)
        st.markdown(f"<small style='color:#5A7A9A'>✅ {n} holdings loaded</small>", unsafe_allow_html=True)
    else:
        st.markdown("<small style='color:#5A7A9A'>No portfolio loaded</small>", unsafe_allow_html=True)

    if st.button("🔄 Refresh Prices", use_container_width=True):
        if st.session_state.portfolio_data is not None:
            from core.price_fetcher import fetch_live_prices
            symbols = st.session_state.portfolio_data['Symbol'].tolist()
            st.session_state.live_prices = fetch_live_prices(symbols, force_refresh=True)
            st.success("Prices refreshed!")
        else:
            st.warning("No portfolio loaded yet.")

# ===== IMPORTS =====
from ui.dashboard    import render_dashboard
from ui.upload_page  import render_upload_page
from ui.cfo_page     import render_cfo_page
from ui.news_page    import render_news_page

# ===== ROUTING =====
if "Dashboard" in page:
    render_dashboard()
elif "Upload" in page:
    render_upload_page()
elif "CFO" in page:
    render_cfo_page()
elif "News" in page:
    render_news_page()
