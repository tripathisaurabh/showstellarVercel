import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BadgeCheck,
  CheckCircle,
  Clock,
  FileText,
  Filter,
  ShieldAlert,
  Star,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import AdminArtistActions from '@/components/AdminArtistActions'
import AdminLogoutButton from '@/components/AdminLogoutButton'
import BrandLogo from '@/components/BrandLogo'
import { getAdminSession } from '@/lib/admin-access'
import {
  filterAdminArtists,
  loadAdminDashboardData,
  type AdminArtistCard,
  type AdminInquiryCard,
} from '@/lib/admin-dashboard'

export const dynamic = 'force-dynamic'

type AdminSearchParams = {
  tab?: string
  q?: string
  category?: string
  city?: string
  approval?: string
  verification?: string
  featured?: string
  artistId?: string
}

const TAB_DEFS = [
  { key: 'overview', label: 'Overview' },
  { key: 'all', label: 'All Artists' },
  { key: 'pending', label: 'Pending Review' },
  { key: 'approved', label: 'Approved Artists' },
  { key: 'draft', label: 'Draft / Rejected' },
  { key: 'inquiries', label: 'Booking Inquiries' },
] as const

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  draft: { label: 'Draft', bg: 'var(--surface-2)', color: 'var(--muted)' },
  pending: { label: 'Pending', bg: 'var(--surface-2)', color: 'var(--accent-violet)' },
  approved: { label: 'Approved', bg: 'var(--surface-2)', color: 'var(--accent)' },
  rejected: { label: 'Rejected', bg: 'var(--surface-2)', color: 'var(--foreground)' },
}

