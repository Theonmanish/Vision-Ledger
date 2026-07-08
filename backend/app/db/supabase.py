"""
Supabase client singleton.

The client is created once at first import and reused across the
entire application lifetime.  It is deliberately *not* async because
the official ``supabase`` Python SDK wraps synchronous ``httpx``
calls.  If you need true async I/O later, swap this for a raw
``httpx.AsyncClient`` talking to the Supabase REST API directly.
"""

from supabase import create_client, Client

from app.core.config import settings


def _create_client() -> Client:
    """Build and return a Supabase client from settings."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


# Module-level singleton — safe for concurrent reads.
supabase_client: Client = _create_client()
