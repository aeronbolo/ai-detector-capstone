# Design — AI Detector Capstone Project

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Browser)                           │
│                   React + Vite + Tailwind CSS                   │
│                   Firebase Hosting (CDN)                        │
└──────────────┬──────────────────────────────┬───────────────────┘
               │ Firebase SDK                 │ REST (HTTPS)
               ▼                              ▼
┌──────────────────────────┐    ┌─────────────────────────────────┐
│     Firebase Services    │    │     FastAPI AI Backend          │
│                          │    │     (Google Cloud Run)          │
│  ┌────────────────────┐  │    │                                 │
│  │  Firebase Auth     │  │    │  POST /detect-image             │
│  └────────────────────┘  │    │  POST /detect-video             │
│  ┌────────────────────┐  │    │  GET  /history                  │
│  │  Firestore DB      │  │    │  GET  /reports                  │
│  └────────────────────┘  │    │  GET  /health                   │
│  ┌────────────────────┐  │    │                                 │
│  │  Firebase Storage  │  │    │  ┌───────────────────────────┐  │
│  └────────────────────┘  │    │  │  CNN Model (images)       │  │
└──────────────────────────┘    │  │  LSTM Model (video)       │  │
                                │  │  PyTorch / TensorFlow     │  │
                                │  │  OpenCV                   │  │
                                │  └───────────────────────────┘  │
                                └─────────────────────────────────┘
```

### Data Flow — Media Detection

```
1. User uploads file → Firebase Storage (direct SDK upload)
2. Frontend gets Storage download URL
3. Frontend calls FastAPI POST /detect-image|video
   - Header: Authorization: Bearer <Firebase ID Token>
   - Body: { storage_url, user_id, file_type }
