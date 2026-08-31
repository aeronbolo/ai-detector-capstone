/**
 * PageWrapper — consistent page layout with Navbar and optional footer.
 * Supports light theme (default) and dark theme for admin pages.
 */

import Navbar from './Navbar'
import Footer from './Footer'

export default function PageWrapper({ children, dark = false, hideFooter = false }) {
  return (
    <div className={`min-h-screen flex flex-col ${dark ? 'bg-dark-bg text-white' : 'bg-gray-50 text-gray-800'}`}>
      <Navbar />
      <main className="flex-1 w-full">
        {children}
      </main>
      {!hideFooter && <Footer dark={dark} />}
    </div>
  )
}
