/**
 * VerifyEmailPage — shown after registration.
 * User lands here and must verify email before accessing the app.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function VerifyEmailPage() {
  const { currentUser, resendVerificationEmail, logout } = useAuth()
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent]       = useState(false)
  const [error, setError]                 = useState('')

  async function handleResend() {
    setResendLoading(true)
    setError('')
    try {
      await resendVerificationEmail()
      setResendSent(true)
      setTimeout(() => setResendSent(false), 5000)
    } catch {
      setError('Failed to resend. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  async function handleLogout() {
    await logout()
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
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-card p-8 text-center">

          {/* Email icon */}
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center
                          justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7
                   a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-primary mb-2">Verify your email</h2>
          <p className="text-gray-500 text-sm mb-1">We sent a verification link to</p>
          <p className="text-primary font-semibold text-sm mb-4">
            {currentUser?.email || 'your email'}
          </p>
          <p className="text-gray-400 text-xs mb-6 leading-relaxed">
            Click the link in the email to activate your account.
            Once verified, you can sign in.
          </p>

          {/* Success message */}
          {resendSent && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-700 text-xs font-medium">
                ✓ Verification email sent! Check your inbox.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          )}

          {/* Resend button */}
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="w-full py-2.5 border border-accent text-accent rounded-lg
                       text-sm font-medium hover:bg-accent/5 transition
                       disabled:opacity-50 mb-3"
          >
            {resendLoading ? 'Sending…' : 'Resend verification email'}
          </button>

          {/* Already verified — go to login */}
          <Link
            to="/login"
            className="block w-full py-2.5 bg-primary text-white rounded-lg
                       text-sm font-semibold text-center hover:bg-primary/90 transition mb-4"
          >
            I've verified — Sign in
          </Link>

          {/* Sign out link */}
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-gray-600 transition"
          >
            Sign out and use a different account
          </button>
        </div>
      </div>
    </div>
  )
}
