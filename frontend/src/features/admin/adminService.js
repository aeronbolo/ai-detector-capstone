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
    const [detectionsSnap, usersSnap, submissionsSnap] = await Promise.all([
      getDocs(collection(db, 'detections')),
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'submissions')),
    ])

    // Detections (main detection flow)
    const detections = detectionsSnap.docs
      .map(d => d.data())
      .filter(d => d.deleted !== true)

    // Submissions (classroom project submissions)
    const submissions = submissionsSnap.docs
      .map(d => d.data())
      .filter(d => d.deleted !== true)

    // Combine for total analyses
    const totalDetections  = detections.length
    const totalSubmissions = submissions.length
    const totalAnalyses    = totalDetections + totalSubmissions
    const totalUsers       = usersSnap.size

    // AI-generated count across both collections
    const aiDetections = detections.filter(
      d => d.label === 'AI-Generated' || d.label === 'Digitally Edited'
    ).length
    const aiSubmissions = submissions.filter(
      d => d.label === 'AI-Generated' || d.label === 'Digitally Edited'
    ).length
    const aiTotal = aiDetections + aiSubmissions

    const aiGeneratedRate = totalAnalyses > 0
      ? Math.round((aiTotal / totalAnalyses) * 100)
      : 0

    // Average confidence across both collections
    const allConfidences = [
      ...detections.map(d => d.confidence || 0),
      ...submissions.map(d => d.confidence || 0),
    ]
    const avgConfidence = allConfidences.length > 0
      ? Math.round(allConfidences.reduce((sum, c) => sum + c, 0) / allConfidences.length)
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
  const snap = await getDocs(collection(db, 'detections'))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(d => d.deleted !== true)
    .sort((a, b) => {
      const tA = a.createdAt?.toDate?.() || new Date(0)
      const tB = b.createdAt?.toDate?.() || new Date(0)
      return tB - tA
    })
}

// ── All users ─────────────────────────────────────────────────────────────────

export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const tA = a.createdAt?.toDate?.() || new Date(0)
      const tB = b.createdAt?.toDate?.() || new Date(0)
      return tB - tA
    })
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
