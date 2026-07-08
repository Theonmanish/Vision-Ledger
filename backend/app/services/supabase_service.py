"""
Low-level Supabase data-access wrapper.

All direct table queries pass through this service so that
higher-level services (StorageService, ClaimService) stay
decoupled from the Supabase SDK surface area.
"""

from supabase import Client

from app.db.supabase import supabase_client
from app.models.constants import CLAIMS_TABLE, CLAIM_COLUMNS


class SupabaseService:
    """
    Thin wrapper around the synchronous Supabase client.

    Methods are named ``fetch_`` / ``insert_`` to signal I/O.
    """

    def __init__(self) -> None:
        self._client: Client = supabase_client

    # ── Generic helpers ──────────────────────────────────────

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
            return resp.data
        except Exception:
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
            return None

    # ── Claim-specific convenience ───────────────────────────

    def get_all_claims(self) -> list[dict]:
        """Fetch claims ordered newest-first."""
        return self.fetch_all(CLAIMS_TABLE, CLAIM_COLUMNS)

    def create_claim(self, payload: dict) -> dict | None:
        """Insert a new claim record."""
        return self.insert_row(CLAIMS_TABLE, payload)
