/**
 * Navbar — matches Landing page UI.jpg mockup exactly.
 * White background, teal logo square, "AI Detector" bold + subtitle,
 * center-spaced nav: Analyze | History | Login / Sign up
 */

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

export default function Navbar() {
  const { currentUser, userDoc, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const isAdmin = userDoc?.role === 'admin'
  const isActive = (path) => location.pathname === path

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Logout failed:', err)
    } finally {
      setLoggingOut(false)
      setShowLogoutModal(false)
    }
  }

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-[60px]">

            {/* ── Logo ── */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              {/* Teal square icon */}
              <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white font-extrabold text-sm tracking-tight">AI</span>
              </div>
              {/* Brand text */}
              <div className="flex flex-col leading-none">
                <span className="text-primary font-bold text-[15px] leading-tight tracking-tight">
                  AI Detector
                </span>
                <span className="text-gray-400 text-[11px] leading-tight mt-0.5">
                  Image and Video Forensics
                </span>
              </div>
            </Link>

            {/* ── Desktop nav links ── */}
            <div className="hidden md:flex items-center gap-10">
              <Link
                to="/"
                className={`text-sm transition-colors ${
                  isActive('/') ? 'text-primary font-semibold' : 'text-gray-700 hover:text-primary font-normal'
                }`}
              >
                Analyze
              </Link>

              {/* History — always visible so guests see it (redirects to login) */}
              <Link
                to={currentUser ? '/history' : '/login'}
                className={`text-sm transition-colors ${
                  isActive('/history') ? 'text-primary font-semibold' : 'text-gray-700 hover:text-primary font-normal'
                }`}
              >
                History
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${
                    location.pathname.startsWith('/admin')
                      ? 'bg-accent text-white'
                      : 'bg-accent/10 text-accent hover:bg-accent/20'
                  }`}
                >
                  Admin
                </Link>
              )}

              {/* Auth */}
              {currentUser ? (
                <div className="flex items-center gap-4">
                  {/* Avatar + display name */}
                  <div className="flex items-center gap-2">
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt="avatar"
                        className="w-7 h-7 rounded-full border border-gray-200"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold">
                        {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-gray-700">
                      {currentUser.displayName || currentUser.email?.split('@')[0]}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className="text-sm text-gray-500 hover:text-danger transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="text-sm text-gray-700 hover:text-primary transition-colors font-normal"
                >
                  Login / Sign up
                </Link>
              )}
            </div>

            {/* ── Mobile hamburger ── */}
            <button
              className="md:hidden text-gray-600 hover:text-primary p-1"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>

          </div>
        </div>

        {/* ── Mobile menu ── */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-3 space-y-1">
            <Link to="/" className="block py-2 text-sm text-gray-700 hover:text-primary" onClick={() => setMenuOpen(false)}>
              Analyze
            </Link>
            <Link to={currentUser ? '/history' : '/login'} className="block py-2 text-sm text-gray-700 hover:text-primary" onClick={() => setMenuOpen(false)}>
              History
            </Link>
            {isAdmin && (
              <Link to="/admin" className="block py-2 text-sm text-gray-700 hover:text-primary" onClick={() => setMenuOpen(false)}>
                Admin
              </Link>
            )}
            {currentUser ? (
              <button
                onClick={() => { setShowLogoutModal(true); setMenuOpen(false) }}
                className="block w-full text-left py-2 text-sm text-danger"
              >
                Logout
              </button>
            ) : (
              <Link to="/login" className="block py-2 text-sm text-gray-700 hover:text-primary" onClick={() => setMenuOpen(false)}>
                Login / Sign up
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* ── Logout confirmation modal ── */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Sign out"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleLogout} loading={loggingOut}>Sign out</Button>
          </>
        }
      >
        <p className="text-gray-600">Are you sure you want to sign out?</p>
      </Modal>
    </>
  )
}