const INQUIRY_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  new: { bg: 'var(--surface-2)', color: 'var(--accent)' },
  contacted: { bg: 'var(--surface-2)', color: 'var(--accent)' },
  closed: { bg: 'var(--surface-2)', color: 'var(--muted)' },
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<AdminSearchParams>
}) {
  const params = (await searchParams) ?? {}
  const activeTab = normalizeTab(params.tab)
  const artistIdFilter = params.artistId?.trim() ?? ''
  const { user, adminClient, userRecord, isAdmin } = await getAdminSession()

  if (!user || !adminClient) {
    redirect('/admin/login?reason=unauthenticated')
  }

  if (!isAdmin) {
    redirect('/admin/login?reason=not-admin')
  }

  const data = await loadAdminDashboardData()
  const filteredAllArtists = filterAdminArtists(data.artists, params)
  const filteredInquiries =
    activeTab === 'inquiries' && artistIdFilter
      ? data.inquiries.filter(inquiry => inquiry.artistId === artistIdFilter)
      : data.inquiries

  const pendingArtists = data.artists.filter(
    artist => artist.approvalStatus !== 'approved' || !artist.emailVerified
  )
  const approvedArtists = data.artists.filter(artist => artist.approvalStatus === 'approved')
  const draftRejectedArtists = data.artists.filter(
    artist => artist.approvalStatus === 'draft' || artist.approvalStatus === 'rejected'
  )

  const tabHref = (key: string) => `/admin${key === 'overview' ? '' : `?tab=${key}`}`

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header className="bg-white border-b sticky top-0 z-40" style={{ borderColor: 'var(--border)' }}>
        <div className="px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <BrandLogo href="/" className="shrink-0" variant="compact" imageClassName="h-8" />
          <span className="hidden md:block text-lg font-semibold" style={{ color: 'var(--navy)' }}>
            ShowStellar Admin
          </span>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold"
                style={{ background: 'rgba(193,117,245,0.14)', color: '#c175f5' }}
              >
                AD
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  {userRecord?.email ?? user.email}
                </div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>
                  Administrator
                </div>
              </div>
            </div>
            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 lg:py-10">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Admin Panel
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            ShowStellar Management · {userRecord?.email ?? user.email}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {TAB_DEFS.map(tab => {
            const href = tabHref(tab.key)
            const active = activeTab === tab.key
            return (
              <Link
                key={tab.key}
                href={href}
                className="px-4 py-2 rounded-full text-sm font-medium border transition-colors"
                style={{
                  background: active ? 'var(--navy)' : 'white',
                  color: active ? 'white' : 'var(--foreground)',
                  borderColor: active ? 'var(--navy)' : 'var(--border)',
                }}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Artists" value={data.metrics.totalArtists} icon={Users} />
          <StatCard label="Approved Artists" value={data.metrics.approvedArtists} icon={CheckCircle} />
          <StatCard label="Draft Artists" value={data.metrics.draftArtists} icon={Clock} accent />
          <StatCard label="Rejected Artists" value={data.metrics.rejectedArtists} icon={ShieldAlert} danger />
          <StatCard label="Unverified Artists" value={data.metrics.unverifiedArtists} icon={BadgeCheck} warning />
          <StatCard label="Featured Artists" value={data.metrics.featuredArtists} icon={Star} featured />
          <StatCard label="Total Booking Inquiries" value={data.metrics.totalBookingInquiries} icon={FileText} />
          <StatCard label="New Inquiries" value={data.metrics.newInquiries} icon={Clock} warning />
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-10">
            <Section title="Pending Review" count={pendingArtists.length} accent>
              {pendingArtists.length === 0 ? (
                <EmptyState message="No artists are waiting for review." />
              ) : (
                pendingArtists.map(artist => <AdminArtistCardRow key={artist.id} artist={artist} />)
              )}
            </Section>

            <Section title="Approved Artists" count={approvedArtists.length}>
              {approvedArtists.length === 0 ? (
                <EmptyState message="No approved artists yet." />
              ) : (
                approvedArtists.map(artist => <AdminArtistCardRow key={artist.id} artist={artist} />)
              )}
            </Section>

            <Section title="Booking Inquiries" count={filteredInquiries.length}>
              {filteredInquiries.length === 0 ? (
                <EmptyState message="No inquiries yet." />
              ) : (
                filteredInquiries.slice(0, 8).map(inquiry => (
                  <AdminInquiryCardRow key={inquiry.id} inquiry={inquiry} />
                ))
              )}
            </Section>
          </div>
        )}

        {activeTab === 'all' && (
          <div className="space-y-6">
            <ArtistFiltersForm
              categories={data.categories}
              cities={data.cities}
              params={params}
            />
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                All Artists
              </h2>
              <span className="text-sm" style={{ color: 'var(--muted)' }}>
                {filteredAllArtists.length} result{filteredAllArtists.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="space-y-3">
              {filteredAllArtists.length === 0 ? (
                <EmptyState message="No artists match the current filters." />
              ) : (
                filteredAllArtists.map(artist => <AdminArtistCardRow key={artist.id} artist={artist} />)
              )}
            </div>
          </div>
        )}

        {activeTab === 'pending' && (
          <Section title="Pending Review" count={pendingArtists.length} accent>
            {pendingArtists.length === 0 ? (
              <EmptyState message="No artists are waiting for review." />
            ) : (
              pendingArtists.map(artist => <AdminArtistCardRow key={artist.id} artist={artist} />)
            )}
          </Section>
        )}

        {activeTab === 'approved' && (
          <Section title="Approved Artists" count={approvedArtists.length}>
            {approvedArtists.length === 0 ? (
              <EmptyState message="No approved artists yet." />
            ) : (
              approvedArtists.map(artist => <AdminArtistCardRow key={artist.id} artist={artist} />)
            )}
          </Section>
        )}

        {activeTab === 'draft' && (
          <Section title="Draft / Rejected" count={draftRejectedArtists.length}>
            {draftRejectedArtists.length === 0 ? (
              <EmptyState message="No draft or rejected artists." />
            ) : (
              draftRejectedArtists.map(artist => <AdminArtistCardRow key={artist.id} artist={artist} />)
            )}
          </Section>
        )}

        {activeTab === 'inquiries' && (
          <Section title="Booking Inquiries" count={filteredInquiries.length}>
            {filteredInquiries.length === 0 ? (
              <EmptyState message="No inquiries yet." />
            ) : (
              filteredInquiries.map(inquiry => <AdminInquiryCardRow key={inquiry.id} inquiry={inquiry} />)
            )}
          </Section>
        )}
      </div>
    </div>
  )
}

function normalizeTab(value?: string) {
  const allowed = new Set(TAB_DEFS.map(tab => tab.key))
  return value && allowed.has(value as (typeof TAB_DEFS)[number]['key']) ? value : 'overview'
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  warning,
  danger,
  featured,
}: {
  label: string
  value: number
  icon: LucideIcon
  accent?: boolean
  warning?: boolean
  danger?: boolean
  featured?: boolean
}) {
  const color = danger ? 'var(--foreground)' : warning ? 'var(--accent-violet)' : featured ? '#c175f5' : accent ? 'var(--accent-violet)' : 'var(--foreground)'
  const bg = danger
    ? 'var(--surface-2)'
    : warning
      ? 'var(--surface-2)'
      : featured
        ? 'rgba(193,117,245,0.14)'
        : accent
          ? 'var(--surface-2)'
          : 'var(--surface-2)'

  return (
    <div className="bg-white rounded-2xl p-5 border" style={{ border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-3 gap-3">
        <p className="text-xs font-medium leading-5" style={{ color: 'var(--muted)' }}>
          {label}
        </p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  )
}

function Section({
  title,
  count,
  children,
  accent,
}: {
  title: string
  count: number
  children: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
          {title}
        </h2>
        <span
          className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{
            background: accent ? 'var(--surface-2)' : 'var(--surface-2)',
            color: accent ? 'var(--accent-violet)' : 'var(--muted)',
          }}
        >
          {count}
        </span>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border bg-white p-6 text-sm" style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>
      {message}
    </div>
  )
}

function StatusBadge({
  label,
  bg,
  color,
}: {
  label: string
  bg: string
  color: string
}) {
  return (
    <span className="text-[11px] px-2.5 py-1 rounded-full font-medium capitalize" style={{ background: bg, color }}>
      {label}
    </span>
  )
}

function AdminArtistCardRow({ artist }: { artist: AdminArtistCard }) {
  return (
    <div
      className="rounded-2xl border bg-white p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between transition-shadow hover:shadow-sm"
      style={{ border: '1px solid var(--border)' }}
    >
      <Link href={`/admin/artists/${artist.id}`} className="flex-1 min-w-0">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center shrink-0"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            {artist.profileImage ? (
              <Image
                src={artist.profileImage}
                alt={artist.displayName}
                width={56}
                height={56}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
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
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <StatusBadge
                label={artist.approvalStatus}
                bg={STATUS_STYLES[artist.approvalStatus]?.bg ?? STATUS_STYLES.draft.bg}
                color={STATUS_STYLES[artist.approvalStatus]?.color ?? STATUS_STYLES.draft.color}
              />
              <StatusBadge
                label={artist.emailVerified ? 'Verified' : 'Unverified'}
                bg={artist.emailVerified ? 'var(--surface-2)' : 'var(--surface-2)'}
                color={artist.emailVerified ? 'var(--accent)' : 'var(--accent-violet)'}
              />
              {artist.isFeatured && <StatusBadge label="Featured" bg="rgba(193,117,245,0.14)" color="#c175f5" />}
              <StatusBadge label={`${artist.inquiryCount} inquiries`} bg="var(--surface-2)" color="var(--muted)" />
            </div>
            <h3 className="text-base font-semibold truncate" style={{ color: 'var(--foreground)' }}>
              {artist.displayName}
            </h3>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {artist.categoryNames.slice(0, 3).map(category => (
                <span
                  key={category}
                  className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'var(--surface-2)', color: '#001739' }}
                >
                  {category}
                </span>
              ))}
              {artist.customCategories.length > 0 && (
                <span
                  className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
                >
                  +{artist.customCategories.length} custom
                </span>
              )}
            </div>
            <p className="text-sm mt-2 truncate" style={{ color: 'var(--muted)' }}>
              {artist.categorySummary || artist.categoryName} · {artist.location || artist.city || '—'}
            </p>
            <p className="text-sm mt-1 truncate" style={{ color: 'var(--muted)' }}>
              {artist.email || 'No email'} · {artist.phoneNumber || 'No phone'}
            </p>
          </div>
        </div>
      </Link>

      <div className="flex items-start gap-4 justify-between lg:justify-end shrink-0">
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
            Public profile
          </p>
          <Link
            href={artist.publicProfilePath}
            className="text-sm font-medium hover:underline"
            style={{ color: 'var(--foreground)' }}
          >
            View page
          </Link>
        </div>
        <AdminArtistActions artistId={artist.id} currentStatus={artist.approvalStatus} isFeatured={artist.isFeatured} />
      </div>
    </div>
  )
}

