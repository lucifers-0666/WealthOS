import streamlit as st
import pandas as pd
from core.portfolio_engine import compute_portfolio_metrics, compute_allocation_by_type, compute_allocation_by_sector, get_summary_stats, compute_portfolio_value_over_time
from core.target_tracker import compute_target_deviation
from charts.allocation_chart import render_allocation_charts
from charts.performance_chart import render_performance_chart
from charts.gains_chart import render_gains_chart
from charts.drawdown_chart import render_drawdown_chart
from ui.components import metric_card, section_header
from config import DEFAULT_TARGET_ALLOCATION


def render_dashboard():
    if st.session_state.portfolio_data is None:
        st.info("👈 Go to **Upload Data** to load your portfolio, or use the Demo Portfolio.")
        _render_demo_cta()
        return

    df = st.session_state.portfolio_data
    live_prices = st.session_state.live_prices or {}

    # Compute metrics
    portfolio_df = compute_portfolio_metrics(df, live_prices)
    summary = get_summary_stats(portfolio_df)

    # ── Header ──
    st.markdown("""
    <div class="main-header">
        <h1 style='margin:0'>💰 WealthOS Dashboard</h1>
        <p style='margin:0; opacity:0.8'>Your AI-powered personal finance command center</p>
    </div>
    """, unsafe_allow_html=True)

    # ── KPI Row ──
    col1, col2, col3, col4 = st.columns(4)
    pnl = summary['total_pnl']
    pnl_pct = summary['total_pnl_pct']

    with col1:
        metric_card("💼 Portfolio Value", f"₹{summary['total_current_value']:,.0f}",
                    delta=f"{'+' if pnl >= 0 else ''}₹{pnl:,.0f} ({pnl_pct:+.1f}%)",
                    delta_positive=pnl >= 0)
    with col2:
        metric_card("💸 Total Invested", f"₹{summary['total_invested']:,.0f}")
    with col3:
        metric_card("🏆 Best Performer", summary['best_performer'], delta_positive=True)
    with col4:
        metric_card("⚠️ Worst Performer", summary['worst_performer'], delta_positive=False)

    st.divider()

    # ── Allocation Charts ──
    section_header("📊 Portfolio Allocation", "Current mix vs your target allocation")
    allocation_by_type = compute_allocation_by_type(portfolio_df)

    # Target allocation sidebar override
    with st.expander("⚙️ Configure Target Allocation", expanded=False):
        target = {}
        for cat, pct in DEFAULT_TARGET_ALLOCATION.items():
            target[cat] = st.slider(cat, 0.0, 100.0, float(pct), step=1.0)
        total_target = sum(target.values())
        if abs(total_target - 100) > 0.1:
            st.warning(f"Target allocation sums to {total_target:.0f}% (should be 100%)")

    render_allocation_charts(allocation_by_type, target)

    # ── Target Deviation ──
    deviation_df = compute_target_deviation(allocation_by_type, target)
    st.subheader("🎯 Target vs Actual Deviation")
    st.dataframe(deviation_df, use_container_width=True)

    st.divider()

    # ── Performance Chart ──
    section_header("📈 Portfolio Performance Over Time", "Reconstructed from transaction history")
    transactions_df = st.session_state.transactions_data
    portfolio_value_ts = compute_portfolio_value_over_time(transactions_df, live_prices)
    if not portfolio_value_ts.empty:
        render_performance_chart(portfolio_value_ts)
    else:
        st.info("Upload transaction history to see portfolio performance over time.")

    st.divider()

    # ── Gains/Losses Chart ──
    section_header("💹 Gains & Losses by Holding", "Unrealized P&L for each position")
    render_gains_chart(portfolio_df)

    st.divider()

    # ── Drawdown Chart ──
    section_header("📉 Drawdown Analysis", "Maximum drawdown per position")
    render_drawdown_chart(portfolio_df, live_prices)

    st.divider()

    # ── Holdings Table ──
    section_header("📋 Holdings Detail", "Full position breakdown with live prices")
    display_cols = ['Symbol', 'Name', 'Quantity', 'Avg_Buy_Price', 'Current_Price',
                    'Current_Value', 'Invested_Amount', 'Unrealized_PnL', 'PnL_Pct', 'Weight_Pct']
    display_cols = [c for c in display_cols if c in portfolio_df.columns]
    styled_df = portfolio_df[display_cols].copy()
    st.dataframe(styled_df.style.format({
        'Avg_Buy_Price': '₹{:.2f}',
        'Current_Price': '₹{:.2f}',
        'Current_Value': '₹{:,.0f}',
        'Invested_Amount': '₹{:,.0f}',
        'Unrealized_PnL': '₹{:+,.0f}',
        'PnL_Pct': '{:+.2f}%',
        'Weight_Pct': '{:.1f}%',
    }).applymap(
        lambda v: 'color: #00C851' if isinstance(v, (int, float)) and v > 0 else
                  'color: #FF4444' if isinstance(v, (int, float)) and v < 0 else '',
        subset=['Unrealized_PnL', 'PnL_Pct']
    ), use_container_width=True)


def _render_demo_cta():
    st.markdown("""### 🚀 Get Started with WealthOS

1. **Upload Data** — Go to Upload Data page and load your holdings CSV
2. **Or try the Demo** — Load a sample Indian equity + ETF portfolio
3. **Ask AI CFO** — Get personalized investment advice
    """)
    if st.button("🎮 Load Demo Portfolio", type="primary"):
        from core.data_loader import get_sample_holdings, get_sample_transactions
        from core.price_fetcher import fetch_live_prices
        st.session_state.portfolio_data = get_sample_holdings()
        st.session_state.transactions_data = get_sample_transactions()
        st.session_state.live_prices = fetch_live_prices(st.session_state.portfolio_data['Symbol'].tolist())
        st.rerun()
