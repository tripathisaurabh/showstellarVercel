import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, CalendarDays, Mail, Phone, Star, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import AdminArtistActions from '@/components/AdminArtistActions'
import BrandLogo from '@/components/BrandLogo'
import { getAdminSession } from '@/lib/admin-access'
import { loadAdminArtistDetail } from '@/lib/admin-dashboard'

export const dynamic = 'force-dynamic'

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  draft: { label: 'Draft', bg: 'var(--surface-2)', color: 'var(--muted)' },
  pending: { label: 'Pending', bg: 'var(--surface-2)', color: 'var(--accent-violet)' },
  approved: { label: 'Approved', bg: 'var(--surface-2)', color: 'var(--accent)' },
  rejected: { label: 'Rejected', bg: 'var(--surface-2)', color: 'var(--foreground)' },
}

export default async function AdminArtistDetailPage({
  params,
}: {
  params: Promise<{ artistId: string }>
}) {
  const { artistId } = await params
  const { adminClient, isAdmin } = await getAdminSession()

  if (!adminClient || !isAdmin) {
    redirect('/admin/login?reason=unauthenticated')
  }

  const data = await loadAdminArtistDetail(artistId)

  if (!data) {
    notFound()
  }

  const { artist, inquiries } = data
  const profileDate = artist.updatedAt ?? artist.createdAt ?? null

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header className="bg-white border-b sticky top-0 z-40" style={{ borderColor: 'var(--border)' }}>
        <div className="px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <BrandLogo href="/admin" className="shrink-0" variant="compact" imageClassName="h-8" />
          <Link href="/admin?tab=all" className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 lg:py-10 space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--muted)' }}>
              Artist detail
            </p>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
              {artist.displayName}
            </h1>
            <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
              {artist.categorySummary || artist.categoryName} · {artist.location || artist.city || '—'}
            </p>
          </div>

          <div className="flex items-start gap-3">
            <AdminArtistActions artistId={artist.id} currentStatus={artist.approvalStatus} isFeatured={artist.isFeatured} />
            <Link
              href={`/admin?tab=inquiries&artistId=${artist.id}`}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              View bookings
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="bg-white border rounded-2xl p-6" style={{ border: '1px solid var(--border)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div
                className="w-28 h-28 rounded-2xl overflow-hidden flex items-center justify-center shrink-0"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                {artist.profileImage ? (
                  <Image
                    src={artist.profileImage}
                    alt={artist.displayName}
                    width={112}
                    height={112}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
                    {artist.displayName
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map(part => part[0] ?? '')
                      .join('')
                      .toUpperCase() || 'SS'}
                  </span>
                )}
              </div>

              <div className="min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                <StatusBadge label={artist.approvalStatus} />
                <StatusBadge
                  label={artist.emailVerified ? 'Verified' : 'Unverified'}
                  bg={artist.emailVerified ? 'var(--surface-2)' : 'var(--surface-2)'}
                  color={artist.emailVerified ? 'var(--accent)' : 'var(--accent-violet)'}
                />
                {artist.isFeatured && <StatusBadge label="Featured" bg="rgba(193,117,245,0.14)" color="#c175f5" />}
              </div>
              {artist.categoryNames.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {artist.categoryNames.map(category => (
                    <span
                      key={category}
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: 'var(--surface-2)', color: '#001739' }}
                    >
                      {category}
                    </span>
                  ))}
                  {artist.customCategories.length > 0 && (
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
                    >
                      {artist.customCategories.length} custom
                    </span>
                  )}
                </div>
              )}
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Public profile:
              </p>
                <Link href={artist.publicProfilePath} className="text-sm font-medium hover:underline" style={{ color: 'var(--foreground)' }}>
                  {artist.publicProfilePath}
                </Link>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <InfoCard label="Email" value={artist.email || '—'} icon={Mail} />
              <InfoCard label="Phone" value={artist.phoneNumber || '—'} icon={Phone} />
              <InfoCard label="Category" value={artist.categorySummary || artist.categoryName || '—'} icon={Users} />
              <InfoCard label="Inquiries" value={`${artist.inquiryCount}`} icon={CalendarDays} />
            </div>
          </section>

          <section className="bg-white border rounded-2xl p-6" style={{ border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(193,117,245,0.14)', color: '#c175f5' }}>
                <Star className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  Admin Snapshot
                </h2>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Created {formatDate(artist.createdAt)} · Updated {formatDate(profileDate)}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <MetaRow label="Stage name" value={artist.stageName || '—'} />
              <MetaRow label="City" value={artist.city || '—'} />
              <MetaRow label="Locality" value={artist.location || '—'} />
              <MetaRow label="Pricing start" value={artist.pricingStart ? `₹${artist.pricingStart}` : '—'} />
              <MetaRow label="Rating" value={artist.rating != null ? `${Number(artist.rating).toFixed(1)} / 5.0` : '—'} />
              <MetaRow label="Experience" value={artist.experienceYears != null ? `${artist.experienceYears} yrs` : '—'} />
              <MetaRow label="Media items" value={`${artist.media.length}`} />
              <MetaRow label="Event types" value={artist.eventTypes || '—'} />
              <MetaRow label="Languages" value={artist.languagesSpoken || '—'} />
              <MetaRow label="Performance style" value={artist.performanceStyle || '—'} />
            </div>
          </section>
        </div>

        <section className="bg-white border rounded-2xl p-6" style={{ border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Bio / About
          </h2>
          {artist.bio ? (
            <p className="text-sm leading-7 whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
              {artist.bio}
            </p>
          ) : (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              No bio has been added yet.
            </p>
          )}
        </section>

        <section className="bg-white border rounded-2xl p-6" style={{ border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Gallery / Media
          </h2>
          {artist.media.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              No gallery items uploaded.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {artist.media.map(item => (
                <div
                  key={item.id}
                  className="rounded-2xl overflow-hidden border"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {item.type === 'video' ? (
                    <video className="h-40 w-full object-cover bg-black" controls src={item.media_url} />
                  ) : (
                    <Image
                      src={item.media_url}
                      alt={artist.displayName}
                      width={320}
                      height={240}
                      className="h-40 w-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white border rounded-2xl p-6" style={{ border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
              Booking Inquiries for this Artist
            </h2>
            <span className="text-sm" style={{ color: 'var(--muted)' }}>
              {inquiries.length} total
            </span>
          </div>

          {inquiries.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              No booking inquiries have been received for this artist yet.
            </p>
          ) : (
            <div className="space-y-3">
              {inquiries.map(inquiry => (
                <div
                  key={inquiry.id}
                  className="rounded-2xl border p-4"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <StatusBadge label={inquiry.status} />
                        <StatusBadge
                          label={inquiry.artistEmailVerified ? 'Artist Verified' : 'Artist Unverified'}
                          bg={inquiry.artistEmailVerified ? 'var(--surface-2)' : 'var(--surface-2)'}
                          color={inquiry.artistEmailVerified ? 'var(--accent)' : 'var(--accent-violet)'}
                        />
                      </div>
                      <h3 className="font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                        {inquiry.clientName}
                      </h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                        {inquiry.eventType}
                        {inquiry.customEventType ? ` · ${inquiry.customEventType}` : ''}
                        {inquiry.eventSize ? ` · ${inquiry.eventSize}` : ''}
                        {inquiry.eventDuration ? ` · ${inquiry.eventDuration}` : ''}
                        {inquiry.venueType ? ` · ${inquiry.venueType}` : ''}
                        · {inquiry.city} · {inquiry.eventDate ?? 'Date TBD'}
                      </p>
                      <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                        Price: {displayOptionalPrice(inquiry.artistPrice, 'Not listed')}
                        {inquiry.clientOffer ? ` · Offer: ${displayOptionalPrice(inquiry.clientOffer, 'To be discussed')}` : ''}
                      </p>
                      <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                        📞 {inquiry.clientPhone} {inquiry.clientEmail ? `· ✉️ ${inquiry.clientEmail}` : ''}
                      </p>
                      <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                        {formatDate(inquiry.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <Link
                        href={`/admin/inquiries/${inquiry.id}`}
                        className="text-xs px-3 py-1.5 rounded-lg border font-medium"
                        style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                      >
                        Open inquiry
                      </Link>
                      <Link
                        href={`/admin/artists/${artist.id}`}
                        className="text-xs px-3 py-1.5 rounded-lg border font-medium"
                        style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                      >
                        Back to artist
                      </Link>
                    </div>
                  </div>
                  {(inquiry.additionalDetails || inquiry.message) && (
                    <p className="text-sm mt-4 whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
                      {inquiry.additionalDetails || inquiry.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
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

function displayOptionalPrice(value: string, fallback: string) {
  const trimmed = value.trim()
  return trimmed && trimmed !== '—' ? trimmed : fallback
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

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
