import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from core.data_loader import load_portfolio_from_session, get_demo_portfolio, save_portfolio_to_session
from core.portfolio_engine import enrich_portfolio, compute_portfolio_summary, get_allocation_by
from core.target_tracker import compare_allocation


def _fmt_inr(val: float) -> str:
    if abs(val) >= 1e7:
        return f"\u20b9{val/1e7:.2f}Cr"
    elif abs(val) >= 1e5:
        return f"\u20b9{val/1e5:.2f}L"
    else:
        return f"\u20b9{val:,.0f}"


def _delta_color(val: float) -> str:
    return "#4ADE80" if val >= 0 else "#F87171"


def render_dashboard():
    # ── Load portfolio ──────────────────────────────────────────────────────────
    df = load_portfolio_from_session()

    if df is None or df.empty:
        st.info("No portfolio loaded. Go to **Upload** to add your holdings or load the demo portfolio.")
        col1, col2 = st.columns([1, 3])
        with col1:
            if st.button("Load Demo Portfolio", type="primary"):
                demo = get_demo_portfolio()
                save_portfolio_to_session(demo)
                st.rerun()
        return

    # ── Enrich with live prices ─────────────────────────────────────────────────
    with st.spinner("Fetching live prices..."):
        enriched = enrich_portfolio(df)

    summary = compute_portfolio_summary(enriched)

    # ── KPI Row ─────────────────────────────────────────────────────────────────
    st.markdown("## Portfolio Overview")
    k1, k2, k3, k4, k5 = st.columns(5)

    with k1:
        st.metric(
            "Total Value",
            _fmt_inr(summary["total_value"]),
            help="Current market value of all holdings",
        )
    with k2:
        pnl = summary["total_pnl"]
        pnl_pct = summary["total_pnl_pct"]
        st.metric(
            "Total P&L",
            _fmt_inr(pnl),
            delta=f"{pnl_pct:+.2f}%",
            delta_color="normal",
        )
    with k3:
        st.metric("Invested", _fmt_inr(summary["total_invested"]))
    with k4:
        st.metric("Holdings", summary["num_holdings"])
    with k5:
        st.metric(
            "Winners / Losers",
            f"{summary['num_winners']} / {summary['num_losers']}",
        )

    st.divider()

    # ── Charts Row ──────────────────────────────────────────────────────────────
    chart_col1, chart_col2 = st.columns(2, gap="medium")

    with chart_col1:
        st.markdown("### Allocation by Asset Class")
        alloc = get_allocation_by(enriched, "asset_class")
        if not alloc.empty:
            colors = ["#7DD3FC", "#A78BFA", "#D6C7A1", "#67E8F9", "#34D399",
                      "#F59E0B", "#F87171", "#818CF8", "#FB923C", "#A3E635"]
            fig = go.Figure(go.Pie(
                labels=alloc["asset_class"],
                values=alloc["value"],
                hole=0.55,
                marker=dict(colors=colors[:len(alloc)], line=dict(color="#020617", width=2)),
                textinfo="label+percent",
                textfont=dict(size=12, color="#F3F4F6"),
                hovertemplate="<b>%{label}</b><br>%{customdata}<br>%{percent}<extra></extra>",
                customdata=[_fmt_inr(v) for v in alloc["value"]],
            ))
            fig.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font=dict(color="#94A3B8"),
                legend=dict(font=dict(color="#94A3B8"), bgcolor="rgba(0,0,0,0)"),
                margin=dict(t=10, b=10, l=10, r=10),
                height=300,
                showlegend=True,
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No allocation data available.")

    with chart_col2:
        st.markdown("### P&L by Holding")
        if not enriched.empty:
            enriched_sorted = enriched.sort_values("pnl_pct")
            bar_colors = ["#4ADE80" if v >= 0 else "#F87171" for v in enriched_sorted["pnl_pct"]]
            fig2 = go.Figure(go.Bar(
                x=enriched_sorted["pnl_pct"],
                y=enriched_sorted["symbol"],
                orientation="h",
                marker=dict(color=bar_colors, line=dict(color="rgba(0,0,0,0)")),
                text=[f"{v:+.1f}%" for v in enriched_sorted["pnl_pct"]],
                textposition="outside",
                textfont=dict(color="#94A3B8", size=11),
                hovertemplate="<b>%{y}</b><br>P&L: %{x:.2f}%<extra></extra>",
            ))
            fig2.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font=dict(color="#94A3B8"),
                xaxis=dict(showgrid=True, gridcolor="rgba(148,163,184,0.08)",
                           color="#64748B", ticksuffix="%"),
                yaxis=dict(color="#94A3B8"),
                margin=dict(t=10, b=10, l=10, r=60),
                height=300,
            )
            st.plotly_chart(fig2, use_container_width=True)

    st.divider()

    # ── Target Tracker ──────────────────────────────────────────────────────────
    st.markdown("### Target Allocation Tracker")
    target_df = compare_allocation(enriched)

    if not target_df.empty:
        t1, t2 = st.columns(2, gap="medium")
        with t1:
            status_colors = {"On Target": "#4ADE80", "Overweight": "#F59E0B", "Underweight": "#F87171"}
            for _, row in target_df.iterrows():
                sc = status_colors.get(row["status"], "#94A3B8")
                st.markdown(
                    f'<div style="display:flex;justify-content:space-between;'
                    f'padding:0.5rem 0;border-bottom:1px solid rgba(148,163,184,0.08);">'  
                    f'<span style="color:#F3F4F6;font-size:0.9rem;">{row["asset_class"]}</span>'
                    f'<span style="color:{sc};font-size:0.85rem;font-weight:600;">'
                    f'{row["actual_pct"]:.1f}% / {row["target_pct"]:.1f}% ({row["deviation"]:+.1f}%) {row["status"]}'
                    f'</span></div>',
                    unsafe_allow_html=True,
                )
        with t2:
            fig3 = go.Figure()
            fig3.add_trace(go.Bar(
                name="Actual", x=target_df["asset_class"], y=target_df["actual_pct"],
                marker_color="#7DD3FC",
            ))
            fig3.add_trace(go.Bar(
                name="Target", x=target_df["asset_class"], y=target_df["target_pct"],
                marker_color="rgba(167,139,250,0.5)",
                marker_line=dict(color="#A78BFA", width=1),
            ))
            fig3.update_layout(
                barmode="group",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font=dict(color="#94A3B8"),
                legend=dict(font=dict(color="#94A3B8"), bgcolor="rgba(0,0,0,0)"),
                xaxis=dict(color="#64748B"),
                yaxis=dict(color="#64748B", ticksuffix="%",
                           gridcolor="rgba(148,163,184,0.08)"),
                margin=dict(t=10, b=10),
                height=260,
            )
            st.plotly_chart(fig3, use_container_width=True)

    st.divider()

    # ── Holdings Table ──────────────────────────────────────────────────────────
    st.markdown("### Holdings Detail")
    _refresh_col, _spacer = st.columns([1, 4])
    with _refresh_col:
        if st.button("Refresh Prices", use_container_width=True):
            st.cache_data.clear()
            st.rerun()

    if not enriched.empty:
        display_cols = ["symbol", "name", "asset_class", "quantity", "avg_price",
                        "live_price", "invested", "current_value", "pnl", "pnl_pct", "weight_pct"]
        show_cols = [c for c in display_cols if c in enriched.columns]
        tbl = enriched[show_cols].copy()
        tbl.columns = [c.replace("_", " ").title() for c in show_cols]

        def _color_pnl(val):
            if isinstance(val, (int, float)):
                color = "#4ADE80" if val >= 0 else "#F87171"
                return f"color: {color}"
            return ""

        pnl_col = "Pnl" if "Pnl" in tbl.columns else None
        pnl_pct_col = "Pnl Pct" if "Pnl Pct" in tbl.columns else None
        style_cols = [c for c in [pnl_col, pnl_pct_col] if c is not None]
        if style_cols:
            styled = tbl.style.applymap(_color_pnl, subset=style_cols)
        else:
            styled = tbl.style
        st.dataframe(styled, use_container_width=True, hide_index=True)
    else:
        st.info("Holdings table unavailable.")
