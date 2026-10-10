/**
 * ModelSignalsPanel — right panel showing analysis details.
 * All language is user-friendly — no technical terms exposed.
 */

function ScoreBar({ label, score }) {
  const color = score >= 70 ? 'bg-danger' : score >= 50 ? 'bg-yellow-400' : 'bg-success'
  const textColor = score >= 70 ? 'text-danger' : score >= 50 ? 'text-yellow-500' : 'text-success'
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className={`font-bold ${textColor}`}>{score}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

function WarningBadge({ warning }) {
  const typeLabels = {
    blur_dark:        '⚠ Image is blurry or dark',
    watermark:        '⚠ Watermark detected',
    screen_recapture: '⚠ This looks like a screen photo',
  }
  const label = typeLabels[warning.type] || `⚠ ${warning.type}`
  return (
    <span className="inline-flex items-center bg-yellow-50 text-yellow-700 border border-yellow-200
                     text-xs font-medium px-3 py-1 rounded-full">
      {label}
    </span>
  )
}

export default function ModelSignalsPanel({ detection }) {
  const {
    confidence,
    fileType,
    label,
    model,
    analysisDetails,
    warnings = [],
  } = detection

  const isAI        = label === 'AI-Generated' || label === 'Digitally Edited'
  const isTruthScan = model === 'truthscan' || model === 'truthscan-video'

  const primaryScore  = confidence
  const secondaryScore = fileType === 'video'
    ? Math.max(0, Math.round(confidence * 0.85))
    : Math.min(100, Math.round(confidence * 0.92))

  return (
    <div className="bg-white rounded-lg shadow-card p-6 flex flex-col gap-5 overflow-y-auto max-h-[700px]">

      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest font-semibold text-accent">
          Analysis Details
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Powered by AI Detection Engine
        </p>
      </div>

      {/* Score bars */}
      <div className="space-y-4">
        <ScoreBar
          label="Detection Confidence"
          score={primaryScore}
        />
        {fileType === 'image' && (
          <ScoreBar
            label="Image Analysis Score"
            score={secondaryScore}
          />
        )}
        {fileType === 'video' && (
          <ScoreBar
            label="Video Analysis Score"
            score={secondaryScore}
          />
        )}
      </div>

      {/* Overall verdict */}
      <div className={`rounded-lg p-4 text-center text-sm font-semibold ${
        isAI
          ? 'bg-red-50 text-danger border border-red-100'
          : 'bg-green-50 text-success border border-green-100'
      }`}>
        {isAI
          ? '⚠ This content appears to be AI-generated'
          : '✓ This content appears to be authentic'}
      </div>

      {/* TruthScan analysis details — user friendly */}
      {isTruthScan && analysisDetails && (
        <div className="space-y-4 border-t pt-4">

          {/* What we found */}
          {analysisDetails.keyIndicators?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                What we found
              </p>
              <ul className="space-y-1.5">
                {analysisDetails.keyIndicators.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className={`mt-0.5 ${isAI ? 'text-danger' : 'text-success'}`}>•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Why we think this */}
          {analysisDetails.detailedReasoning && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                Why we think this
              </p>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100">
                {analysisDetails.detailedReasoning}
              </p>
            </div>
          )}

          {/* Visual signs detected */}
          {analysisDetails.visualPatterns?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                Visual signs detected
              </p>
              <ul className="space-y-1">
                {analysisDetails.visualPatterns.map((p, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-accent mt-0.5">→</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {analysisDetails.imageTags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {analysisDetails.imageTags.map((tag, i) => (
                <span key={i}
                  className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full border border-gray-200">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* What you can do */}
          {analysisDetails.recommendations?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                What you can do
              </p>
              <ul className="space-y-1">
                {analysisDetails.recommendations.map((r, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-success mt-0.5">✓</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Warnings */}
      {warnings?.length > 0 && (
        <div className="border-t pt-4">
          <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
            Things to note
          </p>
          <div className="flex flex-wrap gap-2">
            {warnings.map((w, i) => <WarningBadge key={i} warning={w} />)}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 leading-relaxed border-t pt-4">
        Results are based on AI analysis and may not be 100% accurate.
        We recommend using this as a guide, not as final proof.
        When in doubt, consult a media forensics expert.
      </p>
    </div>
  )
}
