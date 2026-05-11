import streamlit as st
import pandas as pd
from core.data_loader import (
    load_from_file,
    get_demo_portfolio,
    save_portfolio_to_session,
)


def render_upload_page():
    st.markdown("## Portfolio Upload")
    st.markdown(
        "<p style='color:#94A3B8;font-size:0.9rem;'>Upload a CSV or XLSX holdings export, or load the demo portfolio to explore.</p>",
        unsafe_allow_html=True,
    )

    col1, col2 = st.columns([2, 1], gap="large")

    with col1:
        st.markdown("### Upload Holdings File")
        uploaded = st.file_uploader(
            "Drag and drop your broker export here",
            type=["csv", "xlsx", "xls"],
            help="Required columns: symbol, quantity, avg_price",
        )

        if uploaded is not None:
            with st.spinner("Parsing file..."):
                try:
                    df = load_from_file(uploaded)
                    save_portfolio_to_session(df)
                    st.success(f"Loaded {len(df)} holdings from {uploaded.name}")
                    st.dataframe(
                        df[["symbol", "name", "quantity", "avg_price", "invested", "asset_class"]]
                        .rename(columns={
                            "symbol": "Symbol",
                            "name": "Name",
                            "quantity": "Qty",
                            "avg_price": "Avg Price",
                            "invested": "Invested (INR)",
                            "asset_class": "Asset Class",
                        }),
                        use_container_width=True,
                        hide_index=True,
                    )
                except ValueError as e:
                    st.error(f"Upload failed: {e}")

    with col2:
        st.markdown("### Quick Start")
        st.info(
            "No file yet? Load the **demo portfolio** to see WealthOS in action "
            "with sample Indian equities + international ETFs."
        )
        if st.button("Load Demo Portfolio", type="primary", use_container_width=True):
            demo = get_demo_portfolio()
            save_portfolio_to_session(demo)
            st.success(f"Demo portfolio loaded — {len(demo)} positions")
            st.rerun()

        if st.session_state.get("portfolio_loaded"):
            st.divider()
            loaded_at = st.session_state.get("portfolio_load_time")
            df_loaded = st.session_state.get("portfolio_df")
            num = len(df_loaded) if df_loaded is not None else 0
            st.markdown(f"""
            **Active Portfolio**  
            {num} positions loaded  
            {f"Last updated: {loaded_at.strftime('%H:%M:%S')}" if loaded_at else ''}
            """)
            if st.button("Clear Portfolio", use_container_width=True):
                st.session_state.pop("portfolio_df", None)
                st.session_state.pop("portfolio_loaded", None)
                st.session_state.pop("portfolio_load_time", None)
                st.rerun()

    st.divider()
    st.markdown("### Expected CSV Format")
    st.markdown("Your file needs these columns (names are flexible — common aliases are auto-detected):")
    sample = pd.DataFrame([
        {"symbol": "RELIANCE", "quantity": 25, "avg_price": 2450.0, "name": "Reliance Industries", "sector": "Energy", "asset_class": "Equity"},
        {"symbol": "INFY",     "quantity": 40, "avg_price": 1380.0, "name": "Infosys Ltd",         "sector": "IT",     "asset_class": "Equity"},
        {"symbol": "VTI",      "quantity": 10, "avg_price": 220.0,  "name": "Vanguard Total Mkt",  "sector": "ETF",    "asset_class": "ETF"},
    ])
    st.dataframe(sample, use_container_width=True, hide_index=True)
    st.caption("Required: symbol, quantity, avg_price | Optional: name, sector, asset_class, exchange")
