/**
 * ImageUploadCard — drag-and-drop image upload.
 * Sends file directly to FastAPI (no Firebase Storage).
 * Matches mockup: dashed dropzone, teal icon, "Run Detection" button.
 */

import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { prepareUpload, simulateProgress } from '@/features/home/uploadService'
import { runImageDetection, saveDetection } from '@/features/detection/detectionService'
import Alert from '@/components/ui/Alert'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_MB = 50

export default function ImageUploadCard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [file, setFile]                   = useState(null)
  const [preview, setPreview]             = useState(null)
  const [dragging, setDragging]           = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  // idle | uploading | analysing | done | error
  const [stage, setStage]                 = useState('idle')
  const [error, setError]                 = useState('')
  const inputRef = useRef(null)

  // ── validation ──────────────────────────────────────────────────────────────
  function validateFile(f) {
    if (!ACCEPTED.includes(f.type)) {
      return 'Unsupported format. Please upload a JPG, PNG, or WebP image.'
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      return `File too large. Maximum size is ${MAX_MB} MB.`
    }
    return null
  }

  function handleFileSelect(f) {
    const msg = validateFile(f)
    if (msg) return setError(msg)
    setError('')
    setFile(f)
    setPreview(URL.createObjectURL(f))
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
    setPreview(null)
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

    // Build FormData — no Firebase Storage involved
    const { detectionId, formData } = prepareUpload(file, 'image')

    try {
      // Step 1: Show fake progress while file uploads + model warms up
      setStage('uploading')
      setUploadProgress(0)
      const finishProgress = simulateProgress(setUploadProgress)

      // Step 2: Send to FastAPI (multipart)
      setStage('analysing')
      const result = await runImageDetection({ formData, detectionId })
      finishProgress()  // jump to 100%

      // Step 3: Save result metadata to Firestore (non-blocking)
      // If Firestore is blocked by browser extension, we still navigate to results
      saveDetection({
        detectionId,
        userId:          currentUser.uid,
        fileName:        file.name,
        fileType:        'image',
        label:           result.label,
        confidence:      result.confidence,
        model:           result.model,
        processingTimeMs: result.processing_time_ms,
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
          fileType:        'image',
          processingTimeMs: result.processing_time_ms,
          // TruthScan extras
          heatmapUrl:      result.heatmap_url      || null,
          analysisDetails: result.analysis_details || null,
          warnings:        result.warnings         || [],
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
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Upload image file</h3>

      {error && (
        <Alert type="error" message={error} onClose={() => setError('')} className="mb-3" />
      )}

      {/* Dropzone / Preview */}
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
            {/* Teal circle icon — matches mockup */}
            <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Choose JPG, JPEG, or PNG</p>
              <p className="text-xs text-gray-400 mt-1">or drag and drop here · Max {MAX_MB} MB</p>
            </div>
            <p className="text-xs text-gray-400">Files are validated before analysis</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(',')}
            className="hidden"
            onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
          />
        </div>
      ) : (
        /* File preview */
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="relative">
            <img src={preview} alt="Preview" className="w-full max-h-48 object-cover" />
            <button
              onClick={clearFile}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7
                         flex items-center justify-center hover:bg-black/70 transition"
              aria-label="Remove file"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 truncate max-w-xs">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload progress bar */}
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
          Running AI analysis…
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
