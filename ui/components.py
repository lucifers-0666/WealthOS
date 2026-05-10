import streamlit as st


def page_header(icon_class: str, title: str, subtitle: str = ""):
    st.markdown(f"""
    <div class="page-header">
        <div class="page-header-icon">
            <i class="{icon_class}"></i>
        </div>
        <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
        </div>
    </div>
    """, unsafe_allow_html=True)


def section_title(icon_class: str, title: str):
    st.markdown(f"""
    <div class="section-title">
        <i class="{icon_class}"></i>
        {title}
    </div>
    """, unsafe_allow_html=True)


def metric_card(label: str, value: str, delta: str = None, positive: bool = None, icon: str = "fa-solid fa-chart-line"):
    delta_html = ""
    if delta:
        cls = "metric-delta-pos" if positive else "metric-delta-neg" if positive is False else ""
        arrow = "fa-arrow-trend-up" if positive else "fa-arrow-trend-down" if positive is False else "fa-minus"
        delta_html = f'<div class="{cls}"><i class="fa-solid {arrow}"></i> {delta}</div>'

    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-label"><i class="{icon}" style="color:#C9A84C; margin-right:6px;"></i>{label}</div>
        <div class="metric-value">{value}</div>
        {delta_html}
    </div>
    """, unsafe_allow_html=True)


def status_badge(text: str, kind: str = "gold"):
    icon_map = {"gold": "fa-star", "green": "fa-circle-check", "red": "fa-circle-xmark"}
    icon = icon_map.get(kind, "fa-circle")
    st.markdown(f'<span class="badge-{kind}"><i class="fa-solid {icon}"></i> {text}</span>', unsafe_allow_html=True)


def render_portfolio_images():
    """Display uploaded portfolio images in a gallery grid."""
    images = st.session_state.get("portfolio_images", [])
    if not images:
        return
    cols = st.columns(min(len(images), 3))
    for i, img_data in enumerate(images):
        with cols[i % 3]:
            st.markdown(f"""
            <div class="portfolio-image-card">
                <img src="{img_data['data_url']}" alt="{img_data['name']}">
                <div class="portfolio-image-overlay">
                    <i class="fa-solid fa-image"></i> {img_data['name']}
                </div>
            </div>
            """, unsafe_allow_html=True)
            st.markdown("<br>", unsafe_allow_html=True)
