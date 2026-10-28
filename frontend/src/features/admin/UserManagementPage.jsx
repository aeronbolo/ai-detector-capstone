/**
 * UserManagementPage — Admin user management table.
 * Matches mockup exactly:
 *   - Dark background #0d1b2a
 *   - "ACCOUNT CONTROL" teal tag
 *   - "User management" large white title
 *   - Table: NAME | EMAIL | ROLE | JOINED | ACTIONS
 *   - Edit (teal outline) + Remove (red solid) per row
 *   - Edit opens inline role-change modal
 *   - Remove opens confirmation modal
 */

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getAllUsers, updateUserRole, removeUserDoc } from './adminService'
import AdminNavbar from './AdminNavbar'
import Spinner from '@/components/ui/Spinner'

// ── Role badge ────────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const isAdmin = role === 'admin'
  return (
    <span className={`text-sm font-medium ${isAdmin ? 'text-accent' : 'text-gray-300'}`}>
      {role || 'user'}
    </span>
  )
}

// ── Edit Role Modal ───────────────────────────────────────────────────────────
function EditModal({ user, onSave, onCancel, saving }) {
  const [role, setRole] = useState(user.role || 'user')
  if (!user) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#162739] border border-white/10 rounded-xl p-8 max-w-sm w-full mx-4 shadow-2xl">
        <h2 className="text-white text-lg font-bold mb-1">Edit user</h2>
        <p className="text-gray-400 text-sm mb-6 truncate">{user.email}</p>

        <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">
          Role
        </label>
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="w-full bg-[#0d1b2a] border border-white/10 text-white rounded-lg px-3 py-2.5
                     text-sm focus:outline-none focus:border-accent mb-6"
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded text-sm text-gray-300 border border-gray-600
                       hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(user.uid, role)}
            disabled={saving}
            className="px-4 py-2 rounded text-sm bg-accent text-white font-semibold
                       hover:bg-accent-dark transition disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Remove Confirm Modal ──────────────────────────────────────────────────────
