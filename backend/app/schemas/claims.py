"""
Pydantic schemas for API request / response payloads.

These are the *transport-layer* DTOs — they validate what enters
and leaves the HTTP boundary.  Internal domain models live in
``app.models`` (added later if SQLAlchemy is introduced).
"""

from pydantic import BaseModel, Field
from typing import Any


# ── Root / Health ─────────────────────────────────────────────

class StatusResponse(BaseModel):
    status: str = Field(..., example="ok")
    service: str = Field(..., example="VisionLedger Backend")


class HealthResponse(BaseModel):
    healthy: bool = True


# ── Upload ───────────────────────────────────────────────────

class UploadResponse(BaseModel):
    """Returned after a successful image upload to storage."""
    imageUrl: str
    fileName: str


# ── Verify ───────────────────────────────────────────────────

class VerifyResponse(BaseModel):
    """Returned by the /verify endpoint (AI not yet connected)."""
    claimId: str
    status: str
    confidence: float
    reason: str


# ── History ───────────────────────────────────────────────────

class HistoryResponse(BaseModel):
    """Wrapper for the list of stored claims."""
    claims: list[dict[str, Any]]
    count: int
