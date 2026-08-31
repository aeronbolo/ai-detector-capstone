/**
 * reportsService — Firestore read/write for the reports collection.
 */

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { nanoid } from 'nanoid'

/**
 * Fetch all saved report metadata for a user.
 * @param {string} uid
 * @returns {Promise<Array>}
 */
export async function fetchReports(uid) {
  const q = query(
    collection(db, 'reports'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Fetch all detections for a user within an optional date range.
 * Used for building summary reports.
 * @param {string} uid
 * @param {Date|null} from
 * @param {Date|null} to
 * @returns {Promise<Array>}
 */
export async function fetchDetectionsForReport(uid, from = null, to = null) {
  let q = query(
    collection(db, 'detections'),
    where('userId', '==', uid),
    where('deleted', '==', false),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

  if (from || to) {
    items = items.filter((item) => {
      const ts = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt)
      if (from && ts < from) return false
      if (to && ts > to) return false
      return true
    })
  }
  return items
}

/**
 * Save report metadata to Firestore after generating a PDF.
 * @param {string} uid
 * @param {'single'|'summary'} type
 * @param {string[]} detectionIds
 * @returns {Promise<string>} The new reportId
 */
export async function saveReportRecord(uid, type, detectionIds) {
  const reportId = nanoid()
  await setDoc(doc(db, 'reports', reportId), {
    reportId,
    userId: uid,
    type,
    detectionIds,
    createdAt: serverTimestamp(),
  })
  return reportId
}
