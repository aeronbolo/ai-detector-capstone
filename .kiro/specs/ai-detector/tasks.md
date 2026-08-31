# Tasks — AI Detector Capstone Project

Implementation tasks are organised into 12 phases matching the project blueprint. Each task references the relevant requirements (FR/NFR) and design sections.

---

## Phase 1 — Project Setup & Requirements

- [ ] **1.1** Initialise the React project with Vite and Tailwind CSS. Configure `vite.config.js`, `tailwind.config.js`, and `postcss.config.js`. *(NFR-6.1)*
- [ ] **1.2** Initialise the FastAPI project. Create the folder structure defined in `design.md § 3`. Add `requirements.txt` with pinned dependencies: `fastapi==0.111.0`, `uvicorn==0.29.0`, `pydantic-settings==2.2.1`, `firebase-admin==6.5.0`, `transformers==4.41.0`, `torch==2.3.0`, `torchvision==0.18.0`, `opencv-python-headless==4.9.0.80`, `python-multipart==0.0.9`, `httpx==0.27.0`, `python-magic==0.4.27`, `Pillow==10.3.0`. *(NFR-6.2)*
- [ ] **1.3** Create a Firebase project. Enable Authentication (Email/Password + Google), Firestore, and Storage. Record all config values. *(FR-1)*
- [ ] **1.4** Set up `.env` files for both frontend and backend using the variable names defined in `design.md § 8`. Add both `.env` files to `.gitignore`. *(NFR-6.2)*
- [ ] **1.5** Initialise a Git repository. Create a `README.md` at the project root with project overview, setup instructions, and deployment steps. *(NFR-7.3)*
- [ ] **1.6** Create `firebase.json` and `.firebaserc` for Firebase Hosting with SPA rewrite rules. *(NFR-7.1)*

---

## Phase 2 — Architecture & Configuration

- [ ] **2.1** Implement `src/lib/firebase.js` — initialise Firebase app and export `auth`, `db` (Firestore), and `storage` instances. *(design.md § 2)*
- [ ] **2.2** Implement `src/lib/apiClient.js` — Axios instance pointing to `VITE_FASTAPI_BASE_URL`. Add a request interceptor that attaches the current user's Firebase ID token as `Authorization: Bearer <token>`. *(NFR-2.1)*
- [ ] **2.3** Implement `src/context/AuthContext.jsx` — wrap the app in a provider that exposes `currentUser`, `loading`, `login`, `logout`, `register`, `loginWithGoogle`, and `resetPassword` helpers. *(FR-1)*
- [ ] **2.4** Implement `src/router/AppRouter.jsx` with React Router v6. Add `ProtectedRoute` (redirects to `/login` if not authenticated) and `AdminRoute` (redirects to `/dashboard` if not admin) HOC wrappers. *(FR-1.6, FR-8.6)*
- [ ] **2.5** Implement `app/config.py` in FastAPI using `pydantic-settings` to load all env vars. *(NFR-6.2)*
- [ ] **2.6** Implement `app/dependencies.py` — a FastAPI dependency `get_current_user` that verifies the Firebase ID token using `firebase_admin.auth.verify_id_token`. Return 401 on failure. *(NFR-2.1)*
- [ ] **2.7** Configure CORS in `app/main.py` to allow requests from the Firebase Hosting domain and `localhost:5173`. *(NFR-2.5)*
- [ ] **2.8** Write Firestore security rules covering all collections as defined in `design.md § 4`. Deploy via Firebase CLI. *(NFR-2.2, NFR-2.3)*
- [ ] **2.9** Write Firebase Storage security rules restricting file access to the uploading user. Deploy via Firebase CLI. *(NFR-2.4)*

---

## Phase 3 — React & Firebase Setup

- [ ] **3.1** Build shared UI primitives in `src/components/ui/`: `Button`, `Badge`, `Card`, `Modal`, `Spinner`, `Alert`, `Input`, `Select`. *(NFR-5.2)*
- [ ] **3.2** Build layout components in `src/components/layout/`: `Navbar` (with auth state), `Sidebar` (with nav links + admin section), `PageWrapper`, `Footer`. *(NFR-5.1)*
- [ ] **3.3** Implement `src/App.jsx` — wrap the router in `AuthContext`. Show a full-page spinner while auth state is loading. *(FR-1.5)*
- [ ] **3.4** Implement the `NotFoundPage` (404) component. *(design.md § 2)*
- [ ] **3.5** Create Firestore composite indexes defined in `design.md § 4` via `firestore.indexes.json` and deploy. *(NFR-4.2)*

---

## Phase 4 — Authentication

