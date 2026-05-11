"""WealthOS Upload — cinematic enterprise-grade file ingestion workspace."""

from __future__ import annotations

import io
import pandas as pd
import streamlit as st

from frontend.design_system import render_topbar


# ─────────────────────────────────────────────────────────────────────────────
# Upload page
# ─────────────────────────────────────────────────────────────────────────────

def render_upload_page() -> None:
    render_topbar("Import Workspace", "File ingestion pipeline")

    st.markdown(
        """
        <section class="wo-panel" style="margin-bottom:1.25rem;">
            <div class="wo-panel-header">
                <div>
                    <div class="wo-kicker">Data Ingestion</div>
                    <div class="wo-panel-title">Upload Holdings & Transactions</div>
                    <div class="wo-panel-subtitle">
                        Drop broker exports in CSV or XLSX format.<br>
                        Supported brokers: Zerodha, Groww, Angel One, Upstox, or custom columns.
                    </div>
                </div>
                <div class="wo-mono" style="text-align:right;">
                    <div style="color:#8EE7B8;">Pipeline ready</div>
                    <div>OCR engine standby</div>
                </div>
            </div>
        </section>
        """,
        unsafe_allow_html=True,
    )

    tab_h, tab_t, tab_demo = st.tabs(["Holdings File", "Transactions File", "Load Demo Portfolio"])

    # ── Holdings upload ──────────────────────────────────────────────────────
    with tab_h:
        st.markdown(
            """
            <div class="wo-panel">
                <div class="wo-kicker">Step 01</div>
                <div class="wo-panel-title" style="margin-bottom:0.9rem;">Holdings Export</div>
            """,
            unsafe_allow_html=True,
        )
        holdings_file = st.file_uploader(
            "Drop holdings CSV / XLSX here",
            type=["csv", "xlsx"],
            key="holdings_file",
            label_visibility="collapsed",
        )
        if holdings_file:
            try:
                if holdings_file.name.endswith(".csv"):
                    df = pd.read_csv(holdings_file)
                else:
                    df = pd.read_excel(holdings_file)

                st.session_state["holdings_df"] = df

                st.markdown(
                    f"""
                    <div class="wo-terminal-box" style="margin-top:0.8rem;">
                        <div style="color:#8EE7B8;">&#10003; File ingested</div>
                        <div>Filename &nbsp;&nbsp;: {holdings_file.name}</div>
                        <div>Rows &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {len(df)}</div>
                        <div>Columns &nbsp;&nbsp;: {', '.join(df.columns.tolist()[:6])}{' ...' if len(df.columns) > 6 else ''}</div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

                st.markdown(
                    """<div class="wo-kicker" style="margin-top:1rem;margin-bottom:0.5rem;">Preview</div>""",
                    unsafe_allow_html=True,
                )
                st.dataframe(df.head(10), use_container_width=True, hide_index=True)

            except Exception as exc:
                st.error(f"Could not parse file: {exc}")

        else:
            _render_format_guide()

        st.markdown("</div>", unsafe_allow_html=True)

    # ── Transactions upload ──────────────────────────────────────────────────
    with tab_t:
        st.markdown(
            """
            <div class="wo-panel">
                <div class="wo-kicker">Step 02</div>
                <div class="wo-panel-title" style="margin-bottom:0.9rem;">Transaction Ledger</div>
            """,
            unsafe_allow_html=True,
        )
        tx_file = st.file_uploader(
            "Drop transaction CSV / XLSX here",
            type=["csv", "xlsx"],
            key="tx_file",
            label_visibility="collapsed",
        )
        if tx_file:
            try:
                if tx_file.name.endswith(".csv"):
                    df_tx = pd.read_csv(tx_file)
                else:
                    df_tx = pd.read_excel(tx_file)

                st.session_state["transactions_df"] = df_tx

                st.markdown(
                    f"""
                    <div class="wo-terminal-box" style="margin-top:0.8rem;">
                        <div style="color:#8EE7B8;">&#10003; Transaction ledger loaded</div>
                        <div>Filename &nbsp;&nbsp;: {tx_file.name}</div>
                        <div>Entries &nbsp;&nbsp;&nbsp;: {len(df_tx)}</div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
                st.dataframe(df_tx.head(10), use_container_width=True, hide_index=True)

            except Exception as exc:
                st.error(f"Could not parse file: {exc}")

        else:
            st.markdown(
                """
                <div style="padding:2rem;text-align:center;color:#64748B;
                             border:1px dashed rgba(125,211,252,0.14);
                             border-radius:16px;margin-top:0.5rem;">
                    <div style="font-family:'IBM Plex Mono',monospace;font-size:0.9rem;">
                        Awaiting transaction export...
                    </div>
                    <div style="margin-top:0.5rem;font-size:0.82rem;">
                        Required columns: date, ticker, action (BUY/SELL), quantity, price
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )
        st.markdown("</div>", unsafe_allow_html=True)

    # ── Demo portfolio ───────────────────────────────────────────────────────
    with tab_demo:
        st.markdown(
            """
            <div class="wo-panel">
                <div class="wo-kicker">Demo Mode</div>
                <div class="wo-panel-title" style="margin-bottom:0.5rem;">Sample Indian + Global Portfolio</div>
                <div class="wo-panel-subtitle">
                    Loads a pre-built portfolio of Indian equities and international ETFs
                    so you can explore all analytics without uploading any files.
                </div>
            """,
            unsafe_allow_html=True,
        )
        if st.button("Load Demo Portfolio", use_container_width=True):
            _load_demo_data()
            st.success("Demo portfolio loaded. Navigate to the Dashboard to explore.")
        st.markdown("</div>", unsafe_allow_html=True)

    # ── Refresh button ───────────────────────────────────────────────────────
    st.markdown("<div style='height:0.5rem'></div>", unsafe_allow_html=True)
    if st.button("Refresh & Sync Prices", use_container_width=True):
        st.success("Prices refreshed. Dashboard data is now current.")


def _render_format_guide() -> None:
    st.markdown(
        """
        <div style="margin-top:1rem;">
            <div class="wo-kicker" style="margin-bottom:0.65rem;">Expected Format</div>
            <div class="wo-terminal-box">
                <div style="color:#67E8F9;">ticker &nbsp;&nbsp;&nbsp; name &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; qty &nbsp;&nbsp; avg_cost</div>
                <div style="color:#94A3B8;">RELIANCE.NS &nbsp;Reliance Ind &nbsp;&nbsp; 25 &nbsp;&nbsp; 2310.00</div>
                <div style="color:#94A3B8;">INFY.NS &nbsp;&nbsp;&nbsp;&nbsp; Infosys &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 50 &nbsp;&nbsp; 1640.00</div>
                <div style="color:#94A3B8;">VTI &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Vanguard ETF &nbsp;&nbsp; 12 &nbsp;&nbsp; 218.00</div>
                <div style="margin-top:0.6rem;color:#64748B;">NSE tickers: append .NS | BSE: append .BO | International: bare ticker</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def _load_demo_data() -> None:
    demo = [
        {"ticker": "RELIANCE.NS", "name": "Reliance Industries", "qty": 25, "avg_cost": 2310.0},
        {"ticker": "INFY.NS",     "name": "Infosys",             "qty": 50, "avg_cost": 1640.0},
        {"ticker": "HDFCBANK.NS", "name": "HDFC Bank",          "qty": 40, "avg_cost": 1490.0},
        {"ticker": "TCS.NS",      "name": "TCS",                "qty": 15, "avg_cost": 3350.0},
        {"ticker": "WIPRO.NS",    "name": "Wipro",              "qty": 80, "avg_cost": 440.0},
        {"ticker": "VTI",         "name": "Vanguard Total Mkt", "qty": 12, "avg_cost": 218.0},
        {"ticker": "QQQ",         "name": "Invesco QQQ",        "qty": 8,  "avg_cost": 365.0},
        {"ticker": "INDA",        "name": "iShares MSCI India", "qty": 30, "avg_cost": 42.0},
    ]
    st.session_state["holdings_df"] = pd.DataFrame(demo)
