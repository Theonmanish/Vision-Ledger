"""
Low-level Supabase data-access wrapper.

All direct table queries pass through this service so that
higher-level services (StorageService, ClaimService) stay
decoupled from the Supabase SDK surface area.
"""

import logging

from supabase import Client

from app.db.supabase import supabase_client
from app.models.constants import CLAIMS_TABLE, CLAIM_COLUMNS
from app.utils.claim_mapper import normalize_claim_record

logger = logging.getLogger(__name__)


class SupabaseService:
    """
    Thin wrapper around the synchronous Supabase client.

    Methods are named ``fetch_`` / ``insert_`` to signal I/O.
    """

    def __init__(self) -> None:
        self._client: Client = supabase_client

    def fetch_all(self, table: str, columns: str = "*") -> list[dict]:
        """
        Return every row from *table*.

        Returns an empty list on failure rather than raising —
        callers decide whether to treat that as an error.
        """
        try:
            resp = (
                self._client.table(table)
                .select(columns)
                .order("created_at", desc=True)
                .execute()
            )
            return [normalize_claim_record(row) for row in resp.data]
        except Exception:
            logger.exception("Supabase fetch_all failed for table %s", table)
            return []

    def insert_row(self, table: str, payload: dict) -> dict | None:
        """
        Insert a single row and return the persisted dict,
        or ``None`` on failure.
        """
        try:
            resp = self._client.table(table).insert(payload).execute()
            return resp.data[0] if resp.data else None
        except Exception:
            logger.exception("Supabase insert failed for table %s", table)
            return None

    def get_all_claims(self) -> list[dict]:
        """Fetch claims ordered newest-first."""
        return self.fetch_all(CLAIMS_TABLE, CLAIM_COLUMNS)

    def create_claim(self, payload: dict) -> dict | None:
        """Insert a new claim record."""
        return self.insert_row(CLAIMS_TABLE, payload)

    def get_claim_by_id(self, claim_id: str) -> dict | None:
        """Fetch a single claim by its UUID primary key."""
        try:
            resp = (
                self._client.table(CLAIMS_TABLE)
                .select(CLAIM_COLUMNS)
                .eq("id", claim_id)
                .limit(1)
                .execute()
            )
            if resp.data:
                return normalize_claim_record(resp.data[0])
        except Exception:
            logger.exception("Supabase get_claim_by_id failed for %s", claim_id)
        return None
