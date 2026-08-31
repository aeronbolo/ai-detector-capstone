/**
 * ForgotPasswordPage — sends Firebase password reset email.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getAuthErrorMessage } from './authService'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      setError(getAuthErrorMessage(err.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
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
          <p className="text-gray-500 text-sm">Reset your password</p>
        </div>

        <div className="bg-white rounded-lg shadow-card p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-primary">Check your email</h2>
              <p className="text-gray-500 text-sm">
                We sent a password reset link to <strong>{email}</strong>.
                Check your inbox and follow the instructions.
              </p>
              <Link to="/login" className="inline-block text-accent font-medium text-sm hover:text-accent-dark transition-colors">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <Alert type="error" message={error} onClose={() => setError('')} className="mb-5" />
              )}
              <p className="text-gray-600 text-sm mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
                <Button type="submit" variant="primary" className="w-full" loading={loading}>
                  Send reset link
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-accent hover:text-accent-dark transition-colors">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
