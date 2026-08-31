"""
schemas.py — Pydantic request/response models for all API endpoints.
"""

from pydantic import BaseModel
from typing import Optional, Any


# ── Detection responses ───────────────────────────────────────────────────────

class ImageDetectionResponse(BaseModel):
    detection_id:       str
    label:              str           # "AI-Generated" | "Real" | "Digitally Edited"
    confidence:         float         # 0.0 – 100.0
    model:              str           # "truthscan" | "siglip-deepfake-v1 (local)"
    processing_time_ms: int

    # TruthScan extras — None when local model is used
    heatmap_url:        Optional[str]  = None
    analysis_details:   Optional[Any]  = None   # dict with keyIndicators, detailedReasoning etc.
    warnings:           Optional[list] = None   # watermark, blur, screen_recapture warnings


class VideoDetectionResponse(BaseModel):
    detection_id:       str
    label:              str
    confidence:         float
    model:              str
    processing_time_ms: int
    frames_analysed:    Optional[int] = None


# ── Health response ───────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status:             str
    image_model_loaded: bool
    video_model_loaded: bool
    device:             str
    uptime_seconds:     Optional[float] = None


# ── Error response ────────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    detail: str
