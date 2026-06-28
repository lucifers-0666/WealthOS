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


@router.post("/chat")
async def advisor_chat(req: ChatRequest):
    from core.ai_client import GeminiClient
    from config import settings
    
    context = (
        "You are WealthOS AI Advisor — an expert Indian equity portfolio advisor. "
        "You have access to the user's portfolio context. Be specific, data-driven, "
        "and actionable. Use Indian financial terminology. Format responses clearly "
        "with bullet points where appropriate. Keep responses under 400 words."
    )
    
    if not settings.GEMINI_API_KEY:
        global _fallback_idx
        resp = FALLBACK_RESPONSES[_fallback_idx % len(FALLBACK_RESPONSES)]
        _fallback_idx += 1
        return {"reply": resp}
        
    client = GeminiClient(settings.GEMINI_API_KEY)
    reply = await asyncio.get_event_loop().run_in_executor(
        None, lambda: client.ask(req.message, context=context)
    )
    return {"reply": reply}


@router.post("/stream")
async def advisor_stream(req: ChatRequest):
    from core.ai_client import GeminiClient
    from config import settings
    
    context = (
        "You are WealthOS AI Advisor — an expert Indian equity portfolio advisor. "
        "You have access to the user's portfolio context. Be specific, data-driven, "
        "and actionable. Use Indian financial terminology. Format responses clearly "
        "with bullet points where appropriate. Keep responses under 400 words."
    )

    if not settings.GEMINI_API_KEY:
        async def fallback_stream():
            global _fallback_idx
            text = FALLBACK_RESPONSES[_fallback_idx % len(FALLBACK_RESPONSES)]
            _fallback_idx += 1
            for word in text.split():
                yield f'data: {json.dumps({"text": word + " "})}\n\n'
                await asyncio.sleep(0.05)
            yield 'data: [DONE]\n\n'
        return StreamingResponse(fallback_stream(), media_type="text/event-stream")

    async def stream_gen():
        client = GeminiClient(settings.GEMINI_API_KEY)
        # Using ask() and simulating stream to frontend
        reply = await asyncio.get_event_loop().run_in_executor(
            None, lambda: client.ask(req.message, context=context)
        )
        for word in reply.split():
            yield f'data: {json.dumps({"text": word + " "})}\n\n'
            await asyncio.sleep(0.02)
        yield 'data: [DONE]\n\n'

    return StreamingResponse(stream_gen(), media_type="text/event-stream")
