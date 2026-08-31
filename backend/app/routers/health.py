"""
health.py — GET /health

No auth required. Used by Render.com health checks and the frontend
to confirm the backend is alive before showing the upload UI.
"""

import time
from fastapi import APIRouter
from app.models.ml.model_loader import get_model_status
from app.models.schemas import HealthResponse

router = APIRouter(tags=["Health"])
_start_time = time.time()


@router.get("/health", response_model=HealthResponse, summary="Backend health check")
async def health():
    status = get_model_status()
    all_loaded = status["image_model_loaded"] and status["video_model_loaded"]
    return HealthResponse(
        status="ok" if all_loaded else "degraded",
        image_model_loaded=status["image_model_loaded"],
        video_model_loaded=status["video_model_loaded"],
        device=status["device"],
        uptime_seconds=round(time.time() - _start_time, 1),
    )
