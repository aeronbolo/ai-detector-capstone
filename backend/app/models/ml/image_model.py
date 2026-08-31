"""
Image classification wrapper.

Uses dima806/ai_vs_human_generated_image_detection (ViT-Base, ~98% accuracy).
LABEL_0 = human/real, LABEL_1 = AI-generated.
"""

import logging

from app.models.ml.model_loader import get_image_classifier

logger = logging.getLogger(__name__)

MODEL_ID = "dima806/ai_vs_human_generated_image_detection"

# Label mapping from model output to display labels
_LABEL_MAP = {
    "LABEL_0": "Real",
    "LABEL_1": "AI-Generated",
    # Some checkpoints use human-readable labels directly
    "human": "Real",
    "AI-generated": "AI-Generated",
    "ai-generated": "AI-Generated",
    "real": "Real",
}


def predict_image(image_path: str) -> dict:
    """
    Run image classification inference.

    Args:
        image_path: Absolute path to the downloaded image file.

    Returns:
        {
            "label": "AI-Generated" | "Real",
            "confidence": float (0–100),
            "model": str,
        }
    """
    classifier = get_image_classifier()
    results = classifier(image_path)
    top = results[0]  # highest-scoring label

    raw_label = top["label"]
    label = _LABEL_MAP.get(raw_label, "Real")
    confidence = round(top["score"] * 100, 1)

    logger.info("Image prediction: label=%s confidence=%.1f%%", label, confidence)
    return {
        "label": label,
        "confidence": confidence,
        "model": MODEL_ID,
    }
