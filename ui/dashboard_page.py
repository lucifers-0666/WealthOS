"""WealthOS Dashboard — cinematic portfolio intelligence workspace."""

from __future__ import annotations
import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from frontend.design_system import render_topbar, render_hero, panel_start, panel_end

try:
    from core.data_loader import load_demo_portfolio
    from core.portfolio_engine import compute_portfolio_metrics
    from core.price_fetcher import fetch_prices
except Exception:
    load_demo_portfolio = compute_portfolio_metrics = fetch_prices = None


# ── Palette ────────────────────────────────────────────────────────────────
C_SURFACE = "rgba(0,0,0,0)"
C_LINE    = "#7DD3FC"
C_LINE2   = "#A78BFA"
C_GOLD    = "#D6C7A1"
C_GREEN   = "#8EE7B8"
C_RED     = "#FCA5A5"
C_GRID    = "rgba(148,163,184,0.08)"
C_TEXT    = "#94A3B8"
COLORS    = ["#7DD3FC","#A78BFA","#67E8F9","#D6C7A1","#8EE7B8","#FCA5A5","#F9A8D4","#FDE68A","#6EE7B7"]

CHART_LAYOUT = dict(
    template="plotly_dark",
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font=dict(family="Inter, sans-serif", color="#94A3B8", size=12),
    title_font=dict(family="Space Grotesk, sans-serif", color="#F3F4F6", size=14),
    margin=dict(l=0, r=0, t=36, b=0),
    xaxis=dict(gridcolor="rgba(148,163,184,0.08)", zerolinecolor="rgba(148,163,184,0.06)", showline=False),
    yaxis=dict(gridcolor="rgba(148,163,184,0.08)", zerolinecolor="rgba(148,163,184,0.06)", showline=False),
    legend=dict(bgcolor="rgba(0,0,0,0)", font=dict(size=11)),
)


# ── Demo data ────────────────────────────────────────────────────────────────
DEMO_HOLDINGS = pd.DataFrame({
    "Ticker":   ["RELIANCE.NS","INFY.NS","HDFCBANK.NS","TCS.NS","WIPRO.NS","VTI","QQQ","INDA","GOLDBEES.NS"],
    "Name":     ["Reliance","Infosys","HDFC Bank","TCS","Wipro","Vanguard Total","Invesco QQQ","iShares MSCI India","GoldBees"],
    "Qty":      [15, 30, 20, 10, 45, 8, 5, 12, 50],
    "Avg Cost": [2800, 1600, 1650, 3800, 540, 215, 430, 42, 55],
    "CMP":      [3120, 1820, 1740, 4100, 580, 226, 448, 45, 60],
    "Sector":   ["Energy","IT","Banking","IT","IT","Global ETF","Global ETF","Global ETF","Gold"],
})
DEMO_HOLDINGS["Invested"]  = DEMO_HOLDINGS["Qty"] * DEMO_HOLDINGS["Avg Cost"]
DEMO_HOLDINGS["Current"]   = DEMO_HOLDINGS["Qty"] * DEMO_HOLDINGS["CMP"]
DEMO_HOLDINGS["PnL"]       = DEMO_HOLDINGS["Current"] - DEMO_HOLDINGS["Invested"]
DEMO_HOLDINGS["PnL%"]      = (DEMO_HOLDINGS["PnL"] / DEMO_HOLDINGS["Invested"] * 100).round(2)
DEMO_HOLDINGS["Weight%"]   = (DEMO_HOLDINGS["Current"] / DEMO_HOLDINGS["Current"].sum() * 100).round(2)

TOTAL_INVESTED  = DEMO_HOLDINGS["Invested"].sum()
TOTAL_CURRENT   = DEMO_HOLDINGS["Current"].sum()
TOTAL_PNL       = DEMO_HOLDINGS["PnL"].sum()
TOTAL_RETURN_PC = round(TOTAL_PNL / TOTAL_INVESTED * 100, 2)
SECTOR_ALLOC    = DEMO_HOLDINGS.groupby("Sector")["Current"].sum().reset_index()


