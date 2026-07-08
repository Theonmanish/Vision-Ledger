"""
API route definitions.

Every endpoint lives in this single module.  As the project grows
you may split into sub-routers (e.g. ``/api/v1/upload``) and mount
them together — the pattern is already compatible with that.
"""

from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile, Depends

from app.core.config import settings
from app.schemas.claims import (
    StatusResponse,
    HealthResponse,
    UploadResponse,
    VerifyResponse,
    HistoryResponse,
)
from app.services.storage_service import StorageService
from app.services.claim_service import ClaimService

# -- Router --

router = APIRouter()


# -- Dependency-injected services --

def _storage_service() -> StorageService:
    """Yield a fresh StorageService per request."""
    return StorageService()


def _claim_service() -> ClaimService:
    """Yield a fresh ClaimService per request."""
    return ClaimService()


# Type aliases for cleaner injection signatures.
StorageDep = Annotated[StorageService, Depends(_storage_service)]
ClaimDep = Annotated[ClaimService, Depends(_claim_service)]


# -- GET / --

@router.get(
    "/",
    response_model=StatusResponse,
    summary="Service status",
    description="Confirm the backend is reachable and identify itself.",
)
async def root() -> StatusResponse:
    return StatusResponse(
        status="ok",
        service=settings.APP_NAME,
    )


# -- GET /health --

@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Lightweight liveness probe — always returns 200.",
)
async def health() -> HealthResponse:
    return HealthResponse()


# -- POST /upload --

@router.post(
    "/upload",
    response_model=UploadResponse,
    summary="Upload evidence image",
    description=(
        "Accept a multipart image upload and store it in the "
        "Supabase Storage *evidence* bucket. "
        "Allowed types: JPEG, PNG, WebP, GIF."
    ),
    responses={
        422: {"description": "Unsupported file type"},
        500: {"description": "Upload failed"},
    },
)
async def upload(
    file: UploadFile = File(..., description="Evidence image file"),
    storage: StorageDep = StorageService(),
) -> UploadResponse:
    """
    Validate the MIME type, upload to Supabase Storage, and
    return the public URL of the stored image.
    """
    result = storage.upload_image(
        file_data=file.file,
        filename=file.filename or "unknown.jpg",
        content_type=file.content_type,
    )
    return UploadResponse(**result)


# -- POST /verify --

@router.post(
    "/verify",
    response_model=VerifyResponse,
    summary="Verify a claim",
    description=(
        "Submit a claim with an image URL for AI-based verification. "
        "The Fireworks AI model analyses the image and returns a "
        "structured assessment including confidence score, detected "
        "objects, and a recommendation."
    ),
    responses={
        502: {"description": "AI returned an invalid response"},
        503: {"description": "AI service unavailable"},
    },
)
async def verify(
    claim_type: str = Form(..., description="Type of the claim"),
    description: str = Form(..., description="Description of the claim"),
    image_url: str = Form(..., description="Public URL of the uploaded image"),
    claims: ClaimDep = ClaimService(),
) -> VerifyResponse:
    result = claims.verify(
        claim_type=claim_type,
        description=description,
        image_url=image_url,
    )
    return VerifyResponse(**result)


# -- GET /history --

@router.get(
    "/history",
    response_model=HistoryResponse,
    summary="Claim history",
    description="Return all stored claims, ordered newest-first.",
)
async def history(
    claims: ClaimDep = ClaimService(),
) -> HistoryResponse:
    all_claims = claims.get_history()
    return HistoryResponse(claims=all_claims, count=len(all_claims))
