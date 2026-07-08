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

    # ── Fireworks AI ──────────────────────────────────────────
    FIREWORKS_API_KEY: str
    FIREWORKS_BASE_URL: str = "https://api.fireworks.ai/inference/v1"
    MODEL_NAME: str = "accounts/fireworks/models/qwen3p7-plus"

    # ── Application ───────────────────────────────────────────
    APP_NAME: str = "VisionLedger Backend"
    DEBUG: bool = False


# Singleton — import this wherever settings are needed.
settings = Settings()
