import streamlit as st
from config import COLOR_PROFIT, COLOR_LOSS


def metric_card(label: str, value: str, delta: str = None, delta_positive: bool = None):
    """Render a styled metric card."""
    delta_color = COLOR_PROFIT if delta_positive else COLOR_LOSS if delta_positive is False else "gray"
    delta_html = f'<span style="color:{delta_color}; font-size:14px">{delta}</span>' if delta else ""
    st.markdown(f"""
    <div style="background:#1E1E2E; padding:1rem; border-radius:10px; border-left:4px solid #7C3AED; margin-bottom:0.5rem">
        <div style="color:#888; font-size:13px">{label}</div>
        <div style="font-size:22px; font-weight:bold; color:white">{value}</div>
        {delta_html}
    </div>
    """, unsafe_allow_html=True)


def status_badge(text: str, color: str = "green"):
    """Render a colored status badge."""
    colors = {"green": "#00C851", "red": "#FF4444", "yellow": "#FFBB33", "blue": "#2196F3"}
    bg = colors.get(color, "#888")
    st.markdown(
        f'<span style="background:{bg}; color:white; padding:2px 8px; border-radius:12px; font-size:12px">{text}</span>',
        unsafe_allow_html=True
    )


def section_header(title: str, subtitle: str = ""):
    """Render a consistent section header."""
    st.markdown(f"### {title}")
    if subtitle:
        st.caption(subtitle)
    st.divider()


def pnl_badge(value: float):
    """Display P&L with color coding."""
    color = COLOR_PROFIT if value >= 0 else COLOR_LOSS
    symbol = "+" if value >= 0 else ""
    st.markdown(f'<span style="color:{color}; font-weight:bold">{symbol}{value:.1f}%</span>', unsafe_allow_html=True)
