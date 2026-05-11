"""WealthOS cinematic luxury design system.
Provides a premium dark fintech UI layer for the Streamlit app.
"""

from __future__ import annotations

import streamlit as st


def load_global_styles() -> None:
    """Inject the WealthOS premium cinematic design system into Streamlit."""
    st.set_page_config(
        page_title="WealthOS",
        page_icon="◈",
        layout="wide",
        initial_sidebar_state="expanded",
    )

    st.markdown(
        """
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

        :root {
            --bg: #020617;
            --bg-soft: #07111F;
            --surface: #0B1728;
            --panel: #101827;
            --panel-2: rgba(16, 24, 39, 0.78);
            --text: #F3F4F6;
            --text-soft: #94A3B8;
            --text-muted: #64748B;
            --accent: #7DD3FC;
            --accent-2: #A78BFA;
            --gold: #D6C7A1;
            --cyan-soft: #67E8F9;
            --border: rgba(148,163,184,0.14);
            --border-strong: rgba(148,163,184,0.26);
            --glow: rgba(125,211,252,0.10);
            --shadow-1: 0 12px 30px rgba(0,0,0,0.28);
            --shadow-2: 0 24px 80px rgba(2,6,23,0.58);
            --radius-sm: 12px;
            --radius-md: 16px;
            --radius-lg: 18px;
            --radius-xl: 24px;
            --space-1: 4px;
            --space-2: 8px;
            --space-3: 12px;
            --space-4: 16px;
            --space-5: 20px;
            --space-6: 24px;
            --space-8: 32px;
            --space-10: 40px;
            --space-12: 48px;
            --space-16: 64px;
            --content: 1440px;
        }

        html, body, [class*="css"] {
            font-family: 'Inter', sans-serif;
        }

        .stApp {
            color: var(--text);
            background:
                radial-gradient(circle at 15% 15%, rgba(125, 211, 252, 0.10), transparent 24%),
                radial-gradient(circle at 82% 18%, rgba(167, 139, 250, 0.07), transparent 22%),
                radial-gradient(circle at 50% 100%, rgba(214, 199, 161, 0.06), transparent 28%),
                linear-gradient(180deg, #030916 0%, #020617 50%, #02050f 100%);
            position: relative;
            overflow-x: hidden;
        }

        .stApp::before {
            content: "";
            position: fixed;
            inset: 0;
            pointer-events: none;
            background-image:
                linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
            background-size: 72px 72px;
            mask-image: radial-gradient(circle at center, black 45%, transparent 100%);
            opacity: 0.18;
        }

        .stApp::after {
            content: "";
            position: fixed;
            inset: 0;
            pointer-events: none;
            background:
                radial-gradient(circle at center, transparent 48%, rgba(2, 6, 23, 0.56) 100%),
                url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
            mix-blend-mode: soft-light;
            opacity: 0.28;
        }

        .block-container {
            max-width: var(--content);
            padding-top: 1.4rem;
            padding-bottom: 2rem;
            padding-left: 2rem;
            padding-right: 2rem;
        }

        [data-testid="stSidebar"] {
            background: linear-gradient(180deg, rgba(7,17,31,0.92) 0%, rgba(5,12,24,0.82) 100%);
            border-right: 1px solid var(--border);
            backdrop-filter: blur(18px);
        }

        [data-testid="stSidebar"] > div:first-child {
            background: transparent;
        }

        [data-testid="stSidebarNav"] {
            padding-top: 1.2rem;
        }

        [data-testid="stSidebarNav"]::before {
            content: 'WEALTHOS';
            display: block;
            margin: 0 0 1rem 0.35rem;
            color: var(--gold);
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.1rem;
            font-weight: 700;
            letter-spacing: 0.18em;
        }

        [data-testid="stSidebarNav"] a {
            margin: 0.2rem 0;
            border-radius: 14px;
            background: transparent;
            border: 1px solid transparent;
            min-height: 46px;
        }

        [data-testid="stSidebarNav"] a:hover {
            background: rgba(125,211,252,0.06);
            border-color: rgba(125,211,252,0.12);
        }

        [data-testid="stSidebarNav"] a[aria-current="page"] {
            background: linear-gradient(180deg, rgba(125,211,252,0.10), rgba(125,211,252,0.04));
            border-color: rgba(125,211,252,0.22);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(125,211,252,0.06);
        }

        [data-testid="stSidebarNav"] span {
            color: var(--text);
            font-size: 0.94rem;
            font-weight: 500;
        }

        .wo-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            padding: 0.9rem 1rem;
            margin-bottom: 1.25rem;
            background: linear-gradient(180deg, rgba(11,23,40,0.75), rgba(16,24,39,0.58));
            border: 1px solid var(--border);
            border-radius: 18px;
            backdrop-filter: blur(18px);
            box-shadow: var(--shadow-1);
        }

        .wo-topbar-left {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .wo-terminal-dot {
            width: 10px;
            height: 10px;
            border-radius: 999px;
            background: var(--gold);
            box-shadow: 0 0 18px rgba(214, 199, 161, 0.22);
        }

        .wo-kicker {
            color: var(--gold);
            text-transform: uppercase;
            letter-spacing: 0.18em;
            font-size: 0.73rem;
            font-weight: 700;
        }

        .wo-heading {
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 700;
            letter-spacing: -0.03em;
            color: var(--text);
            margin: 0;
        }

        .wo-topbar-right {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            flex-wrap: wrap;
            justify-content: flex-end;
        }

        .wo-pill {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.56rem 0.82rem;
            border-radius: 999px;
            border: 1px solid var(--border);
            background: rgba(255,255,255,0.02);
            color: var(--text-soft);
            font-size: 0.78rem;
            font-weight: 500;
        }

        .wo-pill strong {
            color: var(--text);
            font-weight: 600;
        }

        .wo-shell,
        .wo-panel,
        .wo-metric,
        .wo-hero {
            position: relative;
            background: linear-gradient(180deg, rgba(11,23,40,0.92) 0%, rgba(8,17,32,0.86) 100%);
            border: 1px solid var(--border);
            border-radius: 18px;
            box-shadow: var(--shadow-1), var(--shadow-2);
            overflow: hidden;
        }

        .wo-shell::before,
        .wo-panel::before,
        .wo-metric::before,
        .wo-hero::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background: linear-gradient(180deg, rgba(255,255,255,0.035), transparent 32%);
        }

        .wo-shell::after,
        .wo-panel::after,
        .wo-metric::after,
        .wo-hero::after {
            content: "";
            position: absolute;
            inset: 1px;
            pointer-events: none;
            border-radius: 17px;
            border: 1px solid rgba(255,255,255,0.02);
        }

        .wo-hero {
            padding: 1.5rem 1.5rem 1.35rem;
            margin-bottom: 1.25rem;
            background:
                radial-gradient(circle at top right, rgba(125,211,252,0.08), transparent 32%),
                linear-gradient(180deg, rgba(11,23,40,0.95), rgba(8,17,32,0.9));
        }

        .wo-hero-grid {
            display: grid;
            grid-template-columns: 1.35fr 0.9fr;
            gap: 1.2rem;
            position: relative;
            z-index: 2;
        }

        .wo-hero h1 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: clamp(2rem, 3vw, 3.2rem);
            line-height: 1;
            letter-spacing: -0.05em;
            margin: 0.25rem 0 0.85rem;
            color: var(--text);
            max-width: 12ch;
        }

        .wo-hero p {
            font-size: 1rem;
            color: var(--text-soft);
            max-width: 58ch;
            margin: 0;
        }

        .wo-grid-2 {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 1rem;
        }

        .wo-grid-3 {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 1rem;
        }

        .wo-metric {
            padding: 1rem 1rem 0.95rem;
            min-height: 146px;
        }

        .wo-label {
            color: var(--gold);
            text-transform: uppercase;
            letter-spacing: 0.16em;
            font-size: 0.72rem;
            font-weight: 700;
            margin-bottom: 0.8rem;
        }

        .wo-value {
            font-family: 'Space Grotesk', sans-serif;
            font-size: clamp(1.5rem, 2vw, 2.3rem);
            line-height: 1.05;
            letter-spacing: -0.04em;
            color: var(--text);
            margin-bottom: 0.45rem;
        }

        .wo-meta {
            color: var(--text-soft);
            font-size: 0.88rem;
        }

        .wo-delta-up { color: #8EE7B8; }
        .wo-delta-down { color: #FCA5A5; }
        .wo-delta-flat { color: var(--text-soft); }

        .wo-panel {
            padding: 1.1rem 1.15rem;
            margin-bottom: 1rem;
        }

        .wo-panel-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 1rem;
            position: relative;
            z-index: 2;
        }

        .wo-panel-title {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.05rem;
            font-weight: 700;
            letter-spacing: -0.03em;
            color: var(--text);
            margin: 0.1rem 0 0;
        }

        .wo-panel-subtitle {
            font-size: 0.85rem;
            color: var(--text-muted);
            margin-top: 0.25rem;
        }

        .wo-mono {
            font-family: 'IBM Plex Mono', monospace;
            color: var(--text-soft);
            font-size: 0.78rem;
        }

        .wo-divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--border-strong), transparent);
            margin: 0.9rem 0;
        }

        .wo-table-wrap {
            border: 1px solid var(--border);
            border-radius: 16px;
            overflow: hidden;
            background: rgba(255,255,255,0.015);
        }

        .stDataFrame, .stTable {
            border-radius: 16px;
            overflow: hidden;
        }

        .stMetric {
            background: transparent;
            border: 0;
            padding: 0;
        }

        div[data-testid="metric-container"] {
            background: linear-gradient(180deg, rgba(11,23,40,0.92) 0%, rgba(8,17,32,0.86) 100%);
            border: 1px solid var(--border);
            border-radius: 18px;
            padding: 1rem 1rem 0.95rem;
            box-shadow: var(--shadow-1);
        }

        div[data-testid="metric-container"] label {
            color: var(--gold) !important;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            font-size: 0.7rem !important;
            font-weight: 700;
        }

        div[data-testid="metric-container"] [data-testid="stMetricValue"] {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.85rem;
            letter-spacing: -0.04em;
            color: var(--text);
        }

        div[data-testid="metric-container"] [data-testid="stMetricDelta"] {
            font-size: 0.82rem;
        }

        .stTabs [data-baseweb="tab-list"] {
            gap: 0.5rem;
            background: rgba(255,255,255,0.025);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 0.35rem;
        }

        .stTabs [data-baseweb="tab"] {
            border-radius: 12px;
            color: var(--text-soft);
            height: 44px;
            font-weight: 600;
            padding: 0 1rem;
        }

        .stTabs [aria-selected="true"] {
            background: linear-gradient(180deg, rgba(125,211,252,0.12), rgba(125,211,252,0.05));
            color: var(--text);
            border: 1px solid rgba(125,211,252,0.18);
        }

        .stButton > button,
        .stDownloadButton > button,
        button[kind="primary"] {
            border-radius: 14px;
            border: 1px solid rgba(125,211,252,0.18);
            background: linear-gradient(180deg, rgba(125,211,252,0.12), rgba(125,211,252,0.06));
            color: var(--text);
            font-weight: 600;
            padding: 0.7rem 1rem;
            box-shadow: 0 0 0 1px rgba(125,211,252,0.04), inset 0 1px 0 rgba(255,255,255,0.03);
        }

        .stButton > button:hover,
        .stDownloadButton > button:hover,
        button[kind="primary"]:hover {
            border-color: rgba(125,211,252,0.3);
            box-shadow: 0 12px 26px rgba(2,6,23,0.28), 0 0 0 1px rgba(125,211,252,0.08);
            transform: translateY(-1px);
        }

        .stTextInput > div > div > input,
        .stTextArea textarea,
        .stSelectbox [data-baseweb="select"] > div,
        .stNumberInput input,
        .stDateInput input,
        .stMultiSelect [data-baseweb="tag"] {
            background: rgba(255,255,255,0.03) !important;
            color: var(--text) !important;
            border: 1px solid var(--border) !important;
            border-radius: 14px !important;
        }

        .stTextInput > div > div > input:focus,
        .stTextArea textarea:focus,
        .stNumberInput input:focus {
            border-color: rgba(125,211,252,0.26) !important;
            box-shadow: 0 0 0 4px rgba(125,211,252,0.08) !important;
        }

        .stFileUploader {
            background: linear-gradient(180deg, rgba(11,23,40,0.92) 0%, rgba(8,17,32,0.86) 100%);
            border: 1px dashed rgba(125,211,252,0.25);
            border-radius: 18px;
            padding: 0.8rem;
        }

        .stAlert {
            border-radius: 16px;
            border: 1px solid var(--border) !important;
            background: rgba(11,23,40,0.84) !important;
            color: var(--text) !important;
        }

        .stMarkdown, .stCaption, p, li, span, label {
            color: var(--text-soft);
        }

        h1, h2, h3, h4 {
            font-family: 'Space Grotesk', sans-serif;
            color: var(--text);
            letter-spacing: -0.03em;
        }

        .wo-section-title {
            margin-bottom: 0.75rem;
        }

        .wo-inline-stats {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 0.75rem;
            margin-top: 1rem;
        }

        .wo-stat-chip {
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 0.85rem;
            background: rgba(255,255,255,0.02);
        }

        .wo-stat-chip .v {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.05rem;
            color: var(--text);
            margin-top: 0.25rem;
        }

        .wo-news-card {
            border: 1px solid var(--border);
            border-radius: 18px;
            padding: 1rem;
            background: linear-gradient(180deg, rgba(11,23,40,0.88), rgba(8,17,32,0.82));
            box-shadow: var(--shadow-1);
            min-height: 100%;
        }

        .wo-news-card h4 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1rem;
            margin: 0.4rem 0 0.65rem;
        }

        .wo-sentiment {
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            padding: 0.34rem 0.62rem;
            border-radius: 999px;
            font-size: 0.74rem;
            border: 1px solid var(--border);
            color: var(--text-soft);
        }

        .wo-terminal-box {
            border: 1px solid var(--border);
            border-radius: 18px;
            background: rgba(4,10,20,0.88);
            padding: 1rem;
            font-family: 'IBM Plex Mono', monospace;
            color: #c7d2fe;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
        }

        .wo-chat-bubble {
            border-radius: 18px;
            padding: 1rem 1.1rem;
            border: 1px solid var(--border);
            background: linear-gradient(180deg, rgba(11,23,40,0.92), rgba(7,17,31,0.82));
            margin-bottom: 0.9rem;
        }

        .wo-chat-bubble.ai {
            border-color: rgba(125,211,252,0.18);
        }

        .wo-chat-bubble.user {
            border-color: rgba(214,199,161,0.16);
            background: linear-gradient(180deg, rgba(24,24,30,0.92), rgba(13,18,28,0.88));
        }

        [data-testid="stExpander"] {
            border: 1px solid var(--border);
            border-radius: 16px;
            background: rgba(255,255,255,0.02);
            overflow: hidden;
        }

        [data-testid="stExpander"] details summary {
            padding-top: 0.35rem;
            padding-bottom: 0.35rem;
        }

        @media (max-width: 1100px) {
            .wo-hero-grid,
            .wo-grid-3,
            .wo-grid-2,
            .wo-inline-stats {
                grid-template-columns: 1fr;
            }
            .block-container {
                padding-left: 1rem;
                padding-right: 1rem;
            }
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def render_topbar(page_title: str, page_note: str = "Live portfolio intelligence") -> None:
    st.markdown(
        f"""
        <div class="wo-topbar">
            <div class="wo-topbar-left">
                <span class="wo-terminal-dot"></span>
                <div>
                    <div class="wo-kicker">Cinematic Wealth Intelligence</div>
                    <h2 class="wo-heading">{page_title}</h2>
                </div>
            </div>
            <div class="wo-topbar-right">
                <span class="wo-pill"><strong>Market</strong> Synced</span>
                <span class="wo-pill"><strong>AI</strong> Advisor Online</span>
                <span class="wo-pill"><strong>Mode</strong> {page_note}</span>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_hero(title: str, description: str, right_html: str = "") -> None:
    st.markdown(
        f"""
        <section class="wo-hero">
            <div class="wo-hero-grid">
                <div>
                    <div class="wo-kicker">Financial Operating System</div>
                    <h1>{title}</h1>
                    <p>{description}</p>
                </div>
                <div>
                    {right_html}
                </div>
            </div>
        </section>
        """,
        unsafe_allow_html=True,
    )


def panel_start(title: str, subtitle: str = "", meta: str = "") -> None:
    meta_html = f'<div class="wo-mono">{meta}</div>' if meta else ""
    subtitle_html = f'<div class="wo-panel-subtitle">{subtitle}</div>' if subtitle else ""
    st.markdown(
        f"""
        <section class="wo-panel">
            <div class="wo-panel-header">
                <div>
                    <div class="wo-kicker">Analysis Layer</div>
                    <div class="wo-panel-title">{title}</div>
                    {subtitle_html}
                </div>
                {meta_html}
            </div>
        """,
        unsafe_allow_html=True,
    )


def panel_end() -> None:
    st.markdown("</section>", unsafe_allow_html=True)
