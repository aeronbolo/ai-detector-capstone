"""
Video classification wrapper.

Uses Naman712/Deep-fake-detection (ResNext50 + LSTM, 87% accuracy).
Output labels: 'real' | 'fake'
"""

import logging

from app.models.ml.model_loader import get_video_classifier

logger = logging.getLogger(__name__)

MODEL_ID = "Naman712/Deep-fake-detection"

_LABEL_MAP = {
    "fake": "AI-Generated",
    "real": "Real",
    "FAKE": "AI-Generated",
    "REAL": "Real",
    "LABEL_0": "Real",
    "LABEL_1": "AI-Generated",
}

# The model is optimised for 20-frame clips
OPTIMAL_FRAMES = 20


def predict_video(video_path: str) -> dict:
    """
    Run video classification inference.

    Args:
        video_path: Absolute path to the downloaded video file.

    Returns:
        {
            "label": "AI-Generated" | "Real",
            "confidence": float (0–100),
            "model": str,
            "frames_analysed": int,
        }
    """
    classifier = get_video_classifier()
    results = classifier(video_path)
    top = results[0]

    raw_label = top["label"]
    label = _LABEL_MAP.get(raw_label, "Real")
    confidence = round(top["score"] * 100, 1)

    logger.info("Video prediction: label=%s confidence=%.1f%%", label, confidence)
    return {
        "label": label,
        "confidence": confidence,
        "model": MODEL_ID,
        "frames_analysed": OPTIMAL_FRAMES,
    }
