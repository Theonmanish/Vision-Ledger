"""
Low-level Supabase data-access wrapper.

All direct table queries pass through this service so that
higher-level services (StorageService, ClaimService) stay
decoupled from the Supabase SDK surface area.
"""

import logging

from supabase import Client

from app.db.supabase import supabase_client
from app.models.constants import CLAIMS_TABLE, CLAIM_COLUMNS, CLAIM_COLUMNS_LEGACY
from app.utils.claim_mapper import normalize_claim_record

logger = logging.getLogger(__name__)


class SupabaseService:
    """
    Thin wrapper around the synchronous Supabase client.

    Methods are named ``fetch_`` / ``insert_`` to signal I/O.
    """

    # Typed blockchain columns added by migration 001. If the
    # migration has not yet been applied these columns are absent and
    # inserts/queries must degrade gracefully — the same data always
    # lives inside claim_input JSON as a durable fallback.
    _BLOCKCHAIN_COLUMNS: tuple[str, ...] = (
        "blockchain_hash",
        "transaction_hash",
        "block_number",
        "network",
        "verification_anchor_time",
        "blockchain_status",
    )

    def __init__(self) -> None:
        self._client: Client = supabase_client

    # -- internals ---------------------------------------------------

    @classmethod
    def _strip_blockchain_columns(cls, payload: dict) -> dict:
        """Return a copy of *payload* without the typed blockchain columns."""
        return {k: v for k, v in payload.items() if k not in cls._BLOCKCHAIN_COLUMNS}

    def _safe_insert(self, table: str, payload: dict) -> dict | None:
        """
        Insert *payload*, retrying without typed blockchain columns
        if the live schema does not yet have them (pre-migration).
        """
        try:
            resp = self._client.table(table).insert(payload).execute()
            return resp.data[0] if resp.data else None
        except Exception as exc:
            msg = str(exc)
            looks_like_missing_column = any(
                col in msg for col in self._BLOCKCHAIN_COLUMNS
            )
            if looks_like_missing_column:
                logger.warning(
                    "Insert with blockchain columns failed (%s); "
                    "retrying with claim_input fallback.",
                    msg[:160],
                )
                stripped = self._strip_blockchain_columns(payload)
                resp = self._client.table(table).insert(stripped).execute()
                return resp.data[0] if resp.data else None
            raise

    # -- reads -------------------------------------------------------

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
        except Exception as exc:
            # If migration 001 hasn't been applied, the blockchain
            # columns won't resolve — retry with the legacy set.
            if any(col in str(exc) for col in self._BLOCKCHAIN_COLUMNS):
                try:
                    resp = (
                        self._client.table(table)
                        .select(CLAIM_COLUMNS_LEGACY)
                        .order("created_at", desc=True)
                        .execute()
                    )
                    return [normalize_claim_record(row) for row in resp.data]
                except Exception:
                    logger.exception("Supabase fetch_all legacy fallback failed")
                    return []
            logger.exception("Supabase fetch_all failed for table %s", table)
            return []

    def insert_row(self, table: str, payload: dict) -> dict | None:
        """
        Insert a single row and return the persisted dict,
        or ``None`` on failure.
        """
        try:
            return self._safe_insert(table, payload)
        except Exception:
            logger.exception("Supabase insert failed for table %s", table)
            return None

    def get_all_claims(self, user_id: str | None = None) -> list[dict]:
        """
        Fetch claims ordered newest-first.
        
        If user_id is provided, only returns claims belonging to that user.
        """
        if user_id:
            return self._fetch_by_user(user_id)
        return self.fetch_all(CLAIMS_TABLE, CLAIM_COLUMNS)

    def _fetch_by_user(self, user_id: str) -> list[dict]:
        """
        Fetch claims for a specific user, ordered newest-first.
        
        Returns an empty list on failure rather than raising.
        """
        try:
            resp = (
                self._client.table(CLAIMS_TABLE)
                .select(CLAIM_COLUMNS)
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
            return [normalize_claim_record(row) for row in resp.data]
        except Exception as exc:
            # If migration 002 hasn't been applied, the user_id
            # column won't exist — fall back to fetching all.
            if "user_id" in str(exc):
                logger.warning(
                    "user_id column not found; falling back to fetch_all. "
                    "Run migration 002 to enable user-based filtering."
                )
                return self.fetch_all(CLAIMS_TABLE, CLAIM_COLUMNS)
            logger.exception("Supabase _fetch_by_user failed for user %s", user_id)
            return []

    def create_claim(self, payload: dict) -> dict | None:
        """Insert a new claim record."""
        return self.insert_row(CLAIMS_TABLE, payload)

    def get_claim_by_id(self, claim_id: str) -> dict | None:
        """Fetch a single claim by its UUID primary key."""
        for columns in (CLAIM_COLUMNS, CLAIM_COLUMNS_LEGACY):
            try:
                resp = (
                    self._client.table(CLAIMS_TABLE)
                    .select(columns)
                    .eq("id", claim_id)
                    .limit(1)
                    .execute()
                )
                if resp.data:
                    return normalize_claim_record(resp.data[0])
            except Exception as exc:
                if any(col in str(exc) for col in self._BLOCKCHAIN_COLUMNS):
                    continue
                logger.exception("Supabase get_claim_by_id failed for %s", claim_id)
                return None
        return None

    def update_row(self, table: str, filters: dict, updates: dict) -> dict | None:
        """
        Update rows matching filters with the given updates.

        Args:
            table: Table name
            filters: Dict of column=value pairs to match
            updates: Dict of column=value pairs to update

        Returns:
            Updated row dict or None on failure
        """
        try:
            query = self._client.table(table).update(updates)
            for col, val in filters.items():
                query = query.eq(col, val)
            resp = query.execute()
            return resp.data[0] if resp.data else None
        except Exception:
            logger.exception("Supabase update failed for table %s", table)
            return None

    def get_rows(self, table: str, filters: dict, columns: str = "*", order: str | None = None) -> list[dict]:
        """
        Fetch rows matching filters.

        Args:
            table: Table name
            filters: Dict of column=value pairs to match
            columns: Columns to select (default: all)
            order: Column to order by (optional)

        Returns:
            List of matching rows
        """
        try:
            query = self._client.table(table).select(columns)
            for col, val in filters.items():
                query = query.eq(col, val)
            if order:
                query = query.order(order, desc=True)
            resp = query.execute()
            return resp.data or []
        except Exception:
            logger.exception("Supabase get_rows failed for table %s", table)
            return []
