"""
model_loader.py — loads AI detection models once at FastAPI startup.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMAGE MODEL  — prithivMLmods/deepfake-detector-model-v1
  Architecture : SigLIP v1 (google/siglip-base-patch16-512, 2024)
  Task         : Binary classification — Fake / Real
  Labels       : 0 = "fake" (AI-Generated), 1 = "real"
  Accuracy     : 94.4% on 19,999 test images
  Public       : ✅ No token needed
  Best for     : GAN-generated faces, StyleGAN2, CIFAKE dataset
                 thispersondoesnotexist.com, old diffusion models

VIDEO MODEL  — eftt/VideoMae-ffc23-deepfake-detector
  Architecture : VideoMAE + Transformer (2025)
  Dataset      : FaceForensics++ (C23)
  Accuracy     : 88%  |  F1: 0.742  |  AUC: 0.836
  Labels       : Real / Fake (Deepfake)
  Public       : ✅ No token needed
  Best for     : Face swap / face reenactment deepfake videos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

import logging
import os

import torch
from PIL import Image
from transformers import AutoImageProcessor, SiglipForImageClassification, pipeline

logger = logging.getLogger(__name__)

# ── Singletons ────────────────────────────────────────────────────────────────
_image_processor = None
_image_model     = None
_video_classifier = None
_loaded_video_model: str | None = None
_load_errors: dict[str, str] = {}

# ── Config ────────────────────────────────────────────────────────────────────
_HF_CACHE    = os.getenv("HF_CACHE_DIR", None)
_DEVICE      = "cuda" if torch.cuda.is_available() else "cpu"
_DEVICE_INT  = 0 if torch.cuda.is_available() else -1

_IMAGE_MODEL = "prithivMLmods/deepfake-detector-model-v1"
_VIDEO_MODEL = "eftt/VideoMae-ffc23-deepfake-detector"


# ─────────────────────────────────────────────────────────────────────────────
# load_models — called once at FastAPI lifespan startup
# ─────────────────────────────────────────────────────────────────────────────

def load_models() -> None:
    global _image_processor, _image_model, _video_classifier, _loaded_video_model

    # Check available memory — on Render free tier (512 MB) we load image only
    import psutil
    available_mb = psutil.virtual_memory().available / (1024 * 1024)
    low_memory   = available_mb < 600
    logger.info(f"Available RAM: {available_mb:.0f} MB — low_memory={low_memory}")

    # ── Image model ───────────────────────────────────────────────────────────
    try:
        logger.info(f"Loading image classifier ({_IMAGE_MODEL})…")
        _image_processor = AutoImageProcessor.from_pretrained(
            _IMAGE_MODEL,
            cache_dir=_HF_CACHE,
        )
        _image_model = SiglipForImageClassification.from_pretrained(
            _IMAGE_MODEL,
            cache_dir=_HF_CACHE,
            torch_dtype=torch.float16 if _DEVICE == "cuda" else torch.float32,
            low_cpu_mem_usage=True,
        ).to(_DEVICE).eval()
        logger.info("✓ Image classifier loaded.")
    except Exception as e:
        logger.error(f"Failed to load image model: {e}")
        _load_errors["image"] = str(e)

    # ── Video model — skip on low memory (free tier) ──────────────────────────
    if low_memory:
        logger.warning(
            "Low memory detected — skipping video model preload. "
            "Video requests will use TruthScan API fallback."
        )
        _load_errors["video"] = "Skipped on low-memory instance"
        return

    hf_token = os.getenv("HF_TOKEN")

    video_models_to_try = [
        _VIDEO_MODEL,
        "MCG-NJU/videomae-base-finetuned-kinetics",
    ]

    if os.getenv("HF_VIDEO_MODEL"):
        video_models_to_try = [os.getenv("HF_VIDEO_MODEL")]

    for model_id in video_models_to_try:
        try:
            logger.info(f"Loading video classifier ({model_id})…")
            _video_classifier = pipeline(
                "video-classification",
                model=model_id,
                device=_DEVICE_INT,
                token=hf_token or None,
                model_kwargs={"cache_dir": _HF_CACHE} if _HF_CACHE else {},
            )
            _loaded_video_model = model_id
            logger.info(f"✓ Video classifier loaded ({model_id}).")
            break
        except Exception as e:
            logger.warning(f"Video model {model_id} failed: {e}")
            _load_errors["video"] = str(e)


# ─────────────────────────────────────────────────────────────────────────────
# predict_image
# ─────────────────────────────────────────────────────────────────────────────

def predict_image(image_path: str) -> dict:
    """
    Run SigLIP v2 deepfake detection on an image.
    Returns { label, confidence, raw_label }
    """
    if _image_model is None or _image_processor is None:
        raise RuntimeError("Image model is not loaded.")

    image  = Image.open(image_path).convert("RGB")
    inputs = _image_processor(images=image, return_tensors="pt")
    inputs = {k: v.to(_DEVICE) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = _image_model(**inputs)
        probs   = torch.nn.functional.softmax(outputs.logits, dim=1).squeeze().tolist()

    # SigLIP v2 label mapping: 0 = Fake, 1 = Real
    # (same as v1 — confirmed from model card id2label)
    fake_prob = probs[0]
    real_prob = probs[1]

    if fake_prob >= real_prob:
        return {"label": "AI-Generated", "confidence": round(fake_prob * 100, 1), "raw_label": "Fake"}
    else:
        return {"label": "Real",         "confidence": round(real_prob * 100, 1), "raw_label": "Real"}


# ─────────────────────────────────────────────────────────────────────────────
# Getters + status
# ─────────────────────────────────────────────────────────────────────────────

def get_image_classifier():
    return _image_model   # truthy check only

def get_video_classifier():
    return _video_classifier

def get_loaded_image_model_id() -> str | None:
    return _IMAGE_MODEL if _image_model is not None else None

def get_loaded_video_model_id() -> str | None:
    return _loaded_video_model

def get_model_status() -> dict:
    return {
        "image_model_loaded":  _image_model is not None,
        "video_model_loaded":  _video_classifier is not None,
        "image_model":         get_loaded_image_model_id() or _IMAGE_MODEL,
        "video_model":         _loaded_video_model or _VIDEO_MODEL,
        "errors":              _load_errors,
        "device":              _DEVICE,
    }
