/**
 * AllAnalysesPage — All saved analyses (admin view).
 * Matches mockup exactly:
 *   - Dark background #0d1b2a
 *   - "DATABASE REVIEW" teal tag
 *   - "All saved analyses" large white title
 *   - Table: MEDIA | TYPE | PREDICTION | CONFIDENCE | REVIEWER | USER NAME | USER EMAIL | DATE
 *   - Fetches ALL detections from Firestore + joins with users for name/email
 *   - Authentic = teal text, AI-Generated = red text
 */

import { useEffect, useState, useMemo } from 'react'
import { getAllDetections, getAllUsers, exportToCSV } from './adminService'
import AdminNavbar from './AdminNavbar'
import Spinner from '@/components/ui/Spinner'

// ── Prediction badge ──────────────────────────────────────────────────────────
function PredictionBadge({ label }) {
  const isAI = label === 'AI-Generated' || label === 'Digitally Edited'
  return (
    <span className={`text-sm font-medium ${isAI ? 'text-danger' : 'text-accent'}`}>
      {label || 'Unknown'}
    </span>
  )
}

// ── File type badge ───────────────────────────────────────────────────────────
function TypeBadge({ fileName, fileType }) {
  const ext = fileName?.split('.').pop()?.toUpperCase() || fileType?.toUpperCase() || '—'
  const type = fileType === 'video' ? 'Video' : 'Image'
  return (
    <span className="text-gray-300 text-sm whitespace-nowrap">
      {type}<br />
      <span className="text-gray-500 text-xs">/ {ext}</span>
    </span>
  )
}

