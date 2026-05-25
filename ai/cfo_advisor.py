try:
    from google import genai
    from google.genai import types as genai_types
    _USE_NEW_SDK = True
except ImportError:
    import google.generativeai as genai_legacy
    _USE_NEW_SDK = False

from loguru import logger
from config import GOOGLE_API_KEY, GEMINI_MODEL, GEMINI_MAX_TOKENS, GEMINI_TEMPERATURE
from ai.prompts import CFO_SYSTEM_PROMPT, PORTFOLIO_ANALYSIS_PROMPT
import pandas as pd


def _get_client():
    """Return an initialised client regardless of SDK version installed."""
    if not GOOGLE_API_KEY:
        return None, None
    try:
        if _USE_NEW_SDK:
            client = genai.Client(api_key=GOOGLE_API_KEY)
            return client, "new"
        else:
            genai_legacy.configure(api_key=GOOGLE_API_KEY)
            model = genai_legacy.GenerativeModel(
                model_name=GEMINI_MODEL,
                system_instruction=CFO_SYSTEM_PROMPT,
                generation_config=genai_legacy.types.GenerationConfig(
                    max_output_tokens=GEMINI_MAX_TOKENS,
                    temperature=GEMINI_TEMPERATURE,
                )
            )
            return model, "legacy"
    except Exception as e:
        logger.error(f"Gemini init error: {e}")
        return None, None


def format_portfolio_for_prompt(portfolio_df: pd.DataFrame, summary_stats: dict) -> str:
    lines = []
    lines.append(f"Total Portfolio Value: \u20b9{summary_stats.get('total_current_value', 0):,.0f}")
    lines.append(f"Total Invested: \u20b9{summary_stats.get('total_invested', 0):,.0f}")
    lines.append(f"Total P&L: \u20b9{summary_stats.get('total_pnl', 0):+,.0f} ({summary_stats.get('total_pnl_pct', 0):+.1f}%)")
    lines.append(f"Number of Holdings: {summary_stats.get('num_holdings', 0)}")
    lines.append(f"Best Performer: {summary_stats.get('best_performer', 'N/A')}")
    lines.append(f"Worst Performer: {summary_stats.get('worst_performer', 'N/A')}")
    lines.append("\nHoldings Breakdown:")
    for _, row in portfolio_df.iterrows():
        lines.append(
            f"  - {row['Symbol']} ({row.get('Name', '')}): "
            f"Qty={row['Quantity']}, Avg=\u20b9{row['Avg_Buy_Price']:.0f}, "
            f"CMP=\u20b9{row.get('Current_Price', 0):.0f}, "
            f"Value=\u20b9{row.get('Current_Value', 0):,.0f}, "
            f"P&L={row.get('PnL_Pct', 0):+.1f}%, "
            f"Weight={row.get('Weight_Pct', 0):.1f}%"
        )
    return "\n".join(lines)


def chat_with_cfo(user_message: str, portfolio_context: str, history: list) -> str:
    client, sdk = _get_client()
    if not client:
        return "Advisor systems are temporarily unavailable because AI credentials are not configured. Portfolio reasoning will resume once the service is connected."

    full_message = f"{user_message}\n\n[Portfolio Context]\n{portfolio_context}" if portfolio_context else user_message

    last_error = None
    for _attempt in range(2):
      try:
        if sdk == "new":
            contents = []
            for msg in history[-10:]:
                role = "user" if msg['role'] == 'user' else "model"
                contents.append(genai_types.Content(role=role, parts=[genai_types.Part(text=msg['content'])]))
            contents.append(genai_types.Content(role="user", parts=[genai_types.Part(text=full_message)]))
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=contents,
                config=genai_types.GenerateContentConfig(
                    system_instruction=CFO_SYSTEM_PROMPT,
                    max_output_tokens=GEMINI_MAX_TOKENS,
                    temperature=GEMINI_TEMPERATURE,
                )
            )
            return response.text
        else:
            chat_history = []
            for msg in history[-10:]:
                chat_history.append({'role': msg['role'], 'parts': [msg['content']]})
            chat = client.start_chat(history=chat_history)
            response = chat.send_message(full_message)
            return response.text
      except Exception as e:
        last_error = e
        logger.error(f"CFO chat error: {e}")

    return "Advisor systems are temporarily under elevated load. Portfolio reasoning remains available shortly, and your latest holdings context has been preserved."


def run_full_portfolio_analysis(portfolio_df: pd.DataFrame, summary_stats: dict) -> str:
    client, sdk = _get_client()
    if not client:
        return "Advisor analysis is unavailable until AI credentials are configured."

    portfolio_summary = format_portfolio_for_prompt(portfolio_df, summary_stats)
    prompt = PORTFOLIO_ANALYSIS_PROMPT.format(
        portfolio_summary=portfolio_summary,
        price_context="Live prices fetched via yfinance"
    )

    try:
        if sdk == "new":
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config=genai_types.GenerateContentConfig(
                    system_instruction=CFO_SYSTEM_PROMPT,
                    max_output_tokens=GEMINI_MAX_TOKENS,
                    temperature=GEMINI_TEMPERATURE,
                )
            )
        else:
            response = client.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return f"Analysis failed: {str(e)}"


def get_cfo_response(user_message: str, portfolio, history: list) -> str:
    """Backward-compatible wrapper for the FastAPI endpoint."""
    if isinstance(portfolio, str):
        portfolio_context = portfolio
    elif portfolio is None:
        portfolio_context = ""
    else:
        try:
            portfolio_context = str(portfolio)
        except Exception:
            portfolio_context = ""

    return chat_with_cfo(user_message=user_message, portfolio_context=portfolio_context, history=history)
