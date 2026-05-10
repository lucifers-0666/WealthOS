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
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<style>

/* =============================================
   WEALTHOS — LUXURY CINEMATIC FINTECH OS
   ============================================= */

:root {
  --bg:          #020617;
  --bg-secondary:#07111F;
  --card-surface:#0B1728;
  --panel-deep:  #101827;
  --text-primary:#F3F4F6;
  --text-secondary:#94A3B8;
  --text-muted:  #64748B;
  --accent-cyan: #7DD3FC;
  --accent-purple:#A78BFA;
  --accent-gold: #D6C7A1;
  --accent-soft-cyan:#67E8F9;
  --border-color:rgba(148,163,184,0.14);
  --soft-glow:   rgba(125,211,252,0.10);
  --radius-lg:   16px;
  --radius-md:   12px;
  --radius-sm:   8px;
  --transition-smooth: all 0.2s cubic-bezier(0.4,0,0.2,1);
  --transition-cinematic: all 0.3s cubic-bezier(0.25,0.46,0.45,0.94);
}

/* ---- Base ---- */
* { box-sizing: border-box; }

html, body {
  background: linear-gradient(135deg, #020617 0%, #0A1628 50%, #020617 100%);
  background-attachment: fixed;
  color: var(--text-primary);
}

body::before {
  content: '';
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: 
    radial-gradient(circle at 20% 30%, rgba(125,211,252,0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(167,139,250,0.06) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
}

[data-testid="stAppViewContainer"] {
  background: transparent !important;
}

[data-testid="stSidebar"] {
  background: linear-gradient(180deg, rgba(11,23,40,0.8) 0%, rgba(7,17,31,0.9) 100%) !important;
  border-right: 1px solid var(--border-color) !important;
  backdrop-filter: blur(12px) !important;
}

[data-testid="stSidebar"] > div:first-child { padding-top: 0 !important; }

.block-container {
  padding-top: 2rem !important;
  padding-left: 2.5rem !important;
  padding-right: 2.5rem !important;
  max-width: 1520px !important;
  margin-left: auto !important;
  margin-right: auto !important;
}

body, p, span, div, label, li {
  font-family: 'Inter', sans-serif !important;
  color: var(--text-primary);
}

h1, h2, h3, h4, h5 {
  font-family: 'Space Grotesk', sans-serif !important;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

h1 { font-size: 2.2rem; line-height: 1.1; }
h2 { font-size: 1.8rem; line-height: 1.15; }
h3 { font-size: 1.3rem; line-height: 1.2; }

code, pre { font-family: 'IBM Plex Mono', monospace !important; font-size: 0.85rem; }

/* ---- Scrollbar ---- */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: rgba(11,23,40,0.4); }
::-webkit-scrollbar-thumb { background: rgba(125,211,252,0.3); border-radius: 8px; }
::-webkit-scrollbar-thumb:hover { background: var(--accent-cyan); }

/* ---- Sidebar Logo ---- */
.sidebar-logo {
  padding: 2rem 1.5rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1.5rem;
}

.sidebar-logo-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.4rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-cyan), var(--accent-gold));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: -0.03em;
}

.sidebar-logo-sub {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin: 0.25rem 0 0;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* ---- Nav Radio ---- */
[data-testid="stRadio"] > label { display: none !important; }
[data-testid="stRadio"] > div {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

[data-testid="stRadio"] > div > label {
  display: flex !important;
  align-items: center;
  gap: 0.8rem;
  padding: 0.75rem 1rem !important;
  border-radius: var(--radius-md) !important;
  cursor: pointer;
  transition: var(--transition-smooth) !important;
  border: 1px solid transparent !important;
  color: var(--text-secondary) !important;
  font-size: 0.9rem !important;
  font-weight: 500 !important;
}

[data-testid="stRadio"] > div > label:hover {
  background: rgba(125,211,252,0.08) !important;
  border-color: var(--border-color) !important;
  color: var(--accent-cyan) !important;
}

[data-testid="stRadio"] > div > label[data-checked="true"],
[data-testid="stRadio"] > div > label:has(input:checked) {
  background: rgba(125,211,252,0.12) !important;
  border-color: var(--accent-cyan) !important;
  color: var(--accent-cyan) !important;
  box-shadow: inset 0 0 8px rgba(125,211,252,0.1) !important;
}

[data-testid="stRadio"] input { display: none !important; }

/* ---- Premium Cards ---- */
.w-card {
  background: linear-gradient(135deg, rgba(11,23,40,0.6) 0%, rgba(16,24,39,0.5) 100%);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  transition: var(--transition-cinematic);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(8px);
}

.w-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent-cyan), transparent);
  opacity: 0;
  transition: var(--transition-smooth);
}

