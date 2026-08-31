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

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      return setError('Passwords do not match.')
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters.')
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
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="Min. 6 characters"
              required
              autoComplete="new-password"
            />
            <Input
              label="Confirm password"
              type="password"
              value={form.confirm}
              onChange={set('confirm')}
              placeholder="Repeat your password"
              required
              autoComplete="new-password"
            />

            <Button type="submit" variant="primary" className="w-full mt-2" loading={loading}>
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
