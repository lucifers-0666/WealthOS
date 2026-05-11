"""WealthOS Dashboard — cinematic portfolio intelligence workspace."""

from __future__ import annotations

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from frontend.design_system import render_topbar, render_hero

try:
    from core.data_loader import load_demo_portfolio
    from core.portfolio_engine import compute_portfolio_metrics
    from core.price_fetcher import fetch_prices
except Exception:
    load_demo_portfolio = None
    compute_portfolio_metrics = None
    fetch_prices = None


# ─────────────────────────────────────────────────────────────────────────────
# Chart helpers — dark luxury chart factory
# ─────────────────────────────────────────────────────────────────────────────

_CHART_BG = "rgba(0,0,0,0)"
_PAPER_BG = "rgba(0,0,0,0)"
_GRID = "rgba(148,163,184,0.06)"
_TEXT_MUTED = "#64748B"
_TEXT_SOFT = "#94A3B8"
_ACCENT = "#7DD3FC"
_ACCENT2 = "#A78BFA"
_GOLD = "#D6C7A1"
_GREEN = "#8EE7B8"
_RED = "#FCA5A5"

_PALETTE = [_ACCENT, _ACCENT2, _GOLD, "#67E8F9", "#86EFAC", "#FCD34D", "#F9A8D4"]

_BASE_LAYOUT = dict(
    paper_bgcolor=_PAPER_BG,
    plot_bgcolor=_CHART_BG,
    font=dict(family="Inter, sans-serif", color=_TEXT_SOFT, size=12),
    margin=dict(l=0, r=0, t=32, b=0),
    legend=dict(
        bgcolor="rgba(0,0,0,0)",
        borderwidth=0,
        font=dict(size=11, color=_TEXT_SOFT),
        orientation="h",
        yanchor="bottom",
        y=1.04,
        xanchor="left",
        x=0,
    ),
    colorway=_PALETTE,
    xaxis=dict(
        gridcolor=_GRID,
        linecolor=_GRID,
        tickfont=dict(size=11, color=_TEXT_MUTED),
        zeroline=False,
    ),
    yaxis=dict(
        gridcolor=_GRID,
        linecolor=_GRID,
        tickfont=dict(size=11, color=_TEXT_MUTED),
        zeroline=False,
    ),
)


def _chart_config() -> dict:
    return {"displayModeBar": False, "responsive": True}


def _apply_base(fig: go.Figure) -> go.Figure:
    fig.update_layout(**_BASE_LAYOUT)
    return fig


def make_donut(labels: list, values: list, title: str = "") -> go.Figure:
    fig = go.Figure(
        go.Pie(
            labels=labels,
            values=values,
            hole=0.68,
            marker=dict(
                colors=_PALETTE[: len(labels)],
                line=dict(color="rgba(2,6,23,0.6)", width=2),
            ),
            textinfo="none",
            hovertemplate="%{label}<br>%{percent}<extra></extra>",
        )
    )
    fig.update_layout(
        **_BASE_LAYOUT,
        showlegend=True,
        title=dict(
            text=title,
            font=dict(family="Space Grotesk, sans-serif", size=14, color="#F3F4F6"),
            x=0,
            xanchor="left",
        ),
        annotations=[
            dict(
                text=f"<b>{len(labels)}</b><br>Holdings",
                x=0.5, y=0.5,
                font=dict(size=15, color="#F3F4F6", family="Space Grotesk, sans-serif"),
                showarrow=False,
            )
        ],
    )
    return fig


def make_area_line(x: list, y: list, title: str = "", color: str = _ACCENT) -> go.Figure:
    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=x,
            y=y,
            mode="lines",
            line=dict(color=color, width=1.8, shape="spline"),
            fill="tozeroy",
            fillcolor=f"rgba({int(color[1:3],16)},{int(color[3:5],16)},{int(color[5:7],16)},0.07)"
            if color.startswith("#") and len(color) == 7
            else f"rgba(125,211,252,0.07)",
            hovertemplate="%{x}<br>%{y:,.0f}<extra></extra>",
        )
    )
    fig.update_layout(
        **_BASE_LAYOUT,
        title=dict(
            text=title,
            font=dict(family="Space Grotesk, sans-serif", size=14, color="#F3F4F6"),
            x=0,
            xanchor="left",
        ),
    )
    return fig


def make_hbar(names: list, values: list, title: str = "") -> go.Figure:
    colors = [_GREEN if v >= 0 else _RED for v in values]
    fig = go.Figure(
        go.Bar(
            x=values,
            y=names,
            orientation="h",
            marker=dict(color=colors, opacity=0.82),
            hovertemplate="%{y}<br>%{x:+,.2f}%<extra></extra>",
        )
    )
    fig.update_layout(
        **_BASE_LAYOUT,
        title=dict(
            text=title,
            font=dict(family="Space Grotesk, sans-serif", size=14, color="#F3F4F6"),
            x=0,
            xanchor="left",
        ),
        xaxis=dict(
            **_BASE_LAYOUT["xaxis"],
            tickformat="+.1f",
            ticksuffix="%",
        ),
    )
    return fig