function AdminInquiryCardRow({ inquiry }: { inquiry: AdminInquiryCard }) {
  return (
    <div
      className="rounded-2xl border bg-white p-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between transition-shadow hover:shadow-sm"
      style={{ border: '1px solid var(--border)' }}
    >
      <Link href={`/admin/inquiries/${inquiry.id}`} className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <StatusBadge
            label={inquiry.status}
            bg={INQUIRY_STATUS_STYLES[inquiry.status]?.bg ?? INQUIRY_STATUS_STYLES.new.bg}
            color={INQUIRY_STATUS_STYLES[inquiry.status]?.color ?? INQUIRY_STATUS_STYLES.new.color}
          />
          <StatusBadge label={inquiry.artistApprovalStatus} bg="var(--surface-2)" color="var(--muted)" />
          <StatusBadge
            label={inquiry.artistEmailVerified ? 'Artist Verified' : 'Artist Unverified'}
            bg={inquiry.artistEmailVerified ? 'var(--surface-2)' : 'var(--surface-2)'}
            color={inquiry.artistEmailVerified ? 'var(--accent)' : 'var(--accent-violet)'}
          />
          {inquiry.artistIsFeatured && <StatusBadge label="Featured" bg="rgba(193,117,245,0.14)" color="#c175f5" />}
        </div>
        <h3 className="font-semibold truncate" style={{ color: 'var(--foreground)' }}>
          {inquiry.clientName} → {inquiry.artistName}
        </h3>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {inquiry.artistCategoryNames.slice(0, 3).map(category => (
            <span
              key={category}
              className="text-[11px] px-2.5 py-1 rounded-full font-medium"
              style={{ background: 'var(--surface-2)', color: '#001739' }}
            >
              {category}
            </span>
          ))}
          {inquiry.artistCustomCategories.length > 0 && (
            <span
              className="text-[11px] px-2.5 py-1 rounded-full font-medium"
              style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
            >
              +{inquiry.artistCustomCategories.length} custom
            </span>
          )}
        </div>
        <p className="text-sm mt-1 truncate" style={{ color: 'var(--muted)' }}>
          {inquiry.artistCategorySummary || inquiry.artistCategoryName} · {inquiry.eventType}
          {inquiry.customEventType ? ` · ${inquiry.customEventType}` : ''}
          {inquiry.eventSize ? ` · ${inquiry.eventSize}` : ''}
          {inquiry.eventDuration ? ` · ${inquiry.eventDuration}` : ''}
          {inquiry.venueType ? ` · ${inquiry.venueType}` : ''}
          · {inquiry.city} · {inquiry.eventDate ?? 'Date TBD'}
        </p>
        <p className="text-sm mt-1 truncate" style={{ color: 'var(--muted)' }}>
          Price: {displayOptionalPrice(inquiry.artistPrice, 'Not listed')}
          {inquiry.clientOffer ? ` · Offer: ${displayOptionalPrice(inquiry.clientOffer, 'To be discussed')}` : ''}
        </p>
        <p className="text-sm mt-1 truncate" style={{ color: 'var(--muted)' }}>
          📞 {inquiry.clientPhone} {inquiry.clientEmail ? `· ✉️ ${inquiry.clientEmail}` : ''}
        </p>
      </Link>

      <div className="flex flex-col items-start gap-2 shrink-0">
        <Link
          href={`/admin/artists/${inquiry.artistId}`}
          className="text-xs px-3 py-1.5 rounded-lg border font-medium"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          Artist details
        </Link>
        <Link
          href={inquiry.artistPublicPath}
          className="text-xs px-3 py-1.5 rounded-lg border font-medium"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          Public profile
        </Link>
      </div>
    </div>
  )
}

