"""WealthOS Upload Page — cinematic enterprise-grade data import workspace."""

from __future__ import annotations
import streamlit as st
import pandas as pd
from frontend.design_system import render_topbar


REQUIRED_COLS = {"Ticker", "Qty", "Avg Cost"}

COL_MAP_HINTS = {
    "symbol": "Ticker", "scrip": "Ticker", "stock": "Ticker", "isin": "Ticker",
    "quantity": "Qty", "shares": "Qty", "units": "Qty",
    "avg_price": "Avg Cost", "average_price": "Avg Cost", "buy_price": "Avg Cost",
    "cost": "Avg Cost", "purchase_price": "Avg Cost",
}


def _auto_map(df: pd.DataFrame) -> pd.DataFrame:
    mapped = {}
    for col in df.columns:
        normalised = col.lower().strip().replace(" ", "_")
        if normalised in COL_MAP_HINTS:
            mapped[col] = COL_MAP_HINTS[normalised]
    return df.rename(columns=mapped)


def render_upload_page() -> None:
    render_topbar("Data Import", "Portfolio Upload Workspace")

    # ── Hero ──────────────────────────────────────────────────────────────
    st.markdown("""
    <section class='wo-hero'>
        <div style='position:relative;z-index:2;'>
            <div class='wo-kicker'>Import Engine</div>
            <h1 style='font-family:Space Grotesk,sans-serif;font-size:clamp(1.8rem,2.5vw,2.8rem);
                       letter-spacing:-0.04em;color:#F3F4F6;margin:0.25rem 0 0.8rem;max-width:18ch;'>
                Upload your <span style='color:#7DD3FC;'>holdings</span>.
            </h1>
            <p style='color:#94A3B8;max-width:58ch;font-size:1rem;'>
                Drag in a CSV or XLSX export from Zerodha, Groww, Angel, Upstox, or any broker.
                WealthOS auto-detects column names and normalises your data instantly.
            </p>
        </div>
    </section>
    """, unsafe_allow_html=True)

    # ── Format guide ──────────────────────────────────────────────────────
    with st.expander("Supported format — what columns do I need?", expanded=False):
        st.markdown("""
        <div style='color:#94A3B8;font-size:0.9rem;line-height:1.75;'>
            WealthOS maps common broker column names automatically.<br>
            At minimum your file needs columns for: <strong style='color:#F3F4F6;'>Ticker / Symbol, Quantity, Average Buy Price</strong>.<br><br>
            <strong style='color:#D6C7A1;'>Broker auto-map examples:</strong><br>
            Zerodha Kite → <code>symbol</code>, <code>quantity</code>, <code>average_price</code><br>
            Groww → <code>scrip</code>, <code>units</code>, <code>avg_price</code><br>
            Angel One → <code>stock</code>, <code>shares</code>, <code>buy_price</code><br><br>
            NSE tickers should end in <code>.NS</code>, BSE in <code>.BO</code>.
            International tickers (VTI, QQQ etc.) are used bare.
        </div>
        """, unsafe_allow_html=True)

    st.markdown("<div style='margin:0.5rem 0'></div>", unsafe_allow_html=True)

    col_up, col_demo = st.columns([3, 1], gap="small")

    # ── File upload ────────────────────────────────────────────────────────
    with col_up:
        st.markdown("""
        <div class='wo-panel'>
            <div class='wo-panel-header'>
                <div>
                    <div class='wo-kicker'>File Intake</div>
                    <div class='wo-panel-title'>Upload Holdings or Transactions</div>
                    <div class='wo-panel-subtitle'>CSV or XLSX  ·  up to 50 MB</div>
                </div>
            </div>
        """, unsafe_allow_html=True)

        uploaded = st.file_uploader(
            "Drop your portfolio export here",
            type=["csv", "xlsx", "xls"],
            label_visibility="collapsed",
        )

        if uploaded:
            with st.spinner("Parsing file…"):
                try:
                    if uploaded.name.endswith(".csv"):
                        raw = pd.read_csv(uploaded)
                    else:
                        raw = pd.read_excel(uploaded)

                    df = _auto_map(raw)
                    missing = REQUIRED_COLS - set(df.columns)

                    st.markdown("""
                    <div style='border:1px solid rgba(142,231,184,0.28);border-radius:14px;
                                padding:0.85rem 1rem;background:rgba(142,231,184,0.05);
                                margin:0.75rem 0;'>
                        <span style='color:#8EE7B8;font-weight:700;font-size:0.9rem;'>File parsed successfully</span>
                        <span style='color:#64748B;font-size:0.82rem;margin-left:0.5rem;'>{rows} rows · {cols} columns detected</span>
                    </div>
                    """.format(rows=len(df), cols=len(df.columns)), unsafe_allow_html=True)

                    if missing:
                        st.warning(f"Could not find columns: {missing}. Please map them below.")
                        rename_map = {}
                        for needed in missing:
                            choice = st.selectbox(
                                f"Which column represents {needed}?",
                                options=["— skip —"] + list(raw.columns),
                                key=f"map_{needed}",
                            )
                            if choice != "— skip —":
                                rename_map[choice] = needed
                        if rename_map:
                            df = df.rename(columns=rename_map)

                    st.subheader("Preview")
                    st.dataframe(df.head(10), use_container_width=True)

                    if st.button("Confirm and Load into WealthOS", use_container_width=True):
                        st.session_state["holdings"] = df
                        st.success("Holdings loaded into session. Switch to Dashboard to view analytics.")
                except Exception as e:
                    st.error(f"Could not parse file: {e}")

        st.markdown("</div>", unsafe_allow_html=True)

    # ── Demo data ─────────────────────────────────────────────────────────
    with col_demo:
        st.markdown("""
        <div class='wo-panel' style='height:100%;'>
            <div class='wo-kicker'>Quick Start</div>
            <div class='wo-panel-title' style='margin-bottom:0.6rem;'>Load Demo Portfolio</div>
            <div class='wo-panel-subtitle' style='margin-bottom:1.2rem;'>
                9 holdings: Reliance, Infosys, HDFC Bank, TCS, Wipro, VTI, QQQ, INDA, GoldBees.
            </div>
        """, unsafe_allow_html=True)

        if st.button("Load Demo Data", use_container_width=True):
            demo = pd.DataFrame({
                "Ticker":   ["RELIANCE.NS","INFY.NS","HDFCBANK.NS","TCS.NS","WIPRO.NS","VTI","QQQ","INDA","GOLDBEES.NS"],
                "Name":     ["Reliance","Infosys","HDFC Bank","TCS","Wipro","Vanguard Total","Invesco QQQ","iShares MSCI India","GoldBees"],
                "Qty":      [15, 30, 20, 10, 45, 8, 5, 12, 50],
                "Avg Cost": [2800, 1600, 1650, 3800, 540, 215, 430, 42, 55],
            })
            st.session_state["holdings"] = demo
            st.success("Demo portfolio loaded.")

        st.markdown("""
        <div class='wo-divider' style='margin:1rem 0;'></div>
        <div class='wo-mono' style='line-height:1.8;'>
            RELIANCE.NS<br>INFY.NS<br>HDFCBANK.NS<br>TCS.NS<br>WIPRO.NS<br>VTI<br>QQQ<br>INDA<br>GOLDBEES.NS
        </div>
        """, unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)

    # ── Session state preview ─────────────────────────────────────────────
    if "holdings" in st.session_state:
        st.markdown("<div style='margin:0.75rem 0'></div>", unsafe_allow_html=True)
        st.markdown("""
        <div class='wo-terminal-box'>
            <div style='color:#D6C7A1;font-size:0.72rem;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:0.5rem;'>Session · Active Portfolio</div>
        """, unsafe_allow_html=True)
        st.dataframe(
            st.session_state["holdings"].head(5),
            use_container_width=True,
            height=200,
        )
        st.markdown("</div>", unsafe_allow_html=True)