4. FastAPI verifies Firebase ID token
5. FastAPI downloads file from Storage URL
6. FastAPI runs CNN (image) or LSTM (video) inference
7. FastAPI returns { label, confidence, model, processing_time_ms }
8. Frontend writes detection record to Firestore (detections collection)
9. Frontend navigates user to results page
```

---

## 2. Frontend Architecture

### Folder Structure

```
src/
├── assets/                  # Static images, icons
├── components/              # Shared/reusable UI components
│   ├── ui/                  # Primitive components (Button, Badge, Card, Modal)
│   ├── layout/              # Navbar, PageWrapper, Footer
│   └── charts/              # Recharts wrappers (BarChart, LineChart, PieChart)
├── features/                # Feature-based modules
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── ForgotPasswordPage.jsx
│   │   └── authService.js   # Firebase Auth helpers
│   ├── home/
│   │   ├── LandingPage.jsx         # Homepage with hero + upload
│   │   ├── HeroSection.jsx
│   │   ├── UploadTabs.jsx
│   │   ├── ImageUploadCard.jsx     # Based on mockup
│   │   ├── VideoUploadCard.jsx
│   │   └── InfoCardsRow.jsx
│   ├── detection/
│   │   ├── DetectionResultPage.jsx # "operation UI.jpg" layout
│   │   ├── ResultCard.jsx          # 71% badge + description
│   │   ├── HeatmapViewer.jsx       # Suspicious-region heatmap
│   │   ├── ModelSignalsPanel.jsx   # CNN/LSTM scores
│   │   └── detectionService.js     # FastAPI calls
│   ├── history/
│   │   ├── HistoryPage.jsx         # "Save analysis UI.jpg"
│   │   ├── HistoryTable.jsx
│   │   ├── HistoryRow.jsx
│   │   └── historyService.js
│   ├── reports/
│   │   ├── ReportsPage.jsx
│   │   ├── ReportGenerator.js      # PDF generation (jsPDF)
│   │   └── reportsService.js
│   └── admin/
│       ├── AdminDashboardPage.jsx  # "Analysis section.jpg" (dark theme)
│       ├── StatCard.jsx
│       ├── ManagementActions.jsx
│       ├── AllAnalysesPage.jsx     # "Home UI.jpg" (all users)
│       ├── ExtendedHistoryTable.jsx
│       ├── UserManagementPage.jsx  # "user management UI.jpg"
│       ├── UserTable.jsx
│       ├── UserRow.jsx
│       └── adminService.js
├── hooks/                   # Custom React hooks
│   ├── useAuth.js
│   ├── useDetection.js
│   ├── useHistory.js
│   └── useAdmin.js
├── context/
│   └── AuthContext.jsx      # Global auth state provider
├── lib/
│   ├── firebase.js          # Firebase app init + exports
│   ├── apiClient.js         # Axios instance with auth token interceptor
│   └── pdfGenerator.js      # jsPDF report helpers
├── styles/
│   ├── colors.js            # Design tokens from mockups
│   └── theme.js             # Light/dark theme configs
├── router/
│   └── AppRouter.jsx        # React Router v6 routes + ProtectedRoute
├── App.jsx
└── main.jsx
```

**See `ui-design-reference.md` for detailed mockup analysis and component mapping.**

### Routing Table (Based on Mockups)

| Path | Component | Mockup Reference | Guard |
|------|-----------|------------------|-------|
| `/` | LandingPage | `Landing page UI.jpg` | Public |
| `/login` | LoginPage | — | Public only |
| `/register` | RegisterPage | — | Public only |
| `/forgot-password` | ForgotPasswordPage | — | Public only |
| `/results/:detectionId` | DetectionResultPage | `operation UI.jpg` | Auth required |
| `/history` | HistoryPage | `Save analysis UI.jpg` | Auth required |
| `/reports` | ReportsPage | — | Auth required |
| `/admin` | AdminDashboardPage | `Analysis section.jpg` | Admin only |
| `/admin/analyses` | AllAnalysesPage | `Home UI.jpg` | Admin only |
| `/admin/users` | UserManagementPage | `user management UI.jpg` | Admin only |
| `*` | NotFoundPage | — | — |

**Note:** The homepage (`/`) serves as both the landing page and upload interface (no separate `/dashboard` or `/upload` routes).

### State Management

- **Auth state** — React Context (`AuthContext`) wrapping the entire app, populated by `onAuthStateChanged`.
- **Server state** — Custom hooks using direct Firestore SDK calls (no extra state library needed for this scale).
- **UI state** — Local `useState` / `useReducer` per feature component.
- No Redux or Zustand required at this project scale.

---

## 3. Backend Architecture (FastAPI)

### Folder Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app init, CORS, router registration
│   ├── config.py            # Settings (env vars via pydantic-settings)
│   ├── dependencies.py      # Firebase token verification dependency
│   ├── routers/
│   │   ├── detection.py     # /detect-image, /detect-video
│   │   ├── history.py       # /history
│   │   ├── reports.py       # /reports
│   │   └── health.py        # /health
│   ├── models/
│   │   ├── schemas.py       # Pydantic request/response models
│   │   └── ml/
│   │       ├── cnn_model.py       # CNN image classifier wrapper
│   │       ├── lstm_model.py      # LSTM video classifier wrapper
│   │       └── model_loader.py    # Singleton model loader (loaded at startup)
│   ├── services/
│   │   ├── inference_service.py   # Orchestrates CNN/LSTM calls
│   │   ├── storage_service.py     # Downloads files from Firebase Storage URL
│   │   └── video_processor.py    # OpenCV frame extraction for LSTM
│   └── utils/
│       ├── file_validator.py      # MIME type + size validation
│       └── logger.py             # Structured logging config
├── weights/                 # Model weight files (.pt / .h5) — gitignored
├── tests/
│   ├── test_detection.py
│   └── test_health.py
├── Dockerfile
├── requirements.txt
└── .env.example
```

### Startup Behaviour

On startup (`lifespan` event), `model_loader.py` loads both the CNN and LSTM model weights into memory. This avoids cold-load latency per request.

---

## 4. Data Models

### Firestore Collections

#### `users/{uid}`
```json
{
  "uid": "string",
  "email": "string",
  "displayName": "string",
  "photoURL": "string | null",
  "role": "user | admin",
  "createdAt": "Timestamp",
  "disabled": false,
  "detectionCount": 0
}
```

#### `detections/{detectionId}`
```json
{
  "detectionId": "string (auto-id)",
  "userId": "string (ref → users)",
  "fileName": "string",
  "fileType": "image | video",
  "storagePath": "string (Firebase Storage path)",
  "storageUrl": "string (download URL)",
  "label": "AI-Generated | Real",
  "confidence": 87.4,
  "model": "cnn-v1 | lstm-v1",
  "processingTimeMs": 1240,
  "status": "pending | completed | failed",
  "createdAt": "Timestamp",
  "deleted": false
}
```

