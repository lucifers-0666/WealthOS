import streamlit as st
from core.portfolio_engine import compute_portfolio_metrics, compute_allocation_by_type, get_summary_stats, compute_portfolio_value_over_time
from core.target_tracker import compute_target_deviation
from charts.allocation_chart import render_allocation_charts
from charts.performance_chart import render_performance_chart
from charts.gains_chart import render_gains_chart
from charts.drawdown_chart import render_drawdown_chart
from ui.components import page_header, section_title, metric_card, render_portfolio_images
from config import DEFAULT_TARGET_ALLOCATION


def render_dashboard():
    if st.session_state.portfolio_data is None:
        _render_welcome()
        return

    df = st.session_state.portfolio_data
    live_prices = st.session_state.live_prices or {}
    portfolio_df = compute_portfolio_metrics(df, live_prices)
    summary = get_summary_stats(portfolio_df)

    page_header(
        "fa-solid fa-chart-pie",
        "Portfolio Dashboard",
        "Real-time overview of your wealth"
    )

    # ===== KPI ROW =====
    pnl = summary['total_pnl']
    pnl_pct = summary['total_pnl_pct']
    is_pos = pnl >= 0
    pnl_sign = "+" if is_pos else ""

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        metric_card(
            "PORTFOLIO VALUE",
            f"\u20b9{summary['total_current_value']:,.0f}",
            delta=f"{pnl_sign}\u20b9{abs(pnl):,.0f} ({pnl_pct:+.1f}%)",
            positive=is_pos,
            icon="fa-solid fa-briefcase"
        )
    with col2:
        metric_card(
            "TOTAL INVESTED",
            f"\u20b9{summary['total_invested']:,.0f}",
            icon="fa-solid fa-indian-rupee-sign"
        )
    with col3:
        metric_card(
            "BEST PERFORMER",
            summary['best_performer'],
            positive=True,
            icon="fa-solid fa-trophy"
        )
    with col4:
        metric_card(
            "WEAKEST HOLDING",
            summary['worst_performer'],
            positive=False,
            icon="fa-solid fa-triangle-exclamation"
        )

    st.markdown("<br>", unsafe_allow_html=True)

    # ===== PORTFOLIO IMAGES =====
    if st.session_state.get("portfolio_images"):
        section_title("fa-solid fa-images", "Portfolio Statements & References")
        render_portfolio_images()
        st.markdown("<br>", unsafe_allow_html=True)

    # ===== ALLOCATION =====
    section_title("fa-solid fa-chart-donut", "Asset Allocation")
    allocation_by_type = compute_allocation_by_type(portfolio_df)

    with st.expander("Configure Target Allocation", expanded=False):
        target = {}
        for cat, pct in DEFAULT_TARGET_ALLOCATION.items():
            target[cat] = st.slider(cat, 0.0, 100.0, float(pct), step=1.0)
        total_target = sum(target.values())
        if abs(total_target - 100) > 0.1:
            st.warning(f"Target sums to {total_target:.0f}% — should be 100%")
    else:
        target = DEFAULT_TARGET_ALLOCATION

    render_allocation_charts(allocation_by_type, target)

    deviation_df = compute_target_deviation(allocation_by_type, target)
    section_title("fa-solid fa-bullseye", "Target vs Actual Deviation")
    st.dataframe(deviation_df, use_container_width=True, hide_index=False)

    st.markdown("<br>", unsafe_allow_html=True)

    # ===== PERFORMANCE =====
    section_title("fa-solid fa-chart-line", "Portfolio Performance Over Time")
    txns = st.session_state.transactions_data
    portfolio_ts = compute_portfolio_value_over_time(txns, live_prices)
    if not portfolio_ts.empty:
        render_performance_chart(portfolio_ts)
    else:
        st.info("Upload transaction history to see performance timeline.")

    st.markdown("<br>", unsafe_allow_html=True)

    # ===== GAINS =====
    section_title("fa-solid fa-arrow-trend-up", "Gains & Losses by Holding")
    render_gains_chart(portfolio_df)

    st.markdown("<br>", unsafe_allow_html=True)

    # ===== DRAWDOWN =====
    section_title("fa-solid fa-chart-waterfall", "Drawdown Analysis")
    render_drawdown_chart(portfolio_df, live_prices)

    st.markdown("<br>", unsafe_allow_html=True)

    # ===== HOLDINGS TABLE =====
    section_title("fa-solid fa-table", "Holdings Detail")
    display_cols = ['Symbol', 'Name', 'Quantity', 'Avg_Buy_Price', 'Current_Price',
                    'Current_Value', 'Invested_Amount', 'Unrealized_PnL', 'PnL_Pct', 'Weight_Pct']
    display_cols = [c for c in display_cols if c in portfolio_df.columns]
    st.dataframe(
        portfolio_df[display_cols].style.format({
            'Avg_Buy_Price': '\u20b9{:.2f}',
            'Current_Price': '\u20b9{:.2f}',
            'Current_Value': '\u20b9{:,.0f}',
            'Invested_Amount': '\u20b9{:,.0f}',
            'Unrealized_PnL': '\u20b9{:+,.0f}',
            'PnL_Pct': '{:+.2f}%',
            'Weight_Pct': '{:.1f}%',
        }).applymap(
            lambda v: 'color: #00D4A0' if isinstance(v, (int, float)) and v > 0
            else 'color: #FF4D6A' if isinstance(v, (int, float)) and v < 0 else '',
            subset=['Unrealized_PnL', 'PnL_Pct']
        ),
        use_container_width=True,
        hide_index=True
    )


def _render_welcome():
    page_header(
        "fa-solid fa-chart-pie",
        "Portfolio Dashboard",
        "Load your holdings to get started"
    )

    st.markdown("""
    <div class="wealth-card" style="text-align:center; padding:3rem 2rem;">
        <i class="fa-solid fa-chart-pie" style="font-size:3rem; color:#C9A84C; opacity:0.4; display:block; margin-bottom:1.5rem;"></i>
        <h3 style="color:#F0EDE6; font-family:'Playfair Display',serif; margin-bottom:0.5rem;">No Portfolio Loaded</h3>
        <p style="color:#8A9BB5; font-size:0.9rem; margin-bottom:2rem;">Upload your holdings CSV or try the demo portfolio to see your dashboard</p>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    col1, col2, col3 = st.columns([1, 1, 2])
    with col1:
        if st.button("Load Demo Portfolio", type="primary", use_container_width=True):
            from core.data_loader import get_sample_holdings, get_sample_transactions
            from core.price_fetcher import fetch_live_prices
            st.session_state.portfolio_data = get_sample_holdings()
            st.session_state.transactions_data = get_sample_transactions()
            st.session_state.live_prices = fetch_live_prices(st.session_state.portfolio_data['Symbol'].tolist())
            st.rerun()
    with col2:
        if st.button("Go to Upload", use_container_width=True):
            st.info("Navigate to Upload Data in the sidebar")
