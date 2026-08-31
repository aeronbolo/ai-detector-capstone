/**
 * ReportsPage — list of saved reports + generate new summary report.
 * Route: /reports
 */

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  fetchReports,
  fetchDetectionsForReport,
  saveReportRecord,
} from './reportsService'
import { generateSingleReport, generateSummaryReport } from '@/lib/pdfGenerator'
import PageWrapper from '@/components/layout/PageWrapper'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

function formatDate(ts) {
  if (!ts) return '—'
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleString()
}

const RANGE_OPTIONS = [
  { value: '7',  label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '0',  label: 'All time' },
]

export default function ReportsPage() {
  const { currentUser } = useAuth()

  const [reports, setReports]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [generating, setGenerating]   = useState(false)
  const [selectedDays, setSelectedDays] = useState('30')

  useEffect(() => {
    if (!currentUser) return
    loadReports()
  }, [currentUser])

  async function loadReports() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchReports(currentUser.uid)
      setReports(data)
    } catch {
      setError('Failed to load reports.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateSummary() {
    setGenerating(true)
    setError('')
    try {
      const days = parseInt(selectedDays)
      const from = days > 0 ? new Date(Date.now() - days * 86400000) : null
      const to   = new Date()

      const detections = await fetchDetectionsForReport(currentUser.uid, from, to)

      if (detections.length === 0) {
        setError('No detections found for the selected date range.')
        return
      }

      const rangeLabel = days > 0 ? `Last ${days} days` : 'All time'
      generateSummaryReport(
        detections,
        {
          displayName: currentUser.displayName || currentUser.email,
          email: currentUser.email,
        },
        rangeLabel
      )

      // Save metadata record to Firestore
      const ids = detections.map((d) => d.id || d.detectionId).filter(Boolean)
      const reportId = await saveReportRecord(currentUser.uid, 'summary', ids)

      // Prepend to list
      setReports((prev) => [
        {
          id: reportId,
          reportId,
          userId: currentUser.uid,
          type: 'summary',
          detectionIds: ids,
          createdAt: new Date(),
        },
        ...prev,
      ])
    } catch (err) {
      setError(err.message || 'Failed to generate report.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="mb-8">
          <p className="section-tag mb-2">Reports</p>
          <h1 className="text-3xl font-bold text-primary">Verification Reports</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Download PDF reports for individual detections or generate a summary for a date range.
          </p>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />
        )}

        {/* Generate summary card */}
        <Card className="mb-8">
          <h2 className="text-lg font-semibold text-primary mb-4">Generate Summary Report</h2>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-600">Date range</label>
              <select
                value={selectedDays}
                onChange={(e) => setSelectedDays(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {RANGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <Button
              variant="primary"
              onClick={handleGenerateSummary}
              loading={generating}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Summary PDF
              </span>
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Generates a landscape PDF with a table of all detections in the selected period.
          </p>
        </Card>

        {/* Reports list */}
        <div>
          <h2 className="text-lg font-semibold text-primary mb-4">
            Saved Reports
            {!loading && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({reports.length})
              </span>
            )}
          </h2>

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : reports.length === 0 ? (
            <Card>
              <div className="text-center py-8 text-gray-400">
                <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="font-medium text-gray-500">No reports yet</p>
                <p className="text-sm mt-1">
                  Generate a summary above or download a report from any detection result page.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => {
                const id = report.id || report.reportId
                return (
                  <div
                    key={id}
                    className="bg-white rounded-lg shadow-card p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Icon */}
                      <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-primary capitalize">
                            {report.type} report
                          </span>
                          <Badge
                            label={report.type === 'summary' ? 'Summary' : 'Single'}
                            type={report.type === 'summary' ? 'info' : 'default'}
                            className="text-xs"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {report.detectionIds?.length || 0} detection{report.detectionIds?.length !== 1 ? 's' : ''} ·{' '}
                          {formatDate(report.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 truncate hidden sm:block max-w-[100px]">
                      {id?.slice(0, 8)}…
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-10">
          PDFs are generated in your browser — no data is sent to external servers.
        </p>
      </div>
    </PageWrapper>
  )
}
