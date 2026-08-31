/**
 * historyService — Firestore queries for the history page.
 */

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  startAfter,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { deleteDetection } from '@/features/detection/detectionService'

const PAGE_SIZE = 20

/**
 * Fetch history with the simplest possible query to avoid needing composite index.
 * TEMPORARY: Fetch ALL user detections, filter/sort client-side
 * TODO: Once composite index is built, switch back to server-side orderBy
 */
export async function fetchHistory(uid, filters = {}, lastDoc = null) {
  try {
    // TEMPORARY: Simplest query — only where userId (no orderBy to avoid index requirement)
    const q = query(
      collection(db, 'detections'),
      where('userId', '==', uid),
      limit(100)  // fetch up to 100 records, sort client-side
    )

    const snap = await getDocs(q)

    // Parse and filter client-side
    let items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    
    // Filter deleted
    items = items.filter(d => !d.deleted)
    
    // Filter by type/label
    if (filters.fileType) items = items.filter(d => d.fileType === filters.fileType)
    if (filters.label) items = items.filter(d => d.label === filters.label)
    
    // Sort by createdAt descending CLIENT-SIDE
    items.sort((a, b) => {
      const timeA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0)
      const timeB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0)
      return timeB - timeA  // descending
    })
    
    // Paginate client-side
    const hasMore = items.length > PAGE_SIZE
    if (hasMore) items = items.slice(0, PAGE_SIZE)

    return { items, lastDoc: null, hasMore: false }  // no cursor pagination for now
  } catch (err) {
    console.error('[historyService] fetchHistory error:', err)
    throw err
  }
}

export { deleteDetection }