def _allocation_donut():
    fig = go.Figure(go.Pie(
        labels=SECTOR_ALLOC["Sector"],
        values=SECTOR_ALLOC["Current"],
        hole=0.64,
        marker=dict(colors=COLORS[:len(SECTOR_ALLOC)], line=dict(color="rgba(2,6,23,0.6)", width=2)),
        textfont=dict(size=11, color="#F3F4F6"),
        hovertemplate="<b>%{label}</b><br>\u20b9%{value:,.0f}<br>%{percent}<extra></extra>",
    ))
    fig.add_annotation(text="<b>Allocation</b>", x=0.5, y=0.56, showarrow=False,
                       font=dict(size=13, color="#F3F4F6", family="Space Grotesk"))
    fig.add_annotation(text=f"\u20b9{TOTAL_CURRENT/100000:.1f}L", x=0.5, y=0.40, showarrow=False,
                       font=dict(size=16, color="#7DD3FC", family="Space Grotesk"))
    layout = {**CHART_LAYOUT}
    layout["margin"] = dict(l=0, r=0, t=0, b=0)
    layout["height"] = 300
    layout["showlegend"] = True
    layout["legend"] = dict(orientation="v", x=1.02, y=0.5, bgcolor="rgba(0,0,0,0)", font=dict(size=10))
    fig.update_layout(**layout)
    return fig


def _pnl_bar():
    df = DEMO_HOLDINGS.sort_values("PnL%")
    colours = [C_GREEN if v >= 0 else C_RED for v in df["PnL%"]]
    fig = go.Figure(go.Bar(
        x=df["PnL%"], y=df["Ticker"].str.replace(".NS", "", regex=False),
        orientation="h",
        marker=dict(color=colours, line=dict(width=0)),
        hovertemplate="<b>%{y}</b>  %{x:.2f}%<extra></extra>",
        text=[f"{v:+.1f}%" for v in df["PnL%"]],
        textposition="outside",
        textfont=dict(size=10, color="#94A3B8"),
    ))
    layout = {**CHART_LAYOUT, "height": 320}
    layout["title"] = dict(text="Unrealised P&L per Holding", font=dict(family="Space Grotesk, sans-serif", color="#F3F4F6", size=14), x=0)
    layout["xaxis"] = {**layout.get("xaxis", {}), "ticksuffix": "%"}
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
        hovertemplate="%{x|%d %b %Y}<br>\u20b9%{y:,.0f}<extra></extra>",
    ))
    layout = {**CHART_LAYOUT, "height": 240}
    layout["title"] = dict(text="Portfolio Value \u2014 180d", font=dict(family="Space Grotesk, sans-serif", color="#F3F4F6", size=14), x=0)
    layout["yaxis"] = {**layout.get("yaxis", {}), "tickprefix": "\u20b9"}
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
    layout = {**CHART_LAYOUT, "height": 260}
    layout["title"] = dict(text="Target vs Actual Allocation", font=dict(family="Space Grotesk, sans-serif", color="#F3F4F6", size=14), x=0)
    layout["barmode"] = "group"
    layout["yaxis"] = {**layout.get("yaxis", {}), "ticksuffix": "%"}
    layout["legend"] = dict(orientation="h", y=1.12, x=0, bgcolor="rgba(0,0,0,0)", font=dict(size=11))
    fig.update_layout(**layout)
    return fig


