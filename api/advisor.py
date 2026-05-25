"""
WealthOS AI Advisor API — chat + streaming endpoints with Gemini
Fallback: cached advisory templates if Gemini fails.
"""
import asyncio
import json
import logging
from typing import AsyncGenerator
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

logger = logging.getLogger("wealthos.advisor")
router = APIRouter(prefix="/api/advisor", tags=["advisor"])

FALLBACK_RESPONSES = [
    "Based on your portfolio composition, consider reviewing concentration in your top holdings.",
    "Market volatility is normal. Your diversification strategy should help cushion downside moves.",
    "For optimal tax efficiency, consider tax-loss harvesting positions showing unrealized losses.",
    "A systematic SIP approach into underweighted sectors can improve your allocation balance.",
]
_fallback_idx = 0


class ChatRequest(BaseModel):
    message: str


def _get_gemini():
    try:
        import google.generativeai as genai
        from config import settings
        genai.configure(api_key=settings.GEMINI_API_KEY)
        return genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=(
                "You are WealthOS AI Advisor — an expert Indian equity portfolio advisor. "
                "You have access to the user's portfolio context. Be specific, data-driven, "
                "and actionable. Use Indian financial terminology. Format responses clearly "
                "with bullet points where appropriate. Keep responses under 400 words."
            )
        )
    except Exception as e:
        logger.warning("Gemini init failed: %s", e)
        return None


@router.post("/chat")
async def advisor_chat(req: ChatRequest):
    global _fallback_idx
    model = _get_gemini()
    if model is None:
        resp = FALLBACK_RESPONSES[_fallback_idx % len(FALLBACK_RESPONSES)]
        _fallback_idx += 1
        return {"reply": resp}

    for attempt in range(3):
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None, lambda: model.generate_content(req.message)
            )
            return {"reply": response.text}
        except Exception as e:
            logger.warning("Gemini attempt %d failed: %s", attempt + 1, e)
            if attempt < 2:
                await asyncio.sleep(1.0)

    resp = FALLBACK_RESPONSES[_fallback_idx % len(FALLBACK_RESPONSES)]
    _fallback_idx += 1
    return {"reply": resp}


@router.post("/stream")
async def advisor_stream(req: ChatRequest):
    model = _get_gemini()
    if model is None:
        async def fallback_stream():
            global _fallback_idx
            text = FALLBACK_RESPONSES[_fallback_idx % len(FALLBACK_RESPONSES)]
            _fallback_idx += 1
            for word in text.split():
                yield f'data: {json.dumps({"text": word + " "})}\n\n'
                await asyncio.sleep(0.05)
            yield 'data: [DONE]\n\n'
        return StreamingResponse(fallback_stream(), media_type="text/event-stream")

    async def stream_gen() -> AsyncGenerator[str, None]:
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: model.generate_content(req.message, stream=True)
            )
            for chunk in response:
                if chunk.text:
                    yield f'data: {json.dumps({"text": chunk.text})}\n\n'
            yield 'data: [DONE]\n\n'
        except Exception as e:
            logger.error("Gemini stream error: %s", e)
            yield f'data: {json.dumps({"text": "Advisor systems are temporarily under elevated load. Please try again."})}\n\n'
            yield 'data: [DONE]\n\n'

    return StreamingResponse(stream_gen(), media_type="text/event-stream")
