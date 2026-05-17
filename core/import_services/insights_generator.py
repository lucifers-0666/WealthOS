"""
insights_generator.py — Generates AI-powered portfolio insights after import.
Uses Gemini if available, otherwise generates rule-based insights.
"""

import os
import re
import json
import logging

logger = logging.getLogger("wealthos-import")


def generate_insights(holdings: list) -> dict:
    """
    Generate insights from a list of holdings.
    Returns dict with diversification, sector_allocation, top_holdings, risk_analysis, summary.
    """
    if not holdings:
        return {"summary": "No holdings to analyse.", "top_holdings": [], "risk_score": 0}

    # Rule-based basics
    total_invested = sum(
        (h.get("avg_buy_price") or 0) * (h.get("quantity") or 0) for h in holdings
    )
    total_current = sum(
        (h.get("current_price") or h.get("avg_buy_price") or 0) * (h.get("quantity") or 0)
        for h in holdings
    )
    total_pnl = total_current - total_invested
    pnl_pct = (total_pnl / total_invested * 100) if total_invested else 0

    top_holdings = sorted(
        holdings,
        key=lambda h: (h.get("current_price") or h.get("avg_buy_price") or 0) * (h.get("quantity") or 0),
        reverse=True,
    )[:5]

    stock_count = len(holdings)
    risk_score = min(10, max(1, 10 - stock_count // 3))  # More stocks = lower risk
    diversification = "Well diversified" if stock_count >= 10 else "Moderately diversified" if stock_count >= 5 else "Concentrated portfolio"

    base_insights = {
        "stock_count": stock_count,
        "total_invested": round(total_invested, 2),
        "total_current_value": round(total_current, 2),
        "total_pnl": round(total_pnl, 2),
        "pnl_percent": round(pnl_pct, 2),
        "diversification": diversification,
        "risk_score": risk_score,
        "top_holdings": [
            {"ticker": h["ticker"], "value": round((h.get("current_price") or h.get("avg_buy_price") or 0) * (h.get("quantity") or 0), 2)}
            for h in top_holdings
        ],
        "ai_summary": None,
    }

    # Try Gemini for narrative summary
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key and total_invested > 0:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            tickers = ", ".join(h["ticker"] for h in holdings[:15])
            prompt = f"""Analyse this Indian stock portfolio and give a 3-sentence professional insight covering diversification, risk, and one actionable suggestion. Be concise.
Stocks: {tickers}
Total invested: ₹{total_invested:,.0f}, P&L: {pnl_pct:.1f}%"""
            resp = model.generate_content(prompt)
            base_insights["ai_summary"] = resp.text.strip()
        except Exception as e:
            logger.warning(f"Gemini insights failed: {e}")

    return base_insights