def make_target_bar(labels: list, actual: list, target: list, title: str = "") -> go.Figure:
    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            name="Actual",
            x=labels,
            y=actual,
            marker=dict(color=_ACCENT, opacity=0.78),
        )
    )
    fig.add_trace(
        go.Bar(
            name="Target",
            x=labels,
            y=target,
            marker=dict(color=_GOLD, opacity=0.46),
        )
    )
    fig.update_layout(
        **_BASE_LAYOUT,
        barmode="group",
        title=dict(
            text=title,
            font=dict(family="Space Grotesk, sans-serif", size=14, color="#F3F4F6"),
            x=0,
            xanchor="left",
        ),
        yaxis=dict(**_BASE_LAYOUT["yaxis"], ticksuffix="%"),
    )
    return fig


# ─────────────────────────────────────────────────────────────────────────────
# Demo data
# ─────────────────────────────────────────────────────────────────────────────

_DEMO_HOLDINGS = [
    {"ticker": "RELIANCE.NS", "name": "Reliance Industries", "qty": 25, "avg_cost": 2310.0, "current": 2820.0, "sector": "Energy"},
    {"ticker": "INFY.NS",     "name": "Infosys",             "qty": 50, "avg_cost": 1640.0, "current": 1950.0, "sector": "IT"},
    {"ticker": "HDFCBANK.NS", "name": "HDFC Bank",          "qty": 40, "avg_cost": 1490.0, "current": 1710.0, "sector": "Finance"},
    {"ticker": "TCS.NS",      "name": "TCS",                "qty": 15, "avg_cost": 3350.0, "current": 3680.0, "sector": "IT"},
    {"ticker": "WIPRO.NS",    "name": "Wipro",              "qty": 80, "avg_cost": 440.0,  "current": 520.0,  "sector": "IT"},
    {"ticker": "VTI",         "name": "Vanguard Total Mkt", "qty": 12, "avg_cost": 218.0,  "current": 244.0,  "sector": "ETF"},
    {"ticker": "QQQ",         "name": "Invesco QQQ",        "qty": 8,  "avg_cost": 365.0,  "current": 428.0,  "sector": "ETF"},
    {"ticker": "INDA",        "name": "iShares MSCI India", "qty": 30, "avg_cost": 42.0,   "current": 50.0,   "sector": "ETF"},
]


def _build_df() -> pd.DataFrame:
    rows = []
    for h in _DEMO_HOLDINGS:
        invested = h["qty"] * h["avg_cost"]
        mkt_val = h["qty"] * h["current"]
        pnl = mkt_val - invested
        pnl_pct = (pnl / invested) * 100
        rows.append({**h, "invested": invested, "mkt_val": mkt_val, "pnl": pnl, "pnl_pct": pnl_pct})
    df = pd.DataFrame(rows)
    df["weight"] = df["mkt_val"] / df["mkt_val"].sum() * 100
    return df


# ─────────────────────────────────────────────────────────────────────────────
# Main render
# ─────────────────────────────────────────────────────────────────────────────