function ArtistFiltersForm({
  categories,
  cities,
  params,
}: {
  categories: string[]
  cities: string[]
  params: AdminSearchParams
}) {
  return (
    <form method="get" className="rounded-2xl border bg-white p-5 grid gap-4 lg:grid-cols-6" style={{ border: '1px solid var(--border)' }}>
      <input type="hidden" name="tab" value="all" />
      <label className="lg:col-span-2 flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
          Search
        </span>
        <input
          name="q"
          defaultValue={params.q ?? ''}
          placeholder="Name, email, phone"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent-violet)] bg-white"
          style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
          Category
        </span>
        <select
          name="category"
          defaultValue={params.category ?? ''}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent-violet)] bg-white"
          style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
        >
          <option value="">All</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
          City
        </span>
        <select
          name="city"
          defaultValue={params.city ?? ''}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent-violet)] bg-white"
          style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
        >
          <option value="">All</option>
          {cities.map(city => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
          Approval
        </span>
        <select
          name="approval"
          defaultValue={params.approval ?? ''}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent-violet)] bg-white"
          style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
        >
          <option value="">All</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
          Verification
        </span>
        <select
          name="verification"
          defaultValue={params.verification ?? ''}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent-violet)] bg-white"
          style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
        >
          <option value="">All</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
          Featured
        </span>
        <select
          name="featured"
          defaultValue={params.featured ?? ''}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent-violet)] bg-white"
          style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
        >
          <option value="">All</option>
          <option value="featured">Featured</option>
          <option value="not_featured">Not featured</option>
        </select>
      </label>

      <div className="lg:col-span-6 flex items-center gap-3">
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--navy)' }}
        >
          <Filter className="w-4 h-4" />
          Apply filters
        </button>
        <Link
          href="/admin?tab=all"
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium border"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          Reset
        </Link>
      </div>
    </form>
  )
}

function displayOptionalPrice(value: string, fallback: string) {
  const trimmed = value.trim()
  return trimmed && trimmed !== '—' ? trimmed : fallback
}
