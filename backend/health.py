"""
WealthOS Health Check Module
Exposes /health and /health/deep endpoints for production monitoring.
"""
import time
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()

STARTUP_TIME = time.time()


@router.get("/health", tags=["Health"])
async def health_check():
    """Basic liveness probe — returns 200 immediately."""
    return JSONResponse(
        status_code=200,
        content={
            "status": "ok",
            "service": "WealthOS API",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "uptime_seconds": round(time.time() - STARTUP_TIME, 1),
        },
    )


@router.get("/health/deep", tags=["Health"])
async def deep_health_check():
    """
    Readiness probe — checks DB connectivity, market engine status, WS broadcaster.
    Returns 200 if all critical dependencies are healthy.
    Returns 503 if any critical component is degraded.
    """
    checks = {}
    overall_ok = True

    # ── Supabase DB check ──────────────────────────────────────────────────────
    try:
        from database.db import supabase
        start = time.monotonic()
        resp = supabase.table("holdings").select("id").limit(1).execute()
        latency_ms = round((time.monotonic() - start) * 1000, 1)
        checks["database"] = {"status": "ok", "latency_ms": latency_ms}
    except Exception as e:
        checks["database"] = {"status": "error", "detail": str(e)[:120]}
        overall_ok = False

    # ── Market engine check ────────────────────────────────────────────────────
    try:
        from backend.services.live_market_engine import get_engine_status
        engine_status = get_engine_status()
        checks["market_engine"] = engine_status
        if engine_status.get("status") == "error":
            overall_ok = False
    except Exception as e:
        checks["market_engine"] = {"status": "unavailable", "detail": str(e)[:80]}

    # ── WebSocket broadcaster ──────────────────────────────────────────────────
    try:
        from backend.services.ws_broadcaster import get_connection_count
        checks["websocket"] = {"status": "ok", "active_connections": get_connection_count()}
    except Exception as e:
        checks["websocket"] = {"status": "unavailable", "detail": str(e)[:80]}

    status_code = 200 if overall_ok else 503
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ok" if overall_ok else "degraded",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "uptime_seconds": round(time.time() - STARTUP_TIME, 1),
            "checks": checks,
        },
    )
