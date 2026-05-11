"""WealthOS shared UI primitives — cinematic design system helpers."""

from __future__ import annotations
import streamlit as st


def metric_row(metrics: list[dict]) -> None:
    """Render a row of premium WealthOS metric cards.

    Each dict: {'label': str, 'value': str, 'delta': str, 'delta_type': 'up'|'down'|'flat'}
    """
    cols = st.columns(len(metrics))
    for col, m in zip(cols, metrics):
        delta_class = {
            "up": "wo-delta-up",
            "down": "wo-delta-down",
            "flat": "wo-delta-flat",
        }.get(m.get("delta_type", "flat"), "wo-delta-flat")
        with col:
            st.markdown(
                f"""
                <div class="wo-metric">
                    <div class="wo-label">{m['label']}</div>
                    <div class="wo-value">{m['value']}</div>
                    <div class="{delta_class} wo-meta">{m.get('delta','')}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )


def section_header(kicker: str, title: str, subtitle: str = "") -> None:
    sub = f'<div class="wo-panel-subtitle">{subtitle}</div>' if subtitle else ""
    st.markdown(
        f"""
        <div class="wo-section-title">
            <div class="wo-kicker">{kicker}</div>
            <div class="wo-panel-title">{title}</div>
            {sub}
        </div>
        """,
        unsafe_allow_html=True,
    )


def divider() -> None:
    st.markdown('<div class="wo-divider"></div>', unsafe_allow_html=True)


def terminal_block(lines: list[str], title: str = "") -> None:
    title_html = f'<div style="color:#D6C7A1;margin-bottom:0.4rem;">{title}</div>' if title else ""
    body = "\n".join(
        f'<div style="color:{"#8EE7B8" if l.startswith("+") else "#FCA5A5" if l.startswith("-") else "#94A3B8"}">{l}</div>'
        for l in lines
    )
    st.markdown(
        f'<div class="wo-terminal-box">{title_html}{body}</div>',
        unsafe_allow_html=True,
    )
