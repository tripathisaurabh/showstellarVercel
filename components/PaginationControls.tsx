import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { buildPaginatedListingHref } from '@/lib/artist-listing'

type Props = {
  pathname: string
  query: Record<string, string | undefined>
  page: number
  totalPages: number
  label?: string
}

function buildWindow(page: number, totalPages: number, width = 5) {
  if (totalPages <= width) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const half = Math.floor(width / 2)
  let start = Math.max(1, page - half)
  const end = Math.min(totalPages, start + width - 1)

  if (end - start + 1 < width) {
    start = Math.max(1, end - width + 1)
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

export default function PaginationControls({ pathname, query, page, totalPages, label = 'Pagination' }: Props) {
  if (totalPages <= 1) return null

  const previousPage = Math.max(1, page - 1)
  const nextPage = Math.min(totalPages, page + 1)
  const pages = buildWindow(page, totalPages)

  return (
    <nav className="mt-10 flex flex-col items-center gap-3" aria-label={label}>
      <div className="flex items-center gap-2">
        <Link
          href={buildPaginatedListingHref(pathname, query, previousPage)}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--surface-2)] ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          aria-disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Link>

        <div className="hidden items-center gap-2 sm:flex">
          {pages.map(next => (
            <Link
              key={next}
              href={buildPaginatedListingHref(pathname, query, next)}
              className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-medium transition-colors ${
                next === page ? 'bg-[var(--navy)] text-white' : 'hover:bg-[var(--surface-2)]'
              }`}
              style={{ borderColor: 'var(--border)' }}
              aria-current={next === page ? 'page' : undefined}
            >
              {next}
            </Link>
          ))}
        </div>

        <Link
          href={buildPaginatedListingHref(pathname, query, nextPage)}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--surface-2)] ${page >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          aria-disabled={page >= totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <p className="text-xs text-[var(--muted)]">
        Page {page} of {totalPages}
      </p>
    </nav>
  )
}