function RemoveModal({ user, onConfirm, onCancel, removing }) {
  if (!user) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#162739] border border-white/10 rounded-xl p-8 max-w-sm w-full mx-4 shadow-2xl">
        <h2 className="text-white text-lg font-bold mb-2">Remove user?</h2>
        <p className="text-gray-400 text-sm mb-1">
          This will remove <span className="text-white font-medium">{user.displayName || user.email}</span> from the system.
        </p>
        <p className="text-gray-500 text-xs mb-6">
          Their Firebase Auth account will remain active. Only the Firestore user document is deleted.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded text-sm text-gray-300 border border-gray-600
                       hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(user.uid)}
            disabled={removing}
            className="px-4 py-2 rounded text-sm bg-danger text-white font-semibold
                       hover:bg-red-600 transition disabled:opacity-50"
          >
            {removing ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Format date ───────────────────────────────────────────────────────────────
function formatDate(ts) {
  if (!ts) return '—'
  try {
    const date = ts?.toDate ? ts.toDate() : new Date(ts)
    return date.toLocaleString('en-US', {
      month: 'numeric',
      day:   'numeric',
      year:  'numeric',
      hour:  'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  } catch {
    return '—'
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function UserManagementPage() {
  const { currentUser } = useAuth()

  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [editUser, setEditUser]     = useState(null)
  const [removeUser, setRemoveUser] = useState(null)
  const [saving, setSaving]         = useState(false)
  const [removing, setRemoving]     = useState(false)
  const [toast, setToast]           = useState('')

  // ── Search & filter ──────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]     = useState('')
  const [roleFilter, setRoleFilter]       = useState('all')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await getAllUsers()
      setUsers(data)
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filtered + searched users
  const filteredUsers = users.filter(u => {
    // Role filter
    if (roleFilter !== 'all' && u.role !== roleFilter) return false

    // Search query — matches name, email, studentId, employeeId, department
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const fields = [
        u.displayName || '',
        u.email || '',
        u.studentId || '',
        u.employeeId || '',
        u.department || '',
      ]
      return fields.some(f => f.toLowerCase().includes(q))
    }
    return true
  })

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleSaveRole(uid, role) {
    setSaving(true)
    try {
      await updateUserRole(uid, role)
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u))
      localStorage.setItem(`role_${uid}`, role)
      showToast('Role updated successfully.')
      setEditUser(null)
    } catch (err) {
      console.error('updateUserRole failed:', err)
      showToast(`Failed to update role: ${err?.code || err?.message || 'Permission denied'}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(uid) {
    setRemoving(true)
    try {
      await removeUserDoc(uid)
      setUsers(prev => prev.filter(u => u.uid !== uid))
      localStorage.removeItem(`userDoc_${uid}`)
      localStorage.removeItem(`role_${uid}`)
      showToast('User removed successfully.')
      setRemoveUser(null)
    } catch (err) {
      console.error('removeUserDoc failed:', err)
      showToast(`Failed to remove user: ${err?.code || err?.message || 'Permission denied'}`)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1b2a] text-white">
      <AdminNavbar title="Admin dashboard" />

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">

        {/* Section tag */}
        <p className="text-xs uppercase tracking-widest font-semibold text-accent mb-3">
          Account Control
        </p>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-10">
          User management
        </h1>

        {/* Search + Filter bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search input */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, ID, department…"
              className="w-full bg-[#162739] border border-white/10 text-white rounded-lg
                         pl-10 pr-4 py-2.5 text-sm placeholder:text-gray-500
                         focus:outline-none focus:border-accent transition"
            />
          </div>

          {/* Role filter dropdown */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-[#162739] border border-white/10 text-white rounded-lg
                       px-4 py-2.5 text-sm focus:outline-none focus:border-accent
                       transition cursor-pointer min-w-[160px]"
          >
            <option value="all">All Users</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        {/* Table card */}
        <div className="bg-[#111e2d] rounded-lg border border-white/5 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner size="xl" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              {users.length === 0
                ? 'No users found.'
                : 'No users match your search or filter.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-xs uppercase tracking-widest text-gray-500 font-semibold px-6 py-4">
                      Name
                    </th>
                    <th className="text-left text-xs uppercase tracking-widest text-gray-500 font-semibold px-6 py-4">
                      Email
                    </th>
                    <th className="text-left text-xs uppercase tracking-widest text-gray-500 font-semibold px-6 py-4">
                      Role
                    </th>
                    <th className="text-left text-xs uppercase tracking-widest text-gray-500 font-semibold px-6 py-4">
                      ID / Department
                    </th>
                    <th className="text-left text-xs uppercase tracking-widest text-gray-500 font-semibold px-6 py-4">
                      Joined
                    </th>
                    <th className="text-left text-xs uppercase tracking-widest text-gray-500 font-semibold px-6 py-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, idx) => (
                    <tr
                      key={user.uid}
                      className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors
                        ${idx % 2 === 0 ? '' : 'bg-white/[0.015]'}`}
                    >
                      {/* Name */}
                      <td className="px-6 py-4 text-gray-200 font-medium whitespace-nowrap">
                        {user.displayName || '—'}
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-gray-300 whitespace-nowrap">
                        {user.email || '—'}
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <RoleBadge role={user.role} />
                      </td>

                      {/* ID / Department */}
                      <td className="px-6 py-4 text-gray-400">
                        {user.role === 'student' && (user.studentId || '—')}
                        {user.role === 'teacher' && (
                          <span className="whitespace-nowrap">
                            {user.employeeId || '—'}
                            {user.department && (
                              <span className="block text-xs text-gray-500 mt-0.5">
                                {user.department}
                              </span>
                            )}
                          </span>
                        )}
                        {(!user.role || (user.role !== 'student' && user.role !== 'teacher')) && '—'}
                      </td>

                      {/* Joined */}
                      <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* Edit */}
                          <button
                            onClick={() => setEditUser(user)}
                            className="px-4 py-1.5 rounded text-xs font-semibold border border-accent
                                       text-accent hover:bg-accent/10 transition"
                          >
                            Edit
                          </button>

                          {/* Remove — disabled for own account */}
                          <button
                            onClick={() => setRemoveUser(user)}
                            disabled={user.uid === currentUser?.uid}
                            className="px-4 py-1.5 rounded text-xs font-semibold bg-danger text-white
                                       hover:bg-red-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            title={user.uid === currentUser?.uid ? "Can't remove your own account" : ''}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User count */}
        {!loading && (
          <p className="text-gray-500 text-xs mt-4">
            {filteredUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''}
            {roleFilter !== 'all' && ` (filtered by: ${roleFilter})`}
          </p>
        )}
      </main>

      {/* Edit modal */}
      {editUser && (
        <EditModal
          user={editUser}
          onSave={handleSaveRole}
          onCancel={() => setEditUser(null)}
          saving={saving}
        />
      )}

      {/* Remove modal */}
      {removeUser && (
        <RemoveModal
          user={removeUser}
          onConfirm={handleRemove}
          onCancel={() => setRemoveUser(null)}
          removing={removing}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#162739] border
                        border-white/10 text-white text-sm px-6 py-3 rounded-lg shadow-2xl z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
