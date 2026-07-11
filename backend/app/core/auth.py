"""
Authentication dependency for extracting user from Supabase JWT.
"""

import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

security = HTTPBearer()


def get_supabase_client() -> Client:
    """Create a Supabase client instance."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Extract and validate the current user from the JWT token.

    Returns:
        dict: User information including 'id' and 'email'

    Raises:
        HTTPException: 401 if token is invalid or missing
    """
    try:
        supabase = get_supabase_client()

        # Verify the JWT token with Supabase
        user_response = supabase.auth.get_user(credentials.credentials)

        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_data = {
            "id": user_response.user.id,
            "email": user_response.user.email,
        }

        return user_data

    except HTTPException:
        # Re-raise HTTPExceptions as-is (already sanitized)
        raise
    except Exception as e:
        # Log the actual error for debugging, but return generic message to client
        logger.error(f"Authentication error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False)),
) -> dict | None:
    """
    Extract user from JWT token if present, otherwise return None.
    Used for endpoints that work with or without authentication.
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
