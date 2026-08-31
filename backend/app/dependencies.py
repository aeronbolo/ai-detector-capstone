"""
dependencies.py — FastAPI dependency for Firebase ID token verification.

Usage in a route:
    @router.post("/detect/image")
    async def detect_image(uid: str = Depends(verify_token), ...):
        ...

The dependency extracts the Bearer token from the Authorization header,
verifies it with Firebase Admin SDK, and returns the user's UID.
Raises HTTP 401 if the token is missing, expired, or invalid.
"""

import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import firebase_admin.auth as fb_auth

logger = logging.getLogger(__name__)
_bearer = HTTPBearer(auto_error=False)


async def verify_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> str:
    """
    Verify Firebase ID token and return the authenticated user's UID.
    Returns "anonymous" when SKIP_AUTH=true (local dev only).
    """
    import os
    if os.getenv("SKIP_AUTH", "false").lower() == "true":
        logger.warning("SKIP_AUTH is enabled — bypassing token verification.")
        return "anonymous"

    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header. Include: Bearer <Firebase ID Token>",
        )

    token = credentials.credentials
    try:
        decoded = fb_auth.verify_id_token(token)
        return decoded["uid"]
    except fb_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Firebase token has expired.")
    except fb_auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid Firebase token.")
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Token verification failed.")
