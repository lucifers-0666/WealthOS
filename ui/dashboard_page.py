"""WealthOS Dashboard — cinematic portfolio intelligence view."""

from __future__ import annotations
import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from frontend.design_system import render_topbar

try:
    from core.data_loader import load_demo_portfolio
    from core.portfolio_engine import compute_portfolio_metrics
    from core.price_fetcher import fetch_prices
except Exception:
    load_demo_portfolio = compute_portfolio_metrics = fetch_prices = None


# ── Colour constants (WealthOS palette) ────────────────────────────────────
C_SURFACE   = "rgba(11,23,40,0.0)"
C_LINE      = "#7DD3FC"
C_LINE2     = "#A78BFA"
C_GOLD      = "#D6C7A1"
C_GREEN     = "#8EE7B8"
C_RED       = "#FCA5A5"
C_GRID      = "rgba(148,163,184,0.08)"
C_TEXT      = "#94A3B8"
C_TEXT2     = "#64748B"

DEMO_HOLDINGS = pd.DataFrame({
    "Ticker":   ["RELIANCE.NS","INFY.NS","HDFCBANK.NS","TCS.NS","WIPRO.NS","VTI","QQQ","INDA","GOLDBEES.NS"],
    "Name":     ["Reliance","Infosys","HDFC Bank","TCS","Wipro","Vanguard Total","Invesco QQQ","iShares MSCI India","GoldBees"],
    "Qty":      [15, 30, 20, 10, 45, 8, 5, 12, 50],
    "Avg Cost": [2800, 1600, 1650, 3800, 540, 215, 430, 42, 55],
    "CMP":      [3120, 1820, 1740, 4100, 580, 226, 448, 45, 60],
    "Sector":   ["Energy","IT","Banking","IT","IT","Global ETF","Global ETF","Global ETF","Gold"],
})
DEMO_HOLDINGS["Invested"]   = DEMO_HOLDINGS["Qty"] * DEMO_HOLDINGS["Avg Cost"]
DEMO_HOLDINGS["Current"]    = DEMO_HOLDINGS["Qty"] * DEMO_HOLDINGS["CMP"]
DEMO_HOLDINGS["PnL"]        = DEMO_HOLDINGS["Current"] - DEMO_HOLDINGS["Invested"]
DEMO_HOLDINGS["PnL%"]       = (DEMO_HOLDINGS["PnL"] / DEMO_HOLDINGS["Invested"] * 100).round(2)
DEMO_HOLDINGS["Weight%"]    = (DEMO_HOLDINGS["Current"] / DEMO_HOLDINGS["Current"].sum() * 100).round(2)

TOTAL_INVESTED  = DEMO_HOLDINGS["Invested"].sum()
TOTAL_CURRENT   = DEMO_HOLDINGS["Current"].sum()
TOTAL_PNL       = DEMO_HOLDINGS["PnL"].sum()
TOTAL_RETURN_PC = round(TOTAL_PNL / TOTAL_INVESTED * 100, 2)

SECTOR_ALLOC = DEMO_HOLDINGS.groupby("Sector")["Current"].sum().reset_index()


def _chart_layout(title="", height=320):
    return dict(
        height=height, plot_bgcolor=C_SURFACE, paper_bgcolor=C_SURFACE,
        font=dict(family="Inter, sans-serif", size=12, color=C_TEXT),
        title=dict(text=title, font=dict(family="Space Grotesk, sans-serif", size=14, color="#F3F4F6"), x=0, xanchor="left") if title else None,
        margin=dict(l=4, r=4, t=30 if title else 8, b=8),
        xaxis=dict(gridcolor=C_GRID, showline=False, zeroline=False, tickfont=dict(size=11)),
        yaxis=dict(gridcolor=C_GRID, showline=False, zeroline=False, tickfont=dict(size=11)),
        legend=dict(bgcolor="rgba(0,0,0,0)", font=dict(size=11)),
    )


def _allocation_donut():
    colours = ["#7DD3FC","#A78BFA","#D6C7A1","#67E8F9","#8EE7B8","#FCA5A5","#F9A8D4","#FDE68A","#6EE7B7"]
    fig = go.Figure(go.Pie(
        labels=SECTOR_ALLOC["Sector"],
        values=SECTOR_ALLOC["Current"],
        hole=0.64,
        marker=dict(colors=colours[:len(SECTOR_ALLOC)], line=dict(color="rgba(2,6,23,0.6)", width=2)),
        textfont=dict(size=11, color="#F3F4F6"),
        hovertemplate="<b>%{label}</b><br>₹%{value:,.0f}<br>%{percent}<extra></extra>",
    ))
    fig.add_annotation(text="<b>Allocation</b>", x=0.5, y=0.54, showarrow=False,
                       font=dict(size=13, color="#F3F4F6", family="Space Grotesk"))
    fig.add_annotation(text=f"₹{TOTAL_CURRENT/100000:.1f}L", x=0.5, y=0.38, showarrow=False,
                       font=dict(size=16, color="#7DD3FC", family="Space Grotesk"))
    fig.update_layout(**_chart_layout(height=300), showlegend=True,
                      legend=dict(orientation="v", x=1, y=0.5, bgcolor="rgba(0,0,0,0)", font=dict(size=10)))
    fig.update_layout(margin=dict(l=0, r=0, t=0, b=0))
    return fig


