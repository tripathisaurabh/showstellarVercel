import type { Metadata } from 'next'
import Link from 'next/link'
import ShowStellarMascotState from '@/components/ShowStellarMascotState'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function InquirySuccessPage() {
  return (
    <ShowStellarMascotState
      state="success"
      title="Inquiry sent successfully"
      message="Your request has been sent to the artist. They will be in touch with you shortly."
      actions={
        <>
          <Link
            href="/artists"
            className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Browse More Artists
          </Link>
          <Link
            href="/"
            className="rounded-full border px-5 py-3 text-sm font-semibold transition-colors hover:bg-[var(--surface-2)]"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            Back to Homepage
          </Link>
        </>
      }
    />
  )
}
