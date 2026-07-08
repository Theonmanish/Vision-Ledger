"""
Structured error helpers.

Every API error is wrapped in a consistent JSON shape so the
frontend (and any future integration) can reliably parse failures.
"""

from fastapi import HTTPException, status


class AppException(HTTPException):
    """
    Base application exception that carries a structured body.

    Example response body:
        {
            "error": {
                "code": "UPLOAD_FAILED",
                "message": "Could not store the uploaded file."
            }
        }
    """

    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
    ) -> None:
        self.code = code
        self.message = message
        detail = {"error": {"code": code, "message": message}}
        super().__init__(status_code=status_code, detail=detail)


# ── Pre-built convenience exceptions ──────────────────────────

def not_found(resource: str = "Resource") -> AppException:
    """404 — requested entity does not exist."""
    return AppException(
        status.HTTP_404_NOT_FOUND,
        "NOT_FOUND",
        f"{resource} not found.",
    )


def bad_request(message: str, code: str = "BAD_REQUEST") -> AppException:
    """400 — client sent invalid data."""
    return AppException(status.HTTP_400_BAD_REQUEST, code, message)


def upload_failed(message: str = "File upload failed.") -> AppException:
    """500 — upstream storage issue."""
    return AppException(
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        "UPLOAD_FAILED",
        message,
    )


def unsupported_file_type(file_type: str) -> AppException:
    """422 — image MIME type is not in the allow-list."""
    return AppException(
        status.HTTP_422_UNPROCESSABLE_ENTITY,
        "UNSUPPORTED_FILE_TYPE",
        f"File type '{file_type}' is not supported. "
        "Allowed types: JPEG, PNG, WebP, GIF.",
    )
