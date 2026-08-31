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

logger = logging.getLogger(__name__)

# ── Lightweight mode check ────────────────────────────────────────────────────
# When LIGHTWEIGHT_MODE=true, skip all PyTorch/transformers imports entirely.
# TruthScan API is the primary engine — local models are fallback only.
_LIGHTWEIGHT = os.getenv("LIGHTWEIGHT_MODE", "false").lower() == "true"

if _LIGHTWEIGHT:
    logger.info("LIGHTWEIGHT_MODE=true — skipping PyTorch model loading. TruthScan API only.")
    torch = None
    Image = None
    AutoImageProcessor = None
    SiglipForImageClassification = None
    pipeline = None
else:
    import torch
    from PIL import Image
    from transformers import AutoImageProcessor, SiglipForImageClassification, pipeline

logger = logging.getLogger(__name__)

# ── Singletons ────────────────────────────────────────────────────────────────
_image_processor  = None
_image_model      = None
_video_classifier = None
_loaded_video_model: str | None = None
_load_errors: dict[str, str] = {}

# ── Config ────────────────────────────────────────────────────────────────────
_HF_CACHE   = os.getenv("HF_CACHE_DIR", None)
_DEVICE     = "cpu" if _LIGHTWEIGHT else ("cuda" if (torch and torch.cuda.is_available()) else "cpu")
_DEVICE_INT = -1  if _LIGHTWEIGHT else (0 if (torch and torch.cuda.is_available()) else -1)

_IMAGE_MODEL = "prithivMLmods/deepfake-detector-model-v1"
_VIDEO_MODEL = "eftt/VideoMae-ffc23-deepfake-detector"


# ─────────────────────────────────────────────────────────────────────────────
# load_models — called once at FastAPI lifespan startup
# ─────────────────────────────────────────────────────────────────────────────

def load_models() -> None:
    global _image_processor, _image_model, _video_classifier, _loaded_video_model

    # ── Skip entirely in lightweight mode ─────────────────────────────────────
    if _LIGHTWEIGHT:
        logger.info("Lightweight mode — no ML models loaded. Using TruthScan API only.")
        _load_errors["image"] = "Skipped — LIGHTWEIGHT_MODE=true"
        _load_errors["video"] = "Skipped — LIGHTWEIGHT_MODE=true"
        return

    # Check available memory — skip video model on low-memory instances
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
        ).to(_DEVICE).eval()
        logger.info("✓ Image classifier loaded.")
    except Exception as e:
        logger.error(f"Failed to load image model: {e}")
        _load_errors["image"] = str(e)

    # ── Video model — skip on low memory ──────────────────────────────────────
    if low_memory:
        logger.warning("Low memory — skipping video model. Using TruthScan API fallback.")
        _load_errors["video"] = "Skipped on low-memory instance"
        return

    hf_token = os.getenv("HF_TOKEN")
    video_models_to_try = [_VIDEO_MODEL, "MCG-NJU/videomae-base-finetuned-kinetics"]
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
    Run SigLIP deepfake detection on an image.
    Returns { label, confidence, raw_label }
    Raises RuntimeError if model not loaded (lightweight mode or load failure).
    """
    if _LIGHTWEIGHT:
        raise RuntimeError("Image model not available in lightweight mode. TruthScan API required.")

    if _image_model is None or _image_processor is None:
        raise RuntimeError("Image model is not loaded.")

    image  = Image.open(image_path).convert("RGB")
    inputs = _image_processor(images=image, return_tensors="pt")
    inputs = {k: v.to(_DEVICE) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = _image_model(**inputs)
        probs   = torch.nn.functional.softmax(outputs.logits, dim=1).squeeze().tolist()

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
        "lightweight_mode":    _LIGHTWEIGHT,
        "image_model_loaded":  _image_model is not None,
        "video_model_loaded":  _video_classifier is not None,
        "image_model":         get_loaded_image_model_id() or _IMAGE_MODEL,
        "video_model":         _loaded_video_model or _VIDEO_MODEL,
        "errors":              _load_errors,
        "device":              _DEVICE,
    }