// ── Format date ───────────────────────────────────────────────────────────────
function formatDate(ts) {
  if (!ts) return '—'
  try {
    const date = ts?.toDate ? ts.toDate() : new Date(ts)
    return date.toLocaleString('en-US', {
      month: 'numeric',
      day:   'numeric',
      year:  'numeric',
      hour:  'numeric',
      minute:'2-digit',
      second:'2-digit',
      hour12: true,
    })
  } catch {
    return '—'
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AllAnalysesPage() {
  const [detections, setDetections] = useState([])
  const [userMap, setUserMap]       = useState({})   // uid → { displayName, email }
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filterType, setFilterType] = useState('all')   // all | image | video
  const [filterLabel, setFilterLabel] = useState('all') // all | AI-Generated | Real
  const [exporting, setExporting]   = useState(false)
  const [toast, setToast]           = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [dets, users] = await Promise.all([getAllDetections(), getAllUsers()])
        // Build uid → user map for fast lookup
        const map = {}
        users.forEach(u => { map[u.uid] = { displayName: u.displayName || 'Guest', email: u.email || 'Guest' } })
        setUserMap(map)
        setDetections(dets)
      } catch (err) {
        console.error('AllAnalysesPage load failed:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // ── Filtered rows ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return detections.filter(d => {
      const user = userMap[d.userId] || { displayName: 'Guest', email: 'Guest' }
      const matchSearch = !search ||
        d.fileName?.toLowerCase().includes(search.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
      const matchType  = filterType  === 'all' || d.fileType === filterType
      const matchLabel = filterLabel === 'all' ||
        (filterLabel === 'AI-Generated' && (d.label === 'AI-Generated' || d.label === 'Digitally Edited')) ||
        (filterLabel === 'Real' && d.label === 'Real')
      return matchSearch && matchType && matchLabel
    })
  }, [detections, userMap, search, filterType, filterLabel])

  // ── Export CSV ────────────────────────────────────────────────────────────
  async function handleExport() {
    setExporting(true)
    try {
      const rows = filtered.map(d => {
        const user = userMap[d.userId] || { displayName: 'Guest', email: 'Guest' }
        return {
          media:      d.fileName,
          type:       d.fileType,
          prediction: d.label,
          confidence: `${d.confidence}%`,
          reviewer:   'AI Detector',
          userName:   user.displayName,
          userEmail:  user.email,
          date:       formatDate(d.createdAt),
        }
      })
      exportToCSV(rows, `all-analyses-${Date.now()}.csv`)
      showToast('Exported successfully.')
    } catch {
      showToast('Export failed.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1b2a] text-white">
      <AdminNavbar title="Admin dashboard" />

      <main className="max-w-[1400px] mx-auto px-6 lg:px-8 py-12">

        {/* Section tag */}
        <p className="text-xs uppercase tracking-widest font-semibold text-accent mb-3">
          Database Review
        </p>

        {/* Title + export */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white">
            All saved analyses
          </h1>
          <button
            onClick={handleExport}
            disabled={exporting || loading}
            className="px-5 py-2 rounded text-sm font-medium border border-accent text-accent
                       hover:bg-accent/10 transition disabled:opacity-50 self-end"
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search file, user…"
            className="bg-[#162739] border border-white/10 text-white text-sm rounded-lg
                       px-4 py-2 focus:outline-none focus:border-accent placeholder-gray-500
                       min-w-[200px]"
          />

          {/* Type filter */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-[#162739] border border-white/10 text-gray-300 text-sm rounded-lg
                       px-4 py-2 focus:outline-none focus:border-accent"
          >
            <option value="all">All types</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>

          {/* Prediction filter */}
          <select
            value={filterLabel}
            onChange={e => setFilterLabel(e.target.value)}
            className="bg-[#162739] border border-white/10 text-gray-300 text-sm rounded-lg
                       px-4 py-2 focus:outline-none focus:border-accent"
          >
            <option value="all">All predictions</option>
            <option value="AI-Generated">AI-Generated</option>
            <option value="Real">Authentic</option>
          </select>

          {/* Count */}
          {!loading && (
            <span className="self-center text-gray-500 text-sm ml-auto">
              {filtered.length} record{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* ── Table ── */}
        <div className="bg-[#111e2d] rounded-lg border border-white/5 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner size="xl" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              No analyses found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {['MEDIA', 'TYPE', 'PREDICTION', 'CONFIDENCE', 'REVIEWER', 'USER NAME', 'USER EMAIL', 'DATE'].map(col => (
                      <th key={col}
                        className="text-left text-xs uppercase tracking-widest text-gray-500
                                   font-semibold px-5 py-4 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((det, idx) => {
                    const user = userMap[det.userId] || { displayName: 'Guest', email: 'Guest' }
                    return (
                      <tr
                        key={det.id}
                        className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors
                          ${idx % 2 === 0 ? '' : 'bg-white/[0.015]'}`}
                      >
                        {/* Media */}
                        <td className="px-5 py-4 text-gray-200 max-w-[220px]">
                          <span className="block truncate text-xs" title={det.fileName}>
                            {det.fileName || '—'}
                          </span>
                        </td>

                        {/* Type */}
                        <td className="px-5 py-4">
                          <TypeBadge fileName={det.fileName} fileType={det.fileType} />
                        </td>

                        {/* Prediction */}
                        <td className="px-5 py-4">
                          <PredictionBadge label={
                            det.label === 'Real' ? 'Authentic' : det.label
                          } />
                        </td>

                        {/* Confidence */}
                        <td className="px-5 py-4 text-gray-300 font-medium">
                          {det.confidence != null ? `${Math.round(det.confidence)}%` : '—'}
                        </td>

                        {/* Reviewer */}
                        <td className="px-5 py-4 text-gray-300 whitespace-nowrap">
                          AI<br />
                          <span className="text-gray-500 text-xs">Detector</span>
                        </td>

                        {/* User name */}
                        <td className="px-5 py-4 text-gray-300">
                          {user.displayName}
                        </td>

                        {/* User email */}
                        <td className="px-5 py-4 text-gray-400 text-xs">
                          {user.email}
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                          {formatDate(det.createdAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#162739] border
                        border-white/10 text-white text-sm px-6 py-3 rounded-lg shadow-2xl z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
