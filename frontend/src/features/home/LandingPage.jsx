/**
 * LandingPage — homepage with hero section and upload interface.
 * Matches: Landing page UI.jpg mockup.
 */

import PageWrapper from '@/components/layout/PageWrapper'
import UploadTabs from './UploadTabs'

export default function LandingPage() {
  return (
    <PageWrapper>
      <section className="bg-gradient-to-br from-blue-50 to-cyan-50 py-16 px-4 min-h-[650px]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            
            {/* LEFT COLUMN: Hero Text + Info Cards */}
            <div className="flex flex-col justify-between min-h-[550px]">
              <div>
                {/* Section tag */}
                <p className="text-xs uppercase tracking-widest font-semibold text-accent mb-6">
                  CNN Spatial Checks + LSTM Temporal Review
                </p>

                {/* Main headline */}
                <h1 className="text-7xl sm:text-8xl lg:text-9xl font-extrabold mb-8 leading-[0.85] text-primary">
                  AI
                  <br />
                  Detector
                </h1>

                {/* Sub-headline */}
                <p className="text-gray-600 text-base leading-relaxed max-w-lg">
                  Upload images or submit video links to classify media as Authentic or AI-Generated,
                  with confidence scoring, explainable summaries, visual heatmaps, saved analysis
                  history, and downloadable verification reports.
                </p>
              </div>

              {/* Info Cards Row - at the bottom */}
              <div className="grid grid-cols-3 gap-5 mt-12">
                <InfoCard icon="image" label="JPG" description="JPEG and PNG images" />
                <InfoCard icon="video" label="MP4" description="AVI and MOV video links" />
                <InfoCard icon="document" label="TXT" description="Downloadable reports" />
              </div>
            </div>

            {/* RIGHT COLUMN: Upload Card */}
            <div className="flex items-start justify-center lg:justify-end">
              <div className="w-full max-w-lg">
                <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                  <UploadTabs />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Bottom spacing */}
      <div className="pb-20"></div>
    </PageWrapper>
  )
}

// Info Card Component
function InfoCard({ icon, label, description }) {
  const icons = {
    image: (
      <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    video: (
      <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    document: (
      <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col items-center text-center gap-3 shadow-sm">
      {icons[icon]}
      <div>
        <span className="text-base font-extrabold text-primary tracking-wide uppercase block">{label}</span>
        <span className="text-xs text-gray-500 leading-tight mt-1 block">{description}</span>
      </div>
    </div>
  )
}
