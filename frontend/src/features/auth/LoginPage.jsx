/**
 * LoginPage — Role-based login with separate pages.
 * /login/student  → Student login (Student Number + Password)
 * /login/teacher  → Teacher login (Employee ID + Password)
 * /login/admin    → Admin login (Email + Password) [hidden URL]
 * /login          → Redirects to /login/student
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getAuthErrorMessage } from './authService'
import {
  collection, query, where, limit, getDocs
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'

// Look up email by studentId
async function getEmailByStudentId(studentId) {
  try {
    const q = query(
      collection(db, 'users'),
      where('studentId', '==', studentId.trim()),
      limit(1)
    )
    const snap = await getDocs(q)
    if (snap.empty) return null
    const data = snap.docs[0].data()
    if (data.role !== 'student') return null
    return data.email
  } catch (err) {
    console.error('getEmailByStudentId error:', err)
    throw err
  }
}

// Look up email by employeeId
async function getEmailByEmployeeId(employeeId) {
  try {
    const q = query(
      collection(db, 'users'),
      where('employeeId', '==', employeeId.trim()),
      limit(1)
    )
    const snap = await getDocs(q)
    if (snap.empty) return null
    const data = snap.docs[0].data()
    if (data.role !== 'teacher') return null
    return data.email
  } catch (err) {
    console.error('getEmailByEmployeeId error:', err)
    throw err
  }
}

// SVG Icons
function StudentIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952
           11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  )
}

function TeacherIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

export default function LoginPage() {
  const { login, loginWithGoogle, currentUser, userDoc, userDocLoading,
          resendVerificationEmail } = useAuth()
  const navigate   = useNavigate()
  const { role: urlRole } = useParams()

  // Determine login type from URL — default to 'student'
  const loginType = urlRole === 'admin' ? 'admin'
                  : urlRole === 'teacher' ? 'teacher'
                  : 'student'

  const [identifier, setIdentifier]           = useState('')
  const [password, setPassword]               = useState('')
  const [error, setError]                     = useState('')
  const [loading, setLoading]                 = useState(false)
  const [googleLoading, setGoogleLoading]     = useState(false)
  const [pendingRedirect, setPendingRedirect] = useState(false)
  const [unverified, setUnverified]           = useState(false)
  const [resendLoading, setResendLoading]     = useState(false)
  const [resendSent, setResendSent]           = useState(false)

  // After login wait for userDoc then redirect
  useEffect(() => {
    if (!pendingRedirect) return
    if (userDocLoading) return

    const role = userDoc?.role
      || localStorage.getItem(`role_${currentUser?.uid}`)
      || 'user'

    if (role === 'admin' && currentUser?.uid) {
      localStorage.setItem(`role_${currentUser.uid}`, 'admin')
    }

    if (role === 'admin')        navigate('/admin',   { replace: true })
    else if (role === 'teacher') navigate('/teacher', { replace: true })
    else if (role === 'student') navigate('/student', { replace: true })
    else                         navigate('/',        { replace: true })

    setPendingRedirect(false)
  }, [pendingRedirect, userDocLoading, userDoc, currentUser, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setUnverified(false)
    setLoading(true)

    try {
      let emailToUse = identifier.trim()

      if (loginType === 'student') {
        const found = await getEmailByStudentId(identifier)
        if (!found) {
          setError('No student account found with that student number.')
          setLoading(false)
          return
        }
        emailToUse = found
      } else if (loginType === 'teacher') {
        const found = await getEmailByEmployeeId(identifier)
        if (!found) {
          setError('No teacher account found with that employee ID.')
          setLoading(false)
          return
        }
        emailToUse = found
      }
      // admin: emailToUse stays as typed email

      const result = await login(emailToUse, password)

      // Check email verification for new accounts
      const createdAt    = result.user.metadata?.creationTime
      const isNewAccount = createdAt && new Date(createdAt) > new Date('2026-11-01')
      if (!result.user.emailVerified && isNewAccount) {
        setUnverified(true)
        setLoading(false)
        return
      }

      setPendingRedirect(true)
    } catch (err) {
      setError(getAuthErrorMessage(err.code))
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
      setPendingRedirect(true)
    } catch (err) {
      setError(getAuthErrorMessage(err.code))
      setGoogleLoading(false)
    }
  }

  async function handleResendVerification() {
    setResendLoading(true)
    try {
      await resendVerificationEmail()
      setResendSent(true)
    } catch {
      setError('Failed to resend verification email.')
    } finally {
      setResendLoading(false)
    }
  }

  // ── Config per login type ──────────────────────────────────────────────────
  const config = {
    student: {
      icon: <StudentIcon />,
      label: 'Student Number',
      idPlaceholder: 'e.g. 2022-00001',
      idType: 'text',
      idAutoComplete: 'username',
      buttonLabel: 'Sign in as Student',
      subtitle: 'Student Login',
    },
    teacher: {
      icon: <TeacherIcon />,
      label: 'Employee ID',
      idPlaceholder: 'e.g. EMP-12345',
      idType: 'text',
      idAutoComplete: 'username',
      buttonLabel: 'Sign in as Teacher',
      subtitle: 'Teacher Login',
    },
    admin: {
      label: 'Email Address',
      idPlaceholder: 'admin@example.com',
      idType: 'email',
      idAutoComplete: 'email',
      buttonLabel: 'Sign in as Administrator',
      subtitle: 'Administrator Access',
    },
  }
  const c = config[loginType]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Loading overlay */}
        {pendingRedirect && (
          <div className="fixed inset-0 bg-gray-50 z-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Signing you in…</p>
            </div>
          </div>
        )}

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-primary">AI Detector</span>
          </div>
          <p className="text-gray-500 text-sm">{c.subtitle}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-card p-8">

          {/* Admin page header */}
          {loginType === 'admin' && (
            <div className="flex items-center gap-3 mb-6 p-3 bg-primary/5 border
                            border-primary/10 rounded-lg">
              <span className="text-2xl">🔑</span>
              <div>
                <p className="text-sm font-semibold text-primary">Admin Login</p>
                <p className="text-xs text-gray-400">Restricted access — authorized personnel only</p>
              </div>
            </div>
          )}

          {/* Errors */}
          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} className="mb-5" />
          )}

          {/* Unverified banner */}
          {unverified && (
            <div className="mb-5 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-yellow-800">Email not verified</p>
              <p className="text-xs text-yellow-700 mt-1">
                Check your inbox and click the verification link before signing in.
              </p>
              {resendSent ? (
                <p className="text-xs text-green-600 font-medium mt-2">✓ Verification email sent!</p>
              ) : (
                <button onClick={handleResendVerification} disabled={resendLoading}
                  className="text-xs text-yellow-700 underline font-medium mt-2
                             hover:text-yellow-900 disabled:opacity-50">
                  {resendLoading ? 'Sending…' : 'Resend verification email'}
                </button>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label={c.label}
              type={c.idType}
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder={c.idPlaceholder}
              required
              autoComplete={c.idAutoComplete}
            />
            <div>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password"
                  className="text-xs text-accent hover:text-accent-dark transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              {c.buttonLabel}
            </Button>
          </form>

          {/* Google — admin page only */}
          {loginType === 'admin' && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-400">or continue with</span>
                </div>
              </div>
              <button onClick={handleGoogle} disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 border border-gray-300
                           rounded py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50
                           transition-colors disabled:opacity-50">
                {googleLoading ? (
                  <svg className="animate-spin h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Sign in with Google
              </button>
            </>
          )}
        </div>

        {/* Bottom links — different per login type */}
        {loginType === 'admin' ? (
          <p className="text-center text-sm text-gray-400 mt-6">
            <Link to="/login/student" className="hover:text-gray-600 transition-colors">
              ← Back to main login
            </Link>
          </p>
        ) : (
          <div className="text-center mt-6 space-y-2">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-accent font-medium hover:text-accent-dark transition-colors">
                Sign up
              </Link>
            </p>
            {loginType === 'student' && (
              <p className="text-xs text-gray-400">
                Faculty Login{' '}
                <Link to="/login/teacher" className="text-accent font-medium hover:text-accent-dark transition-colors">
                  Login here
                </Link>
              </p>
            )}
            {loginType === 'teacher' && (
              <p className="text-xs text-gray-400">
                Are you a student?{' '}
                <Link to="/login/student" className="text-accent font-medium hover:text-accent-dark transition-colors">
                  Login here
                </Link>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