.w-card:hover {
  border-color: var(--accent-cyan);
  background: linear-gradient(135deg, rgba(11,23,40,0.8) 0%, rgba(16,24,39,0.7) 100%);
  box-shadow: 0 8px 24px rgba(125,211,252,0.12), inset 0 0 0 1px rgba(125,211,252,0.1);
}

.w-card:hover::before { opacity: 1; }

.w-label {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.w-value {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.w-delta-pos {
  font-size: 0.8rem;
  color: #34D399;
  margin-top: 0.4rem;
}

.w-delta-neg {
  font-size: 0.8rem;
  color: #F87171;
  margin-top: 0.4rem;
}

/* ---- Topbar ---- */
.topbar-shell {
  background: linear-gradient(135deg, rgba(11,23,40,0.7) 0%, rgba(7,17,31,0.6) 100%);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem;
  margin: 0 0 1.5rem;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.3);
}

.topbar-kicker {
  font-size: 0.65rem;
  color: var(--text-muted);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 0.4rem;
}

.topbar-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.topbar-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

/* ---- Section Header ---- */
.glass-surface {
  background: linear-gradient(135deg, rgba(11,23,40,0.5) 0%, rgba(16,24,39,0.4) 100%);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.hero-shell {
  padding: 1.5rem 1.75rem;
  margin-bottom: 1.5rem;
}

.hero-eyebrow {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--accent-cyan);
  margin-bottom: 0.5rem;
}

.hero-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.15;
  letter-spacing: -0.04em;
}

.hero-subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-top: 0.5rem;
  max-width: 75ch;
  line-height: 1.6;
}

.section-shell {
  display: flex;
  align-items: flex-end;
  gap: 1.2rem;
  margin: 1.75rem 0 1.2rem;
}

.section-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.section-meta {
  margin-top: 0.3rem;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.section-rule {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-color), transparent);
  margin-bottom: 0.5rem;
}
/* ---- Metric Cards ---- */
.metric-card {
  padding: 1.25rem;
  transition: var(--transition-cinematic);
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(16,24,39,0.6) 0%, rgba(11,23,40,0.5) 100%);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  backdrop-filter: blur(8px);
}

.metric-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 0%, rgba(125,211,252,0.1) 0%, transparent 60%);
  opacity: 0;
  transition: var(--transition-smooth);
}

.metric-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent-cyan);
  box-shadow: 0 12px 32px rgba(125,211,252,0.1), inset 0 0 0 1px rgba(125,211,252,0.08);
  background: linear-gradient(135deg, rgba(16,24,39,0.8) 0%, rgba(11,23,40,0.7) 100%);
}

.metric-card:hover::before { opacity: 1; }

.metric-label {
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 0.4rem;
}

.metric-value {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
}

.metric-delta-positive {
  color: #34D399;
  font-size: 0.8rem;
  margin-top: 0.35rem;
}

.metric-delta-negative {
  color: #F87171;
  font-size: 0.8rem;
  margin-top: 0.35rem;
}

.metric-hint {
  color: var(--text-secondary);
  font-size: 0.8rem;
  margin-top: 0.35rem;
}
.w-section { display: flex; align-items: center; gap: 0.8rem; margin: 1.75rem 0 1rem; }
.w-section-icon { width: 32px; height: 32px; border-radius: 8px; background: rgba(125,211,252,0.1); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 0.9rem; color: var(--accent-cyan); }
.w-section-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.05rem; font-weight: 600; color: var(--text-primary); margin: 0; }
.w-section-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, var(--border-color), transparent); }

