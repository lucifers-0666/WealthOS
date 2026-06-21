"""
backend/middleware/security.py
Security middleware for WealthOS — CORS, CSP, HSTS, request ID tracing.

Usage with FastAPI:
    from fastapi import FastAPI
    from backend.middleware.security import apply_security_middleware
    app = FastAPI()
    apply_security_middleware(app)

Usage with Starlette (manual):
    from starlette.middleware.cors import CORSMiddleware
    See apply_security_middleware() below.
"""

import os
import uuid
from typing import Callable

# ── Allowed Origins ────────────────────────────────────────────────────────
ALLOWED_ORIGINS = [
    os.environ.get('FRONTEND_URL', 'http://localhost:5173'),
    'http://localhost:5173',
    'http://localhost:3000',
]

# ── Content Security Policy ────────────────────────────────────────────────
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')

CSP_DIRECTIVES = {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    'font-src': ["'self'", "https://fonts.gstatic.com"],
    'img-src': ["'self'", "data:", "https:"],
    'connect-src': ["'self'", SUPABASE_URL] if SUPABASE_URL else ["'self'"],
}


def _build_csp() -> str:
    return '; '.join(
        f"{directive} {' '.join(sources)}"
        for directive, sources in CSP_DIRECTIVES.items()
    )


CSP_HEADER = _build_csp()

# ── Security Headers ───────────────────────────────────────────────────────
SECURITY_HEADERS = {
    'Content-Security-Policy': CSP_HEADER,
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cache-Control': 'no-store',
    'Server': '',   # Remove server identifier
}


def is_origin_allowed(origin: str) -> bool:
    """Check if origin is in the allowed list."""
    return origin in ALLOWED_ORIGINS


def get_cors_headers(origin: str) -> dict:
    """
    Return CORS headers for an allowed origin.
    Returns empty dict if origin is not allowed.
    """
    if not is_origin_allowed(origin):
        return {}
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
        'Access-Control-Max-Age': '600',
        'Vary': 'Origin',
    }


def generate_request_id() -> str:
    """Generate a UUID v4 request ID for traceability."""
    return str(uuid.uuid4())


def apply_security_headers(response_headers: dict, request_origin: str = '') -> dict:
    """
    Apply all security headers to a response headers dict.
    Mutates and returns the dict.
    """
    for header, value in SECURITY_HEADERS.items():
        if value:
            response_headers[header] = value
    response_headers.update(get_cors_headers(request_origin))
    return response_headers


# ── FastAPI / Starlette Integration ───────────────────────────────────────

def apply_security_middleware(app) -> None:
    """
    Apply security middleware to a FastAPI/Starlette app instance.

    Example:
        from fastapi import FastAPI
        from backend.middleware.security import apply_security_middleware
        app = FastAPI()
        apply_security_middleware(app)
    """
    try:
        from starlette.middleware.cors import CORSMiddleware
        from starlette.middleware.base import BaseHTTPMiddleware
        from starlette.requests import Request
        from starlette.responses import Response

        # CORS
        app.add_middleware(
            CORSMiddleware,
            allow_origins=ALLOWED_ORIGINS,
            allow_credentials=True,
            allow_methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allow_headers=['Content-Type', 'Authorization', 'X-Request-ID'],
        )

        # Security headers + request ID middleware
        class SecurityHeadersMiddleware(BaseHTTPMiddleware):
            async def dispatch(self, request: Request, call_next: Callable) -> Response:
                response = await call_next(request)
                request_id = generate_request_id()
                response.headers['X-Request-ID'] = request_id
                for header, value in SECURITY_HEADERS.items():
                    if value:
                        response.headers[header] = value
                return response

        app.add_middleware(SecurityHeadersMiddleware)

    except ImportError:
        # Starlette not available — security headers must be applied manually
        pass


def validate_csrf(request_headers: dict, allowed_origins: list = None) -> bool:
    """
    Basic CSRF protection: verify Origin/Referer matches allowed domains.
    Returns True if request passes CSRF check.
    """
    origins = allowed_origins or ALLOWED_ORIGINS
    origin = request_headers.get('Origin', '')
    referer = request_headers.get('Referer', '')

    if origin:
        return any(origin.startswith(o) for o in origins)
    if referer:
        return any(referer.startswith(o) for o in origins)
    # No Origin or Referer — reject state-changing requests
    return False
