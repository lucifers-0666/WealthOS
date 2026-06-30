"""
insights_generator.py — Generates AI-powered portfolio insights after import.
Uses Gemini if available, otherwise generates rule-based insights.
"""

import os
import re
import json
import logging

logger = logging.getLogger("wealthos-import")


def generate_insights(holdings: list, user_id: str = None) -> dict:
    """
    Generate insights from a list of holdings.
    Returns dict with diversification, sector_allocation, top_holdings, risk_analysis, summary.
    """
    if not holdings:
        return {"summary": "No holdings to analyse.", "top_holdings": [], "risk_score": 0}

    total_invested = sum((h.get("avg_buy_price") or 0) * (h.get("quantity") or 0) for h in holdings)
    total_current = sum((h.get("current_price") or h.get("avg_buy_price") or 0) * (h.get("quantity") or 0) for h in holdings)
    pnl = total_current - total_invested
    pnl_pct = (pnl / total_invested * 100) if total_invested > 0 else 0

    # Sector Concentration
    sectors = {}
    for h in holdings:
        sec = h.get("sector") or "Other"
        val = (h.get("current_price") or h.get("avg_buy_price") or 0) * (h.get("quantity") or 0)
        sectors[sec] = sectors.get(sec, 0) + val

    sorted_sectors = sorted(sectors.items(), key=lambda x: x[1], reverse=True)
    top_sector = sorted_sectors[0][0] if sorted_sectors else "None"
    top_sector_pct = (sorted_sectors[0][1] / total_current * 100) if total_current > 0 and sorted_sectors else 0

    # Diversification check
    h_count = len(holdings)
    div_status = "Excellent" if h_count >= 15 else "Adequate" if h_count >= 8 else "Concentrated"

    # Risk Score simple heuristic
    risk_score = 50
    if top_sector_pct > 40: risk_score += 15
    if h_count < 5: risk_score += 20
    if pnl_pct < -15: risk_score += 10
    risk_score = min(99, max(5, risk_score))

    top_holdings = sorted(holdings, key=lambda h: (h.get("current_price") or h.get("avg_buy_price") or 0) * (h.get("quantity") or 0), reverse=True)[:3]

    base_insights = {
        "diversification_status": div_status,
        "holding_count": h_count,
        "top_sector": top_sector,
        "top_sector_pct": round(top_sector_pct, 1),
        "risk_score": risk_score,
        "top_holdings": [
            {"ticker": h["ticker"], "value": round((h.get("current_price") or h.get("avg_buy_price") or 0) * (h.get("quantity") or 0), 2)}
            for h in top_holdings
        ],
        "ai_summary": None,
    }

    # Try Gemini for narrative summary
    api_key = os.getenv("GEMINI_API_KEY")
    if user_id:
        try:
            from database.crud import get_or_create_profile
            from config import settings
            profile = get_or_create_profile(user_id)
            api_key = (
                profile.get("gemini_api_key") or 
                profile.get("ui_preferences", {}).get("gemini_api_key") or 
                settings.GEMINI_API_KEY
            )
        except Exception as e:
            logger.warning(f"Could not retrieve custom user AI key in insights generator: {e}")

    if api_key and total_invested > 0:
        try:
            from core.ai_client import GeminiClient
            client = GeminiClient(api_key=api_key)
            tickers = ", ".join(h["ticker"] for h in holdings[:15])
            prompt = f"""Analyse this Indian stock portfolio and give a 3-sentence professional insight covering diversification, risk, and one actionable suggestion. Be concise.
            Stocks: {tickers}
            Total invested: ₹{total_invested:,.0f}, P&L: {pnl_pct:.1f}%"""
            resp_text = client.ask(prompt)
            base_insights["ai_summary"] = resp_text.strip()
        except Exception as e:
            logger.warning(f"Gemini insights failed: {e}")

    return base_insights
