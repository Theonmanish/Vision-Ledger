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


# -------------------------------------------------------------------
# Lifespan
# -------------------------------------------------------------------

@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """
    Runs once when Uvicorn starts and once when it stops.
    """

    logger.info("%s starting up", settings.APP_NAME)

    yield

    logger.info("%s shutting down", settings.APP_NAME)


# -------------------------------------------------------------------
# FastAPI App
# -------------------------------------------------------------------

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# -------------------------------------------------------------------
# Rate Limiter
# -------------------------------------------------------------------

app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
)

# -------------------------------------------------------------------
# CORS
# -------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------
# Security Headers
# -------------------------------------------------------------------

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """
    Adds common security headers to every response.
    """

    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"

    response.headers["X-Frame-Options"] = "DENY"

    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    response.headers["Content-Security-Policy"] = (
        "default-src 'none'; "
        "frame-ancestors 'none'"
    )

    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains"
    )

    response.headers["Permissions-Policy"] = (
        "camera=(), microphone=(), geolocation=()"
    )

    response.headers["Cache-Control"] = (
        "no-store, no-cache, must-revalidate"
    )

    response.headers["Pragma"] = "no-cache"

    # Safely remove identifying headers
    for header in ("server", "x-powered-by"):
        if header in response.headers:
            del response.headers[header]

    return response


# -------------------------------------------------------------------
# Audit Logging
# -------------------------------------------------------------------

@app.middleware("http")
async def audit_log_requests(request: Request, call_next):
    """
    Log failed requests and request timing.
    """

    start_time = time.time()

    response = await call_next(request)

    duration_ms = int((time.time() - start_time) * 1000)

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


# -------------------------------------------------------------------
# Global Exception Handler
# -------------------------------------------------------------------

@app.exception_handler(AppException)
async def _handle_app_exception(
    request: Request,
    exc: AppException,
) -> JSONResponse:
    """
    Convert AppException into JSON response.
    """

    logger.warning(
        "security_event=app_exception "
        "method=%s path=%s status=%d detail=%s",
        request.method,
        request.url.path,
        exc.status_code,
        exc.detail.get("error", {}).get("message", "unknown")
        if isinstance(exc.detail, dict)
        else str(exc.detail),
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail,
    )


# -------------------------------------------------------------------
# Routes
# -------------------------------------------------------------------

app.include_router(router)


# -------------------------------------------------------------------
# Local Development
# -------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )