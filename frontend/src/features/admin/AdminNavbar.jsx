/**
 * AdminNavbar — dark-theme navbar for all admin pages.
 * Includes logout confirmation modal.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

// ── Logout Confirm Modal ──────────────────────────────────────────────────────
function LogoutModal({ open, onConfirm, onCancel, loading }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#162739] border border-white/10 rounded-xl p-8
                      max-w-sm w-full mx-4 shadow-2xl">
        {/* Icon */}
        <div className="w-14 h-14 bg-danger/10 rounded-full flex items-center
                        justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7
                 a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>

        {/* Text */}
        <h2 className="text-white text-xl font-bold text-center mb-2">
          Sign out?
        </h2>
        <p className="text-gray-400 text-sm text-center mb-6">
          Are you sure you want to sign out of the admin dashboard?
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-white/10 text-gray-300
                       hover:bg-white/5 transition text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-danger text-white font-semibold
                       text-sm hover:bg-red-600 transition disabled:opacity-50
                       flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing out…
              </>
            ) : (
              'Yes, sign out'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Navbar ───────────────────────────────────────────────────────────────
export default function AdminNavbar({ title = 'Admin dashboard' }) {
  const { logout, currentUser } = useAuth()
  const navigate                = useNavigate()
  const [showModal, setShowModal]   = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
      navigate('/login')
    } catch {
      setLoggingOut(false)
    }
  }

  return (
    <>
      <nav className="bg-[#0d1b2a] border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <Link to="/admin" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white font-extrabold text-sm tracking-tight">AI</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-white font-bold text-[15px] leading-tight tracking-tight">
                  AI Detector
                </span>
                <span className="text-gray-400 text-[11px] leading-tight mt-0.5">
                  {title}
                </span>
              </div>
            </Link>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/admin"
                className="text-gray-300 hover:text-white text-sm transition-colors">
                Dashboard
              </Link>
              <Link to="/admin/analyses"
                className="text-gray-300 hover:text-white text-sm transition-colors">
                All Analyses
              </Link>
              <Link to="/admin/users"
                className="text-gray-300 hover:text-white text-sm transition-colors">
                Users
              </Link>
              <Link to="/admin/algorithms"
                className="text-gray-300 hover:text-white text-sm transition-colors">
                Algorithms
              </Link>
              <Link to="/admin/train"
                className="text-gray-300 hover:text-white text-sm transition-colors">
                Train Model
              </Link>
              <Link to="/"
                className="text-gray-400 hover:text-white text-sm transition-colors">
                ← Main site
              </Link>
            </div>

            {/* Right side — user + logout */}
            <div className="flex items-center gap-4">
              {currentUser && (
                <span className="hidden sm:block text-gray-400 text-xs truncate max-w-[160px]">
                  {currentUser.displayName || currentUser.email}
                </span>
              )}
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 text-danger hover:text-red-400
                           text-sm font-semibold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7
                       a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* Logout confirmation modal */}
      <LogoutModal
        open={showModal}
        onConfirm={handleLogout}
        onCancel={() => setShowModal(false)}
        loading={loggingOut}
      />
    </>
  )
}
