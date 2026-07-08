"""
Claim service — manages insurance-claim lifecycle records.

Responsibilities:
  * Generate unique claim IDs.
  * Invoke the AI verification service.
  * Persist claim metadata to Supabase.
  * Retrieve full claim history.
"""

import logging

from app.services.ai_service import AIService
from app.services.supabase_service import SupabaseService
from app.utils.helpers import generate_claim_id

logger = logging.getLogger(__name__)


class ClaimService:
    """
    Orchestrates AI verification and claim persistence.

    Inject custom dependencies for testing.
    """

    def __init__(
        self,
        db: SupabaseService | None = None,
        ai: AIService | None = None,
    ) -> None:
        self._db: SupabaseService = db or SupabaseService()
        self._ai: AIService = ai or AIService()

    def verify(
        self,
        claim_type: str,
        description: str,
        image_url: str,
    ) -> dict:
        """
        Analyse the claim image with AI, persist the result, and
        return a verification payload.

        Returns:
            ``{
                claimId, status, confidence, reason,
                claim_supported, objects_detected, estimated_quantity,
                limitations, recommendation
            }``
        """
        claim_id = generate_claim_id()

        # ── Call AI service ─────────────────────────────────────
        ai_result = self._ai.analyze_claim(
            image_url=image_url,
            claim_type=claim_type,
            description=description,
        )

        status = "Verified" if ai_result.claim_supported else "Rejected"

        result = {
            "claimId": claim_id,
            "status": status,
            "confidence": ai_result.confidence,
            "reason": ai_result.reason,
            "claim_supported": ai_result.claim_supported,
            "objects_detected": ai_result.objects_detected,
            "estimated_quantity": ai_result.estimated_quantity,
            "limitations": ai_result.limitations,
            "recommendation": ai_result.recommendation,
        }

        # Persist the claim so it appears in /history.
        self._db.create_claim({
            "claim_id": claim_id,
            "claim_type": claim_type,
            "description": description,
            "status": result["status"],
            "confidence": result["confidence"],
            "reason": result["reason"],
            "image_url": image_url,
        })

        return result

    def get_history(self) -> list[dict]:
        """
        Return all stored claims, newest first.

        Returns an empty list when the table has no rows or when
        the query fails (graceful degradation).
        """
        return self._db.get_all_claims()
