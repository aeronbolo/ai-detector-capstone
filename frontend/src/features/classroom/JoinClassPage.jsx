/**
 * JoinClassPage — Allows an already-registered student to join a class by code.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getClassByCode, joinClass } from './classroomService'
import PageWrapper from '@/components/layout/PageWrapper'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import Input from '@/components/ui/Input'

export default function JoinClassPage() {
  const { currentUser, userDoc } = useAuth()
  const navigate = useNavigate()
  const [code, setCode]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')

  async function handleJoin(e) {
    e.preventDefault()
    if (!code.trim()) return setError('Please enter a class code.')
    setError('')
    setLoading(true)
    try {
      const cls = await getClassByCode(code.trim())
      if (!cls) {
        setError('No active class found with that code. Check with your teacher.')
        return
      }
      await joinClass(cls.classId, currentUser.uid, {
        displayName: currentUser.displayName || userDoc?.displayName || 'Student',
        email: currentUser.email || '',
      })
      setSuccess(`Successfully joined "${cls.className}"! You can now submit projects.`)
      setTimeout(() => navigate('/submit'), 2000)
    } catch (err) {
      setError(err.message || 'Failed to join class. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper>
      <div className="max-w-md mx-auto px-4 py-16">
        <p className="section-tag mb-2">Student Portal</p>
        <h1 className="text-3xl font-bold text-primary mb-2">Join a Class</h1>
        <p className="text-gray-500 text-sm mb-8">
          Enter the class code provided by your teacher to join their class.
        </p>

        {success && (
          <Alert type="success" message={success} className="mb-5" />
        )}
        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} className="mb-5" />
        )}

        <div className="bg-white rounded-lg shadow-card p-6">
          <form onSubmit={handleJoin} className="space-y-4">
            <Input
              label="Class Code"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
              placeholder="e.g. XK9P2R"
              required
              autoComplete="off"
            />
            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              Join Class
            </Button>
          </form>
        </div>

        {userDoc?.classId && (
          <p className="text-xs text-gray-400 mt-4 text-center">
            You are already enrolled in a class. Joining a new class will update your enrollment.
          </p>
        )}
      </div>
    </PageWrapper>
  )
}
