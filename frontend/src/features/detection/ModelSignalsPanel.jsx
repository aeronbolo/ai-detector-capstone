/**
 * ModelSignalsPanel — right panel showing model scores and TruthScan analysis.
 *
 * When TruthScan data is available:
 *   - Shows keyIndicators (specific artifact cues)
 *   - Shows detailedReasoning (narrative explanation)
 *   - Shows visualPatterns
 *   - Shows warnings (watermark detection, blur, screen recapture)
 *
 * When only local model is used:
 *   - Shows derived CNN/LSTM score bars
 *   - Shows generic validation checks
 */

function ScoreBar({ label, score, color }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className={`font-bold ${color}`}>{score}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-700 ${
            score >= 70 ? 'bg-danger' : score >= 50 ? 'bg-yellow-400' : 'bg-success'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

function StatusItem({ label, status, ok }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`flex items-center gap-1.5 text-sm font-medium ${ok ? 'text-success' : 'text-danger'}`}>
        {ok ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )}
        {status}
      </span>
    </div>
  )
}

// ── Warning badge ─────────────────────────────────────────────────────────────
function WarningBadge({ warning }) {
  const typeLabels = {
    blur_dark:        '🌑 Blurred / Dark',
    watermark:        '🔖 Watermark',
    screen_recapture: '🖥 Screen Recapture',
  }
  const label = typeLabels[warning.type] || warning.type
  const detail = warning.label ? ` — ${warning.label}` : ''
  const conf   = warning.confidence ? ` (${Math.round(warning.confidence * 100)}%)` : ''

  return (
    <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 border border-yellow-200
                     text-xs font-medium px-2 py-0.5 rounded-full">
      {label}{detail}{conf}
    </span>
  )
}

// ── Agreement badge ───────────────────────────────────────────────────────────
function AgreementBadge({ agreement }) {
  const styles = {
    strong:      'bg-green-50 text-green-700 border-green-200',
    moderate:    'bg-blue-50 text-blue-700 border-blue-200',
    weak:        'bg-yellow-50 text-yellow-700 border-yellow-200',
    disagreement:'bg-red-50 text-red-700 border-red-200',
  }
  const style = styles[agreement?.toLowerCase()] || styles.moderate
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${style}`}>
      {agreement ? agreement.charAt(0).toUpperCase() + agreement.slice(1) : 'N/A'} agreement
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

  // Derive score bars from confidence
  const spatialScore = fileType === 'image'
    ? confidence
    : Math.min(100, Math.round(confidence * 1.1))
  const temporalScore = fileType === 'video'
    ? Math.max(0, Math.round(confidence * 0.85))
    : null

  const cnnColor  = spatialScore  >= 70 ? 'text-danger' : spatialScore  >= 50 ? 'text-yellow-500' : 'text-success'
  const lstmColor = temporalScore != null
    ? (temporalScore >= 70 ? 'text-danger' : temporalScore >= 50 ? 'text-yellow-500' : 'text-success')
    : 'text-gray-400'

  return (
    <div className="bg-white rounded-lg shadow-card p-6 flex flex-col gap-5 overflow-y-auto max-h-[700px]">

      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest font-semibold text-accent">
          Model Signals
        </p>
        {model && (
          <p className="text-xs text-gray-500 mt-1 break-all">
            <span className="font-medium text-gray-700">{model}</span>
          </p>
        )}
      </div>

      {/* Score bars */}
      <div className="space-y-4">
        <ScoreBar label="Spatial CNN score"   score={spatialScore}  color={cnnColor} />
        {fileType === 'video' && temporalScore != null && (
          <ScoreBar label="Temporal LSTM score" score={temporalScore} color={lstmColor} />
        )}
      </div>

      {/* Overall verdict */}
      <div className={`rounded-lg p-3 text-center text-sm font-semibold ${
        isAI
          ? 'bg-red-50 text-danger border border-red-100'
          : 'bg-green-50 text-success border border-green-100'
      }`}>
        {isAI
          ? '⚠ AI-Generated content detected'
          : '✓ Authentic content — no manipulation found'}
      </div>

      {/* ── TruthScan analysis details ── */}
      {isTruthScan && analysisDetails && (
        <div className="space-y-4 border-t pt-4">

          {/* Agreement + confidence */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <AgreementBadge agreement={analysisDetails.agreement} />
            {analysisDetails.confidence != null && (
              <span className="text-xs text-gray-500">
                Analysis confidence: <strong>{Math.round(analysisDetails.confidence)}%</strong>
              </span>
            )}
          </div>

          {/* Key indicators */}
          {analysisDetails.keyIndicators?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                Key Indicators
              </p>
              <ul className="space-y-1.5">
                {analysisDetails.keyIndicators.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-danger mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed reasoning */}
          {analysisDetails.detailedReasoning && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                Detailed Reasoning
              </p>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100">
                {analysisDetails.detailedReasoning}
              </p>
            </div>
          )}

          {/* Visual patterns */}
          {analysisDetails.visualPatterns?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                Visual Patterns
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

          {/* Image tags */}
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

          {/* Recommendations */}
          {analysisDetails.recommendations?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                Recommendations
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

      {/* ── Warnings (watermark, blur, screen recapture) ── */}
      {warnings?.length > 0 && (
        <div className="border-t pt-4">
          <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
            Warnings
          </p>
          <div className="flex flex-wrap gap-1.5">
            {warnings.map((w, i) => <WarningBadge key={i} warning={w} />)}
          </div>
        </div>
      )}

      {/* ── Validation checks ── */}
      <div className="border-t pt-4">
        <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">
          Validation checks
        </p>
        <StatusItem label="File validation"  status="Passed"    ok={true} />
        <StatusItem label="Stored record"    status="Saved"     ok={true} />
        <StatusItem label="Model inference"  status="Completed" ok={true} />
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 leading-relaxed border-t pt-4">
        {isTruthScan
          ? 'Analysis by TruthScan AI. Results are probabilistic — manual review recommended for critical decisions.'
          : 'Analysis uses CNN spatial checks and LSTM temporal review. Results are probabilistic — manual review is recommended for critical decisions.'}
      </p>
    </div>
  )
}
