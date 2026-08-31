/**
 * HeroSection — full-width hero with headline and description.
 * Matches mockup: "CNN SPATIAL CHECKS + LSTM TEMPORAL REVIEW" tag,
 * large "AI Detector" headline on two lines, with info cards at bottom.
 */

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-blue-50 to-cyan-50 pt-16 pb-24 px-4 min-h-[600px]">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl">
          {/* Section tag */}
          <p className="text-xs uppercase tracking-widest font-semibold text-accent mb-6">
            CNN Spatial Checks + LSTM Temporal Review
          </p>

          {/* Main headline */}
          <h1 className="text-8xl sm:text-9xl font-extrabold mb-8 leading-[0.9] text-primary">
            AI
            <br />
            Detector
          </h1>

          {/* Sub-headline */}
          <p className="text-gray-600 text-base leading-relaxed max-w-xl mb-12">
            Upload images or submit video links to classify media as Authentic or AI-Generated,
            with confidence scoring, explainable summaries, visual heatmaps, saved analysis
            history, and downloadable verification reports.
          </p>

          {/* Info Cards Row - positioned in hero */}
          <div className="grid grid-cols-3 gap-4 max-w-xl">
            <InfoCard icon="image" label="JPG" description="JPEG and PNG images" />
            <InfoCard icon="video" label="MP4" description="AVI and MOV video links" />
            <InfoCard icon="document" label="TXT" description="Downloadable reports" />
          </div>
        </div>
      </div>
    </section>
  )
}

// Info Card Component (inline)
function InfoCard({ icon, label, description }) {
  const icons = {
    image: (
      <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    video: (
      <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    document: (
      <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col items-center text-center gap-2">
      {icons[icon]}
      <span className="text-sm font-extrabold text-primary tracking-wide">{label}</span>
      <span className="text-xs text-gray-500 leading-tight">{description}</span>
    </div>
  )
}