- [ ] **4.1** Build `LoginPage.jsx` — email/password form + Google sign-in button. Show loading state, handle Firebase error codes with user-friendly messages. *(FR-1.1, FR-1.2, FR-1.4)*
- [ ] **4.2** Build `RegisterPage.jsx` — name, email, password, confirm password. On success, create a user document in Firestore `users/{uid}` with `role: "user"`. *(FR-1.1)*
- [ ] **4.3** Build `ForgotPasswordPage.jsx` — email input that calls `sendPasswordResetEmail`. *(FR-1.3)*
- [ ] **4.4** Implement `src/features/auth/authService.js` — thin wrappers around Firebase Auth methods used by AuthContext. *(FR-1)*
- [ ] **4.5** Implement the `useAuth` custom hook that consumes `AuthContext`. *(design.md § 2)*
- [ ] **4.6** Add logout functionality to the Navbar with confirmation. *(FR-1.2)*
- [ ] **4.7** Write tests for auth flow: successful login, failed login (wrong password), registration, password reset email sent. *(NFR-3)*

---

## Phase 5 — Media Upload Module

- [ ] **5.1** Build `UploadDropzone.jsx` — drag-and-drop + click-to-browse file input. Validate file type (image: JPEG/PNG/WebP, video: MP4/MOV/AVI) and size (50 MB image, 500 MB video) client-side before upload. *(FR-2.1, FR-2.2, FR-2.3, FR-2.6)*
- [ ] **5.2** Build `UploadProgress.jsx` — progress bar component driven by Firebase Storage `uploadBytesResumable` percentage events. *(FR-2.4)*
- [ ] **5.3** Implement `src/features/upload/uploadService.js`:
  - Generate a unique `detectionId` (nanoid or UUID).
  - Upload file to `users/{uid}/images/{detectionId}_{filename}` or `users/{uid}/videos/...`.
  - Retrieve download URL after upload.
  - Return `{ detectionId, storageUrl, storagePath }`. *(FR-2.5)*
- [ ] **5.4** Build `UploadPage.jsx` — orchestrate dropzone, progress, and post-upload navigation. After upload, automatically trigger detection (Phase 6). *(FR-2, FR-3.1)*
- [ ] **5.5** Implement `app/utils/file_validator.py` in FastAPI — validate MIME type using `python-magic` and enforce size limits. Raise `HTTPException(422)` on failure. *(NFR-2.6)*

---

## Phase 6 — FastAPI Backend

- [ ] **6.1** Implement `app/routers/health.py` — `GET /health` endpoint returning service status, model load status, and uptime. No auth required. *(FR-8.5, NFR-6.3)*
- [ ] **6.2** Implement `app/services/storage_service.py` — download a file from a Firebase Storage URL to a temp directory. Use `httpx` with a timeout matching `INFERENCE_TIMEOUT_SECONDS`. *(FR-3.1)*
- [ ] **6.3** Implement `app/services/video_processor.py` — use OpenCV to extract N=32 frames at uniform intervals from a video file. Return frames as a NumPy tensor. *(FR-3.3)*
- [ ] **6.4** Implement `app/models/schemas.py` — Pydantic models for all request/response bodies defined in `design.md § 5`. *(design.md § 5)*
- [ ] **6.5** Implement `app/routers/detection.py`:
  - `POST /detect-image` — validate file, download, run CNN inference, return result.
  - `POST /detect-video` — validate file, download, extract frames, run LSTM inference, return result.
  - Both endpoints protected by `get_current_user` dependency.
  - Log failures to `activity_logs` via Firestore Admin SDK. *(FR-3.1 – FR-3.6, NFR-2.1, NFR-3.3)*
- [ ] **6.6** Implement `app/routers/history.py` — `GET /history` with `user_id`, `limit`, `offset` query params. Query Firestore `detections` collection. *(FR-5)*
- [ ] **6.7** Implement `app/routers/reports.py` — `GET /reports` returning metadata from Firestore `reports` collection. *(FR-6.5)*
- [ ] **6.8** Implement `app/utils/logger.py` — structured JSON logging using Python `logging`. *(NFR-3.3)*
- [ ] **6.9** Write FastAPI unit tests for `/health`, `/detect-image` (mocked model), and `/detect-video` (mocked model). *(NFR-3)*

---

## Phase 7 — AI Model Integration

