/**
 * DetectionResultPage — three-panel results layout.
 * Matches mockup: Left: ResultCard | Center: HeatmapViewer | Right: ModelSignalsPanel
 * Route: /results/:detectionId
 *
 * Data priority:
 *   1. React Router navigation state  — available immediately, works even if
 *      Firestore is blocked by a browser extension.
 *   2. Firestore getDetection()       — used as fallback when navigating
 *      directly to the URL (e.g. from history page).
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getDetection } from './detectionService'
import { generateSingleReport } from '@/lib/pdfGenerator'
import PageWrapper from '@/components/layout/PageWrapper'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import ResultCard from './ResultCard'
import HeatmapViewer from './HeatmapViewer'
import ModelSignalsPanel from './ModelSignalsPanel'

export default function DetectionResultPage() {
  const { detectionId } = useParams()
  const { currentUser, userDoc } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [detection, setDetection] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  useEffect(() => {
    if (!detectionId) return

    // ── Priority 1: Navigation state (passed from upload card) ────────────────
    // Available immediately, no Firestore call needed.
    // Works even when Firestore is blocked by a browser extension.
    const navState = location.state

    if (navState?.detectionId === detectionId) {
      setDetection({
        detectionId:      navState.detectionId,
        label:            navState.label,
        confidence:       navState.confidence,
        model:            navState.model,
        fileName:         navState.fileName,
        fileType:         navState.fileType,
        processingTimeMs: navState.processingTimeMs,
        // TruthScan extras
        heatmapUrl:       navState.heatmapUrl       || null,
        analysisDetails:  navState.analysisDetails  || null,
        warnings:         navState.warnings         || [],
        userId:           currentUser?.uid,
        createdAt:        { toDate: () => new Date() },
        status:           'completed',
      })
      setLoading(false)
      return
    }

    // ── Priority 2: Firestore (direct URL access / history page links) ────────
    async function loadFromFirestore() {
      try {
        const data = await getDetection(detectionId)
        if (!data) {
          setError('Detection record not found.')
          return
        }
        if (data.userId !== currentUser?.uid && userDoc?.role !== 'admin') {
          setError('You do not have permission to view this result.')
          return
        }
        setDetection(data)
      } catch (err) {
        setError('Failed to load detection result. If you just ran a detection, try going back and uploading again.')
      } finally {
        setLoading(false)
      }
    }

    loadFromFirestore()
  }, [detectionId, currentUser, userDoc, location.state])

  function handleDownload() {
    if (!detection) return
    generateSingleReport(detection, {
      displayName: currentUser?.displayName || currentUser?.email || 'User',
      email: currentUser?.email || '',
    })
  }

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-accent transition-colors">Home</Link>
          <span>/</span>
          <Link to="/history" className="hover:text-accent transition-colors">History</Link>
          <span>/</span>
          <span className="text-primary font-medium">Result</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Spinner size="xl" />
          </div>
        ) : error ? (
          <div className="max-w-lg mx-auto py-16">
            <Alert type="error" message={error} />
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/')}
                className="text-accent hover:text-accent-dark text-sm font-medium transition-colors"
              >
                ← Back to home
              </button>
            </div>
          </div>
        ) : detection ? (
          <>
            {/* Section tag */}
            <p className="section-tag mb-2">Detection Result</p>
            <h1 className="text-3xl font-bold text-primary mb-8 truncate">
              {detection.fileName || 'Detection Summary'}
            </h1>

            {/* Three-panel layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Result Card */}
              <ResultCard detection={detection} onDownload={handleDownload} />

              {/* Center: Heatmap */}
              <HeatmapViewer detection={detection} />

              {/* Right: Model Signals */}
              <ModelSignalsPanel detection={detection} />
            </div>

            {/* Actions row */}
            <div className="flex flex-wrap items-center gap-4 mt-8 pt-6 border-t">
              <Link
                to="/"
                className="text-sm text-primary border border-primary rounded px-4 py-2 hover:bg-primary hover:text-white transition-colors"
              >
                Analyse another file
              </Link>
              <Link
                to="/history"
                className="text-sm text-gray-500 hover:text-primary transition-colors"
              >
                View history →
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </PageWrapper>
  )
}
