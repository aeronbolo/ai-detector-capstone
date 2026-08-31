/**
 * Footer — matches mockup: "AI Detector verification interface" note.
 */

import { Link } from 'react-router-dom'

export default function Footer({ dark = false }) {
  const textColor = dark ? 'text-gray-400' : 'text-gray-500'
  const borderColor = dark ? 'border-dark-border' : 'border-gray-200'
  const bgColor = dark ? 'bg-dark-card' : 'bg-white'

  return (
    <footer className={`${bgColor} border-t ${borderColor} mt-auto`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className={`text-sm ${textColor}`}>
            <span className="font-medium">AI Detector</span> verification interface
          </div>
          <p className={`text-xs ${textColor} text-center`}>
            Prototype analysis uses CNN spatial checks and LSTM temporal review.
          </p>
          <div className={`flex items-center gap-4 text-xs ${textColor}`}>
            <Link to="/history" className="hover:text-accent transition-colors">History</Link>
            <Link to="/reports" className="hover:text-accent transition-colors">Reports</Link>
            <span>© {new Date().getFullYear()} AI Detector</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
