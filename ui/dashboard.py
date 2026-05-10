import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from loguru import logger

from core.data_loader       import get_sample_holdings
from core.price_fetcher     import fetch_live_prices
from core.portfolio_engine  import compute_portfolio_metrics, get_summary_stats
from ui.components          import page_header, section_title, metric_card

# ---- Plotly base layout matching Deep Space theme ----
BG         = "rgba(0,0,0,0)"
GRID       = "rgba(148,163,184,0.08)"
TEXT       = "#94A3B8"
BLUE       = "#3B82F6"
CYAN       = "#22D3EE"
VIOLET     = "#8B5CF6"
GREEN      = "#34D399"
RED        = "#F87171"
PALETTE    = [BLUE, CYAN, VIOLET, "#F59E0B", GREEN, "#EC4899", "#FB923C", "#A78BFA"]


def _base_layout(**kwargs):
    base = dict(
        paper_bgcolor=BG, plot_bgcolor=BG,
        font=dict(family="Inter, Space Grotesk, sans-serif", color=TEXT, size=12),
        margin=dict(l=16, r=16, t=40, b=16),
        legend=dict(bgcolor="rgba(0,0,0,0)", font=dict(color=TEXT, size=11)),
        xaxis=dict(gridcolor=GRID, zerolinecolor=GRID, tickfont=dict(color=TEXT)),
        yaxis=dict(gridcolor=GRID, zerolinecolor=GRID, tickfont=dict(color=TEXT)),
        colorway=PALETTE,
    )
    base.update(kwargs)
    return base


def _load_portfolio():
    df = st.session_state.get("portfolio_data")
    prices = st.session_state.get("live_prices", {})
    if df is None:
        return None, {}
    if not prices:
        with st.spinner("Fetching live prices..."):
            prices = fetch_live_prices(df['Symbol'].tolist())
        st.session_state.live_prices = prices
    df = compute_portfolio_metrics(df, prices)
    return df, prices


