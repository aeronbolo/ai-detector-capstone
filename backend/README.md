---
title: AI Detector Backend
emoji: 🔍
colorFrom: blue
colorTo: cyan
sdk: docker
pinned: false
app_port: 7860
---

# AI Detector — FastAPI Backend

FastAPI backend for AI-generated image and deepfake video detection.

## Models Used
- **SigLIP v1** (prithivMLmods/deepfake-detector-model-v1) — Image detection, 94.4% accuracy
- **VideoMAE** (eftt/VideoMae-ffc23-deepfake-detector) — Video detection, 88% accuracy
- **TruthScan API** — Primary cloud detection engine, 96.1% accuracy
