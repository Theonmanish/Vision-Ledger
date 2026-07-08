"""
Storage service — handles Supabase Storage bucket operations.

Responsibilities:
  • Validate incoming image MIME types.
  • Upload bytes to the configured Supabase Storage bucket.
  • Return a publicly-accessible URL for the uploaded object.
"""

import logging

from supabase import Client

from app.core.config import settings
from app.core.errors import unsupported_file_type, upload_failed
from app.db.supabase import supabase_client
from app.models.constants import ALLOWED_IMAGE_TYPES
from app.utils.helpers import sanitise_filename

logger = logging.getLogger(__name__)


class StorageService:
    """
    Manages file uploads to Supabase Storage.

    Inject a custom ``Client`` via the constructor for testing;
    the default uses the production singleton.
    """

    def __init__(self, client: Client | None = None) -> None:
        self._client: Client = client or supabase_client
        self._bucket: str = settings.SUPABASE_BUCKET

    def validate_image_type(self, content_type: str | None) -> None:
        """
        Raise ``AppException`` if *content_type* is not an
        allowed image MIME type.
        """
        if content_type not in ALLOWED_IMAGE_TYPES:
            raise unsupported_file_type(content_type or "unknown")

    def upload_image(
        self,
        file_data,
        filename: str,
        content_type: str,
    ) -> dict[str, str]:
        """
        Upload an image to the evidence bucket.

        Returns:
            ``{"imageUrl": "...", "fileName": "..."}``
        """
        self.validate_image_type(content_type)

        safe_name = sanitise_filename(filename)
        file_bytes = file_data.read()

        try:
            bucket = self._client.storage.from_(self._bucket)
            bucket.upload(
                safe_name,
                file_bytes,
                {
                    "content-type": content_type,
                    "upsert": "true",
                },
            )

            image_url = bucket.get_public_url(safe_name).rstrip("?")

            return {
                "imageUrl": image_url,
                "fileName": safe_name,
            }

        except Exception as exc:
            logger.exception("Supabase storage upload failed")
            raise upload_failed(str(exc))
