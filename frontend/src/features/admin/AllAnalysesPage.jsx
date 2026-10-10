/**
 * AllAnalysesPage — All saved analyses (admin view).
 * Clicking a row opens a modal with full detection details.
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
  const ext  = fileName?.split('.').pop()?.toUpperCase() || fileType?.toUpperCase() || '—'
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
      month: 'numeric', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
    })
  } catch { return '—' }
}

function getModelLabel(model) {
  if (!model) return 'N/A'
  const m = model.toLowerCase()
  if (m.includes('truthscan')) return 'AI Detection Engine (CNN + LSTM)'
  if (m.includes('siglip') || m.includes('deepfake-detector')) return 'CNN Model (Local)'
  if (m.includes('videomae') || m.includes('video')) return 'LSTM Model (Local)'
  return model
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({ det, user, onClose }) {
  if (!det) return null
  const isAI = det.label === 'AI-Generated' || det.label === 'Digitally Edited'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}>
      <div
        className="bg-[#162739] border border-white/10 rounded-xl shadow-2xl
                   w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <p className="text-xs uppercase tracking-widest text-accent font-semibold">
              Detection Record
            </p>
            <p className="text-white font-bold text-lg mt-0.5 truncate max-w-sm">
              {det.fileName || '—'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors ml-4 shrink-0"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Result banner */}
        <div className={`mx-6 mt-5 rounded-lg p-4 text-center ${
          isAI
            ? 'bg-red-500/10 border border-red-500/20'
            : 'bg-green-500/10 border border-green-500/20'
        }`}>
          <p className={`text-3xl font-extrabold ${isAI ? 'text-danger' : 'text-success'}`}>
            {det.confidence}%
          </p>
          <p className={`text-sm font-semibold mt-1 ${isAI ? 'text-danger' : 'text-success'}`}>
            {isAI ? '⚠ AI-Generated' : '✓ Authentic'}
          </p>
        </div>

        {/* Details */}
        <div className="px-6 py-5 space-y-3">
          {[
            { label: 'File name',      value: det.fileName || '—' },
            { label: 'File type',      value: det.fileType ? det.fileType.charAt(0).toUpperCase() + det.fileType.slice(1) : '—' },
            { label: 'Prediction',     value: det.label || '—' },
            { label: 'Confidence',     value: det.confidence != null ? `${det.confidence}%` : '—' },
            { label: 'Analysis time',  value: det.processingTimeMs ? `${(det.processingTimeMs / 1000).toFixed(1)} seconds` : '—' },
            { label: 'Model used',     value: getModelLabel(det.model) },
            { label: 'Analysed by',    value: user.displayName || '—' },
            { label: 'User email',     value: user.email || '—' },
            { label: 'Date',           value: formatDate(det.createdAt) },
            { label: 'Detection ID',   value: det.id || det.detectionId || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-4 text-sm border-b border-white/5 pb-2">
              <span className="text-gray-400 shrink-0">{label}</span>
              <span className="text-gray-200 font-medium text-right break-all">{value}</span>
            </div>
          ))}

          {/* Heatmap if available */}
          {det.heatmapUrl && (
            <div className="pt-2">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                Heatmap
              </p>
              <img
                src={det.heatmapUrl}
                alt="Detection heatmap"
                className="w-full rounded-lg border border-white/10"
              />
            </div>
          )}

          {/* Frames analysed for video */}
          {det.framesAnalysed && (
            <div className="flex justify-between text-sm border-b border-white/5 pb-2">
              <span className="text-gray-400">Frames checked</span>
              <span className="text-gray-200 font-medium">{det.framesAnalysed}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg border border-white/10 text-gray-300
                       hover:bg-white/5 transition text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AllAnalysesPage() {
  const [detections, setDetections]   = useState([])
  const [userMap, setUserMap]         = useState({})
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filterType, setFilterType]   = useState('all')
  const [filterLabel, setFilterLabel] = useState('all')
  const [exporting, setExporting]     = useState(false)
  const [toast, setToast]             = useState('')
  const [selected, setSelected]       = useState(null) // selected detection for modal

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [dets, users] = await Promise.all([getAllDetections(), getAllUsers()])
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

        <p className="text-xs uppercase tracking-widest font-semibold text-accent mb-3">
          Database Review
        </p>

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

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search file, user…"
            className="bg-[#162739] border border-white/10 text-white text-sm rounded-lg
                       px-4 py-2 focus:outline-none focus:border-accent placeholder-gray-500
                       min-w-[200px]"
          />
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
          {!loading && (
            <span className="self-center text-gray-500 text-sm ml-auto">
              {filtered.length} record{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Table */}
        <div className="bg-[#111e2d] rounded-lg border border-white/5 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20"><Spinner size="xl" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-500">No analyses found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {['MEDIA', 'TYPE', 'PREDICTION', 'CONFIDENCE', 'USER NAME', 'USER EMAIL', 'DATE', ''].map(col => (
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
                        onClick={() => setSelected({ det, user })}
                        className={`border-b border-white/5 cursor-pointer group
                          hover:bg-accent/10 hover:border-accent/20 transition-all duration-150
                          ${idx % 2 === 0 ? '' : 'bg-white/[0.015]'}`}
                      >
                        <td className="px-5 py-4 text-gray-200 max-w-[220px]">
                          <span className="block truncate text-xs" title={det.fileName}>
                            {det.fileName || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <TypeBadge fileName={det.fileName} fileType={det.fileType} />
                        </td>
                        <td className="px-5 py-4">
                          <PredictionBadge label={det.label === 'Real' ? 'Authentic' : det.label} />
                        </td>
                        <td className="px-5 py-4 text-gray-300 font-medium">
                          {det.confidence != null ? `${Math.round(det.confidence)}%` : '—'}
                        </td>
                        <td className="px-5 py-4 text-gray-300">{user.displayName}</td>
                        <td className="px-5 py-4 text-gray-400 text-xs">{user.email}</td>
                        <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                          {formatDate(det.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <svg className="w-4 h-4 text-gray-600 group-hover:text-accent transition-colors"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 5l7 7-7 7" />
                          </svg>
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

      {/* Detail Modal */}
      {selected && (
        <DetailModal
          det={selected.det}
          user={selected.user}
          onClose={() => setSelected(null)}
        />
      )}

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
