"""
FastAPI application entry-point.

Creates the ``app`` instance, registers middleware, includes
routers, and exposes a lifespan context that initialises /
tears down resources once per server lifecycle.
"""

import logging
import time
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.errors import AppException
from app.core.limiter import limiter
from app.api.routes import router

logger = logging.getLogger(__name__)


# -- Lifespan -- one-time startup / shutdown hooks --

@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """
    Runs once when Uvicorn starts and once when it stops.

    Use this hook to initialise heavyweight resources (connection
    pools, ML model warm-up, etc.) and tear them down cleanly.
    """
    # -- Startup --
    logger.info("%s starting up", settings.APP_NAME)
    yield
    # -- Shutdown --
    logger.info("%s shutting down", settings.APP_NAME)


# -- Application instance --

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Attach rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# -- CORS -- configured for localhost frontend --
# Restricted to specific methods and headers required by the frontend.

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


# -- Security headers middleware --

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add production-grade security headers to every response."""
    response = await call_next(request)

    # Prevent MIME type sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"

    # Prevent clickjacking
    response.headers["X-Frame-Options"] = "DENY"

    # Control referrer information
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    # Content Security Policy — restrict resource loading
    response.headers["Content-Security-Policy"] = (
        "default-src 'none'; "
        "frame-ancestors 'none'"
    )

    # HTTP Strict Transport Security (HSTS)
    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains"
    )

    # Restrict browser features
    response.headers["Permissions-Policy"] = (
        "camera=(), microphone=(), geolocation=()"
    )

    # Prevent caching of sensitive API responses
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
    response.headers["Pragma"] = "no-cache"

    # Remove server header to avoid leaking tech stack
    response.headers.pop("server", None)

    return response


# -- Audit logging middleware --

@app.middleware("http")
async def audit_log_requests(request: Request, call_next):
    """Log failed requests and track request timing for security auditing."""
    start_time = time.time()

    response = await call_next(request)

    duration_ms = int((time.time() - start_time) * 1000)

    # Log failed requests (4xx and 5xx)
    if response.status_code >= 400:
        logger.warning(
            "security_event=failed_request "
            "method=%s path=%s status=%d duration_ms=%d client_ip=%s",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
            request.client.host if request.client else "unknown",
        )

    return response


# -- Global exception handler --

@app.exception_handler(AppException)
async def _handle_app_exception(
    request: Request,
    exc: AppException,
) -> JSONResponse:
    """
    Convert ``AppException`` into the structured JSON body
    defined in ``core/errors.py``.
    """
    logger.warning(
        "security_event=app_exception "
        "method=%s path=%s status=%d detail=%s",
        request.method,
        request.url.path,
        exc.status_code,
        exc.detail.get("error", {}).get("message", "unknown") if isinstance(exc.detail, dict) else str(exc.detail),
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail,
    )


# -- Include routers --

app.include_router(router)


# -- Run directly with: python -m app.main --

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