def render_dashboard_page() -> None:
    render_topbar("Portfolio Intelligence", "Live \u00b7 Demo Data")
    render_hero(
        "Your Wealth,<br><span style='color:#7DD3FC;'>Decoded.</span>",
        "Real-time portfolio analytics, sector intelligence, and AI-driven insights — all in one cinematic workspace.",
        right_html=f"""
        <div style='text-align:right;'>
            <div style='color:#64748B;font-size:0.72rem;letter-spacing:0.16em;text-transform:uppercase;'>Total Return</div>
            <div style='font-family:Space Grotesk,sans-serif;font-size:2.8rem;font-weight:700;
                        color:{'#8EE7B8' if TOTAL_RETURN_PC >= 0 else '#FCA5A5'};letter-spacing:-0.04em;'>
                {TOTAL_RETURN_PC:+.2f}%
            </div>
            <div style='color:#64748B;font-size:0.82rem;'>on \u20b9{TOTAL_INVESTED/100000:.2f}L invested</div>
        </div>
        """,
    )

    # ── KPI metrics row ────────────────────────────────────────────────────
    best = DEMO_HOLDINGS.loc[DEMO_HOLDINGS["PnL%"].idxmax()]
    worst = DEMO_HOLDINGS.loc[DEMO_HOLDINGS["PnL%"].idxmin()]

    kpi_html = f"""
    <div style='display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem;'>
        <div class='wo-metric'>
            <div class='wo-label'>Total Invested</div>
            <div class='wo-value'>\u20b9{TOTAL_INVESTED/100000:.2f}L</div>
            <div class='wo-delta-up'>Capital deployed</div>
        </div>
        <div class='wo-metric'>
            <div class='wo-label'>Current Value</div>
            <div class='wo-value'>\u20b9{TOTAL_CURRENT/100000:.2f}L</div>
            <div class='wo-delta-{'up' if TOTAL_PNL >= 0 else 'down'}'>
                \u20b9{TOTAL_PNL/100000:+.2f}L unrealised
            </div>
        </div>
        <div class='wo-metric'>
            <div class='wo-label'>Best Performer</div>
            <div class='wo-value'>{best['Ticker'].replace('.NS','')}</div>
            <div class='wo-delta-up'>{best['PnL%']:+.2f}% return</div>
        </div>
        <div class='wo-metric'>
            <div class='wo-label'>Worst Performer</div>
            <div class='wo-value'>{worst['Ticker'].replace('.NS','')}</div>
            <div class='wo-delta-down'>{worst['PnL%']:+.2f}% return</div>
        </div>
    </div>
    """
    st.markdown(kpi_html, unsafe_allow_html=True)

    # ── Portfolio value + Allocation donut ─────────────────────────────────
    col_chart, col_donut = st.columns([3, 2], gap="small")
    with col_chart:
        panel_start("Portfolio Value", "180-day NAV trajectory")
        st.plotly_chart(_sparkline_portfolio(), use_container_width=True,
                        config=dict(displayModeBar=False))
        panel_end()
    with col_donut:
        panel_start("Sector Allocation", "Asset distribution by sector")
        st.plotly_chart(_allocation_donut(), use_container_width=True,
                        config=dict(displayModeBar=False))
        panel_end()

    st.markdown("<div style='margin:0.5rem 0'></div>", unsafe_allow_html=True)

    # ── P&L bar + Target vs Actual ─────────────────────────────────────────
    col_pnl, col_tgt = st.columns([3, 2], gap="small")
    with col_pnl:
        panel_start("Unrealised P&L", "Per-holding gain / loss breakdown")
        st.plotly_chart(_pnl_bar(), use_container_width=True,
                        config=dict(displayModeBar=False))
        panel_end()
    with col_tgt:
        panel_start("Allocation vs Target", "Actual vs strategic allocation")
        st.plotly_chart(_target_vs_actual(), use_container_width=True,
                        config=dict(displayModeBar=False))
        panel_end()

    st.markdown("<div style='margin:0.5rem 0'></div>", unsafe_allow_html=True)

    # ── Holdings table ─────────────────────────────────────────────────────
    panel_start("Holdings Registry", "All active positions")

    def colour_pnl(val):
        return f"color: {'#8EE7B8' if val >= 0 else '#FCA5A5'}; font-weight:600;"

    display_df = DEMO_HOLDINGS[[
        "Ticker","Name","Qty","Avg Cost","CMP","Invested","Current","PnL","PnL%","Weight%","Sector"
    ]].copy()
    st.dataframe(
        display_df.style.map(colour_pnl, subset=["PnL","PnL%"]),
        use_container_width=True,
        height=310,
        column_config={
            "Invested": st.column_config.NumberColumn("Invested",  format="\u20b9%.0f"),
            "Current":  st.column_config.NumberColumn("Current",   format="\u20b9%.0f"),
            "PnL":      st.column_config.NumberColumn("P&L",       format="\u20b9%.0f"),
            "PnL%":     st.column_config.NumberColumn("P&L %",     format="%.2f%%"),
            "Weight%":  st.column_config.NumberColumn("Weight",    format="%.1f%%"),
            "Avg Cost": st.column_config.NumberColumn("Avg Cost",  format="\u20b9%.0f"),
            "CMP":      st.column_config.NumberColumn("CMP",       format="\u20b9%.0f"),
        },
    )
    panel_end()

    # ── AI CFO Snapshot ────────────────────────────────────────────────────
    st.markdown("<div style='margin:0.5rem 0'></div>", unsafe_allow_html=True)
    st.markdown(f"""
    <div class='wo-terminal-box'>
        <div style='color:#D6C7A1;font-size:0.72rem;letter-spacing:0.16em;
                    text-transform:uppercase;margin-bottom:0.6rem;'>AI CFO Snapshot</div>
        <div style='line-height:1.85;color:#c7d2fe;font-family:IBM Plex Mono,monospace;font-size:0.88rem;'>
            &gt;&nbsp;Portfolio return
            <strong style='color:#8EE7B8;'>{TOTAL_RETURN_PC:+.2f}%</strong>
            vs Nifty 50 benchmark +10.4% \u2014 positive alpha generated.<br>
            &gt;&nbsp;IT sector concentration at
            <strong style='color:#FDE68A;'>38.1%</strong>
            \u2014 approaching overweight threshold of 40%.<br>
            &gt;&nbsp;Suggested: Trim
            <strong style='color:#7DD3FC;'>Wipro</strong>
            by 10 shares \u2192 redeploy into Banking for rebalance.<br>
            &gt;&nbsp;LTCG exposure this FY: \u20b90 (all holdings under 12 months). Review in Q3 FY26.
        </div>
    </div>
    """, unsafe_allow_html=True)
