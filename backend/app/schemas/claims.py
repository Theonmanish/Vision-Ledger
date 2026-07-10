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


# ── Object Detection ─────────────────────────────────────────

class ObjectDetection(BaseModel):
    """Detected object with confidence score."""
    label: str
    confidence: int = Field(..., ge=0, le=100, description="Confidence score 0-100")


# ── Verify ───────────────────────────────────────────────────

class AIResult(BaseModel):
    """Structured output from the Fireworks AI model."""
    claim_supported: bool
    confidence: float = Field(..., ge=0.0, le=1.0)
    vision_confidence: int = Field(..., ge=0, le=100, description="How confidently the AI detected visual content (0-100)")
    claim_match_confidence: int = Field(..., ge=0, le=100, description="How strongly the detected scene supports the claim (0-100)")
    verification_confidence: int = Field(..., ge=0, le=100, description="Final verification confidence score (0-100)")
    objects_detected: list[dict[str, Any]] = Field(..., description="List of detected objects with label and confidence")
    estimated_quantity: int | None = None
    reason: str
    limitations: str
    recommendation: str


class VerifyResponse(BaseModel):
    """Returned by the /verify endpoint."""
    claimId: str
    status: str
    confidence: float
    vision_confidence: int
    claim_match_confidence: int
    verification_confidence: int
    reason: str
    claim_supported: bool
    objects_detected: list[ObjectDetection]
    estimated_quantity: int | None = None
    limitations: str
    recommendation: str
    blockchain_status: str | None = None


# ── History ───────────────────────────────────────────────────

class HistoryResponse(BaseModel):
    """Wrapper for the list of stored claims."""
    claims: list[dict[str, Any]]
    count: int


# ── Claim detail ──────────────────────────────────────────────

class ClaimDetailResponse(BaseModel):
    """Full claim record returned by GET /claims/{claim_id}."""
    id: str | None = None
    claim_id: str
    claim_type: str
    description: str | None = None
    status: str
    confidence: float
    vision_confidence: int | None = None
    claim_match_confidence: int | None = None
    verification_confidence: int | None = None
    reason: str | None = None
    image_url: str | None = None
    created_at: str | None = None
    claim_supported: bool | None = None
    objects_detected: list[ObjectDetection] | None = None
    estimated_quantity: int | None = None
    limitations: str | None = None
    recommendation: str | None = None
    # ── Blockchain proof ───────────────────────────────────────
    blockchain_hash: str | None = None
    transaction_hash: str | None = None
    block_number: int | None = None
    network: str | None = None
    verification_anchor_time: str | None = None
    blockchain_status: str | None = None
    contract_address: str | None = None
    explorer_url: str | None = None


# ── Certificate ─────────────────────────────────────────────

class CertificateRequest(BaseModel):
    """Body for POST /certificate."""
    claim_id: str = Field(..., min_length=1, description="Public claim identifier")
