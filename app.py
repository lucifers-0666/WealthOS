import streamlit as st
from loguru import logger

st.set_page_config(
    page_title="WealthOS — Personal Finance Dashboard",
  page_icon="W",
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
st.html("""
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<style>

/* =============================================
   WEALTHOS — DEEP SPACE PREMIUM THEME
   ============================================= */

:root {
  --bg:          #050816;
  --bg2:         #0B1120;
  --blue:        #3B82F6;
  --cyan:        #22D3EE;
  --violet:      #8B5CF6;
  --text:        #F8FAFC;
  --muted:       #94A3B8;
  --glass:       rgba(148,163,184,0.08);
  --glass-border:rgba(148,163,184,0.15);
  --blue-glow:   rgba(59,130,246,0.25);
  --cyan-glow:   rgba(34,211,238,0.2);
  --radius:      14px;
  --radius-sm:   8px;
  --transition:  all 0.25s cubic-bezier(0.4,0,0.2,1);
}

/* ---- Base ---- */
*, *::before, *::after { box-sizing: border-box; }

[data-testid="stAppViewContainer"] {
  background: var(--bg) !important;
  background-image:
    radial-gradient(ellipse 80% 50% at 20% 0%, rgba(59,130,246,0.07) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 100%, rgba(139,92,246,0.06) 0%, transparent 60%) !important;
}

[data-testid="stSidebar"] {
  background: var(--bg2) !important;
  border-right: 1px solid var(--glass-border) !important;
}

[data-testid="stSidebar"] > div:first-child { padding-top: 0 !important; }

.block-container {
  padding-top: 1.75rem !important;
  padding-left: 2rem !important;
  padding-right: 2rem !important;
  max-width: 1440px !important;
}

body, p, span, div, label, li {
  font-family: 'Inter', sans-serif !important;
  color: var(--text);
}

h1, h2, h3, h4, h5 {
  font-family: 'Space Grotesk', sans-serif !important;
  font-weight: 600;
  color: var(--text);
}

code, pre { font-family: 'JetBrains Mono', monospace !important; }

/* ---- Scrollbar ---- */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: var(--bg2); }
::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.4); border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: var(--blue); }

/* ---- Sidebar Logo ---- */
.sidebar-logo {
  padding: 1.75rem 1.25rem 1.25rem;
  border-bottom: 1px solid var(--glass-border);
  margin-bottom: .75rem;
}
.sidebar-logo-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.35rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--blue), var(--cyan));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: -.02em;
}
.sidebar-logo-sub {
  font-size: .72rem;
  color: var(--muted);
  margin: .15rem 0 0;
  letter-spacing: .05em;
  text-transform: uppercase;
}

/* ---- Nav Radio ---- */
[data-testid="stRadio"] > label { display: none !important; }
[data-testid="stRadio"] > div {
  display: flex;
  flex-direction: column;
  gap: .25rem;
}
[data-testid="stRadio"] > div > label {
  display: flex !important;
  align-items: center;
  gap: .65rem;
  padding: .65rem 1rem !important;
  border-radius: var(--radius-sm) !important;
  cursor: pointer;
  transition: var(--transition) !important;
  border: 1px solid transparent !important;
  color: var(--muted) !important;
  font-size: .88rem !important;
  font-weight: 500 !important;
}
[data-testid="stRadio"] > div > label:hover {
  background: var(--glass) !important;
  border-color: var(--glass-border) !important;
  color: var(--text) !important;
}
[data-testid="stRadio"] > div > label[data-checked="true"],
[data-testid="stRadio"] > div > label:has(input:checked) {
  background: rgba(59,130,246,0.12) !important;
  border-color: rgba(59,130,246,0.35) !important;
  color: var(--blue) !important;
}
[data-testid="stRadio"] input { display: none !important; }

/* ---- Metric / KPI Cards ---- */
.w-card {
  background: var(--glass);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  padding: 1.25rem 1.4rem;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}
.w-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--blue), var(--cyan));
  opacity: 0;
  transition: var(--transition);
}
.w-card:hover { border-color: rgba(59,130,246,0.4); box-shadow: 0 0 24px var(--blue-glow); }
.w-card:hover::before { opacity: 1; }

.w-label {
  font-size: .68rem;
  font-weight: 600;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: .4rem;
}
.w-value {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.65rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.1;
  letter-spacing: -.03em;
}
.w-delta-pos {
  font-size: .78rem;
  color: var(--cyan);
  margin-top: .3rem;
  display: flex;
  align-items: center;
  gap: .3rem;
}
.w-delta-neg {
  font-size: .78rem;
  color: #F87171;
  margin-top: .3rem;
  display: flex;
  align-items: center;
  gap: .3rem;
}

/* ---- Topbar ---- */
.topbar-shell {
  background: rgba(11,17,32,0.78);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  padding: 1rem 1.25rem;
  margin: 0 0 1.25rem;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-shadow: 0 18px 50px rgba(2,6,23,0.35);
}
.topbar-kicker {
  font-size: .68rem;
  color: var(--muted);
  letter-spacing: .18em;
  text-transform: uppercase;
  margin-bottom: .35rem;
}
.topbar-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}
.topbar-subtitle {
  font-size: .82rem;
  color: var(--muted);
  margin-top: .2rem;
}

/* ---- Section Header ---- */
.glass-surface {
  background: rgba(148,163,184,0.08);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 14px 36px rgba(2,6,23,0.22);
}
.hero-shell {
  padding: 1.35rem 1.45rem;
  margin-bottom: 1.2rem;
}
.hero-eyebrow {
  font-size: .68rem;
  text-transform: uppercase;
  letter-spacing: .18em;
  color: var(--cyan);
  margin-bottom: .4rem;
}
.hero-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.15;
  letter-spacing: -.04em;
}
.hero-subtitle {
  color: var(--muted);
  font-size: .92rem;
  margin-top: .45rem;
  max-width: 72ch;
}
.section-shell {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  margin: 1.4rem 0 .9rem;
}
.section-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}
.section-meta {
  margin-top: .2rem;
  font-size: .72rem;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--muted);
}
.section-rule {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(148,163,184,0.18), rgba(59,130,246,0.22), rgba(148,163,184,0.1));
  margin-bottom: .45rem;
}
.metric-card {
  padding: 1.15rem 1.25rem;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}
.metric-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(59,130,246,0.08), transparent 40%, rgba(139,92,246,0.05));
  opacity: 0;
  transition: var(--transition);
}
.metric-card:hover {
  transform: translateY(-2px);
  border-color: rgba(59,130,246,0.35);
  box-shadow: 0 18px 40px rgba(2,6,23,0.28), 0 0 24px rgba(59,130,246,0.12);
}
.metric-card:hover::before { opacity: 1; }
.metric-label {
  font-size: .68rem;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: .35rem;
}
.metric-value {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.55rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.1;
}
.metric-delta-positive,
.metric-delta-negative,
.metric-hint {
  position: relative;
  z-index: 1;
  margin-top: .35rem;
  font-size: .78rem;
}
.metric-delta-positive { color: var(--cyan); }
.metric-delta-negative { color: #F87171; }
.metric-hint { color: var(--muted); }
.w-section {
  display: flex;
  align-items: center;
  gap: .7rem;
  margin: 1.75rem 0 1rem;
}
.w-section-icon {
  width: 30px; height: 30px;
  border-radius: 8px;
  background: rgba(59,130,246,0.15);
  border: 1px solid rgba(59,130,246,0.3);
  display: flex; align-items: center; justify-content: center;
  font-size: .85rem;
  color: var(--blue);
}
.w-section-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}
.w-section-line {
  flex: 1;
  height: 1px;
  background: var(--glass-border);
}

/* ---- Glass Panel ---- */
.w-panel {
  background: var(--glass);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  padding: 1.5rem;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* ---- Page Header ---- */
.w-page-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.75rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--glass-border);
}
.w-page-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(34,211,238,0.1));
  border: 1px solid rgba(59,130,246,0.3);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}
.w-page-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 .15rem;
  letter-spacing: -.03em;
}
.w-page-sub {
  font-size: .82rem;
  color: var(--muted);
  margin: 0;
}

/* ---- Buttons ---- */
.stButton > button {
  font-family: 'Space Grotesk', sans-serif !important;
  font-size: .875rem !important;
  font-weight: 500 !important;
  border-radius: var(--radius-sm) !important;
  padding: .55rem 1.25rem !important;
  transition: var(--transition) !important;
  border: 1px solid var(--glass-border) !important;
  background: var(--glass) !important;
  color: var(--text) !important;
  letter-spacing: .01em !important;
}
.stButton > button:hover {
  background: rgba(59,130,246,0.15) !important;
  border-color: rgba(59,130,246,0.5) !important;
  color: var(--blue) !important;
  box-shadow: 0 0 16px var(--blue-glow) !important;
  transform: translateY(-1px) !important;
}
.stButton > button:active { transform: translateY(0) !important; }

/* Primary button variant */
.stButton > button[kind="primary"] {
  background: linear-gradient(135deg, var(--blue), var(--violet)) !important;
  border-color: transparent !important;
  color: #fff !important;
  box-shadow: 0 4px 16px rgba(59,130,246,0.3) !important;
}
.stButton > button[kind="primary"]:hover {
  box-shadow: 0 6px 24px rgba(59,130,246,0.5) !important;
  color: #fff !important;
  transform: translateY(-2px) !important;
}

/* ---- Inputs / Selectbox / Text area ---- */
.stTextInput > div > div > input,
.stTextArea > div > div > textarea,
.stSelectbox > div > div > div {
  background: var(--bg2) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius-sm) !important;
  color: var(--text) !important;
  font-family: 'Inter', sans-serif !important;
  transition: var(--transition) !important;
}
.stTextInput > div > div > input:focus,
.stTextArea > div > div > textarea:focus {
  border-color: var(--blue) !important;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important;
  outline: none !important;
}

/* ---- File Uploader ---- */
[data-testid="stFileUploader"] {
  background: var(--glass) !important;
  border: 1.5px dashed rgba(59,130,246,0.35) !important;
  border-radius: var(--radius) !important;
  transition: var(--transition) !important;
}
[data-testid="stFileUploader"]:hover {
  border-color: var(--blue) !important;
  background: rgba(59,130,246,0.06) !important;
}

/* ---- Tabs ---- */
.stTabs [data-baseweb="tab-list"] {
  background: var(--bg2) !important;
  border-radius: var(--radius-sm) !important;
  padding: .25rem !important;
  gap: .2rem !important;
  border: 1px solid var(--glass-border) !important;
}
.stTabs [data-baseweb="tab"] {
  background: transparent !important;
  border-radius: 6px !important;
  color: var(--muted) !important;
  font-family: 'Space Grotesk', sans-serif !important;
  font-weight: 500 !important;
  font-size: .875rem !important;
  transition: var(--transition) !important;
  border: none !important;
}
.stTabs [aria-selected="true"] {
  background: rgba(59,130,246,0.15) !important;
  color: var(--blue) !important;
}

/* ---- DataFrames ---- */
[data-testid="stDataFrame"] {
  border-radius: var(--radius) !important;
  border: 1px solid var(--glass-border) !important;
  overflow: hidden !important;
}

/* ---- Metric native ---- */
[data-testid="stMetric"] {
  background: var(--glass);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  padding: 1rem 1.25rem;
  transition: var(--transition);
}
[data-testid="stMetric"]:hover {
  border-color: rgba(59,130,246,0.35);
  box-shadow: 0 0 20px var(--blue-glow);
}
[data-testid="stMetricLabel"] > div {
  font-size: .68rem !important;
  font-weight: 600 !important;
  letter-spacing: .08em !important;
  text-transform: uppercase !important;
  color: var(--muted) !important;
}
[data-testid="stMetricValue"] > div {
  font-family: 'Space Grotesk', sans-serif !important;
  font-size: 1.6rem !important;
  font-weight: 700 !important;
  color: var(--text) !important;
  letter-spacing: -.03em !important;
}
[data-testid="stMetricDelta"] svg { display: none !important; }
[data-testid="stMetricDelta"] > div { font-size: .8rem !important; font-weight: 500 !important; }

/* ---- Spinner / status ---- */
[data-testid="stSpinner"] > div { border-top-color: var(--blue) !important; }

/* ---- Alerts ---- */
[data-testid="stAlert"] {
  border-radius: var(--radius-sm) !important;
  border-left-width: 3px !important;
  font-size: .88rem !important;
}

/* ---- Divider ---- */
hr { border-color: var(--glass-border) !important; margin: 1.25rem 0 !important; }

/* ---- Expander ---- */
.streamlit-expanderHeader {
  background: var(--glass) !important;
  border-radius: var(--radius-sm) !important;
  border: 1px solid var(--glass-border) !important;
  font-family: 'Space Grotesk', sans-serif !important;
  font-weight: 500 !important;
  transition: var(--transition) !important;
}
.streamlit-expanderHeader:hover {
  border-color: rgba(59,130,246,0.4) !important;
  color: var(--blue) !important;
}

/* ---- Chat messages ---- */
[data-testid="stChatMessage"] {
  background: var(--glass) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius) !important;
  margin-bottom: .75rem !important;
  transition: var(--transition) !important;
}
[data-testid="stChatInput"] > div {
  background: var(--bg2) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius-sm) !important;
}
[data-testid="stChatInput"] > div:focus-within {
  border-color: var(--blue) !important;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important;
}

/* ---- Plotly chart containers ---- */
[data-testid="stPlotlyChart"] {
  background: var(--glass) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius) !important;
  overflow: hidden !important;
  padding: .5rem !important;
  transition: var(--transition) !important;
}
[data-testid="stPlotlyChart"]:hover {
  border-color: rgba(59,130,246,0.3) !important;
  box-shadow: 0 0 20px rgba(59,130,246,0.1) !important;
}

/* ---- Slider ---- */
.stSlider > div > div > div > div { background: var(--blue) !important; }
.stSlider > div > div > div { background: var(--glass-border) !important; }

/* ---- Progress bar ---- */
[data-testid="stProgressBar"] > div {
  background: linear-gradient(90deg, var(--blue), var(--cyan)) !important;
  border-radius: 99px !important;
}

/* ---- Badge / tag ---- */
.w-badge {
  display: inline-flex;
  align-items: center;
  gap: .3rem;
  padding: .2rem .6rem;
  border-radius: 99px;
  font-size: .7rem;
  font-weight: 600;
  letter-spacing: .04em;
  text-transform: uppercase;
}
.w-badge-blue  { background: rgba(59,130,246,0.15);  color: var(--blue);   border: 1px solid rgba(59,130,246,0.3); }
.w-badge-cyan  { background: rgba(34,211,238,0.12);  color: var(--cyan);   border: 1px solid rgba(34,211,238,0.3); }
.w-badge-violet{ background: rgba(139,92,246,0.15);  color: var(--violet); border: 1px solid rgba(139,92,246,0.3); }
.w-badge-green { background: rgba(52,211,153,0.12);  color: #34D399;       border: 1px solid rgba(52,211,153,0.3); }
.w-badge-red   { background: rgba(248,113,113,0.12); color: #F87171;       border: 1px solid rgba(248,113,113,0.3); }

/* ---- News card ---- */
.news-card {
  background: var(--glass);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  padding: 1.1rem 1.3rem;
  margin-bottom: .75rem;
  transition: var(--transition);
  cursor: pointer;
  text-decoration: none;
  display: block;
}
.news-card:hover {
  border-color: rgba(59,130,246,0.4);
  background: rgba(59,130,246,0.05);
  transform: translateX(3px);
  box-shadow: -3px 0 0 var(--blue), 0 4px 20px var(--blue-glow);
}
.news-card-source { font-size: .68rem; color: var(--cyan); text-transform: uppercase; letter-spacing: .08em; font-weight: 600; margin-bottom: .3rem; }
.news-card-title  { font-family: 'Space Grotesk', sans-serif; font-size: .95rem; font-weight: 600; color: var(--text); line-height: 1.35; margin-bottom: .4rem; }
.news-card-desc   { font-size: .8rem; color: var(--muted); line-height: 1.5; }
.news-card-meta   { font-size: .72rem; color: rgba(148,163,184,0.6); margin-top: .5rem; }

/* ---- Upload zone ---- */
.upload-zone {
  border: 2px dashed rgba(59,130,246,0.3);
  border-radius: var(--radius);
  padding: 2rem;
  text-align: center;
  background: rgba(59,130,246,0.03);
  transition: var(--transition);
}
.upload-zone:hover {
  border-color: var(--blue);
  background: rgba(59,130,246,0.07);
}

/* ---- Sidebar status dot ---- */
.status-dot {
  display: inline-block;
  width: 7px; height: 7px;
  border-radius: 50%;
  margin-right: .4rem;
  animation: pulse-dot 2s ease-in-out infinite;
}
.status-dot.active  { background: var(--cyan); box-shadow: 0 0 6px var(--cyan); }
.status-dot.inactive{ background: var(--muted); }
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: .4; }
}

/* ---- Loading skeleton ---- */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, rgba(148,163,184,0.06) 25%, rgba(148,163,184,0.12) 50%, rgba(148,163,184,0.06) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
  border-radius: 6px;
}

/* ---- Smooth page entrance ---- */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.block-container { animation: fade-up .35s ease-out; }

/* ---- Hide Streamlit chrome ---- */
#MainMenu, footer, [data-testid="stToolbar"] { display: none !important; }
[data-testid="stDecoration"] { display: none !important; }

</style>
""")

# ===== SIDEBAR =====
with st.sidebar:
    st.markdown("""
    <div class="sidebar-logo">
      <p class="sidebar-logo-title">WealthOS</p>
      <p class="sidebar-logo-sub">Personal Finance Dashboard</p>
    </div>
    """, unsafe_allow_html=True)

    page = st.radio(
        "Navigation",
        ["Dashboard", "Upload Data", "AI Advisor", "Market News"],
        format_func=lambda x: {
            "Dashboard": "Dashboard",
            "Upload Data": "Upload Data",
            "AI Advisor": "AI Advisor",
            "Market News": "Market News",
        }[x],
        label_visibility="collapsed"
    )

    st.markdown("<div style='height:.5rem'></div>", unsafe_allow_html=True)
    st.markdown("<hr style='margin:.5rem 0'>", unsafe_allow_html=True)

    if st.session_state.portfolio_data is not None:
        n = len(st.session_state.portfolio_data)
        st.markdown(f"""
        <div style='padding:.5rem 1rem;font-size:.8rem;color:#94A3B8'>
          <span class='status-dot active'></span>{n} holdings loaded
        </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown("""
        <div style='padding:.5rem 1rem;font-size:.8rem;color:#94A3B8'>
          <span class='status-dot inactive'></span>No portfolio loaded
        </div>
        """, unsafe_allow_html=True)

    if st.button("Refresh Prices", use_container_width=True):
        if st.session_state.portfolio_data is not None:
            from core.price_fetcher import fetch_live_prices
            symbols = st.session_state.portfolio_data['Symbol'].tolist()
            with st.spinner("Fetching live prices..."):
                st.session_state.live_prices = fetch_live_prices(symbols, force_refresh=True)
            st.success("Prices refreshed!")
        else:
            st.warning("Load a portfolio first.")

st.markdown(f"""
<div class="topbar-shell">
  <div class="topbar-kicker">{page}</div>
  <div class="topbar-title">Premium AI-powered wealth intelligence</div>
  <div class="topbar-subtitle">Portfolio monitoring, research, and contextual CFO guidance in one surface.</div>
</div>
""", unsafe_allow_html=True)

top_left, top_mid, top_right = st.columns([2.2, 1.9, 1.0])

with top_left:
    st.text_input(
        "Search",
        placeholder="Search holdings, symbols, reports, or market news",
        key="global_search",
        label_visibility="collapsed"
    )

with top_mid:
    st.markdown(
        f"<div style='padding:.74rem 1rem;border:1px solid var(--glass-border);border-radius:14px;background:rgba(148,163,184,0.06);color:var(--muted);font-size:.82rem'>"
        f"{len(st.session_state.portfolio_data) if st.session_state.portfolio_data is not None else 0} holdings monitored"
        f"</div>",
        unsafe_allow_html=True
    )

with top_right:
    if st.button("Sync", use_container_width=True):
        if st.session_state.portfolio_data is not None:
            from core.price_fetcher import fetch_live_prices
            symbols = st.session_state.portfolio_data['Symbol'].tolist()
            with st.spinner("Refreshing prices..."):
                st.session_state.live_prices = fetch_live_prices(symbols, force_refresh=True)
            st.success("Synced")
        else:
            st.warning("Load a portfolio first.")

st.markdown("""
<div style='text-align:center;font-size:.68rem;color:rgba(148,163,184,0.4);letter-spacing:.05em;margin-top:1rem'>
  WEALTHOS v1.0 &nbsp;&bull;&nbsp; POWERED BY GEMINI
</div>
""", unsafe_allow_html=True)

# ===== IMPORTS =====
from ui.dashboard    import render_dashboard
from ui.upload_page  import render_upload_page
from ui.advisor_page import render_advisor_page
from ui.news_page    import render_news_page

# ===== ROUTING =====
if page == "Dashboard":
    render_dashboard()
elif page == "Upload Data":
    render_upload_page()
elif page == "AI Advisor":
    render_advisor_page()
elif page == "Market News":
    render_news_page()
