/**
 * HistoryTable — detection history table.
 * Matches mockup: MEDIA | TYPE | PREDICTION | CONFIDENCE | REVIEWER | DATE columns.
 * Clean white background, hover rows, delete action.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { deleteDetection } from './historyService'

function formatDate(ts) {
  if (!ts) return '—'
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleString()
}

export default function HistoryTable({ items, onDeleted }) {
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteDetection(toDelete.id || toDelete.detectionId)
      onDeleted?.(toDelete.id || toDelete.detectionId)
    } finally {
      setDeleting(false)
      setToDelete(null)
    }
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="font-medium text-gray-500">No analyses found</p>
        <p className="text-sm mt-1">Upload a file to run your first detection.</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {['MEDIA', 'TYPE', 'PREDICTION', 'CONFIDENCE', 'REVIEWER', 'DATE', ''].map((h) => (
                <th
                  key={h}
                  className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4 first:pl-0"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => {
              const id = item.id || item.detectionId
              return (
                <tr key={id} className="hover:bg-gray-50 transition-colors group">
                  <td className="py-3 px-4 pl-0 max-w-[200px]">
                    <Link
                      to={`/results/${id}`}
                      className="font-medium text-primary hover:text-accent transition-colors truncate block"
                    >
                      {item.fileName}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-500 capitalize">
                    {item.fileType} / {item.fileName?.split('.').pop()?.toUpperCase() || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <Badge label={item.label} />
                  </td>
                  <td className="py-3 px-4 font-semibold text-primary">
                    {item.confidence}%
                  </td>
                  <td className="py-3 px-4 text-gray-500">AI Detector</td>
                  <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setToDelete(item)}
                      className="text-gray-300 hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {items.map((item) => {
          const id = item.id || item.detectionId
          return (
            <Link
              key={id}
              to={`/results/${id}`}
              className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-primary truncate">{item.fileName}</p>
                <Badge label={item.label} className="text-xs flex-shrink-0" />
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span className="capitalize">{item.fileType}</span>
                <span>·</span>
                <span className="font-semibold text-primary">{item.confidence}%</span>
                <span>·</span>
                <span>{formatDate(item.createdAt)}</span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete analysis"
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleting}>Delete</Button>
          </>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete the analysis for{' '}
          <strong>{toDelete?.fileName}</strong>? This cannot be undone.
        </p>
      </Modal>
    </>
  )
}
