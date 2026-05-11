"""WealthOS Upload Page — cinematic enterprise-grade data import workspace."""

from __future__ import annotations
import streamlit as st
import pandas as pd
from frontend.design_system import render_topbar, render_hero, panel_start, panel_end


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
    render_topbar("Data Import", "Upload Pipeline")
    render_hero(
        "Import your <span style='color:#7DD3FC;'>holdings</span>.",
        "Drag in a CSV or XLSX export from Zerodha, Groww, Angel, Upstox, or any broker. "
        "WealthOS auto-detects column names and normalises your data instantly.",
    )

    # ── Format guide ────────────────────────────────────────────────────────
    with st.expander("Supported format \u2014 what columns do I need?", expanded=False):
        st.markdown("""
        <div style='color:#94A3B8;font-size:0.9rem;line-height:1.8;padding:0.25rem 0;'>
            WealthOS maps common broker column names automatically.<br>
            At minimum your file needs columns for:
            <strong style='color:#F3F4F6;'>Ticker / Symbol, Quantity, Average Buy Price</strong>.<br><br>
            <strong style='color:#D6C7A1;'>Broker auto-map:</strong><br>
            Zerodha Kite \u2192 <code>symbol</code>, <code>quantity</code>, <code>average_price</code><br>
            Groww \u2192 <code>scrip</code>, <code>units</code>, <code>avg_price</code><br>
            Angel One \u2192 <code>stock</code>, <code>shares</code>, <code>buy_price</code><br><br>
            NSE tickers end in <code>.NS</code>, BSE in <code>.BO</code>.
            International tickers (VTI, QQQ) are used bare.
        </div>
        """, unsafe_allow_html=True)

    st.markdown("<div style='margin:0.75rem 0'></div>", unsafe_allow_html=True)

    col_up, col_demo = st.columns([3, 1], gap="small")

    # ── File upload panel ──────────────────────────────────────────────────
    with col_up:
        panel_start("Upload Holdings or Transactions", "CSV or XLSX \u00b7 up to 50 MB", meta="File Intake")

        uploaded = st.file_uploader(
            "Drop your portfolio export here",
            type=["csv", "xlsx", "xls"],
            label_visibility="collapsed",
        )

        if uploaded:
            with st.spinner("Parsing file\u2026"):
                try:
                    if uploaded.name.endswith(".csv"):
                        raw = pd.read_csv(uploaded)
                    else:
                        raw = pd.read_excel(uploaded)

                    df = _auto_map(raw)
                    missing = REQUIRED_COLS - set(df.columns)

                    st.markdown(f"""
                    <div style='border:1px solid rgba(142,231,184,0.28);border-radius:14px;
                                padding:0.85rem 1.1rem;background:rgba(142,231,184,0.05);
                                margin:0.75rem 0;display:flex;align-items:center;gap:0.75rem;'>
                        <span style='color:#8EE7B8;font-weight:700;font-size:0.9rem;'>\u2713 File parsed</span>
                        <span style='color:#64748B;font-size:0.82rem;'>
                            {len(df)} rows \u00b7 {len(df.columns)} columns detected
                        </span>
                    </div>
                    """, unsafe_allow_html=True)

                    if missing:
                        st.warning(f"Could not auto-detect columns: {missing}. Map them below.")
                        rename_map = {}
                        for needed in missing:
                            choice = st.selectbox(
                                f"Which column is '{needed}'?",
                                options=["\u2014 skip \u2014"] + list(raw.columns),
                                key=f"map_{needed}",
                            )
                            if choice != "\u2014 skip \u2014":
                                rename_map[choice] = needed
                        if rename_map:
                            df = df.rename(columns=rename_map)

                    st.markdown("""
                    <div class='wo-panel-header' style='margin:1rem 0 0.5rem;'>
                        <div class='wo-kicker'>Data Preview</div>
                    </div>""", unsafe_allow_html=True)

                    st.markdown("<div class='wo-table-wrap'>", unsafe_allow_html=True)
                    st.dataframe(df.head(10), use_container_width=True)
                    st.markdown("</div>", unsafe_allow_html=True)

                    if st.button("\u2713 Confirm and Load into WealthOS", use_container_width=True):
                        st.session_state["holdings"] = df
                        st.markdown("""
                        <div style='border:1px solid rgba(125,211,252,0.25);border-radius:14px;
                                    padding:0.85rem 1.1rem;background:rgba(125,211,252,0.05);
                                    margin-top:0.75rem;color:#7DD3FC;font-size:0.9rem;'>
                            \u2713 Holdings loaded. Switch to Dashboard to view analytics.
                        </div>
                        """, unsafe_allow_html=True)

                except Exception as e:
                    st.markdown(f"""
                    <div style='border:1px solid rgba(252,165,165,0.3);border-radius:14px;
                                padding:0.85rem 1.1rem;background:rgba(252,165,165,0.05);
                                margin:0.75rem 0;color:#FCA5A5;font-size:0.9rem;'>
                        \u2715 Parse error: {e}
                    </div>
                    """, unsafe_allow_html=True)

        panel_end()

    # ── Demo panel ─────────────────────────────────────────────────────────
    with col_demo:
        st.markdown("""
        <div class='wo-panel' style='height:100%;'>
            <div class='wo-kicker'>Quick Start</div>
            <div class='wo-panel-title' style='margin-bottom:0.5rem;'>Demo Portfolio</div>
            <div class='wo-panel-subtitle' style='margin-bottom:1rem;'>
                9 holdings across Indian & global markets.
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
            st.markdown("""
            <div style='border:1px solid rgba(125,211,252,0.25);border-radius:14px;
                        padding:0.75rem 0.9rem;background:rgba(125,211,252,0.05);
                        margin-top:0.5rem;color:#7DD3FC;font-size:0.82rem;'>
                \u2713 Demo loaded
            </div>
            """, unsafe_allow_html=True)

        st.markdown("""
        <div class='wo-divider' style='margin:1rem 0;'></div>
        <div class='wo-mono' style='line-height:2;color:#64748B;font-size:0.78rem;'>
            RELIANCE.NS<br>INFY.NS<br>HDFCBANK.NS<br>TCS.NS<br>WIPRO.NS<br>
            VTI<br>QQQ<br>INDA<br>GOLDBEES.NS
        </div>
        </div>
        """, unsafe_allow_html=True)

    # ── Active session preview ─────────────────────────────────────────────
    if "holdings" in st.session_state:
        st.markdown("<div style='margin:0.75rem 0'></div>", unsafe_allow_html=True)
        panel_start("Active Session", "Currently loaded portfolio snapshot", meta="Session")
        st.markdown("<div class='wo-table-wrap'>", unsafe_allow_html=True)
        st.dataframe(st.session_state["holdings"].head(5), use_container_width=True, height=200)
        st.markdown("</div>", unsafe_allow_html=True)
        panel_end()
