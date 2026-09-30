/**
 * RegisterPage — name, email, password, confirm password.
 * Creates Firestore user doc with role: "user" on success.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getAuthErrorMessage } from './authService'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'

// ── Password strength checker ─────────────────────────────────────────────────
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '', checks: [] }

  const checks = [
    { label: 'At least 8 characters',          ok: password.length >= 8 },
    { label: 'Uppercase letter (A–Z)',          ok: /[A-Z]/.test(password) },
    { label: 'Lowercase letter (a–z)',          ok: /[a-z]/.test(password) },
    { label: 'Number (0–9)',                    ok: /[0-9]/.test(password) },
    { label: 'Special character (!@#$%^&*…)',  ok: /[^A-Za-z0-9]/.test(password) },
  ]

  const score = checks.filter(c => c.ok).length

  const levels = [
    { label: '',            color: 'bg-gray-200'   },
    { label: 'Very Weak',   color: 'bg-red-500'    },
    { label: 'Weak',        color: 'bg-orange-400' },
    { label: 'Fair',        color: 'bg-yellow-400' },
    { label: 'Strong',      color: 'bg-blue-500'   },
    { label: 'Very Strong', color: 'bg-green-500'  },
  ]

  return { score, ...levels[score], checks }
}

function PasswordStrengthMeter({ password }) {
  const { score, label, color, checks } = getPasswordStrength(password)
  if (!password) return null

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar segments */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Strength label */}
      <p className={`text-xs font-medium ${
        score <= 1 ? 'text-red-500'    :
        score === 2 ? 'text-orange-500' :
        score === 3 ? 'text-yellow-600' :
        score === 4 ? 'text-blue-500'   : 'text-green-600'
      }`}>
        {label}
      </p>

      {/* Requirements checklist */}
      <ul className="space-y-0.5">
        {checks.map((c, i) => (
          <li key={i} className={`flex items-center gap-1.5 text-xs ${c.ok ? 'text-green-600' : 'text-gray-400'}`}>
            {c.ok ? (
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))
  const { score } = getPasswordStrength(form.password)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      return setError('Passwords do not match.')
    }
    if (form.password.length < 8) {
      return setError('Password must be at least 8 characters.')
    }
    if (score < 3) {
      return setError('Password is too weak. Add uppercase, lowercase, numbers and a special character.')
    }

    setLoading(true)
    try {
      await register(form.email, form.password, form.name)
      navigate('/')
    } catch (err) {
      setError(getAuthErrorMessage(err.code))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
      navigate('/')
    } catch (err) {
      setError(getAuthErrorMessage(err.code))
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

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
          <p className="text-gray-500 text-sm">Create your free account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-card p-8">
          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} className="mb-5" />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full name"
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="Juan Miguel"
              required
              autoComplete="name"
            />
            <Input
              label="Email address"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />

            {/* Password + strength meter */}
            <div>
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="Min. 8 characters"
                required
                autoComplete="new-password"
              />
              <PasswordStrengthMeter password={form.password} />
            </div>

            <Input
              label="Confirm password"
              type="password"
              value={form.confirm}
              onChange={set('confirm')}
              placeholder="Repeat your password"
              required
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              loading={loading}
              disabled={loading || score < 3}
            >
              Create account
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-400">or sign up with</span>
            </div>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {googleLoading ? (
              <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
            Sign up with Google
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-medium hover:text-accent-dark transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
