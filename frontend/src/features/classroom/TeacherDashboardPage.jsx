/**
 * TeacherDashboardPage — Teacher views classes, students, submissions and adds remarks.
 * Layout:
 *   - Dashboard overview (stats)
 *   - Class list → click class → see student roster sorted by:
 *     1. Students with submissions (pending review first)
 *     2. Students enrolled but no submission yet
 */

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  getTeacherClasses, createClass, getClassSubmissions,
  getClassStudents, addTeacherRemark
} from './classroomService'
import PageWrapper from '@/components/layout/PageWrapper'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(ts) {
  if (!ts) return '—'
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  })
}

function RemarkBadge({ remark }) {
  if (!remark) return <span className="text-xs text-gray-400 italic">Pending</span>
  const styles = {
    'Accepted':     'bg-green-100 text-green-700 border-green-200',
    'Flagged':      'bg-red-100 text-red-700 border-red-200',
    'Needs Review': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  }
  const icons = { 'Accepted': '✓', 'Flagged': '⚠', 'Needs Review': '🔍' }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1
                      rounded-full border ${styles[remark] || ''}`}>
      {icons[remark]} {remark}
    </span>
  )
}

// ── Submission Detail Modal ───────────────────────────────────────────────────
function SubmissionModal({ sub, student, onClose, onSaveRemark, saving }) {
  const [remark, setRemark]     = useState(sub?.teacherRemark || sub?.systemRemark || '')
  const [note, setNote]         = useState(sub?.teacherNote || '')
  if (!sub) return null

  const isAI = sub.label === 'AI-Generated' || sub.label === 'Digitally Edited'
  const conf = Math.min(100, Math.round(sub.confidence || 0))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh]
                      overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-6 border-b flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-1">
              Submission Review
            </p>
            <h2 className="text-lg font-bold text-primary">{sub.projectTitle}</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              By {student?.displayName || 'Student'} · {formatDate(sub.submittedAt)}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* File preview — image */}
          {sub.fileType === 'image' && (sub.fileUrl || sub.fileBase64) && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                Submitted Image
              </p>
              <img
                src={sub.fileUrl || sub.fileBase64}
                alt="submitted file"
                className="w-full rounded-xl border border-gray-200 max-h-72 object-contain bg-gray-50"
              />
            </div>
          )}

          {/* File preview — video */}
          {sub.fileType === 'video' && sub.fileUrl && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                Submitted Video
              </p>
              <video controls className="w-full rounded-xl border border-gray-200 max-h-64 bg-black">
                <source src={sub.fileUrl} />
                Your browser does not support video playback.
              </video>
            </div>
          )}

          {/* No file available */}
          {!sub.fileUrl && !sub.fileBase64 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400">
                {sub.fileType === 'video'
                  ? 'Video preview not available. File was too large to store for preview.'
                  : 'Image preview not available for this submission.'}
              </p>
            </div>
          )}

          {/* AI Detection Result */}
          <div className={`rounded-xl p-4 border ${
            isAI ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'
          }`}>
            <p className="text-xs uppercase tracking-wider font-semibold mb-1 text-gray-500">
              AI Detection Result
            </p>
            <div className="flex items-center justify-between">
              <span className={`text-lg font-bold ${isAI ? 'text-danger' : 'text-success'}`}>
                {sub.label}
              </span>
              <span className={`text-2xl font-extrabold ${isAI ? 'text-danger' : 'text-success'}`}>
                {conf}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{sub.systemRemarkReason}</p>
          </div>

          {/* File details */}
          <div className="space-y-2 text-sm">
            {[
              { label: 'File name', value: sub.fileName },
              { label: 'File type', value: sub.fileType?.charAt(0).toUpperCase() + sub.fileType?.slice(1) },
              { label: 'Subject',   value: sub.subject || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between border-b pb-2">
                <span className="text-gray-400">{label}</span>
                <span className="text-gray-800 font-medium">{value}</span>
              </div>
            ))}
          </div>

          {/* Preview — image */}
          {sub.fileType === 'image' && sub.heatmapUrl && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                AI Heatmap
              </p>
              <img src={sub.heatmapUrl} alt="heatmap"
                className="w-full rounded-xl border border-gray-100" />
            </div>
          )}

          {/* Description */}
          {sub.description && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">
                Student Description
              </p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100">
                {sub.description}
              </p>
            </div>
          )}

          {/* System suggestion */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500">
              <strong>System suggestion:</strong>{' '}
              <span className={`font-semibold ${
                sub.systemRemark === 'Accepted' ? 'text-success' :
                sub.systemRemark === 'Flagged' ? 'text-danger' : 'text-yellow-600'
              }`}>{sub.systemRemark}</span>
            </p>
          </div>

          {/* Teacher verdict */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Your Verdict</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {['Accepted', 'Flagged', 'Needs Review'].map(v => (
                <button key={v} onClick={() => setRemark(v)}
                  className={`py-2.5 rounded-xl text-xs font-semibold border transition-all
                    ${remark === v
                      ? v === 'Accepted' ? 'bg-success text-white border-success'
                        : v === 'Flagged' ? 'bg-danger text-white border-danger'
                        : 'bg-yellow-400 text-white border-yellow-400'
                      : 'border-gray-300 text-gray-600 hover:border-accent'}`}>
                  {v === 'Accepted' ? '✓ ' : v === 'Flagged' ? '⚠ ' : '🔍 '}{v}
                </button>
              ))}
            </div>

            <label className="text-sm font-medium text-gray-700 block mb-1">
              Note to student (optional)
            </label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. Please resubmit with original work..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent resize-none" />
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="primary" className="flex-1"
            loading={saving} disabled={!remark}
            onClick={() => onSaveRemark(sub.id, remark, note)}>
            Save Remark
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Student Row ───────────────────────────────────────────────────────────────
function StudentRow({ student, submissions, onViewSubmission }) {
  const hasSubs   = submissions.length > 0
  const pending   = submissions.filter(s => s.status !== 'reviewed')
  const reviewed  = submissions.filter(s => s.status === 'reviewed')

  return (
    <div className={`p-4 border-b last:border-0 ${hasSubs ? '' : 'opacity-60'}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white
                           text-sm font-bold shrink-0 ${hasSubs ? 'bg-primary' : 'bg-gray-300'}`}>
            {(student.displayName || 'S')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-800 truncate">{student.displayName}</p>
            <p className="text-xs text-gray-400 truncate">{student.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {hasSubs ? (
            <>
              {pending.length > 0 && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                  {pending.length} pending
                </span>
              )}
              {reviewed.length > 0 && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  {reviewed.length} reviewed
                </span>
              )}
            </>
          ) : (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              No submission
            </span>
          )}
        </div>
      </div>

      {/* Submissions list */}
      {hasSubs && (
        <div className="mt-3 space-y-2 ml-12">
          {submissions.map(sub => (
            <div key={sub.id}
              onClick={() => onViewSubmission(sub, student)}
              className="flex items-center justify-between gap-3 bg-gray-50 hover:bg-accent/5
                         border border-gray-100 hover:border-accent/20 rounded-lg px-3 py-2
                         cursor-pointer transition-all">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{sub.projectTitle}</p>
                <p className="text-xs text-gray-400">{formatDate(sub.submittedAt)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-semibold ${
                  sub.label === 'AI-Generated' ? 'text-danger' : 'text-success'
                }`}>
                  {sub.label === 'AI-Generated' ? 'AI' : 'Real'}
                </span>
                <RemarkBadge remark={sub.teacherRemark || (sub.status === 'reviewed' ? sub.systemRemark : null)} />
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TeacherDashboardPage() {
  const { currentUser }                     = useAuth()
  const [classes, setClasses]               = useState([])
  const [loading, setLoading]               = useState(true)
  const [activeClass, setActiveClass]       = useState(null)
  const [submissions, setSubmissions]       = useState([])
  const [students, setStudents]             = useState([])
  const [classLoading, setClassLoading]     = useState(false)
  const [showCreate, setShowCreate]         = useState(false)
  const [createForm, setCreateForm]         = useState({ className: '', subject: '', section: '', schoolYear: '' })
  const [creating, setCreating]             = useState(false)
  const [selectedSub, setSelectedSub]       = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [remarkSaving, setRemarkSaving]     = useState(false)
  const [toast, setToast]                   = useState('')

  useEffect(() => {
    if (!currentUser) return
    getTeacherClasses(currentUser.uid)
      .then(setClasses)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [currentUser])

  // Stats across all classes
  const totalStudents   = classes.reduce((s, c) => s + (c.studentIds?.length || 0), 0)
  const totalClasses    = classes.length

  async function handleCreateClass(e) {
    e.preventDefault()
    setCreating(true)
    try {
      const newClass = await createClass({ teacherId: currentUser.uid, ...createForm })
      setClasses(prev => [newClass, ...prev])
      setShowCreate(false)
      setCreateForm({ className: '', subject: '', section: '', schoolYear: '' })
      showToast(`Class created! Code: ${newClass.classCode}`)
    } catch {
      showToast('Failed to create class.')
    } finally {
      setCreating(false)
    }
  }

  async function handleSelectClass(cls) {
    setActiveClass(cls)
    setClassLoading(true)
    setSubmissions([])
    setStudents([])
    try {
      const [subs, studs] = await Promise.all([
        getClassSubmissions(cls.classId),
        getClassStudents(cls.classId),
      ])
      setSubmissions(subs)
      setStudents(studs)
    } catch (err) {
      console.error('Load class error:', err)
      showToast('Failed to load class data.')
    } finally {
      setClassLoading(false)
    }
  }

  async function handleSaveRemark(submissionId, remark, note) {
    setRemarkSaving(true)
    try {
      await addTeacherRemark(submissionId, {
        teacherRemark: remark,
        teacherNote: note,
        teacherId: currentUser.uid,
      })
      setSubmissions(prev => prev.map(s =>
        s.id === submissionId
          ? { ...s, teacherRemark: remark, teacherNote: note, status: 'reviewed' }
          : s
      ))
      setSelectedSub(null)
      showToast('Remark saved successfully.')
    } catch {
      showToast('Failed to save remark.')
    } finally {
      setRemarkSaving(false)
    }
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // Sort students: those with submissions first (pending first), then no submission
  function getSortedStudentRows() {
    return students.map(student => {
      const subs = submissions.filter(s => s.studentId === student.id || s.studentId === student.uid)
      return { student, subs }
    }).sort((a, b) => {
      const aHas = a.subs.length > 0
      const bHas = b.subs.length > 0
      if (aHas && !bHas) return -1
      if (!aHas && bHas) return 1
      // Both have subs — pending first
      const aPending = a.subs.filter(s => s.status !== 'reviewed').length
      const bPending = b.subs.filter(s => s.status !== 'reviewed').length
      return bPending - aPending
    })
  }

  const pendingCount = submissions.filter(s => s.status !== 'reviewed').length

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="section-tag mb-1">Teacher Portal</p>
            <h1 className="text-3xl font-bold text-primary">
              Welcome, {currentUser?.displayName?.split(' ')[0] || 'Teacher'}
            </h1>
          </div>
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            + Create Class
          </Button>
        </div>

        {/* Stats */}
        {!activeClass && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'My Classes',    value: totalClasses,  color: 'text-primary' },
              { label: 'Total Students', value: totalStudents, color: 'text-accent' },
              { label: 'Pending Reviews', value: '—',          color: 'text-yellow-500' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl shadow-card p-5">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">{s.label}</p>
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Create class modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-lg font-bold text-primary mb-5">Create New Class</h2>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <Input label="Class Name" value={createForm.className}
                  onChange={e => setCreateForm(p => ({ ...p, className: e.target.value }))}
                  placeholder="e.g. BSCS 3A" required />
                <Input label="Subject" value={createForm.subject}
                  onChange={e => setCreateForm(p => ({ ...p, subject: e.target.value }))}
                  placeholder="e.g. Capstone Project" required />
                <Input label="Section" value={createForm.section}
                  onChange={e => setCreateForm(p => ({ ...p, section: e.target.value }))}
                  placeholder="e.g. 3A" />
                <Input label="School Year" value={createForm.schoolYear}
                  onChange={e => setCreateForm(p => ({ ...p, schoolYear: e.target.value }))}
                  placeholder="e.g. 2026-2027" />
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" className="flex-1"
                    onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" className="flex-1" loading={creating}>
                    Create Class
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="xl" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* ── Classes sidebar ── */}
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-2">
                My Classes
              </p>
              {classes.length === 0 ? (
                <div className="bg-white rounded-xl shadow-card p-5 text-center text-gray-400">
                  <p className="text-sm">No classes yet.</p>
                  <button onClick={() => setShowCreate(true)}
                    className="text-xs text-accent underline mt-1">
                    Create your first class
                  </button>
                </div>
              ) : classes.map(cls => (
                <div key={cls.classId}
                  onClick={() => handleSelectClass(cls)}
                  className={`bg-white rounded-xl shadow-card p-4 cursor-pointer transition-all
                    ${activeClass?.classId === cls.classId
                      ? 'border-2 border-accent'
                      : 'border border-transparent hover:border-accent/30'}`}>
                  <p className="font-semibold text-primary text-sm">{cls.className}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{cls.subject}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {cls.studentIds?.length || 0} students
                    </span>
                    <span className="bg-accent/10 text-accent text-xs font-bold px-2
                                     py-0.5 rounded font-mono">
                      {cls.classCode}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Class detail panel ── */}
            <div className="lg:col-span-3">
              {!activeClass ? (
                <div className="bg-white rounded-xl shadow-card p-12 text-center text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="font-medium">Select a class to view students and submissions</p>
                </div>
              ) : classLoading ? (
                <div className="flex justify-center py-20"><Spinner size="lg" /></div>
              ) : (
                <div className="bg-white rounded-xl shadow-card overflow-hidden">

                  {/* Class header */}
                  <div className="px-6 py-4 border-b bg-gray-50">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <h2 className="font-bold text-primary text-lg">{activeClass.className}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {activeClass.subject}
                          {activeClass.section && ` · Section ${activeClass.section}`}
                          {activeClass.schoolYear && ` · ${activeClass.schoolYear}`}
                        </p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-bold text-primary text-xl">{students.length}</p>
                          <p className="text-xs text-gray-400">Students</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-accent text-xl">{submissions.length}</p>
                          <p className="text-xs text-gray-400">Submissions</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-yellow-500 text-xl">{pendingCount}</p>
                          <p className="text-xs text-gray-400">Pending</p>
                        </div>
                      </div>
                    </div>

                    {/* Share code */}
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                      <span>Class code:</span>
                      <span className="bg-accent/10 text-accent font-bold px-2 py-0.5
                                       rounded font-mono text-sm">
                        {activeClass.classCode}
                      </span>
                      <span className="text-gray-400">— Share this with your students</span>
                    </div>
                  </div>

                  {/* Section tabs legend */}
                  <div className="px-6 py-3 border-b bg-white flex gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                      <span className="text-gray-500">Has submissions</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                      <span className="text-gray-400">No submission yet</span>
                    </div>
                  </div>

                  {/* Student rows */}
                  {students.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                      <p className="text-sm">No students enrolled yet.</p>
                      <p className="text-xs mt-1">
                        Share the class code{' '}
                        <strong className="text-accent">{activeClass.classCode}</strong>{' '}
                        with your students.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {getSortedStudentRows().map(({ student, subs }) => (
                        <StudentRow
                          key={student.id}
                          student={student}
                          submissions={subs}
                          onViewSubmission={(sub, stud) => {
                            setSelectedSub(sub)
                            setSelectedStudent(stud)
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submission detail + remark modal */}
        {selectedSub && (
          <SubmissionModal
            sub={selectedSub}
            student={selectedStudent}
            saving={remarkSaving}
            onClose={() => { setSelectedSub(null); setSelectedStudent(null) }}
            onSaveRemark={handleSaveRemark}
          />
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-primary text-white
                          text-sm px-6 py-3 rounded-lg shadow-2xl z-50">
            {toast}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
