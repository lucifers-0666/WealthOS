import streamlit as st
import pandas as pd
from core.data_loader import load_holdings, load_transactions, get_sample_holdings, get_sample_transactions
from core.price_fetcher import fetch_live_prices
from ui.components import section_header


def render_upload_page():
    section_header("📂 Upload Your Portfolio Data", "Upload CSV/XLSX exports from your broker")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Holdings File")
        st.caption("Required columns: Symbol, Quantity, Avg_Buy_Price")
        st.code("Symbol,Name,Quantity,Avg_Buy_Price,Asset_Type,Exchange\nRELIANCE.NS,Reliance,10,2400,Equity,NSE", language="csv")
        holdings_file = st.file_uploader("Upload Holdings", type=['csv', 'xlsx'], key='holdings_upload')

    with col2:
        st.subheader("Transactions File")
        st.caption("Required columns: Date, Symbol, Type, Quantity, Price")
        st.code("Date,Symbol,Type,Quantity,Price,Fees\n2024-01-15,RELIANCE.NS,BUY,10,2400,20", language="csv")
        txn_file = st.file_uploader("Upload Transactions", type=['csv', 'xlsx'], key='txn_upload')

    st.divider()
    col_load, col_demo = st.columns([1, 1])

    with col_load:
        if st.button("🔄 Load & Refresh Data", type="primary", use_container_width=True):
            _load_data(holdings_file, txn_file)

    with col_demo:
        if st.button("🎮 Load Demo Portfolio", use_container_width=True):
            _load_demo()

    # Show current data preview
    if st.session_state.portfolio_data is not None:
        st.subheader("Current Holdings Preview")
        df = st.session_state.portfolio_data
        display_cols = [c for c in ['Symbol', 'Name', 'Quantity', 'Avg_Buy_Price', 'Asset_Type', 'Exchange'] if c in df.columns]
        st.dataframe(df[display_cols], use_container_width=True)


def _load_data(holdings_file, txn_file):
    if holdings_file is None:
        st.error("Please upload a holdings file first.")
        return
    try:
        with st.spinner("Loading holdings..."):
            holdings_df = load_holdings(holdings_file)
            st.session_state.portfolio_data = holdings_df

        symbols = holdings_df['Symbol'].tolist()
        with st.spinner(f"Fetching live prices for {len(symbols)} symbols..."):
            st.session_state.live_prices = fetch_live_prices(symbols)

        if txn_file:
            with st.spinner("Loading transactions..."):
                st.session_state.transactions_data = load_transactions(txn_file)

        st.success(f"✅ Loaded {len(holdings_df)} holdings with live prices!")
        st.balloons()
    except Exception as e:
        st.error(f"Error loading data: {e}")


def _load_demo():
    with st.spinner("Loading demo portfolio..."):
        holdings_df = get_sample_holdings()
        st.session_state.portfolio_data = holdings_df
        st.session_state.transactions_data = get_sample_transactions()
        symbols = holdings_df['Symbol'].tolist()
        st.session_state.live_prices = fetch_live_prices(symbols)
    st.success("✅ Demo portfolio loaded!")
    st.info("Navigate to Dashboard to see your portfolio analytics.")