def _pnl_bar():
    df = DEMO_HOLDINGS.sort_values("PnL%")
    colours = [C_GREEN if v >= 0 else C_RED for v in df["PnL%"]]
    fig = go.Figure(go.Bar(
        x=df["PnL%"], y=df["Ticker"].str.replace(".NS", ""),
        orientation="h",
        marker=dict(color=colours, line=dict(width=0)),
        hovertemplate="<b>%{y}</b>  %{x:.2f}%<extra></extra>",
        text=[f"{v:+.1f}%" for v in df["PnL%"]],
        textposition="outside",
        textfont=dict(size=10, color="#94A3B8"),
    ))
    layout = _chart_layout("Unrealised P&L per Holding", height=320)
    layout["xaxis"]["ticksuffix"] = "%"
    fig.update_layout(**layout)
    fig.add_vline(x=0, line_width=1, line_color="rgba(148,163,184,0.3)")
    return fig


def _sparkline_portfolio():
    import numpy as np
    np.random.seed(42)
    idx = pd.date_range(end=pd.Timestamp.today(), periods=180, freq="D")
    nav = 800000 + np.cumsum(np.random.randn(180) * 3200)
    nav[-1] = TOTAL_CURRENT
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=idx, y=nav,
        mode="lines",
        line=dict(color=C_LINE, width=2),
        fill="tozeroy",
        fillcolor="rgba(125,211,252,0.07)",
        hovertemplate="%{x|%d %b %Y}<br>₹%{y:,.0f}<extra></extra>",
    ))
    layout = _chart_layout("Portfolio Value — 180d", height=240)
    layout["yaxis"]["tickprefix"] = "₹"
    fig.update_layout(**layout)
    return fig


def _target_vs_actual():
    target = {"IT": 30, "Banking": 20, "Energy": 15, "Global ETF": 25, "Gold": 10}
    actual = dict(zip(SECTOR_ALLOC["Sector"], SECTOR_ALLOC["Current"] / SECTOR_ALLOC["Current"].sum() * 100))
    sectors = list(target.keys())
    fig = go.Figure()
    fig.add_trace(go.Bar(name="Target %", x=sectors,
                         y=[target.get(s, 0) for s in sectors],
                         marker_color="rgba(214,199,161,0.55)",
                         marker_line=dict(width=0)))
    fig.add_trace(go.Bar(name="Actual %", x=sectors,
                         y=[actual.get(s, 0) for s in sectors],
                         marker_color=C_LINE,
                         marker_line=dict(width=0),
                         opacity=0.88))
    layout = _chart_layout("Target vs Actual Allocation", height=260)
    layout["barmode"] = "group"
    layout["yaxis"]["ticksuffix"] = "%"
    layout["legend"] = dict(orientation="h", y=1.12, x=0, bgcolor="rgba(0,0,0,0)", font=dict(size=11))
    fig.update_layout(**layout)
    return fig


