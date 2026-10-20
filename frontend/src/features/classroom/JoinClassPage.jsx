/**
 * JoinClassPage — Allows a registered student to join a class by code.
 * After joining, redirects to /student dashboard to see updated class list.
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getClassByCode, joinClass, getStudentClasses } from './classroomService'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import PageWrapper from '@/components/layout/PageWrapper'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'

export default function JoinClassPage() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [code, setCode]                       = useState('')
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState('')
  const [success, setSuccess]                 = useState('')
  const [enrolledClasses, setEnrolledClasses] = useState([])
  const [classesLoading, setClassesLoading]   = useState(true)

  // Load currently enrolled classes
  useEffect(() => {
    if (!currentUser) return
    async function loadClasses() {
      try {
        const snap = await getDoc(doc(db, 'users', currentUser.uid))
        if (snap.exists()) {
          const data = snap.data()
          const classIds = data.classIds?.length
            ? data.classIds
            : data.classId ? [data.classId] : []
          if (classIds.length > 0) {
            const classes = await getStudentClasses(classIds)
            setEnrolledClasses(classes)
          }
        }
      } catch (err) {
        console.error('Load classes error:', err)
      } finally {
        setClassesLoading(false)
      }
    }
    loadClasses()
  }, [currentUser])

  async function handleJoin(e) {
    e.preventDefault()
    if (!code.trim()) return setError('Please enter a class code.')
    setError('')
    setLoading(true)
    try {
      const cls = await getClassByCode(code.trim())
      if (!cls) {
        setError('No active class found with that code. Check with your teacher.')
        return
      }

      // Check if already enrolled
      if (enrolledClasses.find(c => c.classId === cls.classId)) {
        setError('You are already enrolled in this class.')
        return
      }

      await joinClass(cls.classId, currentUser.uid, {
        displayName: currentUser.displayName || 'Student',
        email: currentUser.email || '',
      })

      setSuccess(`Successfully joined "${cls.className}"!`)
      setCode('')

      // Refresh enrolled classes list
      const snap = await getDoc(doc(db, 'users', currentUser.uid))
      if (snap.exists()) {
        const data = snap.data()
        const classIds = data.classIds?.length
          ? data.classIds
          : data.classId ? [data.classId] : []
        const classes = await getStudentClasses(classIds)
        setEnrolledClasses(classes)
      }
    } catch (err) {
      setError(err.message || 'Failed to join class. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper>
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white font-extrabold text-sm tracking-tight">AI</span>
              </div>
              <span className="text-primary font-bold text-[15px]">AI Detector</span>
            </div>
            <p className="section-tag mb-1">Student Portal</p>
            <h1 className="text-3xl font-bold text-primary">Join a Class</h1>
          </div>
          <Link to="/student" className="text-sm text-accent hover:underline font-medium">
            ← Back to Dashboard
          </Link>
        </div>

        {success && (
          <Alert type="success" message={success} className="mb-5" />
        )}
        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} className="mb-5" />
        )}

        {/* Join form */}
        <div className="bg-white rounded-xl shadow-card p-6 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-4">
            Enter the class code from your teacher
          </p>
          <form onSubmit={handleJoin} className="space-y-4">
            <Input
              label="Class Code"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
              placeholder="e.g. XK9P2R"
              required
              autoComplete="off"
            />
            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              Join Class
            </Button>
          </form>
        </div>

        {/* Currently enrolled classes */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700">
              My Enrolled Classes
            </p>
            <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
              {enrolledClasses.length} class{enrolledClasses.length !== 1 ? 'es' : ''}
            </span>
          </div>

          {classesLoading ? (
            <div className="flex justify-center py-6"><Spinner size="sm" /></div>
          ) : enrolledClasses.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <p className="text-sm">Not enrolled in any class yet.</p>
              <p className="text-xs mt-1">Enter a class code above to join.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {enrolledClasses.map(cls => (
                <div key={cls.classId}
                  className="flex items-center justify-between p-3 bg-gray-50
                             border border-gray-100 rounded-xl">
                  <div>
                    <p className="font-semibold text-primary text-sm">{cls.className}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {cls.subject}
                      {cls.section && ` · Section ${cls.section}`}
                    </p>
                  </div>
                  <span className="bg-accent/10 text-accent text-xs font-bold
                                   px-2 py-0.5 rounded font-mono shrink-0">
                    {cls.classCode}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {enrolledClasses.length > 0 && (
          <div className="mt-4 text-center">
            <Link to="/submit"
              className="text-sm text-primary font-semibold hover:underline">
              Submit a Project →
            </Link>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