#### `reports/{reportId}`
```json
{
  "reportId": "string",
  "userId": "string",
  "type": "single | summary",
  "detectionIds": ["string"],
  "dateRangeStart": "Timestamp | null",
  "dateRangeEnd": "Timestamp | null",
  "downloadUrl": "string",
  "createdAt": "Timestamp"
}
```

#### `activity_logs/{logId}`
```json
{
  "logId": "string",
  "userId": "string | null",
  "action": "string",
  "status": "success | error",
  "detail": "string",
  "createdAt": "Timestamp"
}
```

#### `settings/{docId}`
```json
{
  "key": "string",
  "value": "any",
  "updatedAt": "Timestamp"
}
```

### Firestore Indexes

| Collection | Fields | Type |
|---|---|---|
| `detections` | `userId ASC, createdAt DESC` | Composite |
| `detections` | `userId ASC, fileType ASC, createdAt DESC` | Composite |
| `detections` | `userId ASC, label ASC, createdAt DESC` | Composite |
| `activity_logs` | `userId ASC, createdAt DESC` | Composite |

### Firebase Storage Structure

```
storage/
└── users/
    └── {uid}/
        ├── images/
        │   └── {detectionId}_{filename}
        └── videos/
            └── {detectionId}_{filename}
```

### Firestore Security Rules (summary)

```
users collection:
  - read/write own document only (uid == request.auth.uid)
  - admin role can read/write all

detections collection:
  - read/write where userId == request.auth.uid
  - admin role can read all

reports collection:
  - read/write where userId == request.auth.uid

activity_logs collection:
  - write allowed for authenticated users (server-side writes)
  - read restricted to admin role

settings collection:
  - read allowed for authenticated users
  - write restricted to admin role
```

---

## 5. API Contract (FastAPI)

### Authentication

All endpoints (except `/health`) require:
```
Authorization: Bearer <Firebase ID Token>
```
The token is verified server-side using the Firebase Admin SDK.

---

### POST `/detect-image`

**Request Body**
```json
{
  "storage_url": "https://firebasestorage.googleapis.com/...",
  "file_name": "photo.jpg",
  "detection_id": "abc123"
}
```

**Response 200**
```json
{
  "detection_id": "abc123",
  "label": "AI-Generated",
  "confidence": 93.7,
  "model": "cnn-v1",
  "processing_time_ms": 820
}
```

**Response 422** — Validation error (unsupported file type, oversized)
**Response 408** — Inference timeout
**Response 500** — Model inference failure

---

### POST `/detect-video`

**Request Body**
```json
{
  "storage_url": "https://firebasestorage.googleapis.com/...",
  "file_name": "clip.mp4",
  "detection_id": "def456"
}
```

**Response 200**
```json
{
  "detection_id": "def456",
  "label": "Real",
  "confidence": 78.2,
  "model": "lstm-v1",
  "processing_time_ms": 14500,
  "frames_analysed": 32
}
```

---

### GET `/history`

**Query Params:** `user_id`, `limit` (default 20), `offset` (default 0)

**Response 200**
```json
{
  "total": 45,
  "results": [
    {
      "detection_id": "abc123",
      "file_name": "photo.jpg",
      "file_type": "image",
      "label": "AI-Generated",
      "confidence": 93.7,
      "created_at": "2026-07-01T12:00:00Z"
    }
  ]
}
```

---

### GET `/reports`

**Query Params:** `user_id`, `report_id` (optional)

**Response 200** — List of report metadata or single report detail.

---

### GET `/health`

No auth required.

**Response 200**
```json
{
  "status": "ok",
  "cnn_model_loaded": true,
  "lstm_model_loaded": true,
  "uptime_seconds": 3600
}
```

---

## 6. AI Model Design

Both models are loaded from Hugging Face Hub at FastAPI startup via the `transformers` library. No manual weight file downloads or custom training required.

---

### Image Model — `dima806/ai_vs_human_generated_image_detection`

