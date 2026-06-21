"""
backend/middleware/rate_limiter.py
Per-IP rate limiting for WealthOS auth endpoints.

Usage (FastAPI/Starlette example):
    from backend.middleware.rate_limiter import RateLimiter
    limiter = RateLimiter()
    limiter.check(request, endpoint='login')   # raises HTTPException on breach

Usage (plain dict tracking for frameworks without middleware):
    from backend.middleware.rate_limiter import check_rate_limit
    check_rate_limit(client_ip, endpoint='login')
"""

import time
import threading
from collections import defaultdict

# ── Configuration ──────────────────────────────────────────────────────────
RATE_LIMIT_CONFIG = {
    'login': {
        'window_seconds': 15 * 60,   # 15 minutes
        'max_attempts':   5,         # per IP window
        'message': 'Too many login attempts. Wait 15 minutes.',
        'error_code': 'TOO_MANY_ATTEMPTS',
        'retry_after': 15,
    },
    'register': {
        'window_seconds': 60 * 60,   # 1 hour
        'max_attempts':   3,
        'message': 'Too many accounts created. Try again in 1 hour.',
        'error_code': 'REGISTER_LIMIT',
        'retry_after': 60,
    },
    'forgot_password': {
        'window_seconds': 60 * 60,   # 1 hour
        'max_attempts':   3,
        'message': 'Too many reset requests. Try again in 1 hour.',
        'error_code': 'RESET_LIMIT',
        'retry_after': 60,
    },
}

# Per-email lockout (after many failures for the same email)
EMAIL_LOCKOUT_CONFIG = {
    'fail_threshold':    10,       # failures before lockout
    'lockout_seconds':   30 * 60, # 30-minute lockout
    'window_seconds':    15 * 60, # track failures over 15 min
}


class RateLimitExceeded(Exception):
    """Raised when an IP or email has exceeded allowed attempts."""
    def __init__(self, error_code: str, message: str, retry_after: int):
        super().__init__(message)
        self.error_code = error_code
        self.message = message
        self.retry_after = retry_after


class InMemoryRateLimiter:
    """
    Simple thread-safe in-memory rate limiter.
    NOTE: Does not persist across process restarts.
    Replace with Redis-backed store in production (see redis_limiter.py).
    """

    def __init__(self):
        self._lock = threading.Lock()
        # { (ip, endpoint): [(timestamp, ...), ...] }
        self._ip_records: dict[tuple, list[float]] = defaultdict(list)
        # { email: {'count': int, 'locked_until': float | None, 'timestamps': list} }
        self._email_records: dict[str, dict] = defaultdict(lambda: {
            'count': 0,
            'locked_until': None,
            'timestamps': [],
        })

    def _prune(self, timestamps: list[float], window_seconds: int) -> list[float]:
        cutoff = time.time() - window_seconds
        return [t for t in timestamps if t > cutoff]

    def check_ip(self, client_ip: str, endpoint: str) -> None:
        """
        Raises RateLimitExceeded if the IP has hit the limit for the endpoint.
        Call this BEFORE processing the request.
        """
        cfg = RATE_LIMIT_CONFIG.get(endpoint)
        if not cfg:
            return

        key = (client_ip, endpoint)
        now = time.time()

        with self._lock:
            self._ip_records[key] = self._prune(
                self._ip_records[key], cfg['window_seconds']
            )
            if len(self._ip_records[key]) >= cfg['max_attempts']:
                raise RateLimitExceeded(
                    error_code=cfg['error_code'],
                    message=cfg['message'],
                    retry_after=cfg['retry_after'],
                )

    def record_attempt(self, client_ip: str, endpoint: str) -> None:
        """Record an attempt for a given IP + endpoint."""
        key = (client_ip, endpoint)
        with self._lock:
            self._ip_records[key].append(time.time())

    def check_email_lockout(self, email: str) -> None:
        """
        Raises RateLimitExceeded if the email is in a lockout period.
        Call this BEFORE processing the request.
        """
        cfg = EMAIL_LOCKOUT_CONFIG
        now = time.time()
        normalized = email.strip().lower()

        with self._lock:
            rec = self._email_records[normalized]
            if rec['locked_until'] and now < rec['locked_until']:
                wait_minutes = int((rec['locked_until'] - now) / 60) + 1
                raise RateLimitExceeded(
                    error_code='EMAIL_LOCKED',
                    message=f'Account temporarily locked. Try again in {wait_minutes} minutes.',
                    retry_after=wait_minutes,
                )

    def record_email_failure(self, email: str) -> None:
        """
        Record a failed login for an email.
        Locks the email after EMAIL_LOCKOUT_CONFIG['fail_threshold'] failures.
        """
        cfg = EMAIL_LOCKOUT_CONFIG
        now = time.time()
        normalized = email.strip().lower()

        with self._lock:
            rec = self._email_records[normalized]
            # Prune old timestamps
            rec['timestamps'] = [
                t for t in rec['timestamps']
                if t > now - cfg['window_seconds']
            ]
            rec['timestamps'].append(now)
            rec['count'] = len(rec['timestamps'])

            if rec['count'] >= cfg['fail_threshold']:
                rec['locked_until'] = now + cfg['lockout_seconds']

    def clear_email_failures(self, email: str) -> None:
        """Clear failure record on successful login."""
        normalized = email.strip().lower()
        with self._lock:
            self._email_records[normalized] = {
                'count': 0,
                'locked_until': None,
                'timestamps': [],
            }


# Singleton — import this instance in route handlers
rate_limiter = InMemoryRateLimiter()


def get_client_ip(request_headers: dict, remote_addr: str = '') -> str:
    """
    Extract real client IP from forwarded headers or remote_addr.
    """
    for header in ('X-Forwarded-For', 'X-Real-IP', 'CF-Connecting-IP'):
        val = request_headers.get(header, '')
        if val:
            return val.split(',')[0].strip()
    return remote_addr or '0.0.0.0'
