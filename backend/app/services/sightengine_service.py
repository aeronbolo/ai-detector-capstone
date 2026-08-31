"""
sightengine_service.py — Second-opinion AI image detection via Sightengine API.

Sightengine is trained on modern generators (Midjourney v6, DALL-E 3,
Stable Diffusion 3, Flux, Ideogram) — generators the local SigLIP model
may miss due to training data recency.

Used as an ensemble second opinion:
  - Local model runs first (free, instant, offline)
  - If local confidence is below CONFIDENCE_THRESHOLD, Sightengine is called
  - Final result is the weighted ensemble of both scores

API docs: https://sightengine.com/docs/detect-ai-generated-images
Free tier: ~500 operations/month, no credit card required
"""

import logging
import os
import httpx

logger = logging.getLogger(__name__)

_API_USER   = os.getenv("SIGHTENGINE_API_USER", "")
_API_SECRET = os.getenv("SIGHTENGINE_API_SECRET", "")
_ENDPOINT   = "https://api.sightengine.com/1.0/check.json"

# Only call Sightengine when local confidence is below this threshold
# Saves API quota — only uses cloud when local model is uncertain
CONFIDENCE_THRESHOLD = float(os.getenv("SIGHTENGINE_THRESHOLD", "75.0"))


def sightengine_available() -> bool:
    return bool(_API_USER and _API_SECRET)


async def check_image_with_sightengine(image_bytes: bytes, filename: str) -> dict | None:
    """
    Send image bytes to Sightengine AI-generated detection endpoint.

    Returns:
        {
            "ai_score": float,        # 0.0 (real) → 1.0 (AI-generated)
            "label": str,             # "AI-Generated" | "Real"
            "confidence": float,      # 0–100
            "source": "sightengine"
        }
        or None if API call fails (graceful degradation).
    """
    if not sightengine_available():
        logger.debug("Sightengine credentials not set — skipping.")
        return None

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                _ENDPOINT,
                data={
                    "models": "ai-generated",
                    "api_user": _API_USER,
                    "api_secret": _API_SECRET,
                },
                files={"media": (filename, image_bytes, "image/jpeg")},
            )
            response.raise_for_status()
            data = response.json()

        # Sightengine response shape:
        # { "status": "success", "ai_generated": { "score": 0.93 } }
        if data.get("status") != "success":
            logger.warning(f"Sightengine returned non-success: {data}")
            return None

        ai_score = float(data.get("ai_generated", {}).get("score", 0.5))
        label      = "AI-Generated" if ai_score >= 0.5 else "Real"
        confidence = round(ai_score * 100 if ai_score >= 0.5 else (1 - ai_score) * 100, 1)

        logger.info(f"Sightengine: ai_score={ai_score:.3f} → {label} ({confidence}%)")
        return {
            "ai_score":   ai_score,
            "label":      label,
            "confidence": confidence,
            "source":     "sightengine",
        }

    except httpx.HTTPStatusError as e:
        logger.warning(f"Sightengine HTTP error {e.response.status_code}: {e.response.text}")
        return None
    except Exception as e:
        logger.warning(f"Sightengine call failed (non-critical): {e}")
        return None


def ensemble_result(local: dict, sightengine: dict | None) -> dict:
    """
    Combine local model result with Sightengine result.

    Weighting:
      - Sightengine is more accurate on new generators → 60% weight
      - Local SigLIP v2 → 40% weight
      - If Sightengine unavailable → use local result only

    Returns final { label, confidence, model, detail }
    """
    from app.models.ml.model_loader import get_loaded_image_model_id

    local_id = get_loaded_image_model_id() or "prithivMLmods/deepfake-detector-model-v1"

    if sightengine is None:
        return {
            "label":      local["label"],
            "confidence": local["confidence"],
            "model":      local_id,
            "detail":     "local-only",
        }

    # Convert both to AI probability (0–1)
    local_ai_prob = local["confidence"] / 100 if local["label"] == "AI-Generated" \
                    else 1 - (local["confidence"] / 100)
    se_ai_prob    = sightengine["ai_score"]

    # Weighted ensemble: Sightengine 60%, local 40%
    ensemble_ai_prob = (se_ai_prob * 0.6) + (local_ai_prob * 0.4)

    if ensemble_ai_prob >= 0.5:
        label      = "AI-Generated"
        confidence = round(ensemble_ai_prob * 100, 1)
    else:
        label      = "Real"
        confidence = round((1 - ensemble_ai_prob) * 100, 1)

    return {
        "label":      label,
        "confidence": confidence,
        "model":      f"{local_id} + Sightengine",
        "detail":     f"local={local['confidence']}% se={sightengine['confidence']}%",
    }