- [ ] **7.1** Add `transformers==4.41.0`, `torch==2.3.0`, `torchvision==0.18.0`, and `Pillow==10.3.0` to `requirements.txt`. Verify the full `requirements.txt` matches `design.md § 6`. *(design.md § 6)*
- [ ] **7.2** Implement `app/models/ml/model_loader.py` — FastAPI `lifespan` context manager that loads both Hugging Face pipelines at startup:
  - `pipeline("image-classification", model="dima806/ai_vs_human_generated_image_detection")`
  - `pipeline("video-classification", model="Naman712/Deep-fake-detection")`
  - Expose `get_image_classifier()` and `get_video_classifier()` singletons.
  - Set `cnn_model_loaded` and `lstm_model_loaded` flags for the `/health` endpoint. *(FR-3.2, FR-3.3, design.md § 6)*
- [ ] **7.3** Implement `app/models/ml/image_model.py` — wrapper around the image pipeline:
  - `predict(image_path: str) -> dict`
  - Maps `LABEL_1` → `"AI-Generated"`, `LABEL_0` → `"Real"`
  - Returns `{ label, confidence, model }` *(FR-3.2, FR-3.4)*
- [ ] **7.4** Implement `app/models/ml/video_model.py` — wrapper around the video pipeline:
  - `predict(video_path: str) -> dict`
  - Maps `"fake"` → `"AI-Generated"`, `"real"` → `"Real"`
  - Returns `{ label, confidence, model, frames_analysed }` *(FR-3.3, FR-3.4)*
- [ ] **7.5** Implement `app/services/inference_service.py` — orchestrates the full flow:
  - Download file from Firebase Storage URL → temp file
  - Validate MIME type and size
  - Route to `image_model.predict()` or `video_model.predict()` based on file type
  - Enforce timeout (`INFERENCE_TIMEOUT_SECONDS`)
  - Return structured result or raise appropriate HTTP exception *(FR-3.4, FR-3.5, FR-3.6)*
- [ ] **7.6** Wire inference service into `app/routers/detection.py` (replace stub from Phase 6.5). *(FR-3.1)*
- [ ] **7.7** Update `Dockerfile` to pre-bake the Hugging Face model cache during Docker build (as defined in `design.md § 12`) so Cloud Run doesn't download models on cold start. *(NFR-1.2, NFR-1.3)*
- [ ] **7.8** Run end-to-end integration test locally: upload a real image → `/detect-image` → verify label + confidence returned. Upload a real video → `/detect-video` → verify label + confidence returned. *(FR-3.1 – FR-3.6)*

---

## Phase 8 — Analytics

- [ ] **8.1** Install `recharts` in the frontend. Create chart wrapper components in `src/components/charts/`: `DetectionBarChart`, `DetectionLineChart`, `DetectionPieChart`. *(FR-7.1, FR-10.1, FR-10.2)*
- [ ] **8.2** Implement `src/features/dashboard/dashboardService.js` — query Firestore `detections` for the current user to compute: total count, AI-Generated count, Real count, last-30-days time series. *(FR-7.1)*
- [ ] **8.3** Build `DashboardPage.jsx` — stat cards (total, AI-Gen, Real), activity bar chart (last 30 days), recent 5 detections list, upload CTA button. *(FR-7.1, FR-7.2, FR-7.3)*
- [ ] **8.4** Implement `src/features/admin/adminService.js` — query Firestore for platform-wide stats (all users count, all detections count, AI-Gen vs Real ratio, per-day series). *(FR-10.1 – FR-10.3)*
- [ ] **8.5** Build `AnalyticsPage.jsx` (admin) — time-series line chart (detections per day), pie chart (AI-Gen vs Real), bar chart (by media type). Date range filter (last 7/30/90 days). *(FR-10.1 – FR-10.3)*

---

## Phase 9 — Reports (PDF)

- [ ] **9.1** Install `jspdf` and `jspdf-autotable` in the frontend. Implement `src/lib/pdfGenerator.js` with:
  - `generateSingleReport(detection, userInfo)` — single detection PDF.
  - `generateSummaryReport(detections, userInfo, dateRange)` — summary PDF with table + embedded chart. *(FR-6.1, FR-6.2, FR-6.3)*
- [ ] **9.2** Build `ReportsPage.jsx` — list of past reports with download links. Date range picker to generate a new summary report. Per-detection "Download PDF" button accessible from results and history pages. *(FR-6.4)*
- [ ] **9.3** On report generation, save a metadata record to Firestore `reports/{reportId}` so it appears in the reports list. *(FR-6.5)*
- [ ] **9.4** Implement `src/features/reports/reportsService.js` — read/write to Firestore `reports` collection. *(FR-6)*

---

## Phase 10 — Admin Dashboard

