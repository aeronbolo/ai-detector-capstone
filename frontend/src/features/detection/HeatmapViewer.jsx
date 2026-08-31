/**
 * HeatmapViewer — center panel showing the real TruthScan heatmap.
 * When TruthScan returns a heatmap_url, we display the actual AI-generated
 * heatmap image (overlaid on the original by TruthScan).
 * Falls back to a simulated CSS gradient overlay when no real heatmap exists.
 */

import { useState } from 'react'

export default function HeatmapViewer({ detection }) {
  const { fileType, label, fileName, heatmapUrl } = detection
  const isAI = label === 'AI-Generated' || label === 'Digitally Edited'
  const [imgError, setImgError] = useState(false)

  return (
    <div className="bg-dark-card rounded-lg shadow-card overflow-hidden flex flex-col">

      {/* Header */}
      <div className="px-5 py-4 border-b border-dark-border">
        <p className="text-xs uppercase tracking-widest font-semibold text-accent">
          Suspicious-region heatmap
        </p>
        <p className="text-gray-400 text-xs mt-1 truncate">
          {fileName} | {label}
        </p>
      </div>

      {/* Heatmap content */}
      <div className="relative flex-1 flex items-center justify-center min-h-[280px] bg-dark-bg">

        {/* ── Real TruthScan heatmap ── */}
        {heatmapUrl && !imgError ? (
          <div className="relative w-full h-full">
            <img
              src={heatmapUrl}
              alt="AI detection heatmap"
              className="w-full h-full object-contain max-h-72"
              onError={() => setImgError(true)}
            />
            {/* TruthScan badge */}
            <div className="absolute top-2 right-2 bg-accent/90 text-white text-xs font-bold px-2 py-0.5 rounded">
              TruthScan Heatmap
            </div>
          </div>

        ) : fileType === 'image' && isAI ? (
          /* ── Simulated CSS heatmap (local model fallback) ── */
          <div className="relative w-full h-full flex items-center justify-center min-h-[280px]">
            <div className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 60% 40% at 55% 45%, rgba(255,77,77,0.45) 0%, rgba(255,165,0,0.25) 40%, transparent 70%), ' +
                  'radial-gradient(ellipse 30% 25% at 30% 60%, rgba(255,200,0,0.35) 0%, transparent 60%)',
              }}
            />
            <div className="relative z-10 text-center px-6">
              <p className="text-gray-300 text-sm font-medium">Simulated heatmap</p>
              <p className="text-gray-500 text-xs mt-1">
                Real heatmap available when TruthScan processes the image
              </p>
            </div>
          </div>

        ) : fileType === 'video' ? (
          /* ── Video — no heatmap, show info ── */
          <div className="flex flex-col items-center justify-center gap-3 p-8">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm text-center">
              Frame-level temporal analysis completed.
              <br />
              {isAI
                ? 'Inconsistencies detected across video frames.'
                : 'Consistent temporal patterns — no manipulation found.'}
            </p>
          </div>

        ) : (
          /* ── Real image, no heatmap (result is Real) ── */
          <div className="flex flex-col items-center justify-center gap-3 p-8">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm text-center">
              No suspicious regions detected.
              <br />
              Heatmap is only generated for AI-classified images.
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-5 py-3 flex items-center gap-4 border-t border-dark-border">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-danger inline-block" />
          <span className="text-gray-400 text-xs">High suspicion</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
          <span className="text-gray-400 text-xs">Medium suspicion</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-success inline-block" />
          <span className="text-gray-400 text-xs">Clean region</span>
        </div>
      </div>
    </div>
  )
}
