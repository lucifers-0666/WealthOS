import streamlit as st
import plotly.graph_objects as go
import pandas as pd


def render_performance_chart(portfolio_value_ts: pd.DataFrame):
    if portfolio_value_ts.empty:
        st.info("No transaction history to render performance.")
        return

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=portfolio_value_ts['Date'],
        y=portfolio_value_ts['Portfolio_Value'],
        mode='lines',
        name='Portfolio Value',
        line=dict(color='#7C3AED', width=2.5),
        fill='tozeroy',
        fillcolor='rgba(124, 58, 237, 0.1)'
    ))

    fig.update_layout(
        title_text="Portfolio Value Over Time",
        xaxis_title="Date",
        yaxis_title="Portfolio Value (₹)",
        hovermode='x unified',
        legend=dict(orientation='h', yanchor='bottom', y=1.05, xanchor='center', x=0.5)
    )
    fig.update_yaxes(tickprefix='₹', tickformat=',.0f')
    st.plotly_chart(fig, use_container_width=True)
