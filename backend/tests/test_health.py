"""Tests for the /health endpoint."""

from unittest.mock import patch

from fastapi.testclient import TestClient

# Patch model loader before importing app to avoid loading real models in tests
with patch("app.models.ml.model_loader._load_models"):
    from app.main import app

client = TestClient(app)


def test_health_returns_200():
    with (
        patch("app.routers.health.is_image_model_loaded", return_value=True),
        patch("app.routers.health.is_video_model_loaded", return_value=True),
    ):
        response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["image_model_loaded"] is True
    assert data["video_model_loaded"] is True
    assert "uptime_seconds" in data


def test_health_degraded_when_models_not_loaded():
    with (
        patch("app.routers.health.is_image_model_loaded", return_value=False),
        patch("app.routers.health.is_video_model_loaded", return_value=False),
    ):
        response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "degraded"
