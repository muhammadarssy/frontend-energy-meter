import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const Pagination = ({ page, totalPages, total, limit, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null

  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  const getPages = () => {
    const pages = []
    const delta = 2
    const left = Math.max(1, page - delta)
    const right = Math.min(totalPages, page + delta)

    for (let i = left; i <= right; i++) {
      pages.push(i)
    }

    if (left > 2) pages.unshift('...')
    if (left > 1) pages.unshift(1)
    if (right < totalPages - 1) pages.push('...')
    if (right < totalPages) pages.push(totalPages)

    return pages
  }

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-gray-500">
        Menampilkan <span className="font-medium">{start}</span>–<span className="font-medium">{end}</span> dari <span className="font-medium">{total}</span> data
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPages().map((p, idx) => (
          p === '...'
            ? <span key={`dots-${idx}`} className="px-2 py-1 text-sm text-gray-400">...</span>
            : <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors ${
                  p === page
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default Pagination
