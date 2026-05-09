import streamlit as st
import plotly.graph_objects as go
import pandas as pd


def render_gains_chart(portfolio_df: pd.DataFrame):
    df = portfolio_df.sort_values('PnL_Pct', ascending=True)

    colors = ['#00C851' if v >= 0 else '#FF4444' for v in df['PnL_Pct']]

    # Unrealized PnL by symbol
    fig = go.Figure(go.Bar(
        x=df['PnL_Pct'],
        y=df['Symbol'],
        orientation='h',
        marker_color=colors,
        text=[f"{v:+.1f}%" for v in df['PnL_Pct']],
        textposition='outside',
    ))
    fig.update_layout(
        title_text="Unrealized P&L % by Holding",
        xaxis_title="P&L %",
        yaxis_title="Symbol",
        height=max(400, len(df) * 35),
    )
    fig.add_vline(x=0, line_dash='dash', line_color='gray')
    st.plotly_chart(fig, use_container_width=True)

    # Absolute PnL bar chart
    df2 = portfolio_df.sort_values('Unrealized_PnL', ascending=False)
    colors2 = ['#00C851' if v >= 0 else '#FF4444' for v in df2['Unrealized_PnL']]
    fig2 = go.Figure(go.Bar(
        x=df2['Symbol'],
        y=df2['Unrealized_PnL'],
        marker_color=colors2,
        text=[f"₹{v:+,.0f}" for v in df2['Unrealized_PnL']],
        textposition='outside',
    ))
    fig2.update_layout(
        title_text="Absolute Unrealized P&L by Holding (₹)",
        xaxis_title="Symbol",
        yaxis_title="Unrealized P&L (₹)",
    )
    fig2.add_hline(y=0, line_dash='dash', line_color='gray')
    st.plotly_chart(fig2, use_container_width=True)
