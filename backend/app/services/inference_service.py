"""
Inference service — orchestrates download → validation → model call → cleanup.
"""

import asyncio
import logging
import os
import time

from fastapi import HTTPException, status

from app.config import settings
from app.models.ml.image_model import predict_image
from app.models.ml.video_model import predict_video
from app.services.storage_service import download_file
from app.utils.file_validator import validate_image_file, validate_video_file

logger = logging.getLogger(__name__)


async def run_image_inference(storage_url: str, file_name: str, detection_id: str) -> dict:
    """
    Full pipeline: download → validate → infer → return result.

    Returns dict matching DetectImageResponse schema.
    """
    tmp_path = await download_file(storage_url, file_name)
    try:
        validate_image_file(tmp_path, file_name)
        start = time.monotonic()
        result = await _run_with_timeout(predict_image, tmp_path)
        elapsed_ms = int((time.monotonic() - start) * 1000)
        return {
            "detection_id": detection_id,
            "label": result["label"],
            "confidence": result["confidence"],
            "model": result["model"],
            "processing_time_ms": elapsed_ms,
        }
    finally:
        _cleanup(tmp_path)


async def run_video_inference(storage_url: str, file_name: str, detection_id: str) -> dict:
    """
    Full pipeline: download → validate → infer → return result.

    Returns dict matching DetectVideoResponse schema.
    """
    tmp_path = await download_file(storage_url, file_name)
    try:
        validate_video_file(tmp_path, file_name)
        start = time.monotonic()
        result = await _run_with_timeout(predict_video, tmp_path)
        elapsed_ms = int((time.monotonic() - start) * 1000)
        return {
            "detection_id": detection_id,
            "label": result["label"],
            "confidence": result["confidence"],
            "model": result["model"],
            "processing_time_ms": elapsed_ms,
            "frames_analysed": result.get("frames_analysed", 20),
        }
    finally:
        _cleanup(tmp_path)


async def _run_with_timeout(predict_fn, file_path: str) -> dict:
    """Run a synchronous predict function in a thread pool with a timeout."""
    loop = asyncio.get_event_loop()
    try:
        result = await asyncio.wait_for(
            loop.run_in_executor(None, predict_fn, file_path),
            timeout=settings.inference_timeout_seconds,
        )
        return result
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            detail=f"Inference timed out after {settings.inference_timeout_seconds}s.",
        )
    except Exception as exc:
        logger.error("Inference error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model inference failed: {exc}",
        )


def _cleanup(path: str) -> None:
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except Exception:
        pass
