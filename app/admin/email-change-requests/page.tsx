import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Mail, ArrowLeft, ExternalLink } from 'lucide-react'
import { getAdminSession } from '@/lib/admin-access'
import { loadEmailChangeRequests } from '@/lib/admin-contact-requests'

export const metadata: Metadata = {
  title: 'Email Change Requests',
  description: 'Review artist email change requests.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

function StatusPill({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const styles: Record<typeof status, { bg: string; color: string }> = {
    pending: { bg: 'rgba(193,117,245,0.12)', color: '#c175f5' },
    approved: { bg: 'rgba(34,197,94,0.10)', color: '#166534' },
    rejected: { bg: 'rgba(220,38,38,0.08)', color: '#b91c1c' },
  }

  return (
    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium" style={styles[status]}>
      {status}
    </span>
  )
}

export default async function EmailChangeRequestsPage() {
  const { user, isAdmin, adminClient } = await getAdminSession()

  if (!user || !adminClient) {
    redirect('/admin/login?reason=unauthenticated')
  }

  if (!isAdmin) {
    redirect('/admin/login?reason=not-admin')
  }

  const requests = await loadEmailChangeRequests()

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'white' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Email Change Requests
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            Review artist email change requests submitted from the dashboard.
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'var(--surface-2)' }}>
                <Mail className="h-5 w-5" style={{ color: 'var(--muted)' }} />
              </div>
              <div>
                <h2 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  No requests yet
                </h2>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Artists will appear here when they request an email change.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(request => (
              <article
                key={request.id}
                className="rounded-2xl border bg-white p-5 shadow-[0_10px_28px_rgba(0,23,57,0.04)]"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                        {request.artistName}
                      </h2>
                      <StatusPill status={request.status} />
                    </div>
                    <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
                      {request.city}
                    </p>
                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                      <InfoRow label="Current email" value={request.currentEmail} />
                      <InfoRow label="Requested email" value={request.requestedEmail} />
                      <InfoRow label="Created" value={request.createdAt ? new Date(request.createdAt).toLocaleString() : '—'} />
                      <InfoRow label="Updated" value={request.updatedAt ? new Date(request.updatedAt).toLocaleString() : '—'} />
                    </div>
                    {request.reason && (
                      <div className="mt-4 rounded-xl border bg-[var(--surface-2)] p-4" style={{ borderColor: 'var(--border)' }}>
                        <p className="text-xs font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
                          Reason
                        </p>
                        <p className="mt-2 text-sm leading-6" style={{ color: 'var(--foreground)' }}>
                          {request.reason}
                        </p>
                      </div>
                    )}
                  </div>

                  <Link
                    href={request.artistPublicPath}
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'white' }}
                  >
                    Open Artist
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border px-4 py-3" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
      <p className="text-xs font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
        {label}
      </p>
      <p className="mt-1 break-all text-sm font-medium" style={{ color: 'var(--foreground)' }}>
        {value}
      </p>
    </div>
  )
}
