"""WealthOS \u2014 Gains / P&L bar chart with cinematic dark theme."""

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
    yaxis=dict(gridcolor="rgba(148,163,184,0.08)", zerolinecolor="rgba(148,163,184,0.06)"),
    legend=dict(bgcolor="rgba(0,0,0,0)", font=dict(size=11)),
)


def render_gains_chart(holdings_df: pd.DataFrame):
    if holdings_df is None or holdings_df.empty:
        st.info("No holdings data available.")
        return

    pnl_col = next((c for c in ["PnL", "pnl", "Gain", "gain"] if c in holdings_df.columns), None)
    ticker_col = next((c for c in ["Ticker", "ticker", "Symbol", "symbol"] if c in holdings_df.columns), None)

    if not pnl_col or not ticker_col:
        st.warning("Holdings data missing PnL or Ticker columns.")
        return

    df = holdings_df.sort_values(pnl_col)
    colours = ["#8EE7B8" if v >= 0 else "#FCA5A5" for v in df[pnl_col]]

    fig = go.Figure(go.Bar(
        x=df[ticker_col].astype(str).str.replace(".NS", "", regex=False),
        y=df[pnl_col],
        marker=dict(color=colours, line=dict(width=0)),
        hovertemplate="<b>%{x}</b><br>\u20b9%{y:,.0f}<extra></extra>",
        text=[f"\u20b9{v:+,.0f}" for v in df[pnl_col]],
        textposition="outside",
        textfont=dict(size=10, color="#94A3B8"),
    ))
    layout = {**CHART_LAYOUT}
    layout["title"] = dict(text="Unrealised P&L per Holding",
                           font=dict(family="Space Grotesk, sans-serif", color="#F3F4F6", size=14), x=0)
    layout["yaxis"] = dict(tickprefix="\u20b9", tickformat=",.0f",
                           gridcolor="rgba(148,163,184,0.08)", zerolinecolor="rgba(148,163,184,0.3)")
    fig.update_layout(**layout)
    fig.add_hline(y=0, line_width=1, line_color="rgba(148,163,184,0.3)")
    st.plotly_chart(fig, width='stretch', config=dict(displayModeBar=False))
