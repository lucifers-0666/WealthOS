import streamlit as st
import base64
from core.data_loader import load_holdings, load_transactions, get_sample_holdings, get_sample_transactions
from core.price_fetcher import fetch_live_prices
from ui.components import page_header, section_title, render_portfolio_images

ALLOWED_IMAGE_TYPES = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'svg', 'heic', 'avif']


def render_upload_page():
    page_header(
        "fa-solid fa-folder-open",
        "Upload Portfolio Data",
        "Import your broker exports and portfolio statements"
    )

    # ===== PORTFOLIO IMAGES SECTION =====
    section_title("fa-solid fa-images", "Portfolio Images & Statements")
    st.markdown("""
    <p style="color:#8A9BB5; font-size:0.875rem; margin-bottom:1rem;">
        Upload screenshots, broker statements, portfolio reports, or any reference images.
        Supports PNG, JPG, WEBP, GIF, BMP, TIFF, HEIC, AVIF, SVG and more.
    </p>
    """, unsafe_allow_html=True)

    img_files = st.file_uploader(
        "Drop portfolio images here",
        type=ALLOWED_IMAGE_TYPES,
        accept_multiple_files=True,
        key="portfolio_img_upload",
        label_visibility="collapsed",
        help="Upload broker statements, portfolio screenshots, or reference charts"
    )

    if img_files:
        new_images = []
        for img_file in img_files:
            raw = img_file.read()
            b64 = base64.b64encode(raw).decode()
            ext = img_file.name.split('.')[-1].lower()
            mime_map = {
                'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
                'png': 'image/png', 'webp': 'image/webp',
                'gif': 'image/gif', 'bmp': 'image/bmp',
                'tiff': 'image/tiff', 'svg': 'image/svg+xml',
                'heic': 'image/heic', 'avif': 'image/avif',
            }
            mime = mime_map.get(ext, 'image/jpeg')
            new_images.append({
                'name': img_file.name,
                'data_url': f"data:{mime};base64,{b64}",
                'size': f"{len(raw)/1024:.1f} KB"
            })

        st.session_state.portfolio_images = new_images
        st.success(f"{len(new_images)} image(s) uploaded successfully")

    # Show uploaded images
    if st.session_state.get("portfolio_images"):
        section_title("fa-solid fa-grip", "Uploaded Images")
        render_portfolio_images()
        if st.button("Clear Images", key="clear_imgs"):
            st.session_state.portfolio_images = []
            st.rerun()

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown('<hr style="border-color:#1E2D4A; opacity:0.5">', unsafe_allow_html=True)
    st.markdown("<br>", unsafe_allow_html=True)

    # ===== HOLDINGS + TRANSACTIONS =====
    section_title("fa-solid fa-file-csv", "Holdings & Transaction Files")

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("""
        <div class="wealth-card" style="margin-bottom:1rem">
            <div style="color:#C9A84C; font-size:0.72rem; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:0.75rem;">
                <i class="fa-solid fa-table-list"></i>&nbsp; Holdings File
            </div>
            <div style="color:#8A9BB5; font-size:0.8rem; font-family:monospace; background:#080B12; padding:0.75rem; border-radius:8px; border:1px solid #1E2D4A;">
                Symbol, Name, Quantity, Avg_Buy_Price, Asset_Type, Exchange<br>
                RELIANCE.NS, Reliance, 10, 2400, Equity, NSE
            </div>
        </div>
        """, unsafe_allow_html=True)
        holdings_file = st.file_uploader(
            "Holdings CSV / XLSX",
            type=['csv', 'xlsx'],
            key='holdings_upload',
            label_visibility="collapsed"
        )

    with col2:
        st.markdown("""
        <div class="wealth-card" style="margin-bottom:1rem">
            <div style="color:#C9A84C; font-size:0.72rem; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:0.75rem;">
                <i class="fa-solid fa-arrow-right-arrow-left"></i>&nbsp; Transactions File
            </div>
            <div style="color:#8A9BB5; font-size:0.8rem; font-family:monospace; background:#080B12; padding:0.75rem; border-radius:8px; border:1px solid #1E2D4A;">
                Date, Symbol, Type, Quantity, Price, Fees<br>
                2024-01-15, RELIANCE.NS, BUY, 10, 2400, 20
            </div>
        </div>
        """, unsafe_allow_html=True)
        txn_file = st.file_uploader(
            "Transactions CSV / XLSX",
            type=['csv', 'xlsx'],
            key='txn_upload',
            label_visibility="collapsed"
        )

    st.markdown("<br>", unsafe_allow_html=True)
    col_a, col_b, col_c = st.columns([2, 2, 3])

    with col_a:
        if st.button("Load & Refresh Data", type="primary", use_container_width=True):
            _load_data(holdings_file, txn_file)

    with col_b:
        if st.button("Load Demo Portfolio", use_container_width=True):
            _load_demo()

    # Preview
    if st.session_state.portfolio_data is not None:
        st.markdown("<br>", unsafe_allow_html=True)
        section_title("fa-solid fa-eye", "Current Holdings Preview")
        df = st.session_state.portfolio_data
        display_cols = [c for c in ['Symbol', 'Name', 'Quantity', 'Avg_Buy_Price', 'Asset_Type', 'Exchange'] if c in df.columns]
        st.dataframe(
            df[display_cols],
            use_container_width=True,
            hide_index=True
        )


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
        st.success(f"{len(holdings_df)} holdings loaded with live prices")
    except Exception as e:
        st.error(f"Error: {e}")


def _load_demo():
    with st.spinner("Loading demo portfolio..."):
        holdings_df = get_sample_holdings()
        st.session_state.portfolio_data = holdings_df
        st.session_state.transactions_data = get_sample_transactions()
        st.session_state.live_prices = fetch_live_prices(holdings_df['Symbol'].tolist())
    st.success("Demo portfolio loaded — navigate to Dashboard")
