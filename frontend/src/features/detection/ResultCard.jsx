/**
 * ResultCard — left panel of the detection result page.
 * Shows: large confidence %, label badge, description, download button.
 * Matches mockup: "71%" large, "AI-Generated" red badge, description text.
 */

import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

export default function ResultCard({ detection, onDownload }) {
  const { label, confidence, model, fileName, processingTimeMs, framesAnalysed } = detection

  const isAI = label === 'AI-Generated'

  const description = isAI
    ? `AI-Generated classification with ${confidence}% confidence. The CNN pass found localized texture inconsistencies and edge blending artifacts, while the LSTM review indicated temporal flicker and frame-to-frame identity drift.`
    : `Authentic classification with ${confidence}% confidence. No significant spatial artifacts were detected by the CNN pass, and the LSTM temporal review found consistent frame-to-frame patterns characteristic of real media.`

  return (
    <div className="bg-white rounded-lg shadow-card p-6 flex flex-col gap-5">
      {/* Section tag */}
      <p className="text-xs uppercase tracking-widest font-semibold text-accent">
        Prediction Result
      </p>

      {/* Confidence + badge */}
      <div className="flex items-start gap-4">
        <span className={`text-7xl font-extrabold leading-none ${isAI ? 'text-danger' : 'text-success'}`}>
          {confidence}%
        </span>
      </div>

      <Badge label={label} className="self-start text-base px-4 py-1.5" />

      {/* Description */}
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>

      {/* Meta */}
      <div className="border-t pt-4 space-y-2 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>File</span>
          <span className="text-gray-700 font-medium truncate max-w-[180px]">{fileName}</span>
        </div>
        <div className="flex justify-between">
          <span>Model</span>
          <span className="text-gray-700 font-medium truncate max-w-[180px]">{model}</span>
        </div>
        <div className="flex justify-between">
          <span>Processing time</span>
          <span className="text-gray-700 font-medium">{processingTimeMs ? `${processingTimeMs} ms` : '—'}</span>
        </div>
        {framesAnalysed && (
          <div className="flex justify-between">
            <span>Frames analysed</span>
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
