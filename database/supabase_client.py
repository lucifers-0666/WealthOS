"""
WealthOS — Supabase Client
Singleton client for all Supabase operations (PostgreSQL + Auth + Storage + Realtime)
"""

import os
from supabase import create_client, Client
from functools import lru_cache

_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Return singleton Supabase client. Lazily initialised."""
    global _supabase_client
    if _supabase_client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")
        if not url or not key:
            raise EnvironmentError(
                "❌ SUPABASE_URL and SUPABASE_ANON_KEY must be set in your .env file.\n\n"
                "📋 Get them from: https://supabase.com/dashboard/project/<your-project>/settings/api\n\n"
                "Current values:\n"
                f"  SUPABASE_URL={url or '(not set)'}\n"
                f"  SUPABASE_ANON_KEY={key or '(not set)'}\n\n"
                "⚠️  If you don't have a Supabase project, create one free at https://supabase.com"
            )
        try:
            _supabase_client = create_client(url, key)
            # Test connection
            _supabase_client.auth.get_session()
        except Exception as e:
            raise EnvironmentError(
                f"❌ Failed to connect to Supabase: {e}\n\n"
                "Please verify:\n"
                "1. SUPABASE_URL is correct\n"
                "2. SUPABASE_ANON_KEY is valid\n"
                "3. Your Supabase project is accessible"
            )
    return _supabase_client


def get_supabase_service() -> Client:
    """
    Service-role client — bypasses RLS. Use ONLY in backend/server code.
    NEVER expose service key to frontend.
    """
    url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not service_key:
        raise EnvironmentError(
            "❌ SUPABASE_SERVICE_ROLE_KEY must be set for admin operations.\n\n"
            "Get it from: https://supabase.com/dashboard/project/<your-project>/settings/api"
        )
    return create_client(url, service_key)
