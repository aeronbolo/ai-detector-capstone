# Requirements — AI Detector Capstone Project

## Project Overview

A production-quality web system that detects AI-generated images and videos using self-hosted open-source deep learning models (CNN for images, LSTM for video). The system is built on React + Vite + Tailwind CSS (frontend), Firebase (auth, database, storage, hosting), and FastAPI (AI inference backend).

---

## Functional Requirements

### FR-1: Authentication

- **FR-1.1** Users must be able to register with email and password via Firebase Authentication.
- **FR-1.2** Users must be able to log in and log out securely.
- **FR-1.3** Users must be able to reset their password via email.
- **FR-1.4** Google OAuth sign-in must be supported as an alternative login method.
- **FR-1.5** Authenticated sessions must persist across page refreshes.
- **FR-1.6** Unauthenticated users must be redirected to the login page when accessing protected routes.

---

### FR-2: Media Upload

- **FR-2.1** Authenticated users must be able to upload image files (JPEG, PNG, WebP) for AI detection analysis.
- **FR-2.2** Authenticated users must be able to upload video files (MP4, MOV, AVI) for AI detection analysis.
- **FR-2.3** The system must enforce a maximum file size of 50 MB for images and 500 MB for videos.
- **FR-2.4** The system must display upload progress to the user in real time.
- **FR-2.5** Uploaded media must be stored in Firebase Storage under the authenticated user's folder.
- **FR-2.6** The system must reject unsupported file types and display a clear error message.

---

### FR-3: AI Detection

- **FR-3.1** Upon upload completion, the system must automatically submit the media file to the FastAPI backend for inference.
- **FR-3.2** For images, the backend must use a CNN-based model to classify the image as AI-generated or real.
- **FR-3.3** For videos, the backend must use an LSTM-based model (processing frame sequences) to classify the video as AI-generated or real.
- **FR-3.4** The detection result must include:
  - Classification label: `AI-Generated` or `Real`
  - Confidence score (0–100%)
  - Model used
  - Processing time (ms)
- **FR-3.5** The system must handle inference timeouts gracefully and notify the user if analysis exceeds 60 seconds.
- **FR-3.6** Detection results must be saved to Firestore under the authenticated user's record.

---

### FR-4: Detection Results

- **FR-4.1** After analysis, the user must be shown a results page displaying the classification, confidence score, and a visual indicator (e.g., color-coded badge).
- **FR-4.2** The results page must display a thumbnail or preview of the analysed media.
- **FR-4.3** Users must be able to share or download the result summary.

---

### FR-5: History

- **FR-5.1** Users must be able to view a paginated list of all their past detection submissions.
- **FR-5.2** Each history entry must show: file name, media type, classification result, confidence score, and submission date.
- **FR-5.3** Users must be able to filter history by media type (image/video) and classification result (AI-Generated/Real).
- **FR-5.4** Users must be able to delete individual history entries (soft delete with Firestore update).
- **FR-5.5** Clicking a history entry must navigate to the full detection result detail view.

---

### FR-6: Reports (PDF)

- **FR-6.1** Users must be able to generate a PDF report for any individual detection result.
- **FR-6.2** Users must be able to generate a summary PDF report covering a selected date range of detections.
- **FR-6.3** PDF reports must include: user details, media thumbnail, classification result, confidence score, model metadata, and timestamp.
- **FR-6.4** Generated reports must be downloadable directly from the browser.
- **FR-6.5** Reports must be accessible from the GET /reports API endpoint.

---

### FR-7: User Dashboard

- **FR-7.1** The dashboard must display summary statistics for the authenticated user:
  - Total detections submitted
  - Count of AI-Generated vs Real results
  - Detection activity chart (last 30 days)
- **FR-7.2** The dashboard must show the user's 5 most recent detections with quick-access links.
- **FR-7.3** The dashboard must provide a prominent call-to-action to upload new media.

---

### FR-8: Admin Dashboard

