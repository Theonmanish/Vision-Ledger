"""
API route definitions.

Every endpoint lives in this single module.  As the project grows
you may split into sub-routers (e.g. ``/api/v1/upload``) and mount
them together — the pattern is already compatible with that.
"""

import logging
from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse

from app.core.config import settings
from app.core.limiter import limiter
from app.schemas.claims import (
    StatusResponse,
    HealthResponse,
    UploadResponse,
    VerifyResponse,
    HistoryResponse,
    ClaimDetailResponse,
    CertificateRequest,
    BatchCreateRequest,
    BatchResponse,
    BatchListResponse,
)
from app.schemas.notifications import (
    NotificationResponse,
    NotificationListResponse,
    UnreadCountResponse,
    MarkReadResponse,
)
from app.services.storage_service import StorageService
from app.services.claim_service import ClaimService
from app.services.certificate_service import CertificateService
from app.services.batch_service import BatchService
from app.services.notification_service import NotificationService
from app.core.errors import not_found
from app.core.auth import get_current_user

logger = logging.getLogger(__name__)

# -- Router --

router = APIRouter()


# -- Dependency-injected services --

def _storage_service() -> StorageService:
    """Yield a fresh StorageService per request."""
    return StorageService()


def _claim_service() -> ClaimService:
    """Yield a fresh ClaimService per request."""
    return ClaimService()


def _certificate_service() -> CertificateService:
    """Yield a fresh CertificateService per request."""
    return CertificateService()


def _batch_service() -> BatchService:
    """Yield a fresh BatchService per request."""
    return BatchService()


def _notification_service() -> NotificationService:
    """Yield a fresh NotificationService per request."""
    return NotificationService()


# Type aliases for cleaner injection signatures.
StorageDep = Annotated[StorageService, Depends(_storage_service)]
ClaimDep = Annotated[ClaimService, Depends(_claim_service)]
CertificateDep = Annotated[CertificateService, Depends(_certificate_service)]
BatchDep = Annotated[BatchService, Depends(_batch_service)]
NotificationDep = Annotated[NotificationService, Depends(_notification_service)]


# -- GET / --

@router.get(
    "/",
    response_model=StatusResponse,
    summary="Service status",
    description="Confirm the backend is reachable and identify itself.",
)
@limiter.limit("60/minute")
async def root(request: Request) -> StatusResponse:
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
@limiter.limit("60/minute")
async def health(request: Request) -> HealthResponse:
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
        401: {"description": "Not authenticated"},
        422: {"description": "Unsupported file type"},
        500: {"description": "Upload failed"},
    },
)
@limiter.limit("20/minute")
async def upload(
    request: Request,
    storage: StorageDep,
    current_user: dict = Depends(get_current_user),
    file: UploadFile = File(..., description="Evidence image file"),
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
        401: {"description": "Not authenticated"},
        502: {"description": "AI returned an invalid response"},
        503: {"description": "AI service unavailable"},
    },
)
@limiter.limit("10/minute")
async def verify(
    request: Request,
    claims: ClaimDep,
    current_user: dict = Depends(get_current_user),
    claim_type: str = Form(..., max_length=100, description="Type of the claim"),
    description: str = Form(..., max_length=5000, description="Description of the claim"),
    image_url: str = Form(..., max_length=2048, description="Public URL of the uploaded image"),
) -> VerifyResponse:
    result = claims.verify(
        claim_type=claim_type,
        description=description,
        image_url=image_url,
        user_id=current_user["id"],
        user_email=current_user["email"],
    )
    return VerifyResponse(**result)


# -- GET /history --

@router.get(
    "/history",
    response_model=HistoryResponse,
    summary="Claim history",
    description="Return all stored claims for the authenticated user, ordered newest-first.",
    responses={
        401: {"description": "Not authenticated"},
    },
)
@limiter.limit("60/minute")
async def history(
    request: Request,
    claims: ClaimDep,
    current_user: dict = Depends(get_current_user),
) -> HistoryResponse:
    all_claims = claims.get_history(user_id=current_user["id"])
    return HistoryResponse(claims=all_claims, count=len(all_claims))


