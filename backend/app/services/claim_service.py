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
from app.utils.helpers import generate_claim_id, placeholder_tx_hash
from app.utils.claim_mapper import build_claim_payload, normalize_claim_record

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
        """
        claim_code = generate_claim_id()

        ai_result = self._ai.analyze_claim(
            image_url=image_url.rstrip("?"),
            claim_type=claim_type,
            description=description,
        )

        status = "Verified" if ai_result.claim_supported else "Rejected"

        result = {
            "claimId": claim_code,
            "status": status,
            "confidence": ai_result.confidence,
            "reason": ai_result.reason,
            "claim_supported": ai_result.claim_supported,
            "objects_detected": ai_result.objects_detected,
            "estimated_quantity": ai_result.estimated_quantity,
            "limitations": ai_result.limitations,
            "recommendation": ai_result.recommendation,
        }

        saved = self._db.create_claim(
            build_claim_payload(
                claim_code=claim_code,
                claim_type=claim_type,
                description=description,
                image_url=image_url,
                status=status,
                confidence=ai_result.confidence,
                reason=ai_result.reason,
                tx_hash=placeholder_tx_hash(claim_code),
                claim_supported=ai_result.claim_supported,
                objects_detected=ai_result.objects_detected,
                estimated_quantity=ai_result.estimated_quantity,
                limitations=ai_result.limitations,
                recommendation=ai_result.recommendation,
            )
        )

        if saved:
            normalized = normalize_claim_record(saved)
            result["claimId"] = normalized["claim_id"]
        else:
            logger.warning("Claim %s verified but could not be persisted", claim_code)

        return result

    def get_claim(self, claim_id: str) -> dict | None:
        """Return a single claim by its public identifier."""
        return self._db.get_claim_by_id(claim_id)

    def get_history(self) -> list[dict]:
        """
        Return all stored claims, newest first.

        Returns an empty list when the table has no rows or when
        the query fails (graceful degradation).
        """
        return self._db.get_all_claims()
