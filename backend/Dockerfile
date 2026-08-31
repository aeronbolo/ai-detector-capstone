# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Builder
# Install Python dependencies into a clean layer so they can be cached
# separately from the application code.
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /install

# System libs required by OpenCV, python-magic, and PyTorch
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install/packages -r requirements.txt


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Runtime
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Copy system libs installed in builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /install/packages /usr/local

# Copy application code
COPY . .

# ── Pre-bake HuggingFace model cache ─────────────────────────────────────────
# Downloads models at IMAGE BUILD TIME so the container starts instantly
# on Render.com without a cold-start download (330 MB + 200 MB).
# Remove this RUN block if you want faster image builds during development.
ENV HF_CACHE_DIR=/app/.cache/huggingface
ENV TRANSFORMERS_CACHE=/app/.cache/huggingface

RUN python -c "\
import os; \
os.makedirs('/app/.cache/huggingface', exist_ok=True); \
from transformers import pipeline; \
print('Downloading image model…'); \
pipeline('image-classification', model='dima806/ai_vs_human_generated_image_detection', model_kwargs={'cache_dir': '/app/.cache/huggingface'}); \
print('Downloading video model…'); \
pipeline('video-classification', model='Naman712/Deep-fake-detection', model_kwargs={'cache_dir': '/app/.cache/huggingface'}); \
print('Models cached successfully.'); \
"

# Render.com injects PORT env var; default to 8000 for local runs
ENV PORT=8000
EXPOSE 8000

# Run with uvicorn — single worker is fine for Render free tier (512 MB RAM)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --workers 1"]
