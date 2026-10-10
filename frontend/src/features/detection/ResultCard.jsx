/**
 * ResultCard — left panel of the detection result page.
 * User-friendly language — no technical terms exposed to users.
 */

import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

function formatTime(ms) {
  if (!ms) return '—'
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(1)} seconds`
}

export default function ResultCard({ detection, onDownload }) {
  const { label, confidence, fileName, fileType, processingTimeMs, framesAnalysed } = detection

  const isAI = label === 'AI-Generated' || label === 'Digitally Edited'

  // Always cap confidence between 0 and 100
  const safeConfidence = Math.min(100, Math.max(0, confidence || 0))

  const description = isAI
    ? `This ${fileType} appears to be AI-generated with ${safeConfidence}% confidence. Our system detected signs of artificial generation that are not typical of real, unedited media.`
    : `This ${fileType} appears to be authentic with ${safeConfidence}% confidence. Our system found no significant signs of AI generation or digital manipulation.`

  return (
    <div className="bg-white rounded-lg shadow-card p-6 flex flex-col gap-5">

      {/* Section tag */}
      <p className="text-xs uppercase tracking-widest font-semibold text-accent">
        Analysis Result
      </p>

      {/* Confidence score */}
      <div>
        <span className={`text-7xl font-extrabold leading-none ${isAI ? 'text-danger' : 'text-success'}`}>
          {safeConfidence}%
        </span>
        <p className="text-xs text-gray-400 mt-1">Confidence score</p>
      </div>

      {/* Verdict badge */}
      <Badge label={label} className="self-start text-base px-4 py-1.5" />

      {/* Plain English description */}
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>

      {/* File details */}
      <div className="border-t pt-4 space-y-2 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>File name</span>
          <span className="text-gray-700 font-medium truncate max-w-[180px]">{fileName}</span>
        </div>
        <div className="flex justify-between">
          <span>File type</span>
          <span className="text-gray-700 font-medium capitalize">{fileType}</span>
        </div>
        <div className="flex justify-between">
          <span>Analysis time</span>
          <span className="text-gray-700 font-medium">{formatTime(processingTimeMs)}</span>
        </div>
        {framesAnalysed && (
          <div className="flex justify-between">
            <span>Video frames checked</span>
            <span className="text-gray-700 font-medium">{framesAnalysed}</span>
          </div>
        )}
      </div>

      {/* Download button */}
      <Button variant="secondary" className="w-full mt-auto" onClick={onDownload}>
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download report
        </span>
      </Button>
    </div>
  )
}
