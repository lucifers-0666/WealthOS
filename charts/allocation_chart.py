"""WealthOS \u2014 Allocation charts with cinematic dark theme."""

import streamlit as st
import plotly.graph_objects as go
import pandas as pd

COLORS = ["#7DD3FC", "#A78BFA", "#67E8F9", "#D6C7A1", "#8EE7B8", "#FCA5A5", "#F9A8D4", "#FDE68A", "#6EE7B7"]

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


def render_allocation_charts(allocation_by_type: pd.Series, target_allocation: dict):
    col1, col2 = st.columns(2)

    with col1:
        fig = go.Figure(data=[go.Pie(
            labels=allocation_by_type.index.tolist(),
            values=allocation_by_type.values.tolist(),
            hole=0.58,
            textinfo="label+percent",
            textposition="outside",
            marker=dict(colors=COLORS[:len(allocation_by_type)],
                        line=dict(color="rgba(2,6,23,0.6)", width=2)),
            hovertemplate="<b>%{label}</b><br>%{percent}<extra></extra>",
        )])
        layout = {**CHART_LAYOUT}
        layout["title"] = dict(text="Current Allocation",
                               font=dict(family="Space Grotesk, sans-serif", color="#F3F4F6", size=14), x=0)
        layout["showlegend"] = True
        layout["legend"] = dict(orientation="v", x=1.02, bgcolor="rgba(0,0,0,0)", font=dict(size=10))
        fig.update_layout(**layout)
        st.plotly_chart(fig, use_container_width=True, config=dict(displayModeBar=False))

    with col2:
        target_series = pd.Series(target_allocation)
        fig2 = go.Figure(data=[go.Pie(
            labels=target_series.index.tolist(),
            values=target_series.values.tolist(),
            hole=0.58,
            textinfo="label+percent",
            textposition="outside",
            marker=dict(colors=COLORS[:len(target_series)],
                        line=dict(color="rgba(2,6,23,0.6)", width=2)),
            hovertemplate="<b>%{label}</b><br>%{percent}<extra></extra>",
        )])
        layout2 = {**CHART_LAYOUT}
        layout2["title"] = dict(text="Target Allocation",
                                font=dict(family="Space Grotesk, sans-serif", color="#F3F4F6", size=14), x=0)
        layout2["showlegend"] = True
        layout2["legend"] = dict(orientation="v", x=1.02, bgcolor="rgba(0,0,0,0)", font=dict(size=10))
        fig2.update_layout(**layout2)
        st.plotly_chart(fig2, use_container_width=True, config=dict(displayModeBar=False))

    all_categories = list(set(list(allocation_by_type.index) + list(target_allocation.keys())))
    actual_vals = [allocation_by_type.get(c, 0) for c in all_categories]
    target_vals = [target_allocation.get(c, 0) for c in all_categories]

    fig3 = go.Figure()
    fig3.add_trace(go.Bar(name="Actual %", x=all_categories, y=actual_vals,
                          marker_color="#7DD3FC", marker_line=dict(width=0), opacity=0.88))
    fig3.add_trace(go.Bar(name="Target %", x=all_categories, y=target_vals,
                          marker_color="rgba(214,199,161,0.55)", marker_line=dict(width=0)))
    layout3 = {**CHART_LAYOUT}
    layout3["title"] = dict(text="Actual vs Target Allocation",
                            font=dict(family="Space Grotesk, sans-serif", color="#F3F4F6", size=14), x=0)
    layout3["barmode"] = "group"
    layout3["yaxis"] = dict(ticksuffix="%", gridcolor="rgba(148,163,184,0.08)",
                            zerolinecolor="rgba(148,163,184,0.06)")
    layout3["legend"] = dict(orientation="h", y=1.08, x=0, bgcolor="rgba(0,0,0,0)", font=dict(size=11))
    fig3.update_layout(**layout3)
    st.plotly_chart(fig3, use_container_width=True, config=dict(displayModeBar=False))
