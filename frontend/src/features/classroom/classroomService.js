/**
 * classroomService.js — Firestore operations for the classroom system.
 * Handles classes, submissions, and teacher remarks.
 */

import {
  collection, doc, setDoc, getDoc, getDocs,
  updateDoc, query, where, serverTimestamp, limit
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { nanoid } from 'nanoid'

// ── Class code generator (6 chars uppercase, unambiguous) ─────────────────────
function generateClassCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// ── CLASSES ───────────────────────────────────────────────────────────────────

export async function createClass({ teacherId, className, subject, section, schoolYear }) {
  const classId   = nanoid()
  const classCode = generateClassCode()
  const classData = {
    classId,
    teacherId,
    className,
    subject,
    section,
    schoolYear,
    classCode,
    studentIds: [],
    createdAt: serverTimestamp(),
    isActive: true,
  }
  await setDoc(doc(db, 'classes', classId), classData)
  return classData
}

export async function getClassByCode(code) {
  const q = query(
    collection(db, 'classes'),
    where('classCode', '==', code.toUpperCase().trim()),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const data = snap.docs[0].data()
  // Filter isActive client-side to avoid composite index requirement
  if (!data.isActive) return null
  return { id: snap.docs[0].id, ...data }
}

export async function getTeacherClasses(teacherId) {
  const q = query(
    collection(db, 'classes'),
    where('teacherId', '==', teacherId)
  )
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(d => d.isActive !== false)
    .sort((a, b) => {
      const tA = a.createdAt?.toDate?.() || new Date(0)
      const tB = b.createdAt?.toDate?.() || new Date(0)
      return tB - tA
    })
}

export async function joinClass(classId, studentId, studentInfo = {}) {
  const classRef = doc(db, 'classes', classId)
  const classDoc = await getDoc(classRef)
  if (!classDoc.exists()) throw new Error('Class not found')
  const data = classDoc.data()
  if (data.studentIds?.includes(studentId)) return // already joined

  // Store student name/email on class doc
  const studentsMap = data.students || {}
  studentsMap[studentId] = {
    displayName: studentInfo.displayName || 'Student',
    email: studentInfo.email || '',
  }

  await updateDoc(classRef, {
    studentIds: [...(data.studentIds || []), studentId],
    students: studentsMap,
  })

  // Update student's user doc — push classId to classIds array (multi-class support)
  try {
    const studentSnap = await getDoc(doc(db, 'users', studentId))
    const existing = studentSnap.exists() ? (studentSnap.data().classIds || []) : []
    const newClassIds = existing.includes(classId) ? existing : [...existing, classId]

    await updateDoc(doc(db, 'users', studentId), {
      classIds:  newClassIds,
      classId:   newClassIds[0],        // keep backward compat
      teacherId: data.teacherId,        // last joined teacher (fallback)
    })
  } catch (err) {
    console.warn('Could not update student user doc:', err.message)
  }
}

// Get all classes a student is enrolled in
export async function getStudentClasses(classIds = []) {
  if (!classIds.length) return []
  const classes = await Promise.all(
    classIds.map(id => getDoc(doc(db, 'classes', id)))
  )
  return classes
    .filter(s => s.exists())
    .map(s => ({ id: s.id, ...s.data() }))
}

export async function getClassStudents(classId) {
  // Read class doc to get studentIds list
  const classDoc = await getDoc(doc(db, 'classes', classId))
  if (!classDoc.exists()) return []
  const { studentIds = [], students: storedStudents = {} } = classDoc.data()
  if (!studentIds.length) return []

  // Return stored student info (name/email saved when they joined)
  // Falls back to just uid if no stored info
  return studentIds.map(uid => ({
    id: uid,
    uid,
    displayName: storedStudents[uid]?.displayName || 'Student',
    email: storedStudents[uid]?.email || '',
  }))
}

// ── SUBMISSIONS ───────────────────────────────────────────────────────────────

function generateSystemRemark(label, confidence) {
  const safeConf = Math.min(100, Math.round(confidence || 0))
  if (label === 'AI-Generated' || label === 'Digitally Edited') {
    if (safeConf >= 80) return {
      remark: 'Flagged',
      reason: `${safeConf}% confidence — AI-Generated content detected. This submission appears to be artificially created.`
    }
    return {
      remark: 'Needs Review',
      reason: `${safeConf}% confidence — Suspicious content detected. Manual review recommended.`
    }
  }
  if (safeConf >= 80) return {
    remark: 'Accepted',
    reason: `${safeConf}% confidence — Authentic content verified. No AI generation detected.`
  }
  return {
    remark: 'Needs Review',
    reason: `${safeConf}% confidence — Low confidence result. Manual review recommended.`
  }
}

export async function saveSubmission({
  studentId, teacherId, classId,
  projectTitle, subject, description,
  fileName, fileType, label, confidence,
  model, processingTimeMs, heatmapUrl, analysisDetails,
  fileUrl, fileBase64,
}) {
  const submissionId = nanoid()
  const { remark, reason } = generateSystemRemark(label, confidence)

  await setDoc(doc(db, 'submissions', submissionId), {
    submissionId,
    studentId,
    teacherId,
    classId,
    projectTitle,
    subject,
    description:      description || '',
    fileName,
    fileType,
    fileUrl:          fileUrl || null,
    fileBase64:       fileBase64 || null,
    label,
    confidence:       Math.min(100, Math.round(confidence || 0)),
    model,
    processingTimeMs: processingTimeMs || 0,
    heatmapUrl:       heatmapUrl || null,
    analysisDetails:  analysisDetails || null,
    systemRemark:     remark,
    systemRemarkReason: reason,
    teacherRemark:    null,
    teacherNote:      null,
    reviewedAt:       null,
    reviewedBy:       null,
    status:           'pending',
    deleted:          false,
    submittedAt:      serverTimestamp(),
  })
  return submissionId
}

export async function getStudentSubmissions(studentId) {
  const q = query(
    collection(db, 'submissions'),
    where('studentId', '==', studentId)
  )
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(d => d.deleted !== true)
    .sort((a, b) => {
      const tA = a.submittedAt?.toDate?.() || new Date(0)
      const tB = b.submittedAt?.toDate?.() || new Date(0)
      return tB - tA
    })
}

export async function getClassSubmissions(classId) {
  const q = query(
    collection(db, 'submissions'),
    where('classId', '==', classId)
  )
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(d => d.deleted !== true)
    .sort((a, b) => {
      const tA = a.submittedAt?.toDate?.() || new Date(0)
      const tB = b.submittedAt?.toDate?.() || new Date(0)
      return tB - tA
    })
}

export async function addTeacherRemark(submissionId, { teacherRemark, teacherNote, teacherId }) {
  await updateDoc(doc(db, 'submissions', submissionId), {
    teacherRemark,
    teacherNote: teacherNote || null,
    reviewedBy: teacherId,
    reviewedAt: serverTimestamp(),
    status: 'reviewed',
  })
}
