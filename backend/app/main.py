import os
import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()  # ← MUST be first before any os.getenv() calls

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models.ml.model_loader import load_models, get_model_status
from app.routers import detection, health
from app.utils.firebase_admin import init_firebase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initialising Firebase Admin SDK…")
    init_firebase()
    logger.info("Loading AI models — this may take a minute on first run…")
    load_models()
    status = get_model_status()
    logger.info(f"Model status: image={status['image_model_loaded']}, "
                f"video={status['video_model_loaded']}")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="AI Detector API",
    description="CNN + LSTM media forensics backend for the AI Detector capstone project.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allow ALL localhost ports in development — Vite picks a new port every restart.
# In production (Render.com) set ALLOWED_ORIGINS to your Firebase hosting URL.
_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")

if _raw_origins.strip() == "*":
    # Wildcard — allow all origins (dev only)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info("CORS: allowing all origins (*) — development mode")
else:
    allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info(f"CORS: allowing {len(allowed_origins)} origin(s)")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(health.router)
app.include_router(detection.router, prefix="/detect")
