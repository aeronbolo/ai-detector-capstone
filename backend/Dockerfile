# ─────────────────────────────────────────────────────────────────────────────
# Dockerfile.lite — Lightweight production image (no PyTorch/transformers)
#
# Uses TruthScan API as the sole detection engine.
# RAM usage: ~100 MB (vs ~1.5 GB for full ML stack)
# Runs free on Render Starter, Railway, Fly.io, etc.
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# System libs for OpenCV and Firebase
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install lightweight Python dependencies
COPY requirements-lite.txt .
RUN pip install --no-cache-dir -r requirements-lite.txt

# Copy application code
COPY . .

# Environment
ENV LIGHTWEIGHT_MODE=true
ENV HF_CACHE_DIR=/app/.cache/huggingface
ENV PORT=7860

EXPOSE 7860

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860} --workers 1"]