def render_dashboard():
    page_header("📊", "Portfolio Dashboard", "Real-time overview of your holdings, gains & allocation")

    df, prices = _load_portfolio()

    if df is None:
        st.markdown("""
        <div style="text-align:center;padding:4rem 2rem;">
          <div style="font-size:3rem;margin-bottom:1rem">📁</div>
          <p style="font-family:'Space Grotesk',sans-serif;font-size:1.15rem;font-weight:600;color:#F8FAFC;margin:0 0 .5rem">No Portfolio Loaded</p>
          <p style="color:#94A3B8;font-size:.9rem;margin:0 0 1.5rem">Upload your holdings CSV or load the demo portfolio to get started.</p>
        </div>
        """, unsafe_allow_html=True)
        if st.button("Load Demo Portfolio →", type="primary"):
            st.session_state.portfolio_data = get_sample_holdings()
            st.rerun()
        return

    stats = get_summary_stats(df)

    # ---- KPI Row ----
    section_title("💰", "Portfolio Overview")
    c1, c2, c3, c4 = st.columns(4)
    total_val   = stats.get('total_current_value', 0)
    total_inv   = stats.get('total_invested', 0)
    total_pnl   = stats.get('total_pnl', 0)
    total_pnl_p = stats.get('total_pnl_pct', 0)
    day_pnl     = stats.get('day_pnl', 0)
    day_pnl_p   = stats.get('day_pnl_pct', 0)
    num_h       = stats.get('num_holdings', 0)

    with c1:
        metric_card("Portfolio Value",
                    f"₹{total_val:,.0f}",
                    f"{total_pnl_p:+.2f}% all-time",
                    total_pnl >= 0)
    with c2:
        metric_card("Total Invested",
                    f"₹{total_inv:,.0f}",
                    f"{num_h} holdings")
    with c3:
        metric_card("Unrealized P&L",
                    f"₹{total_pnl:+,.0f}",
                    f"{total_pnl_p:+.2f}%",
                    total_pnl >= 0)
    with c4:
        metric_card("Today's Change",
                    f"₹{day_pnl:+,.0f}",
                    f"{day_pnl_p:+.2f}%",
                    day_pnl >= 0)

    st.markdown("<div style='height:.5rem'></div>", unsafe_allow_html=True)

    # ---- Charts Row 1: Allocation + P&L Bar ----
    section_title("🎯", "Allocation & Performance")
    col_a, col_b = st.columns([1, 1])

    with col_a:
        fig_pie = go.Figure(go.Pie(
            labels=df['Symbol'].tolist(),
            values=df['Current_Value'].tolist(),
            hole=.52,
            marker=dict(colors=PALETTE, line=dict(color='rgba(5,8,22,0.8)', width=2)),
            textfont=dict(size=11, color="#F8FAFC"),
            hovertemplate="<b>%{label}</b><br>Value: ₹%{value:,.0f}<br>Weight: %{percent}<extra></extra>"
        ))
        fig_pie.update_layout(**_base_layout(
            title=dict(text="Portfolio Allocation", font=dict(size=14, color="#F8FAFC"), x=.5),
            showlegend=True,
            legend=dict(orientation="v", x=1.02, y=.5, bgcolor="rgba(0,0,0,0)"),
            height=340,
        ))
        fig_pie.add_annotation(text=f"<b style='font-size:16px'>{num_h}</b><br><span style='font-size:11px;color:#94A3B8'>Holdings</span>",
                               x=.5, y=.5, showarrow=False, font=dict(color="#F8FAFC", size=14))
        st.plotly_chart(fig_pie, use_container_width=True)

    with col_b:
        df_sorted = df.sort_values('PnL_Pct', ascending=True)
        colors_bar = [GREEN if v >= 0 else RED for v in df_sorted['PnL_Pct']]
        fig_bar = go.Figure(go.Bar(
            y=df_sorted['Symbol'],
            x=df_sorted['PnL_Pct'],
            orientation='h',
            marker=dict(color=colors_bar, line=dict(width=0)),
            hovertemplate="<b>%{y}</b><br>P&L: %{x:.2f}%<extra></extra>",
            text=[f"{v:+.1f}%" for v in df_sorted['PnL_Pct']],
            textposition='outside',
            textfont=dict(size=10, color="#94A3B8")
        ))
        fig_bar.update_layout(**_base_layout(
            title=dict(text="P&L % by Holding", font=dict(size=14, color="#F8FAFC"), x=.5),
            xaxis=dict(gridcolor=GRID, zerolinecolor="rgba(148,163,184,0.3)",
                       ticksuffix="%", tickfont=dict(color=TEXT)),
            yaxis=dict(gridcolor=GRID, tickfont=dict(color=TEXT)),
            height=340,
            bargap=.3,
        ))
        st.plotly_chart(fig_bar, use_container_width=True)

    # ---- Charts Row 2: Sector + Value vs Invested ----
    section_title("📈", "Sector Breakdown & Cost Basis")
    col_c, col_d = st.columns([1, 1])

    with col_c:
        if 'Sector' in df.columns:
            sector_df = df.groupby('Sector')['Current_Value'].sum().reset_index()
            fig_sec = go.Figure(go.Pie(
                labels=sector_df['Sector'],
                values=sector_df['Current_Value'],
                hole=.45,
                marker=dict(colors=PALETTE, line=dict(color='rgba(5,8,22,0.8)', width=2)),
                textfont=dict(size=11, color="#F8FAFC"),
            ))
            fig_sec.update_layout(**_base_layout(
                title=dict(text="By Sector", font=dict(size=14, color="#F8FAFC"), x=.5),
                showlegend=True, height=300,
            ))
            st.plotly_chart(fig_sec, use_container_width=True)

    with col_d:
        fig_cost = go.Figure()
        fig_cost.add_trace(go.Bar(
            name="Invested", x=df['Symbol'], y=df['Invested_Amount'],
            marker_color=VIOLET, opacity=.8,
        ))
        fig_cost.add_trace(go.Bar(
            name="Current Value", x=df['Symbol'], y=df['Current_Value'],
            marker_color=CYAN, opacity=.9,
        ))
        fig_cost.update_layout(**_base_layout(
            title=dict(text="Value vs Cost Basis", font=dict(size=14, color="#F8FAFC"), x=.5),
            barmode='group', bargap=.25, height=300,
            legend=dict(orientation="h", y=1.08, x=.5, xanchor="center"),
        ))
        st.plotly_chart(fig_cost, use_container_width=True)

    # ---- Holdings Table ----
    section_title("📋", "Holdings Detail")
    display_cols = ['Symbol', 'Name', 'Quantity', 'Avg_Buy_Price', 'Current_Price',
                    'Invested_Amount', 'Current_Value', 'PnL', 'PnL_Pct', 'Weight_Pct']
    cols_present = [c for c in display_cols if c in df.columns]
    tbl = df[cols_present].copy()
    tbl.rename(columns={
        'Avg_Buy_Price': 'Avg Price', 'Current_Price': 'CMP',
        'Invested_Amount': 'Invested', 'Current_Value': 'Value',
        'PnL_Pct': 'P&L %', 'Weight_Pct': 'Weight %'
    }, inplace=True)

    def color_pnl(val):
        if isinstance(val, (int, float)):
            return 'color: #34D399' if val >= 0 else 'color: #F87171'
        return ''

    styled = tbl.style\
        .applymap(color_pnl, subset=[c for c in ['PnL', 'P&L %'] if c in tbl.columns])\
        .format({
            'Avg Price': '₹{:.2f}', 'CMP': '₹{:.2f}',
            'Invested': '₹{:,.0f}', 'Value': '₹{:,.0f}',
            'PnL': '₹{:+,.0f}', 'P&L %': '{:+.2f}%', 'Weight %': '{:.1f}%'
        }, na_rep="—")

    st.dataframe(styled, use_container_width=True, height=280)
