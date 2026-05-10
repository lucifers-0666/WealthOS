import streamlit as st
from config import APP_NAME, APP_VERSION

st.set_page_config(
    page_title="WealthOS",
    page_icon="assets/logo.svg" if False else "W",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css');

/* ===== ROOT VARIABLES ===== */
:root {
    --gold:       #C9A84C;
    --gold-light: #E8CC7A;
    --gold-dark:  #9A7B3A;
    --bg-deep:    #080B12;
    --bg-card:    #0E1420;
    --bg-surface: #131B2E;
    --bg-hover:   #1A2540;
    --border:     #1E2D4A;
    --border-gold:#C9A84C33;
    --text-primary: #F0EDE6;
    --text-secondary: #8A9BB5;
    --text-muted: #4A5A72;
    --green:      #00D4A0;
    --red:        #FF4D6A;
    --blue:       #3B7EFF;
    --purple:     #8B5CF6;
}

/* ===== GLOBAL ===== */
html, body, [data-testid="stAppViewContainer"] {
    background: var(--bg-deep) !important;
    font-family: 'Inter', sans-serif;
    color: var(--text-primary);
}
[data-testid="stHeader"] { background: transparent !important; }
[data-testid="stToolbar"] { display: none !important; }

/* ===== SIDEBAR ===== */
[data-testid="stSidebar"] {
    background: var(--bg-card) !important;
    border-right: 1px solid var(--border) !important;
    padding-top: 0 !important;
}
[data-testid="stSidebar"] > div:first-child { padding-top: 0 !important; }

.sidebar-logo {
    padding: 2rem 1.5rem 1.5rem;
    border-bottom: 1px solid var(--border-gold);
    margin-bottom: 1rem;
}
.sidebar-logo h1 {
    font-family: 'Playfair Display', serif;
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--gold);
    margin: 0;
    letter-spacing: 1px;
}
.sidebar-logo p {
    color: var(--text-muted);
    font-size: 0.72rem;
    margin: 0.25rem 0 0;
    letter-spacing: 2px;
    text-transform: uppercase;
}

/* ===== NAV ITEMS ===== */
[data-testid="stRadio"] label {
    display: flex !important;
    align-items: center !important;
    gap: 0.75rem !important;
    padding: 0.65rem 1.2rem !important;
    border-radius: 8px !important;
    color: var(--text-secondary) !important;
    font-size: 0.875rem !important;
    font-weight: 500 !important;
    transition: all 0.2s ease !important;
    cursor: pointer !important;
    margin-bottom: 2px !important;
    border: 1px solid transparent !important;
}
[data-testid="stRadio"] label:hover {
    background: var(--bg-hover) !important;
    color: var(--text-primary) !important;
    border-color: var(--border) !important;
}
[data-testid="stRadio"] [aria-checked="true"] + label,
[data-testid="stRadio"] label[data-checked="true"] {
    background: linear-gradient(135deg, var(--bg-hover), #1A2540) !important;
    color: var(--gold) !important;
    border-color: var(--border-gold) !important;
}
[data-testid="stRadio"] [type="radio"] { display: none !important; }

/* ===== MAIN CONTENT ===== */
.main .block-container {
    padding: 2rem 2.5rem !important;
    max-width: 1400px !important;
}

/* ===== CARDS ===== */
.wealth-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    transition: border-color 0.2s ease;
}
.wealth-card:hover { border-color: var(--border-gold); }

.metric-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.25rem 1.5rem;
    border-left: 3px solid var(--gold);
    transition: all 0.2s ease;
}
.metric-card:hover {
    border-color: var(--gold);
    background: var(--bg-surface);
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(201,168,76,0.08);
}
.metric-label {
    color: var(--text-muted);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 0.5rem;
}
.metric-value {
    color: var(--text-primary);
    font-size: 1.6rem;
    font-weight: 700;
    line-height: 1;
    font-family: 'Playfair Display', serif;
}
.metric-delta-pos { color: var(--green); font-size: 0.8rem; font-weight: 600; margin-top: 0.3rem; }
.metric-delta-neg { color: var(--red);   font-size: 0.8rem; font-weight: 600; margin-top: 0.3rem; }

/* ===== PAGE HEADER ===== */
.page-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem 2rem;
    background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-surface) 100%);
    border: 1px solid var(--border-gold);
    border-radius: 16px;
    margin-bottom: 2rem;
}
.page-header-icon {
    width: 52px; height: 52px;
    background: linear-gradient(135deg, var(--gold-dark), var(--gold));
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.4rem; color: #000;
    flex-shrink: 0;
}
.page-header h1 {
    font-family: 'Playfair Display', serif;
    font-size: 1.8rem; font-weight: 700;
    color: var(--text-primary); margin: 0;
}
.page-header p { color: var(--text-secondary); font-size: 0.875rem; margin: 0.2rem 0 0; }

/* ===== SECTION HEADER ===== */
.section-title {
    display: flex; align-items: center; gap: 0.6rem;
    font-size: 1rem; font-weight: 600;
    color: var(--text-primary);
    letter-spacing: 0.5px;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border);
}
.section-title i { color: var(--gold); font-size: 0.9rem; }

/* ===== DIVIDER ===== */
[data-testid="stDivider"] { border-color: var(--border) !important; opacity: 0.6 !important; }

/* ===== BUTTONS ===== */
.stButton button {
    background: linear-gradient(135deg, var(--gold-dark), var(--gold)) !important;
    color: #000 !important;
    border: none !important;
    border-radius: 8px !important;
    font-weight: 600 !important;
    font-size: 0.875rem !important;
    letter-spacing: 0.5px !important;
    padding: 0.6rem 1.5rem !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 2px 12px rgba(201,168,76,0.2) !important;
}
.stButton button:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 20px rgba(201,168,76,0.35) !important;
}
.stButton [kind="secondary"] button,
.secondary-btn button {
    background: var(--bg-surface) !important;
    color: var(--text-primary) !important;
    border: 1px solid var(--border) !important;
    box-shadow: none !important;
}

