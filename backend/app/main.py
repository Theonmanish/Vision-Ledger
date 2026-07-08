"""
FastAPI application entry-point.

Creates the ``app`` instance, registers middleware, includes
routers, and exposes a lifespan context that initialises /
tears down resources once per server lifecycle.
"""

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.errors import AppException
from app.api.routes import router


# ── Lifespan — one-time startup / shutdown hooks ──────────────

@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """
    Runs once when Uvicorn starts and once when it stops.

    Use this hook to initialise heavyweight resources (connection
    pools, ML model warm-up, etc.) and tear them down cleanly.
    """
    # ── Startup ───────────────────────────────────────────────
    print(f"⚡ {settings.APP_NAME} starting …")
    print(f"   Supabase URL : {settings.SUPABASE_URL}")
    print(f"   Storage bucket: {settings.SUPABASE_BUCKET}")
    yield
    # ── Shutdown ───────────────────────────────────────────────
    print(f"🛑 {settings.APP_NAME} shutting down.")


# ── Application instance ───────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS — wide-open for hackathon development ────────────────
# Tighten origins before any public deployment.

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global exception handler ───────────────────────────────────

@app.exception_handler(AppException)
async def _handle_app_exception(
    _request: Request,
    exc: AppException,
) -> JSONResponse:
    """
    Convert ``AppException`` into the structured JSON body
    defined in ``core/errors.py``.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail,
    )


# ── Include routers ────────────────────────────────────────────

app.include_router(router)
