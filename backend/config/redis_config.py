"""
backend/config/redis_config.py
Optional Redis configuration for WealthOS.

Redis is used for:
  1. Persistent rate limit storage (survives restarts)
  2. JWT blacklist on logout (key: blacklist:{token_id})
  3. Per-email failed login counters

If Redis is not available, the in-memory rate limiter in
backend/middleware/rate_limiter.py is used automatically.

Environment variables:
    REDIS_HOST      — default: localhost
    REDIS_PORT      — default: 6379
    REDIS_PASSWORD  — default: empty (no auth)
    REDIS_TLS       — 'true' to enable TLS (for managed Redis)
    REDIS_DB        — default: 0
"""

import os
import logging

logger = logging.getLogger(__name__)

REDIS_HOST = os.environ.get('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.environ.get('REDIS_PORT', '6379'))
REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD') or None
REDIS_TLS = os.environ.get('REDIS_TLS', '').lower() == 'true'
REDIS_DB = int(os.environ.get('REDIS_DB', '0'))

# Prefix for all WealthOS keys
KEY_PREFIX = 'wealthos:'

# Key patterns
KEY_RATE_LIMIT = KEY_PREFIX + 'rl:{ip}:{endpoint}'
KEY_BLACKLIST = KEY_PREFIX + 'blacklist:{token_id}'
KEY_EMAIL_FAILS = KEY_PREFIX + 'email_fails:{email}'
KEY_EMAIL_LOCK = KEY_PREFIX + 'email_lock:{email}'


def get_redis_client():
    """
    Returns a Redis client if redis (or ioredis-equivalent) is available.
    Returns None if the redis package is not installed or connection fails.
    """
    try:
        import redis
        ssl_opts = {'ssl': True, 'ssl_cert_reqs': None} if REDIS_TLS else {}
        client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            password=REDIS_PASSWORD,
            db=REDIS_DB,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
            retry_on_timeout=True,
            **ssl_opts,
        )
        client.ping()
        logger.info('[Redis] Connected to %s:%s', REDIS_HOST, REDIS_PORT)
        return client
    except ImportError:
        logger.info('[Redis] redis package not installed — using in-memory fallback.')
        return None
    except Exception as exc:
        logger.warning('[Redis] Could not connect: %s — using in-memory fallback.', exc)
        return None


class RedisTokenBlacklist:
    """
    Manages a JWT blacklist in Redis.
    Tokens are stored with their remaining TTL so they expire automatically.
    """

    def __init__(self, redis_client=None):
        self._redis = redis_client or get_redis_client()

    def is_available(self) -> bool:
        return self._redis is not None

    def blacklist(self, token_id: str, ttl_seconds: int) -> bool:
        """Add a token ID to the blacklist with a TTL equal to token expiry."""
        if not self._redis:
            return False
        try:
            key = KEY_BLACKLIST.format(token_id=token_id)
            self._redis.setex(key, ttl_seconds, '1')
            return True
        except Exception as exc:
            logger.error('[Redis] Blacklist error: %s', exc)
            return False

    def is_blacklisted(self, token_id: str) -> bool:
        """Returns True if the token ID is in the blacklist."""
        if not self._redis:
            return False
        try:
            key = KEY_BLACKLIST.format(token_id=token_id)
            return bool(self._redis.exists(key))
        except Exception as exc:
            logger.error('[Redis] Blacklist check error: %s', exc)
            return False


# Singleton instances
_redis_client = None


def get_shared_redis():
    """Return the shared Redis client, initializing once."""
    global _redis_client
    if _redis_client is None:
        _redis_client = get_redis_client()
    return _redis_client


token_blacklist = RedisTokenBlacklist()