- [ ] **10.1** Build `AdminDashboardPage.jsx` — platform stats cards, recent activity feed, system health widget (polls `GET /health`). *(FR-8.1, FR-8.2, FR-8.5)*
- [ ] **10.2** Build `UserManagementPage.jsx` — paginated user table with search by email/UID, detection count column, disable/enable toggle, delete user action. *(FR-8.3, FR-8.4, FR-9.1, FR-9.2, FR-9.3)*
- [ ] **10.3** Implement `src/features/admin/adminService.js` functions: `getAllUsers()`, `toggleUserDisabled(uid)`, `deleteUser(uid)`, `getUserDetections(uid)`. *(FR-8.3, FR-8.4, FR-9)*
- [ ] **10.4** Enforce admin-only access: `AdminRoute` in the router redirects non-admins. Firestore security rules enforce server-side. *(FR-8.6, NFR-2.3)*
- [ ] **10.5** Add an "Admin" link in the Sidebar, visible only when `currentUser.role === "admin"`. *(FR-8.1)*

---

## Phase 11 — Testing

- [ ] **11.1** Frontend: Write component tests for `LoginPage`, `UploadDropzone`, `DetectionResultPage`, and `HistoryTable` using Vitest + React Testing Library. *(NFR-3)*
- [ ] **11.2** Frontend: Write integration tests for the upload → detection → results flow using MSW (Mock Service Worker) to mock FastAPI responses. *(FR-3)*
- [ ] **11.3** Backend: Write FastAPI integration tests using `httpx.AsyncClient` for all 5 endpoints with real Firebase test credentials. *(NFR-3)*
- [ ] **11.4** Run Lighthouse audit on the deployed frontend. Fix any issues to reach performance ≥ 80 and accessibility ≥ 90. *(NFR-1.1, NFR-5.2)*
- [ ] **11.5** Manual accessibility audit: keyboard navigation, screen reader compatibility (NVDA/VoiceOver), colour contrast check. *(NFR-5.2)*
- [ ] **11.6** Load test FastAPI with 10 concurrent requests using `locust` or `k6`. Verify inference does not degrade. *(NFR-1.4)*
- [ ] **11.7** Security review: verify Firestore rules block cross-user data access, Storage rules block unauthorised downloads, FastAPI rejects requests without valid tokens. *(NFR-2)*

---

## Phase 12 — Deployment

- [ ] **12.1** Write the `Dockerfile` for FastAPI as defined in `design.md § 9`. Build and test the image locally. *(NFR-7.2)*
- [ ] **12.2** Push the Docker image to Google Artifact Registry. Deploy to Google Cloud Run with `memory=1Gi`, `cpu=1`, `min-instances=1` (keeps models warm for demo). Set `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_JSON`, and other env vars as Cloud Run secrets. *(NFR-4.1, NFR-7.2)*
- [ ] **12.3** Build the React app (`npm run build`). Deploy to Firebase Hosting (`firebase deploy --only hosting`). *(NFR-7.1)*
- [ ] **12.4** Set `VITE_FASTAPI_BASE_URL` in the frontend `.env.production` to the Cloud Run service URL. *(NFR-6.2)*
- [ ] **12.5** Configure Firebase Hosting custom domain (if applicable) and verify HTTPS. *(NFR-2.5)*
- [ ] **12.6** Set up Google Cloud Run health check pointing to `GET /health`. *(NFR-6.3)*
- [ ] **12.7** Perform end-to-end smoke test on production: register → upload image → view result → download PDF → admin dashboard. *(FR-1 – FR-8)*
- [ ] **12.8** Finalise `README.md` with: project description, architecture diagram reference, local dev setup, environment variable table, Firebase setup steps, deployment commands. *(NFR-7.3)*

---

## Summary

| Phase | Focus | Key Deliverables |
|---|---|---|
| 1 | Project Setup | Repo, Vite app, FastAPI app, Firebase project, env files |
| 2 | Architecture | Firebase lib, API client, AuthContext, router guards, security rules |
| 3 | React/Firebase Setup | UI primitives, layout, App shell, Firestore indexes |
| 4 | Authentication | Login, Register, Forgot Password, protected routes |
| 5 | Upload Module | Dropzone, progress, Firebase Storage upload service |
| 6 | FastAPI Backend | All 5 API endpoints, file validator, structured logging |
| 7 | AI Integration | CNN + LSTM models, inference service, model loader singleton |
| 8 | Analytics | Dashboard stats + charts, admin analytics page |
| 9 | Reports | jsPDF single + summary reports, reports list page |
| 10 | Admin | Admin dashboard, user management, platform analytics |
| 11 | Testing | Unit, integration, Lighthouse, accessibility, load, security |
| 12 | Deployment | Docker → Cloud Run, Firebase Hosting, smoke test, README |
