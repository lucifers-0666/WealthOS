"""WealthOS \u2014 Drawdown chart with cinematic dark theme."""

import streamlit as st
import plotly.graph_objects as go
import pandas as pd

COLORS = ["#7DD3FC", "#A78BFA", "#67E8F9", "#D6C7A1", "#8EE7B8", "#FCA5A5"]

CHART_LAYOUT = dict(
    template="plotly_dark",
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font=dict(family="Inter, sans-serif", color="#94A3B8", size=12),
    title_font=dict(family="Space Grotesk, sans-serif", color="#F3F4F6", size=14),
    margin=dict(l=0, r=0, t=36, b=0),
    xaxis=dict(gridcolor="rgba(148,163,184,0.08)", zerolinecolor="rgba(148,163,184,0.06)"),
    yaxis=dict(gridcolor="rgba(148,163,184,0.08)", zerolinecolor="rgba(148,163,184,0.06)",
               ticksuffix="%"),
    legend=dict(bgcolor="rgba(0,0,0,0)", font=dict(size=11)),
    hovermode="x unified",
)


def render_drawdown_chart(drawdown_df: pd.DataFrame):
    if drawdown_df is None or drawdown_df.empty:
        st.info("No drawdown data available.")
        return

    date_col = next((c for c in ["Date", "date", "index"] if c in drawdown_df.columns), None)
    if date_col is None and hasattr(drawdown_df.index, "dtype"):
        drawdown_df = drawdown_df.reset_index()
        date_col = drawdown_df.columns[0]

    if date_col is None:
        st.warning("Drawdown data missing Date column.")
        return

    value_cols = [c for c in drawdown_df.columns if c != date_col]

    fig = go.Figure()
    for idx, col in enumerate(value_cols):
        fig.add_trace(go.Scatter(
            x=drawdown_df[date_col],
            y=drawdown_df[col],
            mode="lines",
            name=col,
            line=dict(color=COLORS[idx % len(COLORS)], width=1.5),
            fill="tozeroy",
            fillcolor=f"rgba({','.join(str(int(COLORS[idx % len(COLORS)].lstrip('#')[i:i+2], 16)) for i in (0,2,4))},0.06)",
            hovertemplate=f"%{{x|%d %b}}<br>{col}: %{{y:.2f}}%<extra></extra>",
        ))

    layout = {**CHART_LAYOUT}
    layout["title"] = dict(text="Portfolio Drawdown %",
                           font=dict(family="Space Grotesk, sans-serif", color="#F3F4F6", size=14), x=0)
    fig.update_layout(**layout)
    fig.add_hline(y=0, line_width=1, line_color="rgba(148,163,184,0.2)")
    st.plotly_chart(fig, use_container_width=True, config=dict(displayModeBar=False))