def render_dashboard_page() -> None:
    render_topbar("Portfolio Dashboard", "Live · Demo Data")

    # ── Hero KPIs ──────────────────────────────────────────────────────────
    k1, k2, k3, k4 = st.columns(4, gap="small")
    delta_color = "normal" if TOTAL_RETURN_PC >= 0 else "inverse"
    with k1:
        st.metric("Total Invested", f"₹{TOTAL_INVESTED/100000:.2f}L")
    with k2:
        st.metric("Current Value", f"₹{TOTAL_CURRENT/100000:.2f}L",
                  delta=f"₹{TOTAL_PNL/100000:+.2f}L")
    with k3:
        st.metric("Overall Return", f"{TOTAL_RETURN_PC:+.2f}%",
                  delta=f"{TOTAL_RETURN_PC:.2f}%",
                  delta_color=delta_color)
    with k4:
        best = DEMO_HOLDINGS.loc[DEMO_HOLDINGS["PnL%"].idxmax()]
        st.metric("Best Performer",
                  best["Ticker"].replace(".NS", ""),
                  delta=f"{best['PnL%']:+.2f}%")

    st.markdown("<div style='margin:0.8rem 0'></div>", unsafe_allow_html=True)

    # ── Portfolio value + Allocation donut ────────────────────────────────
    col_chart, col_donut = st.columns([3, 2], gap="small")
    with col_chart:
        st.markdown("""<div class='wo-panel'>""", unsafe_allow_html=True)
        st.plotly_chart(_sparkline_portfolio(), use_container_width=True,
                        config=dict(displayModeBar=False))
        st.markdown("""</div>""", unsafe_allow_html=True)
    with col_donut:
        st.markdown("""<div class='wo-panel'>""", unsafe_allow_html=True)
        st.markdown("""<div class='wo-panel-header'><div>
            <div class='wo-kicker'>Asset Allocation</div>
            <div class='wo-panel-title'>Sector Breakdown</div></div></div>""",
            unsafe_allow_html=True)
        st.plotly_chart(_allocation_donut(), use_container_width=True,
                        config=dict(displayModeBar=False))
        st.markdown("""</div>""", unsafe_allow_html=True)

    st.markdown("<div style='margin:0.5rem 0'></div>", unsafe_allow_html=True)

    # ── P&L bar + Target vs Actual ─────────────────────────────────────────
    col_pnl, col_tgt = st.columns([3, 2], gap="small")
    with col_pnl:
        st.markdown("""<div class='wo-panel'>""", unsafe_allow_html=True)
        st.plotly_chart(_pnl_bar(), use_container_width=True,
                        config=dict(displayModeBar=False))
        st.markdown("""</div>""", unsafe_allow_html=True)
    with col_tgt:
        st.markdown("""<div class='wo-panel'>""", unsafe_allow_html=True)
        st.plotly_chart(_target_vs_actual(), use_container_width=True,
                        config=dict(displayModeBar=False))
        st.markdown("""</div>""", unsafe_allow_html=True)

    st.markdown("<div style='margin:0.5rem 0'></div>", unsafe_allow_html=True)

    # ── Holdings table ─────────────────────────────────────────────────────
    st.markdown("""
    <div class='wo-panel'>
        <div class='wo-panel-header'>
            <div>
                <div class='wo-kicker'>Holdings Registry</div>
                <div class='wo-panel-title'>All Positions</div>
            </div>
        </div>
    """, unsafe_allow_html=True)

    def colour_pnl(val):
        return f"color: {'#8EE7B8' if val >= 0 else '#FCA5A5'}; font-weight:600;"

    display_df = DEMO_HOLDINGS[["Ticker","Name","Qty","Avg Cost","CMP","Invested","Current","PnL","PnL%","Weight%","Sector"]].copy()
    st.dataframe(
        display_df.style.applymap(colour_pnl, subset=["PnL","PnL%"]),
        use_container_width=True,
        height=310,
        column_config={
            "Invested":  st.column_config.NumberColumn("Invested",    format="₹%.0f"),
            "Current":   st.column_config.NumberColumn("Current",     format="₹%.0f"),
            "PnL":       st.column_config.NumberColumn("P&L",         format="₹%.0f"),
            "PnL%":      st.column_config.NumberColumn("P&L %",       format="%.2f%%"),
            "Weight%":   st.column_config.NumberColumn("Weight",      format="%.1f%%"),
            "Avg Cost":  st.column_config.NumberColumn("Avg Cost",    format="₹%.0f"),
            "CMP":       st.column_config.NumberColumn("CMP",         format="₹%.0f"),
        },
    )
    st.markdown("</div>", unsafe_allow_html=True)

    # ── AI Snapshot ────────────────────────────────────────────────────────
    st.markdown("<div style='margin:0.5rem 0'></div>", unsafe_allow_html=True)
    st.markdown("""
    <div class='wo-terminal-box'>
        <div style='color:#D6C7A1;font-size:0.72rem;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:0.6rem;'>AI CFO Snapshot</div>
        <div style='line-height:1.75;color:#c7d2fe;'>
            &gt;&nbsp;Portfolio return <strong style='color:#8EE7B8;'>+{ret:.2f}%</strong> vs Nifty 50 benchmark +10.4% — alpha generated.<br>
            &gt;&nbsp;IT sector concentration at <strong style='color:#FDE68A;'>38.1%</strong> — approaching overweight threshold of 40%.<br>
            &gt;&nbsp;Suggested action: Trim <strong style='color:#7DD3FC;'>Wipro</strong> by 10 shares and redeploy into Banking for rebalance.<br>
            &gt;&nbsp;LTCG exposure this FY: ₹0 (all holdings under 12 months). Review in Q3 FY26.
        </div>
    </div>
    """.format(ret=TOTAL_RETURN_PC), unsafe_allow_html=True)
