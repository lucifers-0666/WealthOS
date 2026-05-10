import streamlit as st
import pandas as pd
from PIL import Image
from io import BytesIO
from loguru import logger
from core.data_loader import load_holdings_from_file, get_sample_holdings, get_sample_transactions
from core.price_fetcher import fetch_live_prices
from ui.components import page_header, section_title


def render_upload_page():
    page_header(
        "fa-solid fa-upload",
        "Upload Portfolio Data",
        "Import your broker export or paste holdings manually"
    )

    tab1, tab2, tab3 = st.tabs(["📄 CSV / Excel", "🖼️ Image / Screenshot", "✍️ Manual Entry"])

    # ------------------------------------------------------------------ CSV
    with tab1:
        section_title("fa-solid fa-file-csv", "Upload Holdings CSV / Excel")
        st.markdown(
            "Export your holdings from Zerodha, Groww, Upstox, Angel One, or any broker. "
            "File must have columns: `Symbol`, `Quantity`, `Avg_Buy_Price` (and optionally `Name`, `Type`).",
            unsafe_allow_html=False
        )
        uploaded_file = st.file_uploader(
            "Drop your holdings file here",
            type=["csv", "xlsx", "xls"],
            label_visibility="collapsed"
        )
        if uploaded_file:
            try:
                df = load_holdings_from_file(uploaded_file)
                st.success(f"✅ Loaded {len(df)} holdings from {uploaded_file.name}")
                st.dataframe(df.head(10), use_container_width=True)
                if st.button("Confirm & Load to Dashboard", type="primary"):
                    st.session_state.portfolio_data = df
                    st.session_state.live_prices = fetch_live_prices(df['Symbol'].tolist())
                    st.success("Portfolio loaded! Go to Dashboard.")
                    st.rerun()
            except Exception as e:
                st.error(f"Failed to parse file: {e}")

    # ------------------------------------------------------------------ Image
    with tab2:
        section_title("fa-solid fa-image", "Portfolio Images & Statements")
        st.markdown(
            "Upload screenshots, broker statements, portfolio reports, or any reference images. "
            "Supports PNG, JPG, WEBP, GIF, BMP, TIFF, HEIC, AVIF, SVG and more.",
            unsafe_allow_html=False
        )

        uploaded_images = st.file_uploader(
            "Upload portfolio images",
            type=["png", "jpg", "jpeg", "webp", "gif", "bmp", "tif", "tiff", "svg", "heic", "avif"],
            accept_multiple_files=True,
            label_visibility="collapsed"
        )

        if uploaded_images:
            if "portfolio_images" not in st.session_state:
                st.session_state.portfolio_images = []

            new_count = 0
            for img_file in uploaded_images:
                img_bytes = img_file.read()
                if img_bytes not in [i["bytes"] for i in st.session_state.portfolio_images]:
                    st.session_state.portfolio_images.append({
                        "name": img_file.name,
                        "bytes": img_bytes
                    })
                    new_count += 1

            if new_count:
                st.success(f"✅ Added {new_count} image(s) to your portfolio reference.")

        if st.session_state.get("portfolio_images"):
            section_title("fa-solid fa-grid", "Uploaded Images")
            images = st.session_state.portfolio_images
            cols = st.columns(2)
            for idx, img_data in enumerate(images):
                with cols[idx % 2]:
                    st.image(img_data["bytes"], caption=img_data["name"], use_container_width=True)

            # ---- OCR extraction button ----
            st.markdown("<br>", unsafe_allow_html=True)
            col_ocr, col_clear = st.columns([2, 1])
            with col_ocr:
                if st.button("🔍 Extract Holdings from Images (OCR)", type="primary", use_container_width=True):
                    _run_ocr_pipeline(st.session_state.portfolio_images)
            with col_clear:
                if st.button("Clear Images", use_container_width=True):
                    st.session_state.portfolio_images = []
                    st.rerun()

    # ------------------------------------------------------------------ Manual
    with tab3:
        section_title("fa-solid fa-pencil", "Add Holdings Manually")
        st.markdown("Enter your holdings one by one:")

        with st.form("manual_holding_form"):
            c1, c2, c3, c4 = st.columns(4)
            symbol = c1.text_input("Symbol (e.g. RELIANCE.NS)")
            name   = c2.text_input("Name (optional)")
            qty    = c3.number_input("Quantity", min_value=0.0001, step=1.0)
            price  = c4.number_input("Avg Buy Price (₹)", min_value=0.01, step=0.5)
            submitted = st.form_submit_button("Add Holding")

            if submitted and symbol:
                new_row = pd.DataFrame([{
                    "Symbol": symbol.upper().strip(),
                    "Name": name or symbol.upper().strip(),
                    "Quantity": qty,
                    "Avg_Buy_Price": price,
                    "Type": "Indian Equity"
                }])
                if st.session_state.portfolio_data is None:
                    st.session_state.portfolio_data = new_row
                else:
                    st.session_state.portfolio_data = pd.concat(
                        [st.session_state.portfolio_data, new_row], ignore_index=True
                    )
                st.success(f"Added {symbol}")
                # Refresh live prices for new symbol
                st.session_state.live_prices = fetch_live_prices(
                    st.session_state.portfolio_data['Symbol'].tolist()
                )
                st.rerun()

        if st.session_state.portfolio_data is not None:
            st.markdown("**Current Holdings:**")
            st.dataframe(st.session_state.portfolio_data, use_container_width=True, hide_index=True)

    # ------------------------------------------------------------------ Demo
    st.markdown("---")
    section_title("fa-solid fa-flask", "Quick Start with Demo Data")
    if st.button("Load Demo Portfolio", type="secondary", use_container_width=False):
        st.session_state.portfolio_data = get_sample_holdings()
        st.session_state.transactions_data = get_sample_transactions()
        st.session_state.live_prices = fetch_live_prices(
            st.session_state.portfolio_data['Symbol'].tolist()
        )
        st.success("Demo portfolio loaded! Switch to Dashboard.")
        st.rerun()