# -- GET /claims/{claim_id} --

@router.get(
    "/claims/{claim_id}",
    response_model=ClaimDetailResponse,
    summary="Get claim by ID",
    description="Return full details for a single verification record.",
    responses={
        401: {"description": "Not authenticated"},
        403: {"description": "Forbidden - not the owner"},
        404: {"description": "Claim not found"},
    },
)
@limiter.limit("60/minute")
async def get_claim(
    request: Request,
    claim_id: str,
    claims: ClaimDep,
    current_user: dict = Depends(get_current_user),
) -> ClaimDetailResponse:
    claim = claims.get_claim(claim_id)
    if not claim:
        raise not_found("Claim")

    if claim.get("user_id") != current_user["id"]:
        logger.warning(
            "security_event=unauthorized_access_attempt "
            "claim_id=%s user_id=%s",
            claim_id,
            current_user["id"],
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this claim",
        )

    return ClaimDetailResponse(**claim)


# -- POST /certificate --

@router.post(
    "/certificate",
    summary="Generate verification certificate",
    description=(
        "Generate and download a PDF certificate for the given claim. "
        "Returns application/pdf with Content-Disposition attachment."
    ),
    responses={
        401: {"description": "Not authenticated"},
        403: {"description": "Forbidden - not the owner"},
        404: {"description": "Claim not found"},
    },
)
async def certificate(
    body: CertificateRequest,
    claims: ClaimDep,
    cert_service: CertificateDep,
    current_user: dict = Depends(get_current_user),
) -> StreamingResponse:
    claim = claims.get_claim(body.claim_id)
    if not claim:
        raise not_found("Claim")
    if claim.get("user_id") != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this claim",
        )

    pdf_bytes, filename = cert_service.generate(claim)
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


# -- POST /batches --

@router.post(
    "/batches",
    response_model=BatchResponse,
    summary="Create batch verification",
    description=(
        "Submit multiple pre-uploaded images for sequential verification. "
        "Images must be uploaded first via /upload endpoint. "
        "Returns batch summary with results for each image."
    ),
    responses={
        401: {"description": "Not authenticated"},
        422: {"description": "Invalid request (too many images, invalid data)"},
    },
)
@limiter.limit("5/minute")
async def create_batch(
    request: Request,
    batch_service: BatchDep,
    current_user: dict = Depends(get_current_user),
    body: BatchCreateRequest = ...,
) -> BatchResponse:
    """
    Create a batch verification job.

    Accepts a list of image URLs (already uploaded) with their claim types
    and descriptions. Processes them sequentially.
    """
    # Validate limits
    if len(body.images) > 10:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Maximum 10 images per batch",
        )

    if len(body.images) == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one image is required",
        )

    # Process batch
    result = batch_service.create_batch_from_urls(
        user_id=current_user["id"],
        project_name=body.project_name,
        images=[
            {
                "image_url": img.image_url,
                "claim_type": img.claim_type,
                "description": img.description,
            }
            for img in body.images
        ],
    )

    return BatchResponse(**result)


# -- GET /batches --

@router.get(
    "/batches",
    response_model=BatchListResponse,
    summary="List user batches",
    description="Return all verification batches for the authenticated user.",
    responses={
        401: {"description": "Not authenticated"},
    },
)
@limiter.limit("60/minute")
async def list_batches(
    request: Request,
    batch_service: BatchDep,
    current_user: dict = Depends(get_current_user),
) -> BatchListResponse:
    batches = batch_service.get_user_batches(user_id=current_user["id"])
    return BatchListResponse(batches=batches, count=len(batches))


# -- GET /batches/{batch_id} --

