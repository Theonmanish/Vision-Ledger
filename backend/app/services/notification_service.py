"""
Notification service for managing in-app notifications.

Handles creation, retrieval, and management of user notifications
for verification events, certificates, blockchain anchors, and batches.
"""

import logging
from datetime import datetime, timezone
from typing import Any

from app.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Manages user notifications.

    Creates notifications for verification events and provides
    methods to retrieve and manage them.
    """

    def __init__(self, db: SupabaseService | None = None) -> None:
        self._db: SupabaseService = db or SupabaseService()

    def create_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        notification_type: str,
        claim_id: str | None = None,
        batch_id: str | None = None,
        action_url: str | None = None,
    ) -> dict[str, Any] | None:
        """
        Create a new notification for a user.

        Args:
            user_id: The user to notify
            title: Notification title
            message: Notification message
            notification_type: Type of notification
            claim_id: Optional associated claim ID
            batch_id: Optional associated batch ID
            action_url: Optional URL for action button

        Returns:
            Created notification dict or None on failure
        """
        payload = {
            "user_id": user_id,
            "title": title,
            "message": message,
            "notification_type": notification_type,
            "claim_id": claim_id,
            "batch_id": batch_id,
            "action_url": action_url,
            "is_read": False,
        }

        try:
            result = self._db.insert_row("notifications", payload)
            if result:
                logger.info(f"Created notification for user {user_id}: {notification_type}")
            return result
        except Exception as e:
            logger.error(f"Failed to create notification: {e}")
            return None

    def get_notifications(
        self,
        user_id: str,
        limit: int = 30,
        offset: int = 0,
        notification_type: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Get notifications for a user with optional filtering.

        Args:
            user_id: The user's ID
            limit: Number of notifications to return (default 30)
            offset: Pagination offset
            notification_type: Optional filter by type

        Returns:
            List of notification dicts
        """
        filters = {"user_id": user_id}
        if notification_type:
            filters["notification_type"] = notification_type

        return self._db.get_rows(
            "notifications",
            filters,
            columns="*",
            order="created_at",
        )[offset:offset + limit]

    def get_unread_count(self, user_id: str) -> int:
        """
        Get count of unread notifications for a user.

        Args:
            user_id: The user's ID

        Returns:
            Number of unread notifications
        """
        try:
            response = (
                self._db._client.table("notifications")
                .select("id", count="exact")
                .eq("user_id", user_id)
                .eq("is_read", False)
                .execute()
            )
            return response.count if response.count is not None else 0
        except Exception as e:
            logger.error(f"Failed to get unread count: {e}")
            return 0

    def mark_as_read(self, notification_id: str, user_id: str) -> bool:
        """
        Mark a single notification as read.

        Args:
            notification_id: The notification ID
            user_id: The user's ID (for authorization)

        Returns:
            True if successful, False otherwise
        """
        try:
            result = self._db.update_row(
                "notifications",
                {"id": notification_id, "user_id": user_id},
                {"is_read": True},
            )
            return result is not None
        except Exception as e:
            logger.error(f"Failed to mark notification as read: {e}")
            return False

    def mark_all_as_read(self, user_id: str) -> bool:
        """
        Mark all notifications as read for a user.

        Args:
            user_id: The user's ID

        Returns:
            True if successful, False otherwise
        """
        try:
            response = (
                self._db._client.table("notifications")
                .update({"is_read": True})
                .eq("user_id", user_id)
                .eq("is_read", False)
                .execute()
            )
            return True
        except Exception as e:
            logger.error(f"Failed to mark all as read: {e}")
            return False

    def clear_read_notifications(self, user_id: str) -> bool:
        """
        Delete all read notifications for a user.

        Args:
            user_id: The user's ID

        Returns:
            True if successful, False otherwise
        """
        try:
            response = (
                self._db._client.table("notifications")
                .delete()
                .eq("user_id", user_id)
                .eq("is_read", True)
                .execute()
            )
            return True
        except Exception as e:
            logger.error(f"Failed to clear read notifications: {e}")
            return False

    # ── Convenience Methods for Event Types ─────────────────────

    def notify_verification_started(
        self, user_id: str, claim_id: str, claim_type: str
    ) -> dict[str, Any] | None:
        """Create notification for verification started."""
        return self.create_notification(
            user_id=user_id,
            title="Verification Started",
            message=f"Your {claim_type} verification has started.",
            notification_type="verification_started",
            claim_id=claim_id,
            action_url=f"/results/{claim_id}",
        )

    def notify_verification_completed(
        self, user_id: str, claim_id: str, claim_type: str, status: str
    ) -> dict[str, Any] | None:
        """Create notification for verification completed."""
        if status == "Verified":
            message = f"{claim_type} verification completed successfully."
            notif_type = "verification_completed"
        elif status == "Needs Review":
            message = "Verification completed but requires manual review."
            notif_type = "verification_review"
        else:
            message = f"{claim_type} verification completed with status: {status}."
            notif_type = "verification_completed"

        return self.create_notification(
            user_id=user_id,
            title="Verification Completed",
            message=message,
            notification_type=notif_type,
            claim_id=claim_id,
            action_url=f"/results/{claim_id}",
        )

    def notify_verification_failed(
        self, user_id: str, claim_id: str, claim_type: str
    ) -> dict[str, Any] | None:
        """Create notification for verification failed."""
        return self.create_notification(
            user_id=user_id,
            title="Verification Failed",
            message=f"{claim_type} verification failed. Tap to retry.",
            notification_type="verification_failed",
            claim_id=claim_id,
            action_url=f"/verify",
        )

    def notify_certificate_generated(
        self, user_id: str, claim_id: str
    ) -> dict[str, Any] | None:
        """Create notification for certificate generated."""
        return self.create_notification(
            user_id=user_id,
            title="Certificate Generated",
            message="Your verification certificate is ready.",
            notification_type="certificate_generated",
            claim_id=claim_id,
            action_url=f"/results/{claim_id}",
        )

    def notify_blockchain_anchored(
        self, user_id: str, claim_id: str, network: str
    ) -> dict[str, Any] | None:
        """Create notification for blockchain anchored."""
        return self.create_notification(
            user_id=user_id,
            title="Blockchain Anchored",
            message=f"Verification successfully anchored on {network}.",
            notification_type="blockchain_anchored",
            claim_id=claim_id,
            action_url=f"/results/{claim_id}",
        )

    def notify_batch_completed(
        self, user_id: str, batch_id: str, project_name: str, completed: int, total: int
    ) -> dict[str, Any] | None:
        """Create notification for batch completed."""
        return self.create_notification(
            user_id=user_id,
            title="Bulk Verification Completed",
            message=f"Batch '{project_name}' completed: {completed}/{total} images verified.",
            notification_type="batch_completed",
            batch_id=batch_id,
            action_url=f"/history",
        )