# ---------------------------------------------------------------------------
# OCR Pipeline
# ---------------------------------------------------------------------------

def _run_ocr_pipeline(portfolio_images: list):
    """Run OCR on all uploaded images and merge extracted holdings."""
    from core.image_ocr import extract_holdings_from_image

    all_dfs = []
    progress = st.progress(0, text="Extracting holdings from images...")

    for i, img_data in enumerate(portfolio_images):
        progress.progress((i + 1) / len(portfolio_images), text=f"Processing {img_data['name']}...")
        try:
            pil_img = Image.open(BytesIO(img_data["bytes"]))
            df = extract_holdings_from_image(pil_img)
            if df is not None and not df.empty:
                all_dfs.append(df)
                logger.info(f"Extracted {len(df)} rows from {img_data['name']}")
            else:
                st.warning(f"⚠️ Could not extract data from {img_data['name']}")
        except Exception as e:
            st.error(f"Error processing {img_data['name']}: {e}")

    progress.empty()

    if not all_dfs:
        st.error("No holdings could be extracted. Try uploading a clearer screenshot or use CSV upload.")
        return

    combined = pd.concat(all_dfs, ignore_index=True).drop_duplicates(subset=['Symbol'])
    st.success(f"✅ Extracted {len(combined)} unique holdings from {len(all_dfs)} image(s)!")
    st.dataframe(combined, use_container_width=True)

    if st.button("✅ Use These Holdings", type="primary"):
        if st.session_state.portfolio_data is not None:
            merged = pd.concat([st.session_state.portfolio_data, combined], ignore_index=True)
            st.session_state.portfolio_data = merged.drop_duplicates(subset=['Symbol'], keep='last')
        else:
            st.session_state.portfolio_data = combined
        st.session_state.live_prices = fetch_live_prices(
            st.session_state.portfolio_data['Symbol'].tolist()
        )
        st.success("Holdings merged into your portfolio!")
        st.rerun()
