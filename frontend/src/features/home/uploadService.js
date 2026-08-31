/**
 * uploadService — prepares a file for direct multipart upload to FastAPI.
 * Firebase Storage is NOT used (requires Blaze plan).
 * Instead the file is sent as FormData directly to the FastAPI backend.
 *
 * Exported helpers:
 *   prepareUpload(file, type) → { detectionId, formData }
 *   simulateProgress(onProgress) → starts a fake 0→90% ticker (resolved by caller at 100%)
 */

import { nanoid } from 'nanoid'

/**
 * Generate a unique detection ID and build the FormData payload.
 *
 * @param {File}               file   The file chosen by the user.
 * @param {'image'|'video'}    type   Media type.
 * @returns {{ detectionId: string, formData: FormData }}
 */
export function prepareUpload(file, type) {
  const detectionId = nanoid()
  const formData = new FormData()
  formData.append('file', file)
  formData.append('detection_id', detectionId)
  formData.append('file_type', type)
  return { detectionId, formData }
}

/**
 * Drive a fake progress bar from 0 → 90 in ~1.5 s so the user sees activity
 * while the file is being sent / the model is warming up.
 * Call the returned cancel function once the real request completes.
 *
 * @param {(pct: number) => void} onProgress
 * @returns {() => void}  cancel / complete function — call it to jump to 100
 */
export function simulateProgress(onProgress) {
  let pct = 0
  const id = setInterval(() => {
    pct = Math.min(pct + Math.random() * 12, 90)
    onProgress(Math.round(pct))
  }, 200)
  return () => {
    clearInterval(id)
    onProgress(100)
  }
}