def render_dashboard() -> None:
    render_topbar("Portfolio Intelligence", "Live analytics mode")

    df = _build_df()
    total_val = df["mkt_val"].sum()
    total_invested = df["invested"].sum()
    total_pnl = df["pnl"].sum()
    total_pnl_pct = (total_pnl / total_invested) * 100
    day_change = 1.24  # demo

    # ── Hero metrics ────────────────────────────────────────────────────────
    right_stats = f"""
    <div class="wo-inline-stats">
        <div class="wo-stat-chip">
            <div class="wo-kicker">Invested</div>
            <div class="v">&#8377;{total_invested/100000:.2f}L</div>
        </div>
        <div class="wo-stat-chip">
            <div class="wo-kicker">P&amp;L</div>
            <div class="v" style="color:#8EE7B8">&#8377;{total_pnl/1000:.1f}K</div>
        </div>
        <div class="wo-stat-chip">
            <div class="wo-kicker">Return</div>
            <div class="v" style="color:#7DD3FC">+{total_pnl_pct:.2f}%</div>
        </div>
    </div>
    """
    render_hero(
        "Wealth Intelligence<br>Operating System",
        "Cinematic real-time portfolio analytics. Deep allocation insight. AI-powered financial strategy.",
        right_stats,
    )

    # ── KPI row ─────────────────────────────────────────────────────────────
    k1, k2, k3, k4 = st.columns(4)
    with k1:
        st.metric("Portfolio Value", f"₹{total_val/100000:.2f}L", f"+{day_change:.2f}% today")
    with k2:
        st.metric("Total Return", f"+{total_pnl_pct:.2f}%", f"₹{total_pnl/1000:.1f}K gain")
    with k3:
        best = df.loc[df["pnl_pct"].idxmax()]
        st.metric("Best Performer", best["name"][:14], f"+{best['pnl_pct']:.1f}%")
    with k4:
        st.metric("Holdings", f"{len(df)}", "Active positions")

    st.markdown("<div style='height:1rem'></div>", unsafe_allow_html=True)

    # ── Row 1: Allocation donut + P&L bar ───────────────────────────────────
    c1, c2 = st.columns([1.1, 0.9])
    with c1:
        st.markdown(
            """<div class="wo-panel">
                <div class="wo-panel-header">
                    <div><div class="wo-kicker">Allocation Layer</div>
                    <div class="wo-panel-title">Portfolio Composition</div></div>
                </div>""",
            unsafe_allow_html=True,
        )
        fig_donut = make_donut(
            df["name"].tolist(),
            df["mkt_val"].tolist(),
            "Current Allocation",
        )
        st.plotly_chart(fig_donut, use_container_width=True, config=_chart_config())
        st.markdown("</div>", unsafe_allow_html=True)

    with c2:
        st.markdown(
            """<div class="wo-panel">
                <div class="wo-panel-header">
                    <div><div class="wo-kicker">Performance Layer</div>
                    <div class="wo-panel-title">Gain / Loss by Position</div></div>
                </div>""",
            unsafe_allow_html=True,
        )
        fig_pnl = make_hbar(
            df.sort_values("pnl_pct")["name"].tolist(),
            df.sort_values("pnl_pct")["pnl_pct"].tolist(),
            "Return % per Holding",
        )
        st.plotly_chart(fig_pnl, use_container_width=True, config=_chart_config())
        st.markdown("</div>", unsafe_allow_html=True)

    # ── Row 2: Portfolio value line + target vs actual ───────────────────────
    import numpy as np
    dates = pd.date_range(end=pd.Timestamp.today(), periods=60, freq="B")
    base = total_invested
    nav = base + np.cumsum(np.random.normal(0, base * 0.008, 60))

    c3, c4 = st.columns([1.1, 0.9])
    with c3:
        st.markdown(
            """<div class="wo-panel">
                <div class="wo-panel-header">
                    <div><div class="wo-kicker">Trend Layer</div>
                    <div class="wo-panel-title">Portfolio Value — 60 Sessions</div></div>
                </div>""",
            unsafe_allow_html=True,
        )
        fig_nav = make_area_line(
            dates.strftime("%d %b").tolist(), nav.tolist(), color=_ACCENT
        )
        st.plotly_chart(fig_nav, use_container_width=True, config=_chart_config())
        st.markdown("</div>", unsafe_allow_html=True)

    with c4:
        targets = {"IT": 35, "Finance": 20, "Energy": 15, "ETF": 30}
        sec_actual = df.groupby("sector")["weight"].sum().to_dict()
        sec_labels = list(targets.keys())
        sec_actual_vals = [sec_actual.get(s, 0) for s in sec_labels]
        sec_target_vals = [targets[s] for s in sec_labels]
        st.markdown(
            """<div class="wo-panel">
                <div class="wo-panel-header">
                    <div><div class="wo-kicker">Target Layer</div>
                    <div class="wo-panel-title">Actual vs Target Mix</div></div>
                </div>""",
            unsafe_allow_html=True,
        )
        fig_target = make_target_bar(sec_labels, sec_actual_vals, sec_target_vals)
        st.plotly_chart(fig_target, use_container_width=True, config=_chart_config())
        st.markdown("</div>", unsafe_allow_html=True)

    # ── Holdings table ───────────────────────────────────────────────────────
    st.markdown(
        """<div class="wo-panel">
            <div class="wo-panel-header">
                <div><div class="wo-kicker">Holdings Register</div>
                <div class="wo-panel-title">All Positions</div></div>
            </div>""",
        unsafe_allow_html=True,
    )
    display_cols = ["ticker", "name", "qty", "avg_cost", "current", "mkt_val", "pnl", "pnl_pct", "weight"]
    display_df = df[display_cols].copy()
    display_df.columns = ["Ticker", "Name", "Qty", "Avg Cost", "LTP", "Mkt Value", "P&L (₹)", "P&L %", "Wt %"]
    display_df["Avg Cost"] = display_df["Avg Cost"].map("₹{:,.2f}".format)
    display_df["LTP"] = display_df["LTP"].map("₹{:,.2f}".format)
    display_df["Mkt Value"] = display_df["Mkt Value"].map("₹{:,.0f}".format)
    display_df["P&L (₹)"] = display_df["P&L (₹)"].map("₹{:+,.0f}".format)
    display_df["P&L %"] = display_df["P&L %"].map("{:+.2f}%".format)
    display_df["Wt %"] = display_df["Wt %"].map("{:.1f}%".format)
    st.dataframe(
        display_df,
        use_container_width=True,
        hide_index=True,
        height=min(380, 55 + len(display_df) * 38),
    )
    st.markdown("</div>", unsafe_allow_html=True)
