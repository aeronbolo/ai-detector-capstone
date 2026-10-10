/**
 * detectionService — calls FastAPI endpoints and writes results to Firestore.
 *
 * Upload strategy (no Firebase Storage required):
 *   Files are sent as multipart/form-data directly to FastAPI.
 *   FastAPI handles the file in-process, runs the model, and returns the result.
 *   The Firestore record stores metadata only (no storageUrl / storagePath).
 */

import { doc, setDoc, getDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import apiClient from '@/lib/apiClient'

// ─────────────────────────────────────────────────────────────────────────────
// FastAPI calls — multipart/form-data
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send an image file directly to FastAPI for AI detection.
 *
 * @param {{ formData: FormData, detectionId: string }} params
 * @returns {Promise<{ label, confidence, model, processing_time_ms }>}
 */
export async function runImageDetection({ formData, detectionId }) {
  try {
    console.log('[detection] Sending to:', import.meta.env.VITE_FASTAPI_BASE_URL, '→ POST /detect/image')
    const { data } = await apiClient.post('/detect/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    console.log('[detection] TruthScan result:', data)
    return data
  } catch (err) {
    console.error('[detection] API error status:', err.status, 'message:', err.message)
    if (err.status === 0 || err.status === undefined || err.status === null) {
      throw new Error('Cannot connect to the analysis server. Please check your internet connection and try again.')
    }
    throw new Error(err.message || 'Image detection failed. Please try again.')
  }
}

export async function runImageDetectionFromUrl({ url, detectionId }) {
  try {
    console.log('[detection] URL scan → POST /detect/image-url')
    const { data } = await apiClient.post('/detect/image-url', { url, detection_id: detectionId })
    console.log('[detection] URL result:', data)
    return data
  } catch (err) {
    console.error('[detection] URL API error:', err.status, err.message)
    if (err.status === 0 || err.status === undefined || err.status === null) {
      throw new Error('Cannot connect to the analysis server. Please check your internet connection and try again.')
    }
    throw new Error(err.message || 'Image URL detection failed. Please try again.')
  }
}

/**
 * Send a video file directly to FastAPI for AI detection.
 *
 * @param {{ formData: FormData, detectionId: string }} params
 * @returns {Promise<{ label, confidence, model, processing_time_ms, frames_analysed }>}
 */
export async function runVideoDetection({ formData, detectionId }) {
  try {
    const { data } = await apiClient.post('/detect/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 180000,
    })
    return data
  } catch (err) {
    if (err.status === 0 || !err.status) {
      throw new Error('Cannot connect to the analysis server. Please check your internet connection and try again.')
    }
    throw new Error(err.message || 'Video detection failed. Please try again.')
  }
}

export async function runVideoDetectionFromUrl({ url, detectionId }) {
  try {
    console.log('[detection] Video URL scan → POST /detect/video-url')
    const { data } = await apiClient.post('/detect/video-url', { url, detection_id: detectionId }, {
      timeout: 180000,
    })
    console.log('[detection] Video URL result:', data)
    return data
  } catch (err) {
    console.error('[detection] Video URL API error:', err.status, err.message)
    if (err.status === 0 || !err.status) {
      throw new Error('Cannot connect to the analysis server. Please check your internet connection and try again.')
    }
    throw new Error(err.message || 'Video URL detection failed. Please try again.')
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Simulated result — used when FastAPI backend is not running
// Lets the full UI flow work end-to-end during frontend-only development.
// ─────────────────────────────────────────────────────────────────────────────

function simulateResult(detectionId, fileType) {
  const seed = detectionId.charCodeAt(0) + detectionId.charCodeAt(1)
  const confidence = 50 + (seed % 45)
  const label = confidence > 65 ? 'AI-Generated' : 'Real'
  return {
    detection_id: detectionId,
    label,
    confidence,
    model: fileType === 'video'
      ? 'eftt/VideoMae-ffc23-deepfake-detector (offline)'
      : 'prithivMLmods/deepfake-detector-model-v1 (offline)',
    processing_time_ms: 800 + (seed * 7),
    frames_analysed: fileType === 'video' ? 32 : null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Firestore writes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Save a completed detection result to Firestore.
 * No storageUrl / storagePath since we're bypassing Firebase Storage.
 */
export async function saveDetection({
  detectionId,
  userId,
  fileName,
  fileType,
  label,
  confidence,
  model,
  processingTimeMs,
  framesAnalysed,
}) {
  const detectionRef = doc(db, 'detections', detectionId)
  await setDoc(detectionRef, {
    detectionId,
    userId,
    fileName,
    fileType,
    // No storageUrl / storagePath — file sent directly to FastAPI
    storageUrl: null,
    storagePath: null,
    label,
    confidence,
    model,
    processingTimeMs: processingTimeMs || 0,
    framesAnalysed: framesAnalysed || null,
    status: 'completed',
    deleted: false,
    createdAt: serverTimestamp(),
  })

  // Increment user's detection counter
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, { detectionCount: increment(1) })
  } catch {
    // Non-critical — don't block the result page if this fails
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Firestore reads
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single detection record by ID.
 * Returns null if not found or soft-deleted.
 */
export async function getDetection(detectionId) {
  const snap = await getDoc(doc(db, 'detections', detectionId))
  if (!snap.exists()) return null
  const data = snap.data()
  if (data.deleted) return null
  return { id: snap.id, ...data }
}

/**
 * Soft-delete a detection (sets deleted: true).
 */
export async function deleteDetection(detectionId) {
  await updateDoc(doc(db, 'detections', detectionId), { deleted: true })
}
