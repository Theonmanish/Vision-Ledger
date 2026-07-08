"""
Domain-level constants used across services.

Centralised here so every module references a single source of
truth for magic strings.
"""

# Allowed MIME types for evidence image uploads.
ALLOWED_IMAGE_TYPES: set[str] = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}

# Human-readable label (used in error messages).
ALLOWED_IMAGE_TYPE_LABELS: str = "JPEG, PNG, WebP, GIF"

# Supabase table name for claim records.
CLAIMS_TABLE: str = "claims"

# Columns returned when fetching claims (must match live Supabase schema).
CLAIM_COLUMNS: str = (
    "id, claim_type, description, image_url, status, confidence, reason, "
    "image_hash, report_hash, tx_hash, created_at, claim_input"
)
