/**
 * HistoryPage — previous analysis list.
 * Matches mockup: "DATABASE REVIEW" tag, "Previous analysis" title,
 * table with MEDIA | TYPE | PREDICTION | CONFIDENCE | REVIEWER | DATE columns.
 */

import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { fetchHistory } from './historyService'
import PageWrapper from '@/components/layout/PageWrapper'
import HistoryTable from './HistoryTable'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import Select from '@/components/ui/Select'

const TYPE_OPTIONS = [
  { value: '', label: 'Select an option' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
]

const LABEL_OPTIONS = [
  { value: '', label: 'Select an option' },
  { value: 'AI-Generated', label: 'AI-Generated' },
  { value: 'Real', label: 'Real / Authentic' },
]

export default function HistoryPage() {
  const { currentUser } = useAuth()

  const [items, setItems]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError]           = useState('')
  const [isBlocked, setIsBlocked]   = useState(false)
  const [lastDoc, setLastDoc]       = useState(null)
  const [hasMore, setHasMore]       = useState(false)
  const [filters, setFilters]       = useState({ fileType: '', label: '' })

  const load = useCallback(async (reset = false) => {
    if (!currentUser) return
    reset ? setLoading(true) : setLoadingMore(true)
    setError('')
    setIsBlocked(false)

    try {
      const cursor = reset ? null : lastDoc
      const result = await fetchHistory(currentUser.uid, filters, cursor)
      setItems(prev => reset ? result.items : [...prev, ...result.items])
      setLastDoc(result.lastDoc)
      setHasMore(result.hasMore)
    } catch (err) {
      console.error('fetchHistory error:', err)

      // Detect Brave/ad-blocker blocking
      if (
        err?.message?.includes('ERR_BLOCKED') ||
        err?.message?.includes('Failed to fetch') ||
        err?.code === 'unavailable' ||
        err?.code === 'permission-denied' ||
        err?.name === 'FirebaseError'
      ) {
        setIsBlocked(true)
      }
      setError(err?.message || 'Failed to load history.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [currentUser, filters, lastDoc])

  useEffect(() => {
    load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, filters.fileType, filters.label])

  function handleDeleted(id) {
    setItems(prev => prev.filter(item => (item.id || item.detectionId) !== id))
  }

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="mb-8">
          <p className="section-tag mb-2">Database Review</p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-3xl font-bold text-primary">Previous analysis</h1>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-primary text-white text-sm
                         font-medium px-4 py-2 rounded hover:bg-primary-dark transition-colors
                         self-start sm:self-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New analysis
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Select
            value={filters.fileType}
            onChange={e => setFilters(f => ({ ...f, fileType: e.target.value }))}
            options={TYPE_OPTIONS}
            className="w-44"
          />
          <Select
            value={filters.label}
            onChange={e => setFilters(f => ({ ...f, label: e.target.value }))}
            options={LABEL_OPTIONS}
            className="w-52"
          />
          {(filters.fileType || filters.label) && (
            <button
              onClick={() => setFilters({ fileType: '', label: '' })}
              className="text-sm text-accent hover:text-accent-dark transition-colors"
            >
              Clear filters
            </button>
          )}
          {!loading && (
            <span className="text-sm text-gray-400 ml-auto">
              {items.length} {items.length === 1 ? 'result' : 'results'}
            </span>
          )}
        </div>

        {/* ── Brave Shields / blocked notice ── */}
        {isBlocked && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <p className="text-amber-800 font-medium text-sm">Firestore is being blocked</p>
              <p className="text-amber-700 text-xs mt-1">
                Your browser (Brave/ad-blocker) is blocking requests to{' '}
                <code className="bg-amber-100 px-1 rounded">firestore.googleapis.com</code>.
                To fix: click the <strong>Brave shield icon</strong> in the address bar and
                toggle <strong>Shields OFF</strong> for this site.
              </p>
              <button
                onClick={() => load(true)}
                className="mt-2 text-xs text-amber-800 underline hover:no-underline"
              >
                Try again after disabling shields
              </button>
            </div>
          </div>
        )}

        {/* Generic error */}
        {error && !isBlocked && (
          <Alert type="error" message={error} onClose={() => setError('')} className="mb-5" />
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Spinner size="xl" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-card overflow-hidden">
              {/* Table header */}
              {items.length > 0 && (
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {items.length} detection{items.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              <div className="p-6">
                <HistoryTable items={items} onDeleted={handleDeleted} />
              </div>
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="text-center mt-6">
                <button
                  onClick={() => load(false)}
                  disabled={loadingMore}
                  className="text-sm text-accent hover:text-accent-dark font-medium
                             transition-colors disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}

            {/* Footer note */}
            <p className="text-center text-xs text-gray-400 mt-8">
              AI Detector verification interface ·{' '}
              Prototype analysis uses CNN spatial checks and LSTM temporal review.
            </p>
          </>
        )}
      </div>
    </PageWrapper>
  )
}
