/**
 * AdminDashboardPage — Operations dashboard.
 * Matches mockup exactly:
 *   - Dark background (#0d1b2a)
 *   - "ADMINISTRATIVE MANAGEMENT" teal tag
 *   - "Operations dashboard" large white title
 *   - 4 stat cards: Total analyses | AI-generated rate | Average confidence | Total users
 *   - Management functions row: Export records | Export users | Clear database (red)
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  getDashboardStats,
  getAllDetections,
  getAllUsers,
  exportToCSV,
} from './adminService'
import AdminNavbar from './AdminNavbar'
import Spinner from '@/components/ui/Spinner'

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, loading }) {
  return (
    <div className="bg-[#162739] rounded-lg p-6 flex flex-col gap-2 border border-white/5">
      <span className="text-gray-400 text-sm font-medium">{label}</span>
      {loading ? (
        <div className="h-10 flex items-center">
          <Spinner size="sm" />
        </div>
      ) : (
        <span className="text-white text-4xl font-bold leading-none">{value}</span>
      )}
    </div>
  )
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ open, onConfirm, onCancel, loading }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#162739] border border-white/10 rounded-xl p-8 max-w-sm w-full mx-4 shadow-2xl">
        <h2 className="text-white text-xl font-bold mb-2">Clear database?</h2>
        <p className="text-gray-400 text-sm mb-6">
          This will permanently soft-delete all detection records.
          User accounts will not be affected. This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded text-sm text-gray-300 border border-gray-600 hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded text-sm bg-danger text-white font-semibold hover:bg-red-600 transition disabled:opacity-50"
          >
            {loading ? 'Clearing…' : 'Yes, clear'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { userDoc } = useAuth()
  const navigate    = useNavigate()

  const [stats, setStats]             = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [exporting, setExporting]     = useState('')   // 'records' | 'users' | ''
  const [showClearModal, setShowClearModal] = useState(false)
  const [clearing, setClearing]       = useState(false)
  const [toast, setToast]             = useState('')

  // Redirect non-admins
  useEffect(() => {
    if (userDoc && userDoc.role !== 'admin') navigate('/')
  }, [userDoc, navigate])

  // Load stats
  useEffect(() => {
    async function load() {
      setStatsLoading(true)
      const data = await getDashboardStats()
      setStats(data)
      setStatsLoading(false)
    }
    load()
  }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // Export records CSV
  async function handleExportRecords() {
    setExporting('records')
    try {
      const detections = await getAllDetections()
      const rows = detections.map(d => ({
        detectionId:     d.detectionId || d.id,
        fileName:        d.fileName,
        fileType:        d.fileType,
        label:           d.label,
        confidence:      d.confidence,
        model:           d.model,
        processingTimeMs: d.processingTimeMs,
        userId:          d.userId,
        createdAt:       d.createdAt?.toDate?.() || '',
        status:          d.status,
      }))
      exportToCSV(rows, `ai-detector-records-${Date.now()}.csv`)
      showToast('Records exported successfully.')
    } catch {
      showToast('Export failed. Please try again.')
    } finally {
      setExporting('')
    }
  }

  // Export users CSV
  async function handleExportUsers() {
    setExporting('users')
    try {
      const users = await getAllUsers()
      const rows = users.map(u => ({
        uid:            u.uid,
        displayName:    u.displayName,
        email:          u.email,
        role:           u.role,
        detectionCount: u.detectionCount || 0,
        createdAt:      u.createdAt?.toDate?.() || '',
        disabled:       u.disabled || false,
      }))
      exportToCSV(rows, `ai-detector-users-${Date.now()}.csv`)
      showToast('Users exported successfully.')
    } catch {
      showToast('Export failed. Please try again.')
    } finally {
      setExporting('')
    }
  }

  // Clear database (soft delete all detections)
  async function handleClearDatabase() {
    setClearing(true)
    try {
      const { writeBatch, doc, collection } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase')
      const detections = await getAllDetections()

      // Batch soft-delete in groups of 500 (Firestore limit)
      const chunks = []
      for (let i = 0; i < detections.length; i += 499) {
        chunks.push(detections.slice(i, i + 499))
      }
      for (const chunk of chunks) {
        const batch = writeBatch(db)
        chunk.forEach(d => {
          batch.update(doc(db, 'detections', d.id), { deleted: true })
        })
        await batch.commit()
      }

      // Refresh stats
      const data = await getDashboardStats()
      setStats(data)
      showToast(`Database cleared — ${detections.length} records removed.`)
    } catch (err) {
      showToast('Clear failed. Please try again.')
    } finally {
      setClearing(false)
      setShowClearModal(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1b2a] text-white">
      <AdminNavbar title="Admin dashboard" />

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">

        {/* Section tag */}
        <p className="text-xs uppercase tracking-widest font-semibold text-accent mb-3">
          Administrative Management
        </p>

        {/* Page title */}
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-10">
          Operations dashboard
        </h1>

        {/* ── 4 Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard
            label="Total analyses"
            value={stats?.totalAnalyses ?? '—'}
            loading={statsLoading}
          />
          <StatCard
            label="AI-generated rate"
            value={stats ? `${stats.aiGeneratedRate}%` : '—'}
            loading={statsLoading}
          />
          <StatCard
            label="Average confidence"
            value={stats ? `${stats.avgConfidence}%` : '—'}
            loading={statsLoading}
          />
          <StatCard
            label="Total users"
            value={stats?.totalUsers ?? '—'}
            loading={statsLoading}
          />
        </div>

        {/* ── Management Functions ── */}
        <div className="bg-[#162739] rounded-lg p-6 border border-white/5 mb-8">
          <h2 className="text-white text-base font-semibold mb-4">
            Management functions
          </h2>
          <div className="flex flex-wrap gap-3">
            {/* Export records */}
            <button
              onClick={handleExportRecords}
              disabled={exporting === 'records'}
              className="px-5 py-2 rounded text-sm font-medium border border-accent text-accent
                         hover:bg-accent/10 transition disabled:opacity-50"
            >
              {exporting === 'records' ? 'Exporting…' : 'Export records'}
            </button>

            {/* Export users */}
            <button
              onClick={handleExportUsers}
              disabled={exporting === 'users'}
              className="px-5 py-2 rounded text-sm font-medium border border-accent text-accent
                         hover:bg-accent/10 transition disabled:opacity-50"
            >
              {exporting === 'users' ? 'Exporting…' : 'Export users'}
            </button>

            {/* Clear database — red */}
            <button
              onClick={() => setShowClearModal(true)}
              className="px-5 py-2 rounded text-sm font-medium bg-danger text-white
                         hover:bg-red-600 transition"
            >
              Clear database
            </button>
          </div>
        </div>

        {/* ── Quick nav to other admin pages ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/admin/analyses"
            className="bg-[#162739] border border-white/5 rounded-lg p-5 flex items-center
                       justify-between hover:border-accent/40 transition group"
          >
            <div>
              <p className="text-white font-semibold">All Analyses</p>
              <p className="text-gray-400 text-sm mt-0.5">
                View all users' detection records
              </p>
            </div>
            <svg className="w-5 h-5 text-gray-500 group-hover:text-accent transition"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            to="/admin/users"
            className="bg-[#162739] border border-white/5 rounded-lg p-5 flex items-center
                       justify-between hover:border-accent/40 transition group"
          >
            <div>
              <p className="text-white font-semibold">User Management</p>
              <p className="text-gray-400 text-sm mt-0.5">
                Manage roles and remove accounts
              </p>
            </div>
            <svg className="w-5 h-5 text-gray-500 group-hover:text-accent transition"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            to="/admin/algorithms"
            className="bg-[#162739] border border-white/5 rounded-lg p-5 flex items-center
                       justify-between hover:border-accent/40 transition group"
          >
            <div>
              <p className="text-white font-semibold">Algorithm Comparison</p>
              <p className="text-gray-400 text-sm mt-0.5">
                Benchmark analysis — our models vs baselines
              </p>
            </div>
            <svg className="w-5 h-5 text-gray-500 group-hover:text-accent transition"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </main>

      {/* Clear confirmation modal */}
      <ConfirmModal
        open={showClearModal}
        onConfirm={handleClearDatabase}
        onCancel={() => setShowClearModal(false)}
        loading={clearing}
      />

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#162739] border
                        border-white/10 text-white text-sm px-6 py-3 rounded-lg shadow-2xl z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
