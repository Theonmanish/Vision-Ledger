"""
Claim service — manages insurance-claim lifecycle records.

Responsibilities:
  * Generate unique claim IDs.
  * Invoke the AI verification service.
  * Anchor verification proof on-chain (best-effort).
  * Persist claim metadata to Supabase.
  * Retrieve full claim history.
"""

import logging
from datetime import datetime, timezone

from app.services.ai_service import AIService
from app.services.blockchain_service import (
    BlockchainService,
    BlockchainResult,
    generate_verification_hash,
)
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
        blockchain: BlockchainService | None = None,
    ) -> None:
        self._db: SupabaseService = db or SupabaseService()
        self._ai: AIService = ai or AIService()
        self._blockchain: BlockchainService = blockchain or BlockchainService()

    def verify(
        self,
        claim_type: str,
        description: str,
        image_url: str,
        user_id: str | None = None,
        user_email: str | None = None,
        batch_id: str | None = None,
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

        # Determine status based on verification_confidence
        verification_confidence = ai_result.verification_confidence
        if verification_confidence >= 90:
            status = "Verified"
        elif verification_confidence >= 75:
            status = "Likely Verified"
        elif verification_confidence >= 50:
            status = "Needs Review"
        elif verification_confidence >= 25:
            status = "Inconclusive"
        else:
            status = "Rejected"

        # ── Blockchain anchor (best-effort, never breaks AI flow) ──
        timestamp = datetime.now(timezone.utc).isoformat()
        verification_hash = generate_verification_hash(
            claim_id=claim_code,
            claim_type=claim_type,
            description=description,
            image_url=image_url,
            confidence=ai_result.confidence,
            timestamp=timestamp,
        )
        anchor = self._blockchain.anchor_verification(
            verification_hash=verification_hash,
        )

        if anchor.status == "Confirmed":
            tx_hash = anchor.transaction_hash
            logger.info(
                "Claim %s anchored on %s — tx %s",
                claim_code,
                anchor.network,
                tx_hash,
            )
        else:
            # AI verification succeeded; blockchain will be retried later.
            tx_hash = placeholder_tx_hash(claim_code)
            logger.warning(
                "Claim %s blockchain anchor pending: %s",
                claim_code,
                anchor.error,
            )

        result = {
            "claimId": claim_code,
            "status": status,
            "confidence": ai_result.confidence,
            "vision_confidence": ai_result.vision_confidence,
            "claim_match_confidence": ai_result.claim_match_confidence,
            "verification_confidence": ai_result.verification_confidence,
            "reason": ai_result.reason,
            "claim_supported": ai_result.claim_supported,
            "objects_detected": ai_result.objects_detected,
            "estimated_quantity": ai_result.estimated_quantity,
            "limitations": ai_result.limitations,
            "recommendation": ai_result.recommendation,
            "blockchain_status": anchor.status,
        }

        # Build the blockchain dict for the Supabase payload. It is
        # written to both claim_input JSON (always) and typed columns
        # (when migration 001 is applied).
        blockchain_payload: dict = {
            "verification_hash": anchor.verification_hash,
            "transaction_hash": tx_hash,
            "block_number": anchor.block_number,
            "contract_address": anchor.contract_address,
            "network": anchor.network,
            "anchor_time": anchor.anchor_time,
            "status": anchor.status,
        }
        if anchor.transaction_hash and anchor.status == "Confirmed":
            from app.core.config import settings

            blockchain_payload["explorer_url"] = (
                f"{settings.ETHERSCAN_BASE_URL}/tx/{anchor.transaction_hash}"
            )

        payload = build_claim_payload(
            claim_code=claim_code,
            claim_type=claim_type,
            description=description,
            image_url=image_url,
            status=status,
            confidence=ai_result.confidence,
            reason=ai_result.reason,
            tx_hash=tx_hash,
            claim_supported=ai_result.claim_supported,
            objects_detected=ai_result.objects_detected,
            estimated_quantity=ai_result.estimated_quantity,
            limitations=ai_result.limitations,
            recommendation=ai_result.recommendation,
            blockchain=blockchain_payload,
            user_id=user_id,
            user_email=user_email,
            vision_confidence=ai_result.vision_confidence,
            claim_match_confidence=ai_result.claim_match_confidence,
            verification_confidence=ai_result.verification_confidence,
        )

        saved = self._db.create_claim(payload)

        if saved:
            normalized = normalize_claim_record(saved)
            result["claimId"] = normalized["claim_id"]
        else:
            logger.warning("Claim %s verified but could not be persisted", claim_code)

        return result

    def get_claim(self, claim_id: str) -> dict | None:
        """Return a single claim by its public identifier."""
        return self._db.get_claim_by_id(claim_id)

    def get_history(self, user_id: str | None = None) -> list[dict]:
        """
        Return all stored claims, newest first.

        If user_id is provided, only returns claims belonging to that user.
        Returns an empty list when the table has no rows or when
        the query fails (graceful degradation).
        """
        return self._db.get_all_claims(user_id=user_id)
