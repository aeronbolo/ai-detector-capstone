"""File MIME type and size validation for uploaded media."""

import logging
import os

from fastapi import HTTPException, status

from app.config import settings

logger = logging.getLogger(__name__)

ALLOWED_IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_VIDEO_MIMES = {"video/mp4", "video/quicktime", "video/x-msvideo", "video/avi"}

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi"}


def validate_image_file(file_path: str, file_name: str) -> None:
    """
    Validate an image file by extension and size.

    Raises HTTPException(422) on failure.
    """
    _validate_extension(file_name, ALLOWED_IMAGE_EXTENSIONS, "image")
    _validate_size(file_path, settings.max_image_size_mb, "image")


def validate_video_file(file_path: str, file_name: str) -> None:
    """
    Validate a video file by extension and size.

    Raises HTTPException(422) on failure.
    """
    _validate_extension(file_name, ALLOWED_VIDEO_EXTENSIONS, "video")
    _validate_size(file_path, settings.max_video_size_mb, "video")


def _validate_extension(file_name: str, allowed: set, media_type: str) -> None:
    ext = os.path.splitext(file_name)[1].lower()
    if ext not in allowed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported {media_type} format '{ext}'. "
                   f"Allowed: {', '.join(sorted(allowed))}",
        )


def _validate_size(file_path: str, max_mb: int, media_type: str) -> None:
    size_bytes = os.path.getsize(file_path)
    size_mb = size_bytes / (1024 * 1024)
    if size_mb > max_mb:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{media_type.capitalize()} file exceeds {max_mb} MB limit "
                   f"(received {size_mb:.1f} MB).",
        )
