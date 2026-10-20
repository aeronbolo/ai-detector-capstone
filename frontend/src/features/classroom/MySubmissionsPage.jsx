/**
 * MySubmissionsPage — Student views their submitted projects and teacher remarks.
 * AI detection results are hidden — only shows teacher verdict and notes.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getStudentSubmissions } from './classroomService'
import PageWrapper from '@/components/layout/PageWrapper'
import Spinner from '@/components/ui/Spinner'

function StatusBadge({ status, teacherRemark, systemRemark }) {
  const verdict = teacherRemark || null
  const reviewed = status === 'reviewed'

  if (!reviewed) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1
                        bg-gray-100 text-gray-500 rounded-full border border-gray-200">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse" />
        Pending Review
      </span>
    )
  }

  const styles = {
    'Accepted':     'bg-green-50 text-green-700 border-green-200',
    'Flagged':      'bg-red-50 text-red-700 border-red-200',
    'Needs Review': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  }
  const icons = {
    'Accepted':     '✓',
    'Flagged':      '⚠',
    'Needs Review': '🔍',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1
                      rounded-full border ${styles[verdict] || styles['Needs Review']}`}>
      {icons[verdict] || '🔍'} {verdict || 'Reviewed'}
    </span>
  )
}

function formatDate(ts) {
  if (!ts) return '—'
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

function SubmissionCard({ sub, onClick }) {
  const reviewed = sub.status === 'reviewed'
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-card p-5 cursor-pointer
                 hover:shadow-md transition-all border border-transparent
                 hover:border-accent/20"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-primary truncate text-base">
            {sub.projectTitle}
          </p>
          {sub.subject && (
            <p className="text-xs text-gray-400 mt-0.5">{sub.subject}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Submitted {formatDate(sub.submittedAt)}
          </p>
        </div>
        <div className="shrink-0">
          <StatusBadge
            status={sub.status}
            teacherRemark={sub.teacherRemark}
            systemRemark={sub.systemRemark}
          />
        </div>
      </div>

      {/* File info */}
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
        <span className="capitalize bg-gray-100 px-2 py-0.5 rounded">
          {sub.fileType}
        </span>
        <span className="truncate max-w-[200px]">{sub.fileName}</span>
      </div>

      {/* Teacher note — only show if reviewed */}
      {reviewed && sub.teacherNote && (
        <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          <p className="text-xs text-blue-700">
            <strong>Teacher's note:</strong> {sub.teacherNote}
          </p>
        </div>
      )}

      {/* Reviewed by / date */}
      {reviewed && sub.reviewedAt && (
        <p className="text-xs text-gray-400 mt-2">
          Reviewed on {formatDate(sub.reviewedAt)}
        </p>
      )}
    </div>
  )
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({ sub, onClose }) {
  if (!sub) return null
  const reviewed = sub.status === 'reviewed'
  const verdict  = sub.teacherRemark

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh]
                      overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-1">
                Submission Detail
              </p>
              <h2 className="text-lg font-bold text-primary">{sub.projectTitle}</h2>
              {sub.subject && <p className="text-sm text-gray-400 mt-0.5">{sub.subject}</p>}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Submission status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Status</span>
            <StatusBadge
              status={sub.status}
              teacherRemark={sub.teacherRemark}
              systemRemark={sub.systemRemark}
            />
          </div>

          {/* File details */}
          {[
            { label: 'File name',  value: sub.fileName },
            { label: 'File type',  value: sub.fileType?.charAt(0).toUpperCase() + sub.fileType?.slice(1) },
            { label: 'Submitted',  value: formatDate(sub.submittedAt) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-4 text-sm border-b pb-2">
              <span className="text-gray-400">{label}</span>
              <span className="text-gray-800 font-medium text-right">{value}</span>
            </div>
          ))}

          {/* Description */}
          {sub.description && (
            <div className="text-sm border-b pb-3">
              <p className="text-gray-400 mb-1">Description</p>
              <p className="text-gray-700 leading-relaxed">{sub.description}</p>
            </div>
          )}

          {/* Teacher review */}
          {reviewed ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm border-b pb-2">
                <span className="text-gray-400">Reviewed on</span>
                <span className="text-gray-800 font-medium">{formatDate(sub.reviewedAt)}</span>
              </div>

              {sub.teacherNote && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wider text-blue-400 font-semibold mb-1">
                    Teacher's Note
                  </p>
                  <p className="text-sm text-blue-800 leading-relaxed">{sub.teacherNote}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500 font-medium">Awaiting teacher review</p>
              <p className="text-xs text-gray-400 mt-1">
                Your teacher will review and provide feedback soon.
              </p>
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <button onClick={onClose}
            className="w-full py-2.5 rounded-lg border border-gray-200 text-gray-600
                       hover:bg-gray-50 transition text-sm font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MySubmissionsPage() {
  const { currentUser } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState(null)

  useEffect(() => {
    if (!currentUser) return
    getStudentSubmissions(currentUser.uid)
      .then(setSubmissions)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [currentUser])

  const pending  = submissions.filter(s => s.status !== 'reviewed')
  const reviewed = submissions.filter(s => s.status === 'reviewed')

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white font-extrabold text-sm tracking-tight">AI</span>
              </div>
              <span className="text-primary font-bold text-[15px]">AI Detector</span>
            </div>
            <p className="section-tag mb-1">Student Portal</p>
            <h1 className="text-3xl font-bold text-primary">My Submissions</h1>
          </div>
          <Link to="/submit"
            className="bg-primary text-white text-sm font-semibold px-4 py-2.5
                       rounded-lg hover:bg-primary/90 transition">
            + Submit Project
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="xl" /></div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No submissions yet</p>
            <p className="text-gray-400 text-sm mt-1">Submit your first project to get started.</p>
            <Link to="/submit"
              className="inline-block mt-4 bg-primary text-white text-sm font-semibold
                         px-5 py-2.5 rounded-lg hover:bg-primary/90 transition">
              Submit Project
            </Link>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Pending */}
            {pending.length > 0 && (
              <section>
                <h2 className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-3">
                  Awaiting Review ({pending.length})
                </h2>
                <div className="space-y-3">
                  {pending.map(sub => (
                    <SubmissionCard key={sub.id} sub={sub} onClick={() => setSelected(sub)} />
                  ))}
                </div>
              </section>
            )}

            {/* Reviewed */}
            {reviewed.length > 0 && (
              <section>
                <h2 className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-3">
                  Reviewed ({reviewed.length})
                </h2>
                <div className="space-y-3">
                  {reviewed.map(sub => (
                    <SubmissionCard key={sub.id} sub={sub} onClick={() => setSelected(sub)} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        <DetailModal sub={selected} onClose={() => setSelected(null)} />
      </div>
    </PageWrapper>
  )
}
