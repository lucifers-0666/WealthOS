"""Reusable UI components for WealthOS — Deep Space Theme."""
import streamlit as st


def page_header(icon: str, title: str, subtitle: str = ""):
    st.markdown(f"""
    <div class="w-page-header">
      <div class="w-page-icon">{icon}</div>
      <div>
        <p class="w-page-title">{title}</p>
        <p class="w-page-sub">{subtitle}</p>
      </div>
    </div>
    """, unsafe_allow_html=True)


def section_title(icon: str, title: str):
    st.markdown(f"""
    <div class="w-section">
      <div class="w-section-icon">{icon}</div>
      <p class="w-section-title">{title}</p>
      <div class="w-section-line"></div>
    </div>
    """, unsafe_allow_html=True)


def metric_card(label: str, value: str, delta: str = "", positive: bool = True):
    delta_class = "w-delta-pos" if positive else "w-delta-neg"
    arrow = "▲" if positive else "▼"
    delta_html = f'<div class="{delta_class}">{arrow} {delta}</div>' if delta else ""
    st.markdown(f"""
    <div class="w-card">
      <div class="w-label">{label}</div>
      <div class="w-value">{value}</div>
      {delta_html}
    </div>
    """, unsafe_allow_html=True)


def badge(text: str, color: str = "blue"):
    """color: blue | cyan | violet | green | red"""
    return f'<span class="w-badge w-badge-{color}">{text}</span>'


def info_panel(content: str):
    st.markdown(f'<div class="w-panel">{content}</div>', unsafe_allow_html=True)
