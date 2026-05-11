"""
WealthOS — Redis cache layer
Uses Upstash Redis in production; falls back to in-memory dict for local dev.
"""

import os
import json
import time
from typing import Any, Optional

from dotenv import load_dotenv

load_dotenv()

REDIS_URL: str = os.getenv("REDIS_URL", "")
_redis = None
_mem: dict[str, tuple[Any, float]] = {}  # in-memory fallback {key: (value, expires_at)}


def _get_redis():
    global _redis
    if _redis is not None:
        return _redis
    if not REDIS_URL:
        return None
    try:
        import redis as redis_lib
        _redis = redis_lib.from_url(REDIS_URL, decode_responses=True)
        _redis.ping()
        return _redis
    except Exception as e:
        print(f"[WealthOS] Redis unavailable ({e}), using in-memory cache.")
        return None


def cache_set(key: str, value: Any, ttl_seconds: int = 300) -> None:
    """Store a JSON-serialisable value with TTL."""
    r = _get_redis()
    if r:
        try:
            r.setex(key, ttl_seconds, json.dumps(value))
            return
        except Exception:
            pass
    # In-memory fallback
    _mem[key] = (value, time.time() + ttl_seconds)


def cache_get(key: str) -> Optional[Any]:
    """Retrieve cached value, or None if missing/expired."""
    r = _get_redis()
    if r:
        try:
            raw = r.get(key)
            return json.loads(raw) if raw else None
        except Exception:
            pass
    # In-memory fallback
    if key in _mem:
        value, exp = _mem[key]
        if time.time() < exp:
            return value
        del _mem[key]
    return None


def cache_delete(key: str) -> None:
    r = _get_redis()
    if r:
        try:
            r.delete(key)
            return
        except Exception:
            pass
    _mem.pop(key, None)


def cache_clear_pattern(pattern: str) -> None:
    """Delete all keys matching a pattern (Redis only)."""
    r = _get_redis()
    if r:
        try:
            keys = r.keys(pattern)
            if keys:
                r.delete(*keys)
        except Exception:
            pass
    else:
        # Clear matching in-memory keys
        to_del = [k for k in _mem if pattern.replace('*', '') in k]
        for k in to_del:
            del _mem[k]


def cache_health() -> dict:
    r = _get_redis()
    if r:
        try:
            r.ping()
            info = r.info('memory')
            return {"backend": "redis", "status": "ok", "used_memory_human": info.get('used_memory_human')}
        except Exception as e:
            return {"backend": "redis", "status": "error", "error": str(e)}
    return {"backend": "memory", "status": "ok", "keys": len(_mem)}
