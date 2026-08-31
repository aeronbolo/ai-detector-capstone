/**
 * adminService.js — Firestore queries for admin dashboard stats.
 *
 * Stats fetched:
 *   - Total analyses (count of detections collection)
 *   - AI-generated rate (% of detections labelled AI-Generated)
 *   - Average confidence (mean confidence across all detections)
 *   - Total users (count of users collection)
 *
 * Also provides:
 *   - getAllDetections()  → for All Analyses page
 *   - getAllUsers()       → for User Management page
 *   - deleteDetection()  → soft delete
 *   - updateUserRole()   → promote/demote user
 *   - deleteUser()       → remove user doc
 */

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

// ── Dashboard stats ───────────────────────────────────────────────────────────

export async function getDashboardStats() {
  try {
    const [detectionsSnap, usersSnap] = await Promise.all([
      getDocs(collection(db, 'detections')),
      getDocs(collection(db, 'users')),
    ])

    const detections = detectionsSnap.docs
      .map(d => d.data())
      .filter(d => !d.deleted)

    const totalAnalyses = detections.length
    const totalUsers    = usersSnap.size

    const aiGenerated = detections.filter(
      d => d.label === 'AI-Generated' || d.label === 'Digitally Edited'
    ).length

    const aiGeneratedRate = totalAnalyses > 0
      ? Math.round((aiGenerated / totalAnalyses) * 100)
      : 0

    const avgConfidence = totalAnalyses > 0
      ? Math.round(
          detections.reduce((sum, d) => sum + (d.confidence || 0), 0) / totalAnalyses
        )
      : 0

    return {
      totalAnalyses,
      aiGeneratedRate,
      avgConfidence,
      totalUsers,
    }
  } catch (err) {
    console.error('getDashboardStats failed:', err)
    return {
      totalAnalyses:   0,
      aiGeneratedRate: 0,
      avgConfidence:   0,
      totalUsers:      0,
    }
  }
}

// ── All detections (admin view) ───────────────────────────────────────────────

export async function getAllDetections() {
  const snap = await getDocs(
    query(collection(db, 'detections'), orderBy('createdAt', 'desc'))
  )
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(d => !d.deleted)
}

// ── All users ─────────────────────────────────────────────────────────────────

export async function getAllUsers() {
  const snap = await getDocs(
    query(collection(db, 'users'), orderBy('createdAt', 'desc'))
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function updateUserRole(uid, role) {
  await updateDoc(doc(db, 'users', uid), { role })
}

export async function removeUserDoc(uid) {
  await deleteDoc(doc(db, 'users', uid))
}

export async function softDeleteDetection(detectionId) {
  await updateDoc(doc(db, 'detections', detectionId), { deleted: true })
}

// ── Export helpers ────────────────────────────────────────────────────────────

export function exportToCSV(rows, filename) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h]
        if (val === null || val === undefined) return ''
        if (typeof val === 'object' && val?.toDate) return val.toDate().toLocaleString()
        return `"${String(val).replace(/"/g, '""')}"`
      }).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
