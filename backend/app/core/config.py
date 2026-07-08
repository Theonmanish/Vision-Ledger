"""
Application settings loaded from environment variables.

Uses pydantic-settings for validation so that missing required
variables raise a clear startup error rather than a cryptic 500
mid-request.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralised configuration backed by the .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Supabase ──────────────────────────────────────────────
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_BUCKET: str = "evidence"

    # ── Application ───────────────────────────────────────────
    APP_NAME: str = "VisionLedger Backend"
    DEBUG: bool = False


# Singleton — import this wherever settings are needed.
settings = Settings()
