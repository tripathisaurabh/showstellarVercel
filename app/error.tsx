'use client'

import Link from 'next/link'
import ShowStellarFeedbackBanner from '@/components/ShowStellarFeedbackBanner'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center">
        <ShowStellarFeedbackBanner
          state="error"
          title="This page hit a wrong note."
          message="Something went wrong while loading this page. You can try again or go back to the homepage."
          className="text-center"
        />
        {process.env.NODE_ENV !== 'production' && error?.message && (
          <p className="mt-4 max-w-xl rounded-2xl border px-4 py-3 text-left text-xs" style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted)' }}>
            {error.message}
          </p>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Try again
          </button>
          <Link href="/" className="rounded-full border px-5 py-3 text-sm font-semibold transition-colors hover:bg-[var(--surface-2)]" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
            Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
