/**
 * StudentDashboardPage — Student home showing all enrolled classes and submissions.
 * Supports multiple class enrollments.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getStudentSubmissions, getStudentClasses } from './classroomService'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import PageWrapper from '@/components/layout/PageWrapper'
import Spinner from '@/components/ui/Spinner'

function formatDate(ts) {
  if (!ts) return '—'
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatCard({ label, value, color = 'text-primary' }) {
  return (
    <div className="bg-white rounded-xl shadow-card p-5 flex flex-col gap-1">
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</span>
      <span className={`text-3xl font-bold ${color}`}>{value}</span>
    </div>
  )
}

export default function StudentDashboardPage() {
  const { currentUser }                       = useAuth()
  const [studentData, setStudentData]         = useState(null)
  const [enrolledClasses, setEnrolledClasses] = useState([])
  const [submissions, setSubmissions]         = useState([])
  const [loading, setLoading]                 = useState(true)

  useEffect(() => {
    if (!currentUser) return
    async function loadAll() {
      try {
        const studentSnap = await getDoc(doc(db, 'users', currentUser.uid))
        const student = studentSnap.exists() ? studentSnap.data() : null
        setStudentData(student)

        // Support both classIds[] array and legacy classId string
        const classIds = student?.classIds?.length
          ? student.classIds
          : student?.classId ? [student.classId] : []

        if (classIds.length > 0) {
          const classes = await getStudentClasses(classIds)
          setEnrolledClasses(classes)
        }

        const subs = await getStudentSubmissions(currentUser.uid)
        setSubmissions(subs)
      } catch (err) {
        console.error('StudentDashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [currentUser])

  const pending  = submissions.filter(s => s.status !== 'reviewed').length
  const reviewed = submissions.filter(s => s.status === 'reviewed').length
  const accepted = submissions.filter(s => s.teacherRemark === 'Accepted').length
  const flagged  = submissions.filter(s => s.teacherRemark === 'Flagged').length
  const recent   = submissions.slice(0, 3)

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex justify-center py-24"><Spinner size="xl" /></div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <p className="section-tag mb-1">Student Portal</p>
          <h1 className="text-3xl font-bold text-primary">
            Welcome, {currentUser?.displayName?.split(' ')[0] || 'Student'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {studentData?.studentId && <span>Student ID: {studentData.studentId} · </span>}
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
            })}
          </p>
        </div>

        {/* Enrolled classes */}
        {enrolledClasses.length > 0 ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-widest font-semibold text-gray-400">
                Enrolled Classes ({enrolledClasses.length})
              </p>
              <Link to="/join-class" className="text-xs text-accent hover:underline font-medium">
                + Join another class
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {enrolledClasses.map(cls => (
                <div key={cls.id} className="bg-primary text-white rounded-xl p-4">
                  <p className="text-xs text-white/60 uppercase tracking-wider mb-1">{cls.subject}</p>
                  <h3 className="font-bold text-base">{cls.className}</h3>
                  <p className="text-white/70 text-xs mt-0.5">
                    {cls.section && `Section ${cls.section}`}
                    {cls.section && cls.schoolYear && ' · '}
                    {cls.schoolYear}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-8">
            <p className="text-yellow-800 font-semibold">Not enrolled in any class</p>
            <p className="text-yellow-700 text-sm mt-1">
              Ask your teacher for a class code, then{' '}
              <Link to="/join-class" className="underline font-semibold">join a class</Link>.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Submitted"  value={submissions.length} />
          <StatCard label="Pending Review"   value={pending}  color="text-yellow-500" />
          <StatCard label="Accepted"         value={accepted} color="text-success" />
          <StatCard label="Flagged"          value={flagged}  color="text-danger" />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link to="/submit"
            className="bg-white rounded-xl shadow-card p-5 flex items-center gap-4
                       hover:border-accent/30 border border-transparent transition group">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-primary">Submit Project</p>
              <p className="text-xs text-gray-400 mt-0.5">Upload your project for review</p>
            </div>
          </Link>

          <Link to="/my-submissions"
            className="bg-white rounded-xl shadow-card p-5 flex items-center gap-4
                       hover:border-accent/30 border border-transparent transition group">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-primary">My Submissions</p>
              <p className="text-xs text-gray-400 mt-0.5">View submissions and teacher remarks</p>
            </div>
          </Link>
        </div>

        {/* Recent submissions */}
        {recent.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-primary">Recent Submissions</h2>
              <Link to="/my-submissions" className="text-sm text-accent hover:text-accent/80">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {recent.map(sub => (
                <div key={sub.id}
                  className="bg-white rounded-xl shadow-card p-4 flex items-center
                             justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">{sub.projectTitle}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(sub.submittedAt)}</p>
                  </div>
                  <div>
                    {sub.status === 'reviewed' ? (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        sub.teacherRemark === 'Accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                        sub.teacherRemark === 'Flagged'  ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {sub.teacherRemark === 'Accepted' ? '✓ ' : sub.teacherRemark === 'Flagged' ? '⚠ ' : '🔍 '}
                        {sub.teacherRemark}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Pending review</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
