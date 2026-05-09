import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from config import COLOR_PRIMARY


def render_allocation_charts(allocation_by_type: pd.Series, target_allocation: dict):
    col1, col2 = st.columns(2)

    with col1:
        # Current allocation donut
        fig = go.Figure(data=[go.Pie(
            labels=allocation_by_type.index.tolist(),
            values=allocation_by_type.values.tolist(),
            hole=0.5,
            textinfo='label+percent',
            textposition='outside',
        )])
        fig.update_layout(
            title_text="Current Allocation by Asset Type",
            showlegend=True,
            legend=dict(orientation='v', x=1.05)
        )
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        # Target allocation donut
        target_series = pd.Series(target_allocation)
        fig2 = go.Figure(data=[go.Pie(
            labels=target_series.index.tolist(),
            values=target_series.values.tolist(),
            hole=0.5,
            textinfo='label+percent',
            textposition='outside',
            marker_colors=px.colors.qualitative.Set2,
        )])
        fig2.update_layout(
            title_text="Target Allocation",
            showlegend=True,
            legend=dict(orientation='v', x=1.05)
        )
        st.plotly_chart(fig2, use_container_width=True)

    # Deviation bar chart
    all_categories = list(set(list(allocation_by_type.index) + list(target_allocation.keys())))
    actual_vals = [allocation_by_type.get(c, 0) for c in all_categories]
    target_vals = [target_allocation.get(c, 0) for c in all_categories]

    fig3 = go.Figure()
    fig3.add_trace(go.Bar(name='Actual %', x=all_categories, y=actual_vals, marker_color='#7C3AED'))
    fig3.add_trace(go.Bar(name='Target %', x=all_categories, y=target_vals, marker_color='#3B82F6'))
    fig3.update_layout(
        title_text="Actual vs Target Allocation",
        barmode='group',
        xaxis_title="Asset Category",
        yaxis_title="Allocation %",
        legend=dict(orientation='h', yanchor='bottom', y=1.05, xanchor='center', x=0.5)
    )
    st.plotly_chart(fig3, use_container_width=True)