.w-panel {
  background: linear-gradient(135deg, rgba(16,24,39,0.5) 0%, rgba(11,23,40,0.4) 100%);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  backdrop-filter: blur(8px);
}

.w-page-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.75rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border-color);
}

.w-page-icon {
  width: 48px; height: 48px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, rgba(125,211,252,0.15), rgba(167,139,250,0.1));
  border: 1px solid var(--border-color);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}

.w-page-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.2rem;
  letter-spacing: -0.03em;
}

.w-page-sub {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
}

/* ---- Buttons ---- */
.stButton > button {
  font-family: 'Space Grotesk', sans-serif !important;
  font-size: 0.9rem !important;
  font-weight: 500 !important;
  border-radius: var(--radius-md) !important;
  padding: 0.65rem 1.5rem !important;
  transition: var(--transition-smooth) !important;
  border: 1px solid var(--border-color) !important;
  background: linear-gradient(135deg, rgba(16,24,39,0.7) 0%, rgba(11,23,40,0.6) 100%) !important;
  color: var(--text-primary) !important;
  letter-spacing: 0.01em !important;
}

.stButton > button:hover {
  background: linear-gradient(135deg, rgba(125,211,252,0.15) 0%, rgba(167,139,250,0.1) 100%) !important;
  border-color: var(--accent-cyan) !important;
  color: var(--accent-cyan) !important;
  transform: translateY(-1px) !important;
}

.stButton > button[kind="primary"] {
  background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple)) !important;
  border-color: transparent !important;
  color: #020617 !important;
  box-shadow: 0 6px 20px rgba(125,211,252,0.25) !important;
}

.stButton > button[kind="primary"]:hover {
  box-shadow: 0 8px 28px rgba(125,211,252,0.35) !important;
  transform: translateY(-2px) !important;
}

/* ---- Inputs / Selectbox / Text area ---- */
.stTextInput > div > div > input,
.stTextArea > div > div > textarea,
.stSelectbox > div > div > div {
  background: rgba(11,23,40,0.8) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: var(--radius-md) !important;
  color: var(--text-primary) !important;
  font-family: 'Inter', sans-serif !important;
  font-size: 0.9rem !important;
  padding: 0.75rem 1rem !important;
  transition: var(--transition-smooth) !important;
}
.stTextInput > div > div > input:focus,
.stTextArea > div > div > textarea:focus {
  border-color: var(--accent-cyan) !important;
  box-shadow: 0 0 0 2px rgba(125,211,252,0.1), inset 0 0 0 1px var(--accent-cyan) !important;
  outline: none !important;
}
.stTextInput > label,
.stTextArea > label,
.stSelectbox > label {
  font-family: 'Space Grotesk', sans-serif !important;
  font-weight: 600 !important;
  color: var(--text-primary) !important;
  font-size: 0.85rem !important;
  letter-spacing: 0.02em !important;
}

/* ---- File Uploader ---- */
[data-testid="stFileUploader"] {
  background: linear-gradient(135deg, rgba(16,24,39,0.5) 0%, rgba(11,23,40,0.4) 100%) !important;
  border: 1.5px dashed var(--border-color) !important;
  border-radius: var(--radius-md) !important;
  padding: 2rem !important;
  transition: var(--transition-smooth) !important;
}
[data-testid="stFileUploader"]:hover {
  border-color: var(--accent-cyan) !important;
  background: rgba(125,211,252,0.05) !important;
}
.uploadedFile {
  background: linear-gradient(135deg, rgba(16,24,39,0.6) 0%, rgba(11,23,40,0.5) 100%) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: var(--radius-md) !important;
  padding: 0.75rem !important;
}

