"""Reusable UI components for WealthOS — premium dark fintech theme."""
import streamlit as st


def page_header(title: str, subtitle: str = "", eyebrow: str = "WEALTHOS PLATFORM"):
    st.markdown(f"""
    <div class="hero-shell glass-surface">
      <div class="hero-eyebrow">{eyebrow}</div>
      <div class="hero-title">{title}</div>
      <div class="hero-subtitle">{subtitle}</div>
    </div>
    """, unsafe_allow_html=True)


def section_title(title: str, meta: str = ""):
    meta_html = f'<div class="section-meta">{meta}</div>' if meta else ""
    st.markdown(f"""
    <div class="section-shell">
      <div>
        <div class="section-title">{title}</div>
        {meta_html}
      </div>
      <div class="section-rule"></div>
    </div>
    """, unsafe_allow_html=True)


def metric_card(label: str, value: str, delta: str = "", positive: bool = True, hint: str = ""):
    delta_class = "metric-delta-positive" if positive else "metric-delta-negative"
    delta_html = f'<div class="{delta_class}">{delta}</div>' if delta else ""
    hint_html = f'<div class="metric-hint">{hint}</div>' if hint else ""
    st.markdown(f"""
    <div class="metric-card glass-surface">
      <div class="metric-label">{label}</div>
      <div class="metric-value">{value}</div>
      {delta_html}
      {hint_html}
    </div>
    """, unsafe_allow_html=True)


def badge(text: str, color: str = "blue"):
    """color: blue | cyan | violet | green | red | slate"""
    return f'<span class="ui-badge ui-badge-{color}">{text}</span>'


def info_panel(content: str):
    st.markdown(f'<div class="panel-card glass-surface">{content}</div>', unsafe_allow_html=True)

