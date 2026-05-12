"""WealthOS \u2014 Portfolio performance chart with cinematic dark theme."""

import streamlit as st
import plotly.graph_objects as go
import pandas as pd

CHART_LAYOUT = dict(
    template="plotly_dark",
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font=dict(family="Inter, sans-serif", color="#94A3B8", size=12),
    title_font=dict(family="Space Grotesk, sans-serif", color="#F3F4F6", size=14),
    margin=dict(l=0, r=0, t=36, b=0),
    xaxis=dict(gridcolor="rgba(148,163,184,0.08)", zerolinecolor="rgba(148,163,184,0.06)"),
    yaxis=dict(gridcolor="rgba(148,163,184,0.08)", zerolinecolor="rgba(148,163,184,0.06)",
               tickprefix="\u20b9", tickformat=",.0f"),
    legend=dict(bgcolor="rgba(0,0,0,0)", font=dict(size=11)),
    hovermode="x unified",
)


def render_performance_chart(portfolio_value_ts: pd.DataFrame):
    if portfolio_value_ts.empty:
        st.info("No transaction history to render performance.")
        return

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=portfolio_value_ts["Date"],
        y=portfolio_value_ts["Portfolio_Value"],
        mode="lines",
        name="Portfolio Value",
        line=dict(color="#7DD3FC", width=2),
        fill="tozeroy",
        fillcolor="rgba(125,211,252,0.07)",
        hovertemplate="%{x|%d %b %Y}<br>\u20b9%{y:,.0f}<extra></extra>",
    ))
    layout = {**CHART_LAYOUT}
    layout["title"] = dict(text="Portfolio Value Over Time",
                           font=dict(family="Space Grotesk, sans-serif", color="#F3F4F6", size=14), x=0)
    fig.update_layout(**layout)
    st.plotly_chart(fig, width='stretch', config=dict(displayModeBar=False))
