"""
Claim service — manages insurance-claim lifecycle records.

Responsibilities:
  * Generate unique claim IDs.
  * Persist claim metadata to Supabase.
  * Retrieve full claim history.

NOTE: AI verification is **not** implemented.  The ``verify``
      method returns a hardcoded pending response so the rest
      of the architecture can be exercised end-to-end.
"""

from app.services.supabase_service import SupabaseService
from app.utils.helpers import generate_claim_id


class ClaimService:
    """
    Orchestrates claim persistence via ``SupabaseService``.

    Inject a custom ``SupabaseService`` for testing.
    """

    def __init__(self, db: SupabaseService | None = None) -> None:
        self._db: SupabaseService = db or SupabaseService()

    def verify(
        self,
        claim_type: str,
        description: str,
        image_url: str,
    ) -> dict:
        """
        Create a claim record and return a stub verification result.

        **This is a placeholder.**  When AI integration is added,
        replace the body of this method with a call to your model
        while keeping the return shape identical.

        Returns:
            ``{"claimId": ..., "status": ..., "confidence": ..., "reason": ...}``
        """
        claim_id = generate_claim_id()

        stub_result = {
            "claimId": claim_id,
            "status": "Pending AI Verification",
            "confidence": 0,
            "reason": "AI integration pending",
        }

        # Persist the claim so it appears in /history.
        self._db.create_claim({
            "claim_id": claim_id,
            "claim_type": claim_type,
            "description": description,
            "status": stub_result["status"],
            "confidence": stub_result["confidence"],
            "reason": stub_result["reason"],
            "image_url": image_url,
        })

        return stub_result

    def get_history(self) -> list[dict]:
        """
        Return all stored claims, newest first.

        Returns an empty list when the table has no rows or when
        the query fails (graceful degradation).
        """
        return self._db.get_all_claims()
