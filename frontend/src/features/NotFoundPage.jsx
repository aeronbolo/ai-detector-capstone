import { Link } from 'react-router-dom'
import PageWrapper from '@/components/layout/PageWrapper'

export default function NotFoundPage() {
  return (
    <PageWrapper>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="section-tag mb-3">Error 404</p>
        <h1 className="text-5xl font-bold text-primary mb-4">Page not found</h1>
        <p className="text-gray-500 max-w-md mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          to="/"
          className="bg-primary text-white px-6 py-3 rounded font-medium hover:bg-primary-dark transition-colors"
        >
          Back to home
        </Link>
      </div>
    </PageWrapper>
  )
}