@router.get(
    "/batches/{batch_id}",
    response_model=BatchResponse,
    summary="Get batch details",
    description="Return full details for a verification batch including all claims.",
    responses={
        401: {"description": "Not authenticated"},
        403: {"description": "Forbidden - not the owner"},
        404: {"description": "Batch not found"},
    },
)
@limiter.limit("60/minute")
async def get_batch(
    request: Request,
    batch_id: str,
    batch_service: BatchDep,
    current_user: dict = Depends(get_current_user),
) -> BatchResponse:
    batch = batch_service.get_batch(batch_id=batch_id, user_id=current_user["id"])
    if not batch:
        raise not_found("Batch")

    return BatchResponse(**batch)


# -- Notification Endpoints --

# -- GET /notifications --

@router.get(
    "/notifications",
    response_model=NotificationListResponse,
    summary="List notifications",
    description="Return notifications for the authenticated user with optional filtering.",
    responses={
        401: {"description": "Not authenticated"},
    },
)
@limiter.limit("60/minute")
async def list_notifications(
    request: Request,
    notification_service: NotificationDep,
    current_user: dict = Depends(get_current_user),
    limit: int = 30,
    offset: int = 0,
    type: str | None = None,
) -> NotificationListResponse:
    notifications = notification_service.get_notifications(
        user_id=current_user["id"],
        limit=limit,
        offset=offset,
        notification_type=type,
    )
    # Check if there are more notifications
    all_notifications = notification_service.get_notifications(
        user_id=current_user["id"],
        limit=limit + 1,
        offset=offset,
        notification_type=type,
    )
    has_more = len(all_notifications) > limit

    return NotificationListResponse(
        notifications=[NotificationResponse(**n) for n in notifications],
        count=len(notifications),
        has_more=has_more,
    )


# -- GET /notifications/unread-count --

@router.get(
    "/notifications/unread-count",
    response_model=UnreadCountResponse,
    summary="Get unread notification count",
    description="Return the count of unread notifications for the authenticated user.",
    responses={
        401: {"description": "Not authenticated"},
    },
)
@limiter.limit("60/minute")
async def get_unread_count(
    request: Request,
    notification_service: NotificationDep,
    current_user: dict = Depends(get_current_user),
) -> UnreadCountResponse:
    count = notification_service.get_unread_count(user_id=current_user["id"])
    return UnreadCountResponse(count=count)


# -- PATCH /notifications/{notification_id}/read --

@router.patch(
    "/notifications/{notification_id}/read",
    response_model=MarkReadResponse,
    summary="Mark notification as read",
    description="Mark a single notification as read.",
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "Notification not found"},
    },
)
@limiter.limit("60/minute")
async def mark_notification_read(
    request: Request,
    notification_id: str,
    notification_service: NotificationDep,
    current_user: dict = Depends(get_current_user),
) -> MarkReadResponse:
    success = notification_service.mark_as_read(
        notification_id=notification_id,
        user_id=current_user["id"],
    )
    if not success:
        raise not_found("Notification")
    return MarkReadResponse(success=True)


# -- PATCH /notifications/read-all --

@router.patch(
    "/notifications/read-all",
    response_model=MarkReadResponse,
    summary="Mark all notifications as read",
    description="Mark all notifications as read for the authenticated user.",
    responses={
        401: {"description": "Not authenticated"},
    },
)
@limiter.limit("30/minute")
async def mark_all_read(
    request: Request,
    notification_service: NotificationDep,
    current_user: dict = Depends(get_current_user),
) -> MarkReadResponse:
    notification_service.mark_all_as_read(user_id=current_user["id"])
    return MarkReadResponse(success=True)


# -- DELETE /notifications/read --

@router.delete(
    "/notifications/read",
    response_model=MarkReadResponse,
    summary="Clear read notifications",
    description="Delete all read notifications for the authenticated user.",
    responses={
        401: {"description": "Not authenticated"},
    },
)
@limiter.limit("30/minute")
async def clear_read_notifications(
    request: Request,
    notification_service: NotificationDep,
    current_user: dict = Depends(get_current_user),
) -> MarkReadResponse:
    notification_service.clear_read_notifications(user_id=current_user["id"])
    return MarkReadResponse(success=True)