/* ===== FILE UPLOADER ===== */
[data-testid="stFileUploader"] {
    border: 1.5px dashed var(--border-gold) !important;
    border-radius: 12px !important;
    background: var(--bg-surface) !important;
    padding: 1rem !important;
}
[data-testid="stFileUploader"]:hover {
    border-color: var(--gold) !important;
    background: var(--bg-hover) !important;
}

/* ===== INPUTS ===== */
.stTextInput input, .stSelectbox select, [data-testid="stChatInput"] textarea {
    background: var(--bg-surface) !important;
    border: 1px solid var(--border) !important;
    border-radius: 8px !important;
    color: var(--text-primary) !important;
}
.stTextInput input:focus, [data-testid="stChatInput"] textarea:focus {
    border-color: var(--gold) !important;
    box-shadow: 0 0 0 2px rgba(201,168,76,0.15) !important;
}

/* ===== DATAFRAME ===== */
[data-testid="stDataFrame"] {
    border: 1px solid var(--border) !important;
    border-radius: 10px !important;
    overflow: hidden !important;
}

/* ===== CHAT ===== */
[data-testid="stChatMessage"] {
    background: var(--bg-surface) !important;
    border: 1px solid var(--border) !important;
    border-radius: 10px !important;
    margin-bottom: 0.75rem !important;
}

/* ===== STATUS BADGE ===== */
.badge-gold {
    display: inline-flex; align-items: center; gap: 0.35rem;
    background: rgba(201,168,76,0.12);
    color: var(--gold);
    border: 1px solid var(--border-gold);
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.5px;
}
.badge-green {
    background: rgba(0,212,160,0.1); color: var(--green);
    border: 1px solid rgba(0,212,160,0.2);
    display: inline-flex; align-items: center; gap: 0.35rem;
    padding: 0.25rem 0.75rem; border-radius: 20px;
    font-size: 0.75rem; font-weight: 600;
}
.badge-red {
    background: rgba(255,77,106,0.1); color: var(--red);
    border: 1px solid rgba(255,77,106,0.2);
    display: inline-flex; align-items: center; gap: 0.35rem;
    padding: 0.25rem 0.75rem; border-radius: 20px;
    font-size: 0.75rem; font-weight: 600;
}

/* ===== EXPANDER ===== */
[data-testid="stExpander"] {
    background: var(--bg-surface) !important;
    border: 1px solid var(--border) !important;
    border-radius: 10px !important;
}

/* ===== INFO / WARNING / SUCCESS ===== */
[data-testid="stAlert"] {
    border-radius: 10px !important;
    border-left-width: 3px !important;
}

/* ===== SCROLLBAR ===== */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: var(--bg-card); }
::-webkit-scrollbar-thumb { background: var(--gold-dark); border-radius: 10px; }

/* ===== PORTFOLIO IMAGE ===== */
.portfolio-image-card {
    border: 1px solid var(--border-gold);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
}
.portfolio-image-card img {
    width: 100%; object-fit: cover;
    max-height: 220px;
    display: block;
}
.portfolio-image-overlay {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: linear-gradient(transparent, rgba(8,11,18,0.9));
    padding: 1rem;
    color: var(--text-primary);
    font-size: 0.8rem;
}

/* Hide streamlit default elements */
#MainMenu, footer, header { visibility: hidden; }
.stDeployButton { display: none; }
</style>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
""", unsafe_allow_html=True)

from ui.dashboard import render_dashboard
from ui.upload_page import render_upload_page
from ui.advisor_page import render_advisor_page
from ui.news_page import render_news_page

# Session state init
for key, val in [
    ("portfolio_data", None),
    ("transactions_data", None),
    ("live_prices", {}),
    ("chat_history", []),
    ("portfolio_images", []),
]:
    if key not in st.session_state:
        st.session_state[key] = val

# ===== SIDEBAR =====
with st.sidebar:
    st.markdown("""
    <div class="sidebar-logo">
        <h1>WealthOS</h1>
        <p>AI Finance Dashboard</p>
    </div>
    """, unsafe_allow_html=True)

    page = st.radio(
        "",
        [
            "  Dashboard",
            "  Upload Data",
            "  AI CFO Advisor",
            "  News & Insights",
        ],
        label_visibility="collapsed",
        format_func=lambda x: x.strip()
    )

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown('<div style="border-top:1px solid #1E2D4A; margin:0 -1rem; padding: 1rem 1.5rem 0">', unsafe_allow_html=True)

    if st.session_state.portfolio_data is not None:
        n = len(st.session_state.portfolio_data)
        st.markdown(f"""
        <div class="badge-gold">
            <i class="fa-solid fa-circle-check"></i>
            {n} Holdings Loaded
        </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown("""
        <div style="color:#4A5A72; font-size:0.8rem; display:flex; align-items:center; gap:0.5rem;">
            <i class="fa-solid fa-folder-open" style="color:#C9A84C"></i>
            Upload holdings to begin
        </div>
        """, unsafe_allow_html=True)

    st.markdown("</div>", unsafe_allow_html=True)
    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown('<p style="color:#2A3A52; font-size:0.7rem; text-align:center; letter-spacing:1px;">WEALTHOS v1.0.0</p>', unsafe_allow_html=True)

# ===== ROUTING =====
if "Dashboard" in page:
    render_dashboard()
elif "Upload" in page:
    render_upload_page()
elif "CFO" in page:
    render_advisor_page()
elif "News" in page:
    render_news_page()
