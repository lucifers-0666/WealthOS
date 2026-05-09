import streamlit as st
import google.generativeai as genai
from loguru import logger
from config import GOOGLE_API_KEY, GEMINI_MODEL, GEMINI_MAX_TOKENS, GEMINI_TEMPERATURE
from ai.prompts import CFO_SYSTEM_PROMPT, PORTFOLIO_ANALYSIS_PROMPT
import pandas as pd
import json


def initialize_gemini():
    """Initialize Gemini client."""
    if not GOOGLE_API_KEY:
        return None
    try:
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel(
            model_name=GEMINI_MODEL,
            system_instruction=CFO_SYSTEM_PROMPT,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=GEMINI_MAX_TOKENS,
                temperature=GEMINI_TEMPERATURE,
            )
        )
        return model
    except Exception as e:
        logger.error(f"Gemini init error: {e}")
        return None


def format_portfolio_for_prompt(portfolio_df: pd.DataFrame, summary_stats: dict) -> str:
    """Format portfolio data into a readable prompt string."""
    lines = []
    lines.append(f"Total Portfolio Value: ₹{summary_stats.get('total_current_value', 0):,.0f}")
    lines.append(f"Total Invested: ₹{summary_stats.get('total_invested', 0):,.0f}")
    lines.append(f"Total P&L: ₹{summary_stats.get('total_pnl', 0):+,.0f} ({summary_stats.get('total_pnl_pct', 0):+.1f}%)")
    lines.append(f"Number of Holdings: {summary_stats.get('num_holdings', 0)}")
    lines.append(f"Best Performer: {summary_stats.get('best_performer', 'N/A')}")
    lines.append(f"Worst Performer: {summary_stats.get('worst_performer', 'N/A')}")
    lines.append("\nHoldings Breakdown:")

    for _, row in portfolio_df.iterrows():
        lines.append(
            f"  - {row['Symbol']} ({row.get('Name', '')}): "
            f"Qty={row['Quantity']}, Avg=₹{row['Avg_Buy_Price']:.0f}, "
            f"CMP=₹{row.get('Current_Price', 0):.0f}, "
            f"Value=₹{row.get('Current_Value', 0):,.0f}, "
            f"P&L={row.get('PnL_Pct', 0):+.1f}%, "
            f"Weight={row.get('Weight_Pct', 0):.1f}%"
        )

    return "\n".join(lines)


def chat_with_cfo(user_message: str, portfolio_context: str, history: list) -> str:
    """Send a message to the AI CFO and get a response."""
    model = initialize_gemini()
    if not model:
        return "⚠️ Gemini API key not configured. Please add your GOOGLE_API_KEY to the .env file to enable AI CFO."

    try:
        # Build conversation history
        chat_history = []
        for msg in history[-10:]:  # last 10 messages for context window
            chat_history.append({'role': msg['role'], 'parts': [msg['content']]})

        chat = model.start_chat(history=chat_history)

        full_message = f"{user_message}\n\n[Portfolio Context]\n{portfolio_context}" if portfolio_context else user_message
        response = chat.send_message(full_message)
        return response.text

    except Exception as e:
        logger.error(f"CFO chat error: {e}")
        return f"Error connecting to AI CFO: {str(e)}"


def run_full_portfolio_analysis(portfolio_df: pd.DataFrame, summary_stats: dict) -> str:
    """Run a comprehensive portfolio analysis."""
    model = initialize_gemini()
    if not model:
        return "⚠️ Configure GOOGLE_API_KEY to enable AI portfolio analysis."

    portfolio_summary = format_portfolio_for_prompt(portfolio_df, summary_stats)
    prompt = PORTFOLIO_ANALYSIS_PROMPT.format(
        portfolio_summary=portfolio_summary,
        price_context="Live prices fetched via yfinance"
    )

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return f"Analysis failed: {str(e)}"