- **FR-8.1** Admin users (identified by a `role: admin` field in Firestore) must have access to an admin-only dashboard.
- **FR-8.2** The admin dashboard must display platform-wide statistics:
  - Total registered users
  - Total detections across all users
  - AI-Generated vs Real ratio
- **FR-8.3** Admins must be able to view a list of all registered users with their detection counts.
- **FR-8.4** Admins must be able to disable or enable user accounts.
- **FR-8.5** Admins must be able to view the system health status (FastAPI `/health` endpoint result).
- **FR-8.6** Non-admin users must not be able to access any admin routes (enforced both client-side and via Firestore security rules).

---

### FR-9: User Management (Admin)

- **FR-9.1** Admins must be able to search users by email or UID.
- **FR-9.2** Admins must be able to view a user's full detection history.
- **FR-9.3** Admins must be able to delete a user account and all associated data.

---

### FR-10: Analytics (Admin)

- **FR-10.1** The admin analytics page must display time-series charts of total detections per day/week/month.
- **FR-10.2** Analytics must show a breakdown of detections by media type and classification.
- **FR-10.3** Analytics data must be derived from the `detections` Firestore collection.

---

## Non-Functional Requirements

### NFR-1: Performance

- **NFR-1.1** The React frontend must achieve a Lighthouse performance score ≥ 80 on desktop.
- **NFR-1.2** Image inference must complete within 10 seconds for files under 10 MB.
- **NFR-1.3** Video inference must complete within 60 seconds for files under 100 MB.
- **NFR-1.4** The FastAPI backend must support at least 10 concurrent inference requests without degradation.

### NFR-2: Security

- **NFR-2.1** All API calls to FastAPI must be authenticated using Firebase ID tokens (JWT verification on the backend).
- **NFR-2.2** Firestore security rules must restrict read/write access so users can only access their own data.
- **NFR-2.3** Admin-level Firestore operations must be gated by a `role: admin` claim check.
- **NFR-2.4** Firebase Storage security rules must restrict file access to the uploading user only.
- **NFR-2.5** All HTTP communication must use HTTPS.
- **NFR-2.6** Uploaded files must be validated server-side (MIME type and size checks in FastAPI) before inference.

### NFR-3: Reliability

- **NFR-3.1** The system must handle FastAPI backend downtime gracefully, displaying a user-friendly error state.
- **NFR-3.2** Firebase operations must use retry logic for transient failures.
- **NFR-3.3** Failed detections must be logged to the `activity_logs` Firestore collection for debugging.

### NFR-4: Scalability

- **NFR-4.1** The FastAPI service must be containerised (Docker) and deployable to Google Cloud Run for automatic scaling.
- **NFR-4.2** Firestore collections must be structured to support efficient querying as user counts grow (composite indexes where needed).

### NFR-5: Usability & Accessibility

- **NFR-5.1** The UI must be fully responsive across mobile, tablet, and desktop viewports.
- **NFR-5.2** The UI must meet WCAG 2.1 AA accessibility standards (keyboard navigation, ARIA labels, sufficient colour contrast).
- **NFR-5.3** Loading states must be shown for all async operations (uploads, inference, data fetching).
- **NFR-5.4** All error states must display actionable, human-readable messages.

### NFR-6: Maintainability

- **NFR-6.1** Frontend code must follow a feature-based folder structure.
- **NFR-6.2** All environment-specific values (API URLs, Firebase config) must be stored in `.env` files, not hardcoded.
- **NFR-6.3** The FastAPI backend must include a `/health` endpoint returning service status and model load status.
- **NFR-6.4** Code must include JSDoc/docstring comments for all public functions and API routes.

### NFR-7: Deployment

- **NFR-7.1** The React frontend must be deployable to Firebase Hosting via `firebase deploy`.
- **NFR-7.2** The FastAPI backend must be deployable to Google Cloud Run using a `Dockerfile`.
- **NFR-7.3** The deployment process must be documented in a `README.md` at the project root.
