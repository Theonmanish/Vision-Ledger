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
    CORS_ORIGINS: str = (
        "http://localhost:5173,http://localhost:3000,"
        "http://127.0.0.1:5173,http://127.0.0.1:3000"
    )

    @property
    def cors_origin_list(self) -> list[str]:
        """Parse comma-separated CORS origins."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


# Singleton — import this wherever settings are needed.
settings = Settings()
