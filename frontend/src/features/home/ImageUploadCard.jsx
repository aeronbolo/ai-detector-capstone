/**
 * ImageUploadCard — file upload OR URL input for AI image detection.
 * Two modes: File (drag-drop) | URL (paste link)
 */

import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { prepareUpload, simulateProgress } from '@/features/home/uploadService'
import { runImageDetection, runImageDetectionFromUrl, saveDetection } from '@/features/detection/detectionService'
import { nanoid } from 'nanoid'
import Alert from '@/components/ui/Alert'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_MB   = 50

function validateFile(f) {
  if (!ACCEPTED.includes(f.type))
    return 'Unsupported format. Please upload a JPG, PNG, or WebP image.'
  if (f.size > MAX_MB * 1024 * 1024)
    return `File too large. Maximum size is ${MAX_MB} MB.`
  return null
}

function validateUrl(url) {
  try {
    const u = new URL(url)
    if (!['http:', 'https:'].includes(u.protocol))
      return 'URL must start with http:// or https://'
    return null
  } catch {
    return 'Please enter a valid URL.'
  }
}

export default function ImageUploadCard() {
  const { currentUser } = useAuth()
  const navigate        = useNavigate()

  // mode: 'file' | 'url'
  const [mode, setMode]                   = useState('file')
  const [file, setFile]                   = useState(null)
  const [preview, setPreview]             = useState(null)
  const [urlInput, setUrlInput]           = useState('')
  const [dragging, setDragging]           = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [stage, setStage]                 = useState('idle')
  const [error, setError]                 = useState('')
  const inputRef = useRef(null)

  // ── file handling ────────────────────────────────────────────────────────────
  function handleFileSelect(f) {
    const msg = validateFile(f)
    if (msg) return setError(msg)
    setError('')
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setStage('idle')
  }

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

  function switchMode(m) {
    setMode(m)
    setError('')
    setStage('idle')
    clearFile()
    setUrlInput('')
  }

  // ── run detection ────────────────────────────────────────────────────────────
  async function handleRun() {
    if (!currentUser) return navigate('/login')
    setError('')

    const isReady = mode === 'file' ? !!file : urlInput.trim().length > 0
    if (!isReady) return

    if (mode === 'url') {
      const urlErr = validateUrl(urlInput.trim())
      if (urlErr) return setError(urlErr)
    }

    try {
      setStage('uploading')
      setUploadProgress(0)
      const finishProgress = simulateProgress(setUploadProgress)
      setStage('analysing')

      let result
      let fileName

      if (mode === 'file') {
        const { detectionId, formData } = prepareUpload(file, 'image')
        fileName = file.name
        result   = await runImageDetection({ formData, detectionId })
        finishProgress()

        saveDetection({
          detectionId,
          userId:          currentUser.uid,
          fileName,
          fileType:        'image',
          label:           result.label,
          confidence:      result.confidence,
          model:           result.model,
          processingTimeMs: result.processing_time_ms,
        }).catch(e => console.warn('Firestore save failed:', e.message))

        setStage('done')
        navigate(`/results/${result.detection_id || detectionId}`, {
          state: {
            detectionId:     result.detection_id || detectionId,
            label:           result.label,
            confidence:      result.confidence,
            model:           result.model,
            fileName,
            fileType:        'image',
            processingTimeMs: result.processing_time_ms,
            heatmapUrl:      result.heatmap_url      || null,
            analysisDetails: result.analysis_details || null,
            warnings:        result.warnings         || [],
          }
        })
      } else {
        // URL mode
        const detectionId = nanoid()
        const url         = urlInput.trim()
        fileName          = url.split('?')[0].split('/').pop() || 'image-from-url'

        result = await runImageDetectionFromUrl({ url, detectionId })
        finishProgress()

        saveDetection({
          detectionId,
          userId:          currentUser.uid,
          fileName,
          fileType:        'image',
          label:           result.label,
          confidence:      result.confidence,
          model:           result.model,
          processingTimeMs: result.processing_time_ms,
        }).catch(e => console.warn('Firestore save failed:', e.message))

        setStage('done')
        navigate(`/results/${detectionId}`, {
          state: {
            detectionId,
            label:           result.label,
            confidence:      result.confidence,
            model:           result.model,
            fileName,
            fileType:        'image',
            processingTimeMs: result.processing_time_ms,
            heatmapUrl:      result.heatmap_url      || null,
            analysisDetails: result.analysis_details || null,
            warnings:        result.warnings         || [],
          }
        })
      }
    } catch (err) {
      setStage('error')
      setError(err.message || 'Detection failed. Please try again.')
    }
  }

  const isRunning = stage === 'uploading' || stage === 'analysing'
  const canRun    = mode === 'file' ? !!file : urlInput.trim().length > 0

  return (
    <div>
      {/* Section label */}
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Upload image file</h3>

      {/* Mode tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
        <button
          onClick={() => switchMode('file')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-all
            ${mode === 'file' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload File
        </button>
        <button
          onClick={() => switchMode('url')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-all
            ${mode === 'url' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Paste URL
        </button>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError('')} className="mb-3" />
      )}

      {/* ── FILE MODE ── */}
      {mode === 'file' && (
        <>
          {!file ? (
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
                min-h-[180px] flex items-center justify-center
                ${dragging ? 'border-accent bg-accent/5' : 'border-gray-300 hover:border-accent hover:bg-gray-50'}`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Choose JPG, JPEG, or PNG</p>
                  <p className="text-xs text-gray-400 mt-1">or drag and drop · Max {MAX_MB} MB</p>
                </div>
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
              <div className="px-4 py-3 bg-gray-50">
                <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── URL MODE ── */}
      {mode === 'url' && (
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => { setUrlInput(e.target.value); setError('') }}
              placeholder="https://example.com/image.jpg"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
                         placeholder-gray-400"
            />
            {urlInput && (
              <button
                onClick={() => setUrlInput('')}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400">
            Paste a direct link to a JPG, PNG, or WebP image. The URL must be publicly accessible.
          </p>
        </div>
      )}

      {/* Progress bar */}
      {stage === 'uploading' && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Sending to AI model…</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }} />
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
        disabled={!canRun || isRunning}
        className={`mt-5 w-full py-3.5 rounded-lg font-semibold text-white transition-all
          ${canRun && !isRunning
            ? 'bg-primary hover:bg-primary-dark shadow-md hover:shadow-lg'
            : 'bg-gray-300 cursor-not-allowed'
          }`}
      >
        {isRunning ? 'Processing…' : 'Run Detection'}
      </button>
    </div>
  )
}
