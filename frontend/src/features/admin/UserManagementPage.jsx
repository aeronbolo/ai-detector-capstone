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

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleSaveRole(uid, role) {
    setSaving(true)
    try {
      await updateUserRole(uid, role)
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u))
      // Update localStorage cache if it's the current user's role
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

        {/* Table card */}
        <div className="bg-[#111e2d] rounded-lg border border-white/5 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner size="xl" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              No users found.
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
                      Joined
                    </th>
                    <th className="text-left text-xs uppercase tracking-widest text-gray-500 font-semibold px-6 py-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr
                      key={user.uid}
                      className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors
                        ${idx % 2 === 0 ? '' : 'bg-white/[0.015]'}`}
                    >
                      {/* Name */}
                      <td className="px-6 py-4 text-gray-200 font-medium">
                        {user.displayName || '—'}
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-gray-300">
                        {user.email || '—'}
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <RoleBadge role={user.role} />
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
        {!loading && users.length > 0 && (
          <p className="text-gray-500 text-xs mt-4">
            {users.length} user{users.length !== 1 ? 's' : ''} total
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
