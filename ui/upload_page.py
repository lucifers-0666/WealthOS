import streamlit as st
import pandas as pd
from loguru import logger

from core.data_loader import load_holdings_from_file, get_sample_holdings, get_sample_transactions
from ui.components    import page_header, section_title


def render_upload_page():
    page_header("📁", "Upload Portfolio Data",
                "Import your holdings & transactions from any Indian or international broker")

    tab1, tab2, tab3 = st.tabs(["  📄  Holdings CSV/XLSX  ", "  🔄  Transaction History  ", "  📸  Screenshot OCR  "])

    # ---- Tab 1: Holdings ----
    with tab1:
        section_title("📄", "Upload Holdings File")

        st.markdown("""
        <div class="w-panel" style="margin-bottom:1.25rem">
          <p style="margin:0 0 .5rem;font-family:'Space Grotesk',sans-serif;font-weight:600;color:#F8FAFC">Required Columns</p>
          <p style="margin:0;font-size:.85rem;color:#94A3B8">
            <code style="color:#22D3EE">Symbol</code> &nbsp;&bull;&nbsp;
            <code style="color:#22D3EE">Quantity</code> &nbsp;&bull;&nbsp;
            <code style="color:#22D3EE">Avg_Buy_Price</code><br>
            <span style="font-size:.78rem">Optional: Name, Asset_Type, Exchange, Sector</span>
          </p>
        </div>
        """, unsafe_allow_html=True)

        uploaded = st.file_uploader(
            "Drop your CSV or XLSX here",
            type=['csv', 'xlsx'],
            help="Export from Zerodha Kite, Groww, Upstox, Angel One, or any broker"
        )

        if uploaded:
            with st.spinner("Parsing file..."):
                try:
                    df = load_holdings_from_file(uploaded)
                    st.session_state.portfolio_data = df
                    st.success(f"✓ Loaded {len(df)} holdings successfully")
                    st.dataframe(df.head(10), use_container_width=True)
                except Exception as e:
                    st.error(f"Parse error: {e}")

        st.markdown("<hr>", unsafe_allow_html=True)
        section_title("🧪", "Or Load Demo Portfolio")
        col1, col2 = st.columns([2, 1])
        with col1:
            st.markdown("<p style='color:#94A3B8;font-size:.88rem'>10 sample holdings including NSE equities, US ETFs, Gold BeES & Liquid BeES</p>",
                        unsafe_allow_html=True)
        with col2:
            if st.button("Load Demo →", type="primary", use_container_width=True):
                st.session_state.portfolio_data = get_sample_holdings()
                st.success("Demo portfolio loaded!")
                st.rerun()

    # ---- Tab 2: Transactions ----
    with tab2:
        section_title("🔄", "Upload Transaction History")

        st.markdown("""
        <div class="w-panel" style="margin-bottom:1.25rem">
          <p style="margin:0 0 .5rem;font-family:'Space Grotesk',sans-serif;font-weight:600;color:#F8FAFC">Required Columns</p>
          <p style="margin:0;font-size:.85rem;color:#94A3B8">
            <code style="color:#22D3EE">Date</code> &nbsp;&bull;&nbsp;
            <code style="color:#22D3EE">Symbol</code> &nbsp;&bull;&nbsp;
            <code style="color:#22D3EE">Type</code> (BUY/SELL) &nbsp;&bull;&nbsp;
            <code style="color:#22D3EE">Quantity</code> &nbsp;&bull;&nbsp;
            <code style="color:#22D3EE">Price</code>
          </p>
        </div>
        """, unsafe_allow_html=True)

        t_uploaded = st.file_uploader(
            "Drop your transactions CSV or XLSX here",
            type=['csv', 'xlsx'],
            key="txn_uploader"
        )

        if t_uploaded:
            try:
                from core.data_loader import load_transactions_from_file
                tdf = load_transactions_from_file(t_uploaded)
                st.session_state.transactions_data = tdf
                st.success(f"✓ Loaded {len(tdf)} transactions")
                st.dataframe(tdf.head(15), use_container_width=True)
            except Exception as e:
                st.error(f"Parse error: {e}")

        col3, col4 = st.columns([2, 1])
        with col4:
            if st.button("Load Demo Transactions →", use_container_width=True):
                st.session_state.transactions_data = get_sample_transactions()
                st.success("Demo transactions loaded!")

    # ---- Tab 3: Screenshot OCR ----
    with tab3:
        section_title("📸", "Extract from Screenshot")

        st.markdown("""
        <div class="w-panel" style="margin-bottom:1.25rem">
          <p style="margin:0 0 .4rem;font-family:'Space Grotesk',sans-serif;font-weight:600;color:#F8FAFC">
            Powered by Gemini Vision
          </p>
          <p style="margin:0;font-size:.83rem;color:#94A3B8">
            Upload a screenshot of your broker app (Zerodha, Groww, Upstox, etc.).
            Gemini Vision will extract your holdings automatically.
          </p>
        </div>
        """, unsafe_allow_html=True)

        img_file = st.file_uploader(
            "Upload portfolio screenshot (PNG/JPG)",
            type=['png', 'jpg', 'jpeg'],
            key="ocr_uploader"
        )

        if img_file:
            from PIL import Image
            image = Image.open(img_file)
            st.image(image, caption="Uploaded screenshot", width=500)
            if st.button("🤖 Extract Holdings via AI", type="primary"):
                with st.spinner("Analyzing image with Gemini Vision..."):
                    try:
                        from core.image_ocr import extract_holdings_from_image
                        result_df = extract_holdings_from_image(image)
                        if result_df is not None and not result_df.empty:
                            st.success(f"✓ Extracted {len(result_df)} holdings from image")
                            st.dataframe(result_df, use_container_width=True)
                            if st.button("Use These Holdings"):
                                st.session_state.portfolio_data = result_df
                                st.rerun()
                        else:
                            st.warning("Could not extract holdings. Try a clearer screenshot.")
                    except Exception as e:
                        st.error(f"OCR error: {e}")