/* ---- Tabs ---- */
.stTabs [data-baseweb="tab-list"] {
  background: linear-gradient(135deg, rgba(16,24,39,0.4) 0%, rgba(11,23,40,0.3) 100%) !important;
  border-radius: var(--radius-md) !important;
  padding: 0.4rem !important;
  gap: 0.3rem !important;
  border: 1px solid var(--border-color) !important;
}
.stTabs [data-baseweb="tab"] {
  background: transparent !important;
  border-radius: var(--radius-sm) !important;
  color: var(--text-secondary) !important;
  font-family: 'Space Grotesk', sans-serif !important;
  font-weight: 500 !important;
  font-size: 0.9rem !important;
  transition: var(--transition-smooth) !important;
  border: none !important;
  letter-spacing: 0.01em !important;
}
.stTabs [aria-selected="true"] {
  background: linear-gradient(135deg, rgba(125,211,252,0.15) 0%, rgba(167,139,250,0.1) 100%) !important;
  color: var(--accent-cyan) !important;
  box-shadow: inset 0 0 0 1px rgba(125,211,252,0.2) !important;
}

/* ---- DataFrames ---- */
[data-testid="stDataFrame"] {
  border-radius: var(--radius-md) !important;
  border: 1px solid var(--border-color) !important;
  overflow: hidden !important;
  background: linear-gradient(135deg, rgba(16,24,39,0.5) 0%, rgba(11,23,40,0.4) 100%) !important;
}

/* ---- Metric native ---- */
[data-testid="stMetric"] {
  background: linear-gradient(135deg, rgba(16,24,39,0.6) 0%, rgba(11,23,40,0.5) 100%);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  transition: var(--transition-cinematic);
}
[data-testid="stMetric"]:hover {
  border-color: var(--accent-cyan);
  box-shadow: 0 6px 16px rgba(125,211,252,0.1);
}
[data-testid="stMetricLabel"] > div {
  font-size: 0.65rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.08em !important;
  text-transform: uppercase !important;
  color: var(--text-muted) !important;
}
[data-testid="stMetricValue"] > div {
  font-family: 'Space Grotesk', sans-serif !important;
  font-size: 1.6rem !important;
  font-weight: 700 !important;
  color: var(--text-primary) !important;
  letter-spacing: -0.03em !important;
}
[data-testid="stMetricDelta"] svg { display: none !important; }
[data-testid="stMetricDelta"] > div { font-size: 0.8rem !important; font-weight: 500 !important; color: var(--accent-cyan); }

/* ---- Spinner / status ---- */
[data-testid="stSpinner"] > div { border-top-color: var(--accent-cyan) !important; }

/* ---- Alerts ---- */
[data-testid="stAlert"] {
  border-radius: var(--radius-md) !important;
  border-left-width: 3px !important;
  font-size: 0.9rem !important;
  background: linear-gradient(135deg, rgba(16,24,39,0.6) 0%, rgba(11,23,40,0.5) 100%) !important;
  border: 1px solid var(--border-color) !important;
}

/* ---- Divider ---- */
hr { border-color: var(--border-color) !important; margin: 1.25rem 0 !important; }

/* ---- Expander ---- */
.streamlit-expanderHeader {
  background: linear-gradient(135deg, rgba(16,24,39,0.5) 0%, rgba(11,23,40,0.4) 100%) !important;
  border-radius: var(--radius-md) !important;
  border: 1px solid var(--border-color) !important;
  font-family: 'Space Grotesk', sans-serif !important;
  font-weight: 500 !important;
  transition: var(--transition-smooth) !important;
  color: var(--text-secondary) !important;
}
.streamlit-expanderHeader:hover {
  border-color: var(--accent-cyan) !important;
  color: var(--accent-cyan) !important;
}

/* ---- Chat messages ---- */
[data-testid="stChatMessage"] {
  background: linear-gradient(135deg, rgba(16,24,39,0.6) 0%, rgba(11,23,40,0.5) 100%) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: var(--radius-md) !important;
  margin-bottom: 0.75rem !important;
  transition: var(--transition-smooth) !important;
}
[data-testid="stChatInput"] > div {
  background: rgba(11,23,40,0.8) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: var(--radius-md) !important;
  transition: var(--transition-smooth) !important;
}
[data-testid="stChatInput"] > div:focus-within {
  border-color: var(--accent-cyan) !important;
  box-shadow: 0 0 0 2px rgba(125,211,252,0.1), inset 0 0 0 1px var(--accent-cyan) !important;
}

