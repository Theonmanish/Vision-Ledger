"""
Batch verification service for processing multiple images sequentially.

Orchestrates the bulk verification workflow:
1. Creates a batch record
2. Processes images one at a time
3. Tracks progress and handles failures
4. Updates batch statistics
5. Creates notifications for batch events
"""

import logging
from datetime import datetime, timezone
from typing import Any

from app.services.claim_service import ClaimService
from app.services.storage_service import StorageService
from app.services.supabase_service import SupabaseService
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)


class BatchService:
    """
    Manages batch verification workflows.

    Processes multiple images sequentially, reusing existing services
    for upload and verification.
    """

    def __init__(
        self,
        db: SupabaseService | None = None,
        claim_service: ClaimService | None = None,
        storage_service: StorageService | None = None,
        notification_service: NotificationService | None = None,
    ) -> None:
        self._db: SupabaseService = db or SupabaseService()
        self._claim_service: ClaimService = claim_service or ClaimService()
        self._storage: StorageService = storage_service or StorageService()
        self._notifications: NotificationService = notification_service or NotificationService()

    def create_batch_from_urls(
        self,
        user_id: str,
        project_name: str | None,
        images: list[dict[str, str]],
    ) -> dict[str, Any]:
        """
        Create a new batch and process all images sequentially.

        Args:
            user_id: The authenticated user's ID
            project_name: Optional project name for the batch
            images: List of dicts with keys:
                - image_url: str (already uploaded image URL)
                - claim_type: str
                - description: str

        Returns:
            Batch summary dict with results for each image
        """
        # Create batch record
        batch_id = self._create_batch_record(user_id, project_name, len(images))

        results = []
        completed = 0
        failed = 0
        total_confidence = 0.0

        # Process images sequentially
        for idx, image_data in enumerate(images):
            try:
                logger.info(
                    f"Processing image {idx + 1}/{len(images)} for batch {batch_id}"
                )

                # Verify claim using existing image URL
                verification_result = self._claim_service.verify(
                    claim_type=image_data["claim_type"],
                    description=image_data["description"],
                    image_url=image_data["image_url"],
                    user_id=user_id,
                    user_email=None,
                )

                # Link claim to batch
                claim_id = verification_result.get("claimId")
                if claim_id:
                    self._link_claim_to_batch(claim_id, batch_id)

                # Track success
                confidence = verification_result.get("confidence", 0)
                total_confidence += confidence
                completed += 1

                results.append({
                    "index": idx,
                    "filename": None,  # No filename for URL-based uploads
                    "claim_id": claim_id,
                    "status": "success",
                    "confidence": confidence,
                    "error": None,
                })

            except Exception as e:
                logger.error(
                    f"Failed to process image {idx + 1} in batch {batch_id}: {e}"
                )
                failed += 1
                results.append({
                    "index": idx,
                    "filename": None,
                    "claim_id": None,
                    "status": "failed",
                    "confidence": None,
                    "error": str(e),
                })

        # Update batch with final statistics
        avg_confidence = (total_confidence / completed * 100) if completed > 0 else 0
        batch_status = "completed" if failed == 0 else "partial" if completed > 0 else "failed"

        self._update_batch_record(
            batch_id=batch_id,
            completed_images=completed,
            failed_images=failed,
            average_confidence=avg_confidence,
            status=batch_status,
        )

        # Create batch completion notification (non-blocking, best-effort)
        try:
            self._notifications.notify_batch_completed(
                user_id=user_id,
                batch_id=batch_id,
                project_name=project_name or "Unnamed Batch",
                completed=completed,
                total=len(images),
            )
        except Exception as e:
            logger.warning(f"Failed to create batch notification: {e}")

        return {
            "batch_id": batch_id,
            "project_name": project_name,
            "total_images": len(images),
            "completed_images": completed,
            "failed_images": failed,
            "average_confidence": avg_confidence,
            "status": batch_status,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "results": results,
        }

    def get_batch(self, batch_id: str, user_id: str) -> dict[str, Any] | None:
        """
        Get batch details with all associated claims.

        Args:
            batch_id: The batch UUID
            user_id: The authenticated user's ID (for authorization)

        Returns:
            Batch dict with claims list, or None if not found/unauthorized
        """
        # Get batch record
        batch = self._get_batch_by_id(batch_id)
        if not batch:
            return None

        # Verify ownership
        if batch.get("user_id") != user_id:
            return None

        # Get all claims for this batch
        claims = self._get_claims_by_batch_id(batch_id)

        return {
            **batch,
            "claims": claims,
        }

    def get_user_batches(self, user_id: str) -> list[dict[str, Any]]:
        """
        Get all batches for a user.

        Args:
            user_id: The authenticated user's ID

        Returns:
            List of batch dicts
        """
        return self._get_batches_by_user_id(user_id)

    # ── Private Methods ─────────────────────────────────────────

    def _create_batch_record(
        self,
        user_id: str,
        project_name: str | None,
        total_images: int,
    ) -> str:
        """Create a new batch record in the database."""
        import uuid

        batch_id = str(uuid.uuid4())
        payload = {
            "id": batch_id,
            "user_id": user_id,
            "project_name": project_name,
            "total_images": total_images,
            "completed_images": 0,
            "failed_images": 0,
            "average_confidence": 0,
            "status": "processing",
        }

        self._db.insert_row("batches", payload)
        return batch_id

    def _update_batch_record(
        self,
        batch_id: str,
        completed_images: int,
        failed_images: int,
        average_confidence: float,
        status: str,
    ) -> None:
        """Update batch record with final statistics."""
        self._db.update_row(
            "batches",
            {"id": batch_id},
            {
                "completed_images": completed_images,
                "failed_images": failed_images,
                "average_confidence": average_confidence,
                "status": status,
            },
        )

    def _link_claim_to_batch(self, claim_id: str, batch_id: str) -> None:
        """Link a claim to its batch."""
        self._db.update_row(
            "claims",
            {"id": claim_id},
            {"batch_id": batch_id},
        )

    def _get_batch_by_id(self, batch_id: str) -> dict[str, Any] | None:
        """Get a batch by ID."""
        rows = self._db.get_rows("batches", {"id": batch_id})
        return rows[0] if rows else None

    def _get_batches_by_user_id(self, user_id: str) -> list[dict[str, Any]]:
        """Get all batches for a user."""
        return self._db.get_rows("batches", {"user_id": user_id}, order="created_at")

    def _get_claims_by_batch_id(self, batch_id: str) -> list[dict[str, Any]]:
        """Get all claims for a batch."""
        return self._db.get_rows("claims", {"batch_id": batch_id}, order="created_at")
