/**
 * VideoUploadCard — file upload OR URL input for deepfake video detection.
 * Two modes: File (drag-drop) | URL (paste link)
 */

import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { prepareUpload, simulateProgress } from '@/features/home/uploadService'
import { runVideoDetection, runVideoDetectionFromUrl, saveDetection } from '@/features/detection/detectionService'
import { nanoid } from 'nanoid'
import Alert from '@/components/ui/Alert'

const ACCEPTED_EXT = '.mp4,.mov,.avi'
const MAX_MB       = 500

function validateFile(f) {
  const ext = f.name.split('.').pop().toLowerCase()
  if (!['mp4', 'mov', 'avi'].includes(ext))
    return 'Unsupported format. Please upload an MP4, MOV, or AVI video.'
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

export default function VideoUploadCard() {
  const { currentUser } = useAuth()
  const navigate        = useNavigate()

  // mode: 'file' | 'url'
  const [mode, setMode]                   = useState('file')
  const [file, setFile]                   = useState(null)
  const [urlInput, setUrlInput]           = useState('')
  const [dragging, setDragging]           = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [stage, setStage]                 = useState('idle')
  const [error, setError]                 = useState('')
  const inputRef = useRef(null)

  function handleFileSelect(f) {
    const msg = validateFile(f)
    if (msg) return setError(msg)
    setError('')
    setFile(f)
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
        const { detectionId, formData } = prepareUpload(file, 'video')
        fileName = file.name
        result   = await runVideoDetection({ formData, detectionId })
        finishProgress()

        saveDetection({
          detectionId,
          userId:           currentUser.uid,
          fileName,
          fileType:         'video',
          label:            result.label,
          confidence:       result.confidence,
          model:            result.model,
          processingTimeMs: result.processing_time_ms,
          framesAnalysed:   result.frames_analysed,
        }).catch(e => console.warn('Firestore save failed:', e.message))

        setStage('done')
        navigate(`/results/${result.detection_id || detectionId}`, {
          state: {
            detectionId:     result.detection_id || detectionId,
            label:           result.label,
            confidence:      result.confidence,
            model:           result.model,
            fileName,
            fileType:        'video',
            processingTimeMs: result.processing_time_ms,
            heatmapUrl:      null,
            analysisDetails: null,
            warnings:        [],
          }
        })
      } else {
        // URL mode
        const detectionId = nanoid()
        const url         = urlInput.trim()
        fileName          = url.split('?')[0].split('/').pop() || 'video-from-url'

        result = await runVideoDetectionFromUrl({ url, detectionId })
        finishProgress()

        saveDetection({
          detectionId,
          userId:           currentUser.uid,
          fileName,
          fileType:         'video',
          label:            result.label,
          confidence:       result.confidence,
          model:            result.model,
          processingTimeMs: result.processing_time_ms,
          framesAnalysed:   result.frames_analysed,
        }).catch(e => console.warn('Firestore save failed:', e.message))

        setStage('done')
        navigate(`/results/${detectionId}`, {
          state: {
            detectionId,
            label:           result.label,
            confidence:      result.confidence,
            model:           result.model,
            fileName,
            fileType:        'video',
            processingTimeMs: result.processing_time_ms,
            heatmapUrl:      null,
            analysisDetails: null,
            warnings:        [],
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
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Upload video file</h3>

      {/* Mode tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
        <button
          onClick={() => switchMode('file')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-all
            ${mode === 'file' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14
                 M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
                      d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14
                         M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Choose MP4, MOV, or AVI</p>
                  <p className="text-xs text-gray-400 mt-1">or drag and drop · Max {MAX_MB} MB</p>
                </div>
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
              <button onClick={clearFile} className="text-gray-400 hover:text-danger transition-colors shrink-0" aria-label="Remove">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
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
              placeholder="https://example.com/video.mp4"
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
            Paste a direct link to an MP4, MOV, or AVI video. The URL must be publicly accessible.
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
          Running AI analysis… This may take up to 60s for videos.
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
