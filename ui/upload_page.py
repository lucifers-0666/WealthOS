import streamlit as st

from core.data_loader import load_holdings_from_file, get_sample_holdings, get_sample_transactions
from ui.components import page_header, section_title


def render_upload_page():
    page_header(
        "Upload Portfolio Data",
        "Import holdings, transactions, and screenshots from broker statements.",
        "DATA INGESTION",
    )

    tab1, tab2, tab3 = st.tabs(["Holdings", "Transactions", "Screenshot OCR"])

    # ---- Tab 1: Holdings ----
    with tab1:
        section_title("Upload Holdings File", "CSV or XLSX")

        st.markdown(
            """
            <div class="glass-surface" style="margin-bottom:1rem;padding:1rem 1.15rem">
                <p style="margin:0 0 .45rem;font-family:'Space Grotesk',sans-serif;font-weight:600;color:#F8FAFC">Required columns</p>
                <p style="margin:0;font-size:.84rem;color:#94A3B8">
                    <code style="color:#22D3EE">Symbol</code>,
                    <code style="color:#22D3EE">Quantity</code>,
                    <code style="color:#22D3EE">Avg_Buy_Price</code>
                </p>
                <p style="margin:.4rem 0 0;font-size:.78rem;color:#94A3B8">Optional: Name, Asset_Type, Exchange, Sector</p>
            </div>
            """,
            unsafe_allow_html=True,
        )

        uploaded = st.file_uploader(
            "Upload holdings file",
            type=["csv", "xlsx"],
            help="Export from your broker in CSV/XLSX format.",
        )

        if uploaded:
            with st.spinner("Parsing file..."):
                try:
                    df = load_holdings_from_file(uploaded)
                    st.session_state.portfolio_data = df
                    st.success(f"Loaded {len(df)} holdings successfully.")
                    st.dataframe(df.head(10), use_container_width=True)
                except Exception as e:
                    st.error(f"Parse error: {e}")

        section_title("Load Demo Portfolio", "Fast preview mode")
        col1, col2 = st.columns([2, 1])
        with col1:
            st.markdown(
                "<p style='color:#94A3B8;font-size:.88rem'>Includes diversified sample holdings for dashboard preview and AI testing.</p>",
                unsafe_allow_html=True,
            )
        with col2:
            if st.button("Load Demo", type="primary", use_container_width=True):
                st.session_state.portfolio_data = get_sample_holdings()
                st.success("Demo portfolio loaded.")
                st.rerun()

    # ---- Tab 2: Transactions ----
    with tab2:
        section_title("Upload Transaction History", "Ledger import")

        st.markdown(
            """
            <div class="glass-surface" style="margin-bottom:1rem;padding:1rem 1.15rem">
                <p style="margin:0 0 .45rem;font-family:'Space Grotesk',sans-serif;font-weight:600;color:#F8FAFC">Required columns</p>
                <p style="margin:0;font-size:.84rem;color:#94A3B8">
                    <code style="color:#22D3EE">Date</code>,
                    <code style="color:#22D3EE">Symbol</code>,
                    <code style="color:#22D3EE">Type</code>,
                    <code style="color:#22D3EE">Quantity</code>,
                    <code style="color:#22D3EE">Price</code>
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )

        t_uploaded = st.file_uploader(
            "Upload transactions file",
            type=["csv", "xlsx"],
            key="txn_uploader",
        )

        if t_uploaded:
            try:
                from core.data_loader import load_transactions_from_file

                tdf = load_transactions_from_file(t_uploaded)
                st.session_state.transactions_data = tdf
                st.success(f"Loaded {len(tdf)} transactions")
                st.dataframe(tdf.head(15), use_container_width=True)
            except Exception as e:
                st.error(f"Parse error: {e}")

        col3, col4 = st.columns([2, 1])
        with col4:
            if st.button("Load Demo Transactions", use_container_width=True):
                st.session_state.transactions_data = get_sample_transactions()
                st.success("Demo transactions loaded.")

    # ---- Tab 3: Screenshot OCR ----
    with tab3:
        section_title("Extract from Screenshot", "Vision-assisted import")

        st.markdown(
            """
            <div class="glass-surface" style="margin-bottom:1rem;padding:1rem 1.15rem">
                <p style="margin:0 0 .4rem;font-family:'Space Grotesk',sans-serif;font-weight:600;color:#F8FAFC">Vision extraction powered by Gemini</p>
                <p style="margin:0;font-size:.83rem;color:#94A3B8">Upload a clean broker screenshot and auto-extract holdings.</p>
            </div>
            """,
            unsafe_allow_html=True,
        )

        img_file = st.file_uploader(
            "Upload portfolio screenshot",
            type=["png", "jpg", "jpeg"],
            key="ocr_uploader",
        )

        if img_file:
            from PIL import Image

            image = Image.open(img_file)
            st.image(image, caption="Uploaded screenshot", width=500)
            if st.button("Extract Holdings via AI", type="primary"):
                with st.spinner("Analyzing image with Gemini Vision..."):
                    try:
                        from core.image_ocr import extract_holdings_from_image
                        result_df = extract_holdings_from_image(image)
                        if result_df is not None and not result_df.empty:
                            st.success(f"Extracted {len(result_df)} holdings from image")
                            st.dataframe(result_df, use_container_width=True)
                            if st.button("Use Extracted Holdings"):
                                st.session_state.portfolio_data = result_df
                                st.rerun()
                        else:
                            st.warning("Could not extract holdings. Try a clearer screenshot.")
                    except Exception as e:
                        st.error(f"OCR error: {e}")
