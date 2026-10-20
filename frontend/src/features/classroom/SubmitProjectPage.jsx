/**
 * SubmitProjectPage — Student submits a project for AI detection review.
 * Files are uploaded to Firebase Storage so teachers can view them.
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { prepareUpload, simulateProgress } from '@/features/home/uploadService'
import { runImageDetection, runVideoDetection } from '@/features/detection/detectionService'
import { saveSubmission, getStudentClasses } from './classroomService'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import PageWrapper from '@/components/layout/PageWrapper'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import { nanoid } from 'nanoid'

const ACCEPTED_IMAGE   = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_VIDEO_EXT = ['mp4', 'mov', 'avi']

export default function SubmitProjectPage() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  // Read fresh student data from Firestore (not stale cache)
  const [studentData, setStudentData]   = useState(null)
  const [enrolledClasses, setEnrolledClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [dataLoading, setDataLoading]   = useState(true)

  useEffect(() => {
    if (!currentUser) return
    getDoc(doc(db, 'users', currentUser.uid))
      .then(async snap => {
        if (snap.exists()) {
          const data = snap.data()
          setStudentData(data)
          // Load all enrolled classes
          const classIds = data.classIds?.length
            ? data.classIds
            : data.classId ? [data.classId] : []
          if (classIds.length > 0) {
            const classes = await getStudentClasses(classIds)
            setEnrolledClasses(classes)
            if (classes.length === 1) setSelectedClassId(classes[0].classId)
          }
        }
      })
      .catch(console.error)
      .finally(() => setDataLoading(false))
  }, [currentUser])

  const [form, setForm]       = useState({ projectTitle: '', subject: '', description: '' })
  const [file, setFile]       = useState(null)
  const [fileType, setFileType] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [stage, setStage]     = useState('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError]     = useState('')
  const inputRef = useRef(null)

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  function handleFileSelect(f) {
    const isImage = ACCEPTED_IMAGE.includes(f.type)
    const ext = f.name.split('.').pop().toLowerCase()
    const isVideo = ACCEPTED_VIDEO_EXT.includes(ext)
    if (!isImage && !isVideo)
      return setError('Unsupported format. Use JPG, PNG, WebP, MP4, MOV, or AVI.')
    setFile(f)
    setFileType(isImage ? 'image' : 'video')
    if (isImage) setPreview(URL.createObjectURL(f))
    setError('')
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return setError('Please select a file to submit.')
    if (!form.projectTitle.trim()) return setError('Please enter a project title.')
    if (!selectedClassId) return setError('Please select which class to submit to.')

    const selectedClass = enrolledClasses.find(c => c.classId === selectedClassId)
    if (!selectedClass) return setError('Selected class not found.')

    setError('')
    setStage('uploading')
    setProgress(0)

    const { detectionId, formData } = prepareUpload(file, fileType)
    const finish = simulateProgress(setProgress)

    try {
      setStage('analysing')

      // ── Convert image to base64 for teacher preview (images only, max 900KB) ─
      let fileBase64 = null
      if (fileType === 'image' && file.size < 900 * 1024) {
        try {
          fileBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result) // data:image/jpeg;base64,...
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
        } catch {
          // Non-critical — teacher just won't see preview
        }
      }

      // ── Run AI detection ────────────────────────────────────────────────────
      let result
      if (fileType === 'image') {
        result = await runImageDetection({ formData, detectionId })
      } else {
        result = await runVideoDetection({ formData, detectionId })
      }
      finish()

      // ── Save submission to Firestore ────────────────────────────────────────
      await saveSubmission({
        studentId:       currentUser.uid,
        teacherId:       selectedClass.teacherId || null,
        classId:         selectedClassId,
        projectTitle:    form.projectTitle,
        subject:         form.subject || '',
        description:     form.description,
        fileName:        file.name,
        fileType,
        fileUrl:         result.image_url || null,  // TruthScan hosted image URL
        fileBase64,                                   // base64 fallback for small images
        label:           result.label,
        confidence:      result.confidence,
        model:           result.model,
        processingTimeMs: result.processing_time_ms,
        heatmapUrl:      result.heatmap_url || null,
        analysisDetails: result.analysis_details || null,
      })

      setStage('done')
      navigate('/my-submissions')
    } catch (err) {
      finish()
      setStage('error')
      setError(err.message || 'Submission failed. Please try again.')
    }
  }

  const isRunning = stage === 'uploading' || stage === 'analysing'

  if (dataLoading) {
    return (
      <PageWrapper>
        <div className="flex justify-center py-24"><Spinner size="xl" /></div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <p className="section-tag mb-2">Student Portal</p>
        <h1 className="text-3xl font-bold text-primary mb-2">Submit Project</h1>
        <p className="text-gray-500 text-sm mb-8">
          Upload your project file. Our AI will analyze it and your teacher will review the result.
        </p>

        {enrolledClasses.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 font-medium">Not enrolled in any class</p>
            <p className="text-xs text-yellow-700 mt-1">
              Ask your teacher for the class code, then{' '}
              <Link to="/join-class" className="underline font-semibold">join a class</Link>{' '}
              before submitting a project.
            </p>
          </div>
        )}

        {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-5" />}

        <div className="bg-white rounded-lg shadow-card p-6 space-y-5">
          {/* Class selector */}
          {enrolledClasses.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Submit to Class <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select a class…</option>
                {enrolledClasses.map(cls => (
                  <option key={cls.classId} value={cls.classId}>
                    {cls.className} — {cls.subject}
                  </option>
                ))}
              </select>
            </div>
          )}
          {enrolledClasses.length === 1 && (
            <div className="bg-accent/5 border border-accent/20 rounded-lg px-4 py-3 text-xs text-gray-600">
              ✓ Submitting to: <strong>{enrolledClasses[0].className}</strong> — {enrolledClasses[0].subject}
            </div>
          )}

          <Input label="Project Title" value={form.projectTitle}
            onChange={set('projectTitle')} placeholder="e.g. Capstone Project Final Submission" required />
          <Input label="Subject" value={form.subject}
            onChange={set('subject')} placeholder="e.g. Computer Science Capstone" />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              placeholder="Brief description of your project..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          {/* File upload */}
          {!file ? (
            <div
              onDrop={onDrop}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
                ${dragging ? 'border-accent bg-accent/5' : 'border-gray-300 hover:border-accent hover:bg-gray-50'}`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Upload project file</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, MP4, MOV, AVI</p>
                </div>
              </div>
              <input ref={inputRef} type="file"
                accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.avi"
                className="hidden"
                onChange={e => e.target.files[0] && handleFileSelect(e.target.files[0])} />
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-4">
              {preview && (
                <img src={preview} alt="preview" className="w-16 h-16 object-cover rounded-lg shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                <p className="text-xs text-gray-400 capitalize">{fileType} · {(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={() => { setFile(null); setPreview(null) }}
                className="text-gray-400 hover:text-danger transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Progress */}
          {stage === 'uploading' && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Uploading…</span><span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-accent h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          {stage === 'analysing' && (
            <div className="flex items-center gap-2 text-sm text-accent">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Running AI analysis…
            </div>
          )}

          <Button type="button" variant="primary" className="w-full"
            loading={isRunning}
            disabled={!file || isRunning || enrolledClasses.length === 0 || !selectedClassId}
            onClick={handleSubmit}>
            Submit Project
          </Button>
        </div>
      </div>
    </PageWrapper>
  )
}
