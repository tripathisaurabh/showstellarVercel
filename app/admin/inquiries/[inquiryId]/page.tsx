import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { CalendarDays, Clock3, Mail, Phone, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'
import { getAdminSession } from '@/lib/admin-access'
import { loadAdminInquiryDetail } from '@/lib/admin-dashboard'

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  new: { label: 'New', bg: 'var(--surface-2)', color: 'var(--accent)' },
  contacted: { label: 'Contacted', bg: 'var(--surface-2)', color: 'var(--accent)' },
  closed: { label: 'Closed', bg: 'var(--surface-2)', color: 'var(--muted)' },
}

export default async function AdminInquiryDetailPage({
  params,
}: {
  params: Promise<{ inquiryId: string }>
}) {
  const { inquiryId } = await params
  const { adminClient, isAdmin } = await getAdminSession()

  if (!adminClient || !isAdmin) {
    redirect('/admin/login?reason=unauthenticated')
  }

  const data = await loadAdminInquiryDetail(inquiryId)

  if (!data) {
    notFound()
  }

  const { inquiry } = data

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header className="bg-white border-b sticky top-0 z-40" style={{ borderColor: 'var(--border)' }}>
        <div className="px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <BrandLogo href="/admin" className="shrink-0" variant="compact" imageClassName="h-8" />
          <Link href="/admin?tab=inquiries" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            Back to Inquiries
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 lg:py-10 space-y-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--muted)' }}>
            Inquiry detail
          </p>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            {inquiry.clientName}
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
            {inquiry.eventType} · {inquiry.city} · {inquiry.eventDate ?? 'Date TBD'}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="bg-white border rounded-2xl p-6" style={{ border: '1px solid var(--border)' }}>
            <div className="flex flex-wrap gap-2 mb-4">
              <StatusBadge label={inquiry.status} />
              <StatusBadge
                label={inquiry.artistEmailVerified ? 'Artist Verified' : 'Artist Unverified'}
                bg={inquiry.artistEmailVerified ? 'var(--surface-2)' : 'var(--surface-2)'}
                color={inquiry.artistEmailVerified ? 'var(--accent)' : 'var(--accent-violet)'}
              />
              {inquiry.artistIsFeatured && <StatusBadge label="Featured" bg="rgba(193,117,245,0.14)" color="#c175f5" />}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <InfoCard label="Client name" value={inquiry.clientName} icon={User} />
              <InfoCard label="Client phone" value={inquiry.clientPhone} icon={Phone} />
              <InfoCard label="Client email" value={inquiry.clientEmail || '—'} icon={Mail} />
              <InfoCard label="Created" value={formatDate(inquiry.createdAt)} icon={Clock3} />
              <InfoCard label="Event date" value={inquiry.eventDate ?? '—'} icon={CalendarDays} />
              <InfoCard
                label="Artist price"
                value={displayOptionalPrice(inquiry.artistPrice, 'Not listed')}
                icon={CalendarDays}
              />
              <InfoCard
                label="Client offer"
                value={displayOptionalPrice(inquiry.clientOffer, 'To be discussed')}
                icon={CalendarDays}
              />
              <InfoCard label="Event size" value={inquiry.eventSize || '—'} icon={CalendarDays} />
              <InfoCard label="Duration" value={inquiry.eventDuration || '—'} icon={CalendarDays} />
              <InfoCard label="Venue" value={inquiry.venueType || '—'} icon={CalendarDays} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <InfoCard label="Custom event type" value={inquiry.customEventType || '—'} icon={CalendarDays} />
              <InfoCard label="City" value={inquiry.city || '—'} icon={CalendarDays} />
            </div>

            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                Message / Requirements
              </h2>
              {inquiry.additionalDetails || inquiry.message ? (
                <p className="text-sm leading-7 whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
                  {inquiry.additionalDetails || inquiry.message}
                </p>
              ) : (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  No message was provided.
                </p>
              )}
            </div>
          </section>

          <section className="bg-white border rounded-2xl p-6" style={{ border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Linked Artist
            </h2>
            <div className="space-y-3">
              <MetaRow label="Artist" value={inquiry.artistName} />
              <MetaRow label="Category" value={inquiry.artistCategorySummary || inquiry.artistCategoryName || '—'} />
              <MetaRow label="City" value={inquiry.artistCity || '—'} />
              <MetaRow label="Approval" value={inquiry.artistApprovalStatus} />
              <MetaRow label="Verification" value={inquiry.artistEmailVerified ? 'Verified' : 'Unverified'} />
            </div>

            {inquiry.artistCategoryNames.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {inquiry.artistCategoryNames.map(category => (
                  <span
                    key={category}
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: 'var(--surface-2)', color: '#001739' }}
                  >
                    {category}
                  </span>
                ))}
                {inquiry.artistCustomCategories.length > 0 && (
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
                  >
                    {inquiry.artistCustomCategories.length} custom
                  </span>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2">
              <Link
                href={`/admin/artists/${inquiry.artistId}`}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--navy)', color: 'white' }}
              >
                Open artist detail
              </Link>
              <Link
                href={inquiry.artistPublicPath}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium border"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              >
                View public profile
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({
  label,
  bg,
  color,
}: {
  label: string
  bg?: string
  color?: string
}) {
  const styles = STATUS_STYLES[label] ?? null
  return (
    <span
      className="text-[11px] px-2.5 py-1 rounded-full font-medium capitalize"
      style={{
        background: bg ?? styles?.bg ?? 'var(--surface-2)',
        color: color ?? styles?.color ?? 'var(--muted)',
      }}
    >
      {styles?.label ?? label}
    </span>
  )
}

function InfoCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: LucideIcon
}) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color: 'var(--muted)' }} />
        <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
          {label}
        </p>
      </div>
      <p className="text-sm font-medium break-words" style={{ color: 'var(--foreground)' }}>
        {value}
      </p>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-xs uppercase tracking-[0.18em] shrink-0" style={{ color: 'var(--muted)' }}>
        {label}
      </p>
      <p className="text-sm text-right break-words" style={{ color: 'var(--foreground)' }}>
        {value}
      </p>
    </div>
  )
}

function displayOptionalPrice(value: string, fallback: string) {
  const trimmed = value.trim()
  return trimmed && trimmed !== '—' ? trimmed : fallback
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
