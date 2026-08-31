"""
detection.py — POST /detect/image  and  POST /detect/video

Detection priority:
  1. TruthScan API (primary) — real heatmap, analysis details, high accuracy
  2. Local model (fallback)  — used when TruthScan is unavailable or fails

Both endpoints return extended fields:
  - heatmap_url       (real heatmap from TruthScan, None for local)
  - analysis_details  (keyIndicators, detailedReasoning from TruthScan)
  - warnings          (watermark detection, blur, screen recapture)
"""

import logging
import os
import time
import tempfile
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.dependencies import verify_token
from app.models.ml.model_loader import get_image_classifier, get_video_classifier, predict_image
from app.models.schemas import ImageDetectionResponse, VideoDetectionResponse
from app.services.truthscan_service import (
    detect_image_truthscan,
    detect_video_truthscan,
    truthscan_available,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Detection"])

MAX_IMAGE_MB = int(os.getenv("MAX_IMAGE_SIZE_MB", 50))
MAX_VIDEO_MB = int(os.getenv("MAX_VIDEO_SIZE_MB", 500))

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo", "video/avi"}


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _read_upload(file: UploadFile, max_mb: int, allowed_types: set) -> bytes:
    if file.content_type and file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported file type '{file.content_type}'. "
                   f"Allowed: {', '.join(allowed_types)}",
        )
    content = await file.read()
    if len(content) > max_mb * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File too large. Maximum size is {max_mb} MB.",
        )
    return content


def _map_video_label(raw: str) -> str:
    lower = raw.lower()
    if lower in ("fake", "ai-generated", "artificial", "deepfake"):
        return "AI-Generated"
    if lower == "real":
        return "Real"
    return "Real"


# ── POST /detect/image ────────────────────────────────────────────────────────

@router.post("/image", response_model=ImageDetectionResponse, summary="Detect AI-generated image")
async def detect_image(
    file: Annotated[UploadFile, File(description="JPG, PNG, or WebP image")],
    detection_id: Annotated[str, Form(description="Unique detection ID from frontend")],
    uid: str = Depends(verify_token),
):
    content = await _read_upload(file, MAX_IMAGE_MB, ALLOWED_IMAGE_TYPES)
    t0      = time.perf_counter()

    # ── Primary: TruthScan ────────────────────────────────────────────────────
    if truthscan_available():
        logger.info(f"[image] id={detection_id} using TruthScan primary")
        ts = await detect_image_truthscan(content, file.filename or "upload.jpg")

        if ts:
            processing_ms = int((time.perf_counter() - t0) * 1000)
            logger.info(
                f"[image] id={detection_id} uid={uid} "
                f"label={ts['label']} confidence={ts['confidence']}% "
                f"model={ts['model']} heatmap={'yes' if ts['heatmap_url'] else 'no'} "
                f"time={processing_ms}ms"
            )
            return ImageDetectionResponse(
                detection_id     = detection_id,
                label            = ts["label"],
                confidence       = ts["confidence"],
                model            = ts["model"],
                processing_time_ms = processing_ms,
                heatmap_url      = ts.get("heatmap_url"),
                analysis_details = ts.get("analysis_details"),
                warnings         = ts.get("warnings", []),
            )
        logger.warning(f"[image] TruthScan failed for {detection_id} — falling back to local model")

    # ── Fallback: local SigLIP model ──────────────────────────────────────────
    if get_image_classifier() is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No detection service available. TruthScan failed and local model is not loaded.",
        )

    suffix = os.path.splitext(file.filename or "upload.jpg")[1] or ".jpg"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        local = predict_image(tmp_path)
        processing_ms = int((time.perf_counter() - t0) * 1000)
    except Exception as e:
        logger.error(f"Local image inference failed for {detection_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Model inference failed: {e}")
    finally:
        os.unlink(tmp_path)

    logger.info(
        f"[image] id={detection_id} uid={uid} LOCAL "
        f"label={local['label']} confidence={local['confidence']}% "
        f"time={processing_ms}ms"
    )
    return ImageDetectionResponse(
        detection_id       = detection_id,
        label              = local["label"],
        confidence         = local["confidence"],
        model              = "siglip-deepfake-v1 (local)",
        processing_time_ms = processing_ms,
        heatmap_url        = None,
        analysis_details   = None,
        warnings           = [],
    )


# ── POST /detect/video ────────────────────────────────────────────────────────

@router.post("/video", response_model=VideoDetectionResponse, summary="Detect AI-generated / deepfake video")
async def detect_video(
    file: Annotated[UploadFile, File(description="MP4, MOV, or AVI video")],
    detection_id: Annotated[str, Form(description="Unique detection ID from frontend")],
    uid: str = Depends(verify_token),
):
    content = await _read_upload(file, MAX_VIDEO_MB, ALLOWED_VIDEO_TYPES)
    t0      = time.perf_counter()

    # ── Primary: TruthScan ────────────────────────────────────────────────────
    if truthscan_available():
        logger.info(f"[video] id={detection_id} using TruthScan primary")
        ts = await detect_video_truthscan(content, file.filename or "upload.mp4")

        if ts:
            processing_ms = int((time.perf_counter() - t0) * 1000)
            logger.info(
                f"[video] id={detection_id} uid={uid} "
                f"label={ts['label']} confidence={ts['confidence']}% "
                f"model={ts['model']} time={processing_ms}ms"
            )
            return VideoDetectionResponse(
                detection_id       = detection_id,
                label              = ts["label"],
                confidence         = ts["confidence"],
                model              = ts["model"],
                processing_time_ms = processing_ms,
                frames_analysed    = None,
            )
        logger.warning(f"[video] TruthScan failed for {detection_id} — falling back to local model")

    # ── Fallback: local VideoMAE model ────────────────────────────────────────
    classifier = get_video_classifier()
    if classifier is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No detection service available. TruthScan failed and local model is not loaded.",
        )

    suffix = os.path.splitext(file.filename or "upload.mp4")[1] or ".mp4"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        results       = classifier(tmp_path)
        processing_ms = int((time.perf_counter() - t0) * 1000)
    except Exception as e:
        logger.error(f"Local video inference failed for {detection_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Model inference failed: {e}")
    finally:
        # Windows file-lock retry
        for _ in range(5):
            try:
                os.unlink(tmp_path)
                break
            except PermissionError:
                import time as _t; _t.sleep(0.3)

    top        = max(results, key=lambda r: r["score"])
    label      = _map_video_label(top["label"])
    confidence = round(top["score"] * 100, 1)

    logger.info(
        f"[video] id={detection_id} uid={uid} LOCAL "
        f"label={label} confidence={confidence}% time={processing_ms}ms"
    )
    return VideoDetectionResponse(
        detection_id       = detection_id,
        label              = label,
        confidence         = confidence,
        model              = "videomae-deepfake (local)",
        processing_time_ms = processing_ms,
        frames_analysed    = None,
    )
