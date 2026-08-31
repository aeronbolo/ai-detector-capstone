/**
 * AdminNavbar — dark-theme navbar for all admin pages.
 * Matches mockup: AI Detector logo left, "Admin dashboard" subtitle,
 * Logout button top-right in red/danger.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function AdminNavbar({ title = 'Admin dashboard' }) {
  const { logout } = useAuth()
  const navigate   = useNavigate()
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
            <Link to="/"
              className="text-gray-400 hover:text-white text-sm transition-colors">
              ← Main site
            </Link>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-danger hover:text-red-400 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {loggingOut ? 'Logging out…' : 'Logout'}
          </button>
        </div>
      </div>
    </nav>
  )
}
