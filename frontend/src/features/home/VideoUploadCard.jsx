/**
 * VideoUploadCard — drag-and-drop video upload.
 * Sends file directly to FastAPI (no Firebase Storage).
 * Supports MP4, MOV, AVI. Max 500 MB.
 */

import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { prepareUpload, simulateProgress } from '@/features/home/uploadService'
import { runVideoDetection, saveDetection } from '@/features/detection/detectionService'
import Alert from '@/components/ui/Alert'

const ACCEPTED_EXT = '.mp4,.mov,.avi'
const MAX_MB = 500

function validateFile(f) {
  const ext = f.name.split('.').pop().toLowerCase()
  if (!['mp4', 'mov', 'avi'].includes(ext)) {
    return 'Unsupported format. Please upload an MP4, MOV, or AVI video.'
  }
  if (f.size > MAX_MB * 1024 * 1024) {
    return `File too large. Maximum size is ${MAX_MB} MB.`
  }
  return null
}

export default function VideoUploadCard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [file, setFile]                     = useState(null)
  const [dragging, setDragging]             = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  // idle | uploading | analysing | done | error
  const [stage, setStage]                   = useState('idle')
  const [error, setError]                   = useState('')
  const inputRef = useRef(null)

  // ── file selection ───────────────────────────────────────────────────────────
  function handleFileSelect(f) {
    const msg = validateFile(f)
    if (msg) return setError(msg)
    setError('')
    setFile(f)
    setStage('idle')
  }

  // ── drag-drop ────────────────────────────────────────────────────────────────
  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFileSelect(f)
  }, [])
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  function clearFile() {
    setFile(null)
    setStage('idle')
    setError('')
    setUploadProgress(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  // ── run detection ────────────────────────────────────────────────────────────
  async function handleRun() {
    if (!file) return
    if (!currentUser) return navigate('/login')

    setError('')

    const { detectionId, formData } = prepareUpload(file, 'video')

    try {
      // Step 1: Fake progress while file transfers
      setStage('uploading')
      setUploadProgress(0)
      const finishProgress = simulateProgress(setUploadProgress)

      // Step 2: Send to FastAPI — longer timeout for video
      setStage('analysing')
      const result = await runVideoDetection({ formData, detectionId })
      finishProgress()

      // Step 3: Persist metadata to Firestore (non-blocking)
      saveDetection({
        detectionId,
        userId:           currentUser.uid,
        fileName:         file.name,
        fileType:         'video',
        label:            result.label,
        confidence:       result.confidence,
        model:            result.model,
        processingTimeMs: result.processing_time_ms,
        framesAnalysed:   result.frames_analysed,
      }).catch(err => {
        console.warn('Firestore save failed (non-critical):', err.message)
      })

      setStage('done')
      navigate(`/results/${detectionId}`, {
        state: {
          detectionId,
          label:           result.label,
          confidence:      result.confidence,
          model:           result.model,
          fileName:        file.name,
          fileType:        'video',
          processingTimeMs: result.processing_time_ms,
          heatmapUrl:      null,
          analysisDetails: null,
          warnings:        [],
        }
      })
    } catch (err) {
      setStage('error')
      setError(err.message || 'Detection failed. Please try again.')
    }
  }

  const isRunning = stage === 'uploading' || stage === 'analysing'

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Section label */}
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Upload video file</h3>

      {error && (
        <Alert type="error" message={error} onClose={() => setError('')} className="mb-3" />
      )}

      {/* Dropzone / File preview */}
      {!file ? (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
            min-h-[200px] flex items-center justify-center
            ${dragging
              ? 'border-accent bg-accent/5'
              : 'border-gray-300 hover:border-accent hover:bg-gray-50'
            }`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14
                     M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Choose MP4, MOV, or AVI</p>
              <p className="text-xs text-gray-400 mt-1">or drag and drop here · Max {MAX_MB} MB</p>
            </div>
            <p className="text-xs text-gray-400">Files are validated before analysis</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXT}
            className="hidden"
            onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
          />
        </div>
      ) : (
        /* Selected file row */
        <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14
                   M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
            <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <button
            onClick={clearFile}
            className="text-gray-400 hover:text-danger transition-colors shrink-0"
            aria-label="Remove file"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Upload progress */}
      {stage === 'uploading' && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Sending to AI model…</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Analysis spinner */}
      {stage === 'analysing' && (
        <div className="mt-4 flex items-center gap-2 text-sm text-accent">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Running AI analysis… This may take up to 60 s for videos.
        </div>
      )}

      {/* Run Detection button */}
      <button
        onClick={handleRun}
        disabled={!file || isRunning}
        className={`mt-5 w-full py-3.5 rounded-lg font-semibold text-white transition-all
          ${file && !isRunning
            ? 'bg-primary hover:bg-primary-dark shadow-md hover:shadow-lg'
            : 'bg-gray-300 cursor-not-allowed'
          }`}
      >
        {isRunning ? 'Processing…' : 'Run Detection'}
      </button>
    </div>
  )
}