- **Source:** [huggingface.co/dima806/ai_vs_human_generated_image_detection](https://huggingface.co/dima806/ai_vs_human_generated_image_detection)
- **Architecture:** ViT-Base (Vision Transformer, 86M parameters), fine-tuned on the CIFAKE dataset
- **License:** Apache 2.0
- **Accuracy:** ~98% (precision 0.97 / recall 0.96 on 7,995 test images)
- **Input:** 224×224 RGB image
- **Output:** Binary label (`AI-generated` / `human`) + confidence score
- **Framework:** Hugging Face Transformers (PyTorch backend)
- **Labels mapping:** `LABEL_0` = human/real, `LABEL_1` = AI-generated

**Integration code:**
```python
from transformers import pipeline

image_pipe = pipeline(
    "image-classification",
    model="dima806/ai_vs_human_generated_image_detection",
    device=0 if torch.cuda.is_available() else -1
)

def predict_image(image_path: str) -> dict:
    result = image_pipe(image_path)[0]
    label = "AI-Generated" if result["label"] == "LABEL_1" else "Real"
    confidence = round(result["score"] * 100, 1)
    return {"label": label, "confidence": confidence, "model": "dima806/ai_vs_human_generated_image_detection"}
```

**Known limitation:** Trained ~1 year ago; newer generators (Flux, SDXL 3+) may reduce accuracy. Threshold can be tuned (e.g., lower to 0.3) to improve recall. Acceptable for a capstone project.

---

### Video Model — `Naman712/Deep-fake-detection`

- **Source:** [huggingface.co/Naman712/Deep-fake-detection](https://huggingface.co/Naman712/Deep-fake-detection)
- **Architecture:** ResNext50 (spatial CNN feature extractor per frame) + LSTM (temporal sequence analyser) — matches the CNN+LSTM design in the blueprint exactly
- **License:** MIT
- **Accuracy:** 87% on internal test dataset
- **Input:** Video clip — optimally 20 frames; model handles other lengths
- **Output:** Binary label (`real` / `fake`) + confidence score
- **Framework:** PyTorch via Hugging Face Transformers video-classification pipeline
- **Limitation:** Optimised for face-manipulation deepfakes; performance may vary on non-face AI-generated video

**Integration code:**
```python
from transformers import pipeline

video_pipe = pipeline(
    "video-classification",
    model="Naman712/Deep-fake-detection",
    device=0 if torch.cuda.is_available() else -1
)

def predict_video(video_path: str) -> dict:
    result = video_pipe(video_path)[0]
    label = "AI-Generated" if result["label"].lower() == "fake" else "Real"
    confidence = round(result["score"] * 100, 1)
    return {"label": label, "confidence": confidence, "model": "Naman712/Deep-fake-detection"}
```

---

### Model Loading Strategy

Both models are loaded **once at FastAPI startup** using a `lifespan` context manager and stored as module-level singletons. This avoids per-request cold starts.

```python
# app/models/ml/model_loader.py
from contextlib import asynccontextmanager
from transformers import pipeline
import torch

_image_classifier = None
_video_classifier = None

@asynccontextmanager
async def lifespan(app):
    global _image_classifier, _video_classifier
    _image_classifier = pipeline(
        "image-classification",
        model="dima806/ai_vs_human_generated_image_detection",
        device=0 if torch.cuda.is_available() else -1
    )
    _video_classifier = pipeline(
        "video-classification",
        model="Naman712/Deep-fake-detection",
        device=0 if torch.cuda.is_available() else -1
    )
    yield  # app runs here
    # cleanup on shutdown (if needed)

def get_image_classifier():
    return _image_classifier

def get_video_classifier():
    return _video_classifier
```

**Memory requirement:** ViT-Base (~330 MB) + ResNext50+LSTM (~200 MB) = ~530 MB total. Cloud Run instance should be set to **1 GB minimum** (down from the earlier 2 GB estimate).

---

### Updated `requirements.txt` (backend)

```
fastapi==0.111.0
uvicorn==0.29.0
pydantic-settings==2.2.1
firebase-admin==6.5.0
transformers==4.41.0
torch==2.3.0
torchvision==0.18.0
opencv-python-headless==4.9.0.80
python-multipart==0.0.9
httpx==0.27.0
python-magic==0.4.27
Pillow==10.3.0
```

---

## 7. PDF Report Generation

- Library: `jsPDF` + `jspdf-autotable` (client-side, no server round-trip needed).
- Single detection report: includes header, user info, media thumbnail, result badge, confidence bar, model metadata, timestamp.
- Summary report: includes aggregate table of detections in the selected date range + a bar chart rendered as canvas then embedded as image.
- Reports are generated entirely in the browser and triggered by a download button.

## Color Palette (Finalized)

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#1e3a5f` | Navbar, headings, primary buttons |
| `accent` | `#00bcd4` | Tags, links, secondary buttons |
| `success` | `#4caf50` | "Authentic" badge, success states |
| `danger` | `#ff4d4d` | "AI-Generated" badge, delete buttons |
| `warning` | `#ff6b6b` | Alert/limit warnings |
| `background` | `#f5f7fa` | Page background (light theme) |
| `dark-bg` | `#0d1b2a` | Admin pages background |
| `dark-card` | `#162739` | Admin cards/panels |
| `text-primary` | `#2c3e50` | Main text (light theme) |
| `text-light` | `#ffffff` | Main text (dark theme) |
| `border` | `#e0e0e0` | Borders, dividers |

**Typography:**
- **Font Family:** Sans-serif (Inter, Roboto, or system font stack)
- **Hero:** 64–80px, bold
- **Page Title:** 36–48px, bold
- **Section Tag:** 12px, uppercase, semi-bold, letter-spacing: 1px
- **Body:** 16px, regular
- **Button:** 16px, medium

---

## 10. UI Design System

**All UI mockups are documented in detail in `ui-design-reference.md`.**

Key design features from mockups:
- **Landing page:** Hero section with tabbed upload interface (Image/Video)
- **Detection results:** Three-panel layout (result badge | heatmap | model signals)
- **Admin pages:** Dark theme (`#0d1b2a` background, white text)
- **History tables:** Clean white background with hover states
- **Buttons:** Teal outline (secondary), Navy solid (primary), Red solid (danger)
- **Badges:** Pill-shaped, colored by classification (red for AI-Generated, green for Authentic)
- **Cards:** Subtle shadow, rounded corners (8px)

---

## 11. Environment Variables

### Frontend (`.env`)

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FASTAPI_BASE_URL=
```

### Backend (`.env`)

```
FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT_JSON=     # JSON string of service account key
HF_IMAGE_MODEL=dima806/ai_vs_human_generated_image_detection
HF_VIDEO_MODEL=Naman712/Deep-fake-detection
HF_CACHE_DIR=/app/.cache/huggingface  # Cache dir inside Docker container
MAX_IMAGE_SIZE_MB=50
MAX_VIDEO_SIZE_MB=500
INFERENCE_TIMEOUT_SECONDS=60
```

> **Note:** Models are downloaded from Hugging Face Hub on first startup and cached in `HF_CACHE_DIR`. In Docker, pre-bake the cache into the image using `RUN python -c "from transformers import pipeline; pipeline('image-classification', model='dima806/ai_vs_human_generated_image_detection')"` during build to avoid cold-start downloads on Cloud Run.

---

## 12. Deployment Architecture

```
┌─────────────────────────┐     ┌────────────────────────────────┐
│   Firebase Hosting      │     │   Google Cloud Run             │
│   (React SPA)           │     │   (FastAPI Docker Container)   │
│                         │     │                                │
│   firebase.json config  │     │   Dockerfile                   │
│   SPA redirect rules    │     │   Auto-scales 0 → N instances  │
└─────────────────────────┘     └────────────────────────────────┘
          │                                   │
          └──────────── HTTPS ────────────────┘
                    (CORS configured in FastAPI)
```

### Dockerfile (FastAPI)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV and python-magic
RUN apt-get update && apt-get install -y \
    libglib2.0-0 libsm6 libxext6 libxrender-dev libmagic1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-bake Hugging Face model cache into the image
# This avoids cold-start downloads on Cloud Run
RUN python -c "\
from transformers import pipeline; \
pipeline('image-classification', model='dima806/ai_vs_human_generated_image_detection'); \
pipeline('video-classification', model='Naman712/Deep-fake-detection'); \
print('Models cached successfully')"

COPY . .

EXPOSE 8080
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

> **Cloud Run settings:** Memory = 1 GB, CPU = 1, min-instances = 1 (to avoid cold starts in production demo).

### Firebase Hosting `firebase.json` (SPA config)

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```
