import streamlit as st
import plotly.graph_objects as go
import pandas as pd
from core.price_fetcher import fetch_historical_prices
from core.portfolio_engine import compute_drawdown
from loguru import logger


def render_drawdown_chart(portfolio_df: pd.DataFrame, live_prices: dict):
    symbols = portfolio_df['Symbol'].tolist()[:5]  # top 5 for readability

    try:
        hist_prices = fetch_historical_prices(symbols, period='1y')
        if hist_prices.empty:
            st.info("Could not fetch historical prices for drawdown analysis.")
            return

        fig = go.Figure()
        for symbol in symbols:
            if symbol not in hist_prices.columns:
                continue
            price_series = hist_prices[symbol].dropna()
            if price_series.empty:
                continue
            drawdown = compute_drawdown(price_series)
            fig.add_trace(go.Scatter(
                x=drawdown.index,
                y=drawdown.values,
                mode='lines',
                name=symbol,
                fill='tozeroy',
                opacity=0.6,
            ))

        fig.update_layout(
            title_text="Drawdown Analysis — Top 5 Holdings (1Y)",
            xaxis_title="Date",
            yaxis_title="Drawdown %",
            hovermode='x unified',
            legend=dict(orientation='h', yanchor='bottom', y=1.05, xanchor='center', x=0.5)
        )
        fig.update_yaxes(ticksuffix='%')
        st.plotly_chart(fig, use_container_width=True)

    except Exception as e:
        logger.error(f"Drawdown chart error: {e}")
        st.warning(f"Drawdown chart unavailable: {e}")