/* ---- Plotly chart containers ---- */
[data-testid="stPlotlyChart"] {
  background: linear-gradient(135deg, rgba(16,24,39,0.5) 0%, rgba(11,23,40,0.4) 100%) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: var(--radius-md) !important;
  overflow: hidden !important;
  padding: 1rem !important;
  transition: var(--transition-smooth) !important;
}
[data-testid="stPlotlyChart"]:hover {
  border-color: var(--accent-cyan) !important;
  box-shadow: 0 0 16px rgba(125,211,252,0.1) !important;
}

/* ---- Slider ---- */
.stSlider > div > div > div > div { background: var(--accent-cyan) !important; }
.stSlider > div > div > div { background: var(--border-color) !important; }

/* ---- Progress bar ---- */
[data-testid="stProgressBar"] > div {
  background: linear-gradient(90deg, var(--accent-cyan), var(--accent-purple)) !important;
  border-radius: 99px !important;
}

/* ---- Badge / tag ---- */
.w-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.8rem;
  border-radius: 99px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  backdrop-filter: blur(4px);
}
.w-badge-cyan  { background: rgba(125,211,252,0.15);  color: var(--accent-cyan);   border: 1px solid rgba(125,211,252,0.3); }
.w-badge-purple{ background: rgba(167,139,250,0.15);  color: var(--accent-purple); border: 1px solid rgba(167,139,250,0.3); }
.w-badge-gold  { background: rgba(214,199,161,0.15);  color: var(--accent-gold);   border: 1px solid rgba(214,199,161,0.3); }
.w-badge-green { background: rgba(52,211,153,0.12);   color: #34D399;              border: 1px solid rgba(52,211,153,0.3); }
.w-badge-red   { background: rgba(248,113,113,0.12);  color: #F87171;              border: 1px solid rgba(248,113,113,0.3); }

/* ---- News card ---- */
.news-card {
  background: linear-gradient(135deg, rgba(16,24,39,0.6) 0%, rgba(11,23,40,0.5) 100%);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1.15rem 1.3rem;
  margin-bottom: 0.75rem;
  transition: var(--transition-smooth);
  cursor: pointer;
  text-decoration: none;
  display: block;
}
.news-card:hover {
  border-color: var(--accent-cyan);
  background: rgba(125,211,252,0.05);
  transform: translateX(3px);
  box-shadow: -3px 0 0 var(--accent-cyan), 0 4px 16px rgba(125,211,252,0.1);
}
.news-card-source { 
  font-size: 0.68rem; 
  color: var(--accent-cyan); 
  text-transform: uppercase; 
  letter-spacing: 0.08em; 
  font-weight: 600; 
  margin-bottom: 0.3rem; 
}
.news-card-title  { 
  font-family: 'Space Grotesk', sans-serif; 
  font-size: 0.95rem; 
  font-weight: 600; 
  color: var(--text-primary); 
  line-height: 1.35; 
  margin-bottom: 0.4rem; 
}
.news-card-desc   { 
  font-size: 0.8rem; 
  color: var(--text-secondary); 
  line-height: 1.5; 
}
.news-card-meta   { 
  font-size: 0.72rem; 
  color: var(--text-muted); 
  margin-top: 0.5rem; 
}

/* ---- Upload zone ---- */
.upload-zone {
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
  padding: 2rem;
  text-align: center;
  background: rgba(11,23,40,0.5);
  transition: var(--transition-smooth);
}
.upload-zone:hover {
  border-color: var(--accent-cyan);
  background: rgba(125,211,252,0.05);
}

/* ---- Sidebar status dot ---- */
.status-dot {
  display: inline-block;
  width: 7px; height: 7px;
  border-radius: 50%;
  margin-right: 0.4rem;
  animation: pulse-dot 2s ease-in-out infinite;
}
.status-dot.active  { background: var(--accent-cyan); box-shadow: 0 0 6px var(--accent-cyan); }
.status-dot.inactive{ background: var(--text-muted); }
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ---- Loading skeleton ---- */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, rgba(125,211,252,0.06) 25%, rgba(125,211,252,0.12) 50%, rgba(125,211,252,0.06) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
  border-radius: var(--radius-md);
}

/* ---- Smooth page entrance ---- */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.block-container { animation: fade-up 0.35s ease-out; }

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
