"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Firebase
    firebase_project_id: str
    firebase_service_account_json: str  # raw JSON string of service account key

    # Hugging Face models
    hf_image_model: str = "dima806/ai_vs_human_generated_image_detection"
    hf_video_model: str = "Naman712/Deep-fake-detection"
    hf_cache_dir: str = ".cache/huggingface"

    # File limits
    max_image_size_mb: int = 50
    max_video_size_mb: int = 500

    # Inference
    inference_timeout_seconds: int = 60

    # CORS
    allowed_origins: str = "http://localhost:5173"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


settings = Settings()
