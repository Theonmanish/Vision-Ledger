"""
Pydantic schemas for notification API request/response payloads.
"""

from pydantic import BaseModel, Field
from typing import Any


class NotificationResponse(BaseModel):
    """Single notification response."""
    id: str
    user_id: str
    title: str
    message: str
    notification_type: str = Field(..., max_length=50)
    claim_id: str | None = None
    batch_id: str | None = None
    action_url: str | None = Field(None, max_length=2048)
    is_read: bool
    created_at: str


class NotificationListResponse(BaseModel):
    """Response for listing notifications."""
    notifications: list[NotificationResponse]
    count: int
    has_more: bool


class UnreadCountResponse(BaseModel):
    """Response for unread count."""
    count: int


class MarkReadResponse(BaseModel):
    """Response for mark as read operations."""
    success: bool
