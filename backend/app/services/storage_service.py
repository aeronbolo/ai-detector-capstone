"""
Download files from Firebase Storage URLs to a local temp directory.
"""

import logging
import os
import tempfile
import urllib.parse

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


async def download_file(storage_url: str, file_name: str) -> str:
    """
    Download a file from a Firebase Storage download URL.

    Args:
        storage_url: Firebase Storage public download URL.
        file_name:   Original file name (used to preserve extension).

    Returns:
        Absolute path to the downloaded temp file.

    Raises:
        HTTPException(408) if download times out.
        HTTPException(500) if download fails.
    """
    from fastapi import HTTPException, status

    ext = os.path.splitext(file_name)[1].lower() or ".bin"
    tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
    tmp_path = tmp_file.name
    tmp_file.close()

    timeout = settings.inference_timeout_seconds
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(storage_url)
            response.raise_for_status()
            with open(tmp_path, "wb") as f:
                f.write(response.content)
        logger.info("Downloaded '%s' → %s (%.1f KB)", file_name, tmp_path,
                    os.path.getsize(tmp_path) / 1024)
        return tmp_path
    except httpx.TimeoutException:
        _cleanup(tmp_path)
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            detail="Download from Firebase Storage timed out.",
        )
    except Exception as exc:
        _cleanup(tmp_path)
        logger.error("Storage download failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download file: {exc}",
        )


def _cleanup(path: str) -> None:
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception:
        pass
