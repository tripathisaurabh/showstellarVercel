import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ArtistDashboardShell from '@/components/ArtistDashboardShell'
import { CheckCircle, Clock, AlertCircle, XCircle, Edit, Eye, Mail } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import ArtistContactInformationSection from '@/components/ArtistContactInformationSection'
import { getArtistDisplayName, getArtistPublicPath, getArtistCategories, getArtistPreferredWorkingLocationsText } from '@/lib/artist-profile'
import type { PublicArtistRecord } from '@/lib/artist-profile'
import { isMissingEmailChangeRequestsTableError } from '@/lib/contact-info'
import {
  buildArtistLifecycleEmailPayload,
  sendArtistCommunicationEmail,
} from '@/lib/email/artist-communication'
import { getSiteUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic'

type InquiryRow = {
  id: string
  client_name: string
  event_type: string
  custom_event_type?: string | null
  event_size?: string | null
  event_duration?: string | null
  venue_type?: string | null
  city: string
  event_date: string | null
  status: string
  artist_price?: string | number | null
  client_offer?: string | number | null
  additional_details?: string | null
  message?: string | null
}

const statusConfig: Record<string, { label: string; icon: LucideIcon; color: string; bg: string; desc: string }> = {
  draft: { label: 'Draft', icon: AlertCircle, color: 'var(--accent-violet)', bg: 'var(--surface-2)', desc: 'Complete your profile to submit for review' },
  pending: { label: 'Pending Review', icon: Clock, color: 'var(--accent-violet)', bg: 'var(--surface-2)', desc: 'We\'re reviewing your profile' },
  approved: { label: 'Profile Approved', icon: CheckCircle, color: 'var(--accent)', bg: 'rgba(0,23,57,0.08)', desc: 'Your profile is now live' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'var(--foreground)', bg: 'var(--surface-2)', desc: 'Your profile was not approved' },
}

export default async function ArtistDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/artist-login')

  const { data: userRecord } = await supabase
    .from('users')
    .select('role, email, phone_number')
    .eq('id', user.id)
    .maybeSingle()

  const profileResult = (await supabase
    .from('artist_profiles')
    .select('*, users(full_name, phone_number, email), primary_category:categories(name), categories, custom_categories')
    .eq('user_id', user.id)
    .maybeSingle()) as { data: PublicArtistRecord | null }
  const { data: profile } = profileResult

  if (userRecord?.role !== 'artist' && !profile) {
    redirect('/artist-login?reason=not-artist')
  }

  const inquiriesResult = (await supabase
    .from('booking_inquiries')
    .select('id, client_name, event_type, custom_event_type, event_size, event_duration, venue_type, city, event_date, status, artist_price, client_offer, additional_details, message, created_at')
    .eq('artist_id', profile?.id ?? '')
    .order('created_at', { ascending: false })
    .limit(5)) as { data: InquiryRow[] | null }
  const { data: inquiries } = inquiriesResult

  const status = profile?.approval_status ?? 'draft'
  const statusInfo = statusConfig[status] ?? statusConfig.draft
  const StatusIcon = statusInfo.icon
  const artistName = profile
    ? getArtistDisplayName(profile)
    : userRecord?.email?.split('@')[0] ?? 'ShowStellar Artist'
  const publicProfilePath = profile ? getArtistPublicPath(profile) : ''
  const preferredWorkingLocations = profile ? getArtistPreferredWorkingLocationsText(profile) : null
  let pendingEmailRequest = null as
    | null
    | {
        id: string
        status: string
        current_email: string
        requested_email: string
        reason: string | null
        created_at: string | null
        updated_at: string | null
      }

  const pendingEmailRequestResult = await supabase
    .from('email_change_requests')
    .select('id, status, current_email, requested_email, reason, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (!isMissingEmailChangeRequestsTableError(pendingEmailRequestResult.error)) {
    pendingEmailRequest = pendingEmailRequestResult.data
  }
  const emailChangeRequestsEnabled = !isMissingEmailChangeRequestsTableError(pendingEmailRequestResult.error)

  return (
    <ArtistDashboardShell artistName={artistName}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
            Welcome, {artistName}
          </h1>
          <p style={{ color: 'var(--muted)' }}>Manage your ShowStellar profile</p>
        </div>

        {!profile && userRecord?.role === 'artist' && (
          <div className="border rounded-2xl p-5 mb-8" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Your artist profile is not set up yet.</p>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Complete your artist signup so bookings can be routed to your profile.
            </p>
            <Link
              href="/artist-signup"
              className="inline-flex mt-4 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: 'var(--navy)' }}
            >
              Finish Artist Signup
            </Link>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Profile Completion */}
          <div className="bg-white border rounded-2xl p-6" style={{ border: '1px solid var(--border)' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>Profile Completion</h3>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>Complete your profile to get more bookings</p>
              </div>
            </div>
            <div className="w-full h-2.5 rounded-full mb-4" style={{ background: 'var(--border)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: profile?.bio && profile?.pricing_start && profile?.profile_image ? '100%' : profile?.bio ? '60%' : '30%',
                  background: 'linear-gradient(90deg, #c175f5, #c175f5)',
                }}
              />
            </div>
            {preferredWorkingLocations && (
              <p className="mb-4 text-sm leading-6" style={{ color: 'var(--muted)' }}>
                <span className="font-medium text-[var(--foreground)]">Preferred locations:</span> {preferredWorkingLocations}
              </p>
            )}
            <Link
              href="/artist-dashboard/profile"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:opacity-80"
              style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
            >
              <Edit className="w-4 h-4" />
              Complete Profile
            </Link>
          </div>

          {/* Approval Status */}
          <div className="bg-white border rounded-2xl p-6" style={{ border: '1px solid var(--border)' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Approval Status</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: statusInfo.bg }}>
                <StatusIcon className="w-6 h-6" style={{ color: statusInfo.color }} />
              </div>
              <div>
                <div className="font-medium" style={{ color: 'var(--foreground)' }}>{statusInfo.label}</div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>{statusInfo.desc}</div>
              </div>
            </div>
            {status === 'draft' && profile?.id && (
              <SubmitForReviewButton
                artistId={profile.id}
                artistName={artistName}
                artistEmail={userRecord?.email ?? profile?.users?.email ?? user.email ?? ''}
                profileLink={publicProfilePath || `/artist/${profile.id}`}
                category={profile ? getArtistCategories(profile).summary : ''}
                city={profile?.city ?? ''}
                actorUserId={user.id}
              />
            )}
          </div>
        </div>

        <div className="mb-8">
          <ArtistContactInformationSection
            artistId={profile?.id ?? ''}
            email={userRecord?.email ?? profile?.users?.email ?? null}
            phoneNumber={profile?.users?.phone_number ?? userRecord?.phone_number ?? null}
            emailChangeRequestsEnabled={emailChangeRequestsEnabled}
            pendingEmailRequest={
              pendingEmailRequest
                ? {
                    id: pendingEmailRequest.id,
                    status: pendingEmailRequest.status,
                    currentEmail: pendingEmailRequest.current_email,
                    requestedEmail: pendingEmailRequest.requested_email,
                    reason: pendingEmailRequest.reason ?? null,
                    createdAt: pendingEmailRequest.created_at ?? null,
                  }
                : null
            }
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white border rounded-2xl p-6 mb-8" style={{ border: '1px solid var(--border)' }}>
          <h3 className="font-semibold mb-5" style={{ color: 'var(--foreground)' }}>Quick Actions</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link
              href="/artist-dashboard/profile"
              className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors hover:opacity-80"
              style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </Link>
            {status === 'approved' && profile?.id && (
              <Link
                href={publicProfilePath || `/artist/${profile.id}`}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors hover:opacity-80"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
              >
                <Eye className="w-4 h-4" />
                View Public Profile
              </Link>
            )}
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium"
              style={{ border: '1px solid var(--border)', color: 'var(--muted)', background: 'var(--surface-2)' }}
            >
              <Mail className="w-4 h-4" />
              {inquiries?.length ?? 0} Inquiries
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border rounded-2xl p-5" style={{ border: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Total Inquiries</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{inquiries?.length ?? 0}</p>
          </div>
            <div className="bg-white border rounded-2xl p-5" style={{ border: '1px solid var(--border)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Category</p>
            <p className="text-lg font-bold truncate" style={{ color: 'var(--foreground)' }}>
              {profile ? getArtistCategories(profile).summary : '—'}
            </p>
            </div>
          <div className="bg-white border rounded-2xl p-5" style={{ border: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>City</p>
            <p className="text-lg font-bold truncate" style={{ color: 'var(--foreground)' }}>{profile?.city ?? '—'}</p>
          </div>
        </div>

        {/* Recent Inquiries */}
        <div className="bg-white border rounded-2xl p-6" style={{ border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>Recent Inquiries</h3>
            {inquiries && inquiries.length > 0 && (
              <span className="text-sm" style={{ color: 'var(--muted)' }}>{inquiries.length} total</span>
            )}
          </div>

          {!inquiries || inquiries.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--surface-2)' }}>
                <Mail className="w-8 h-8" style={{ color: 'var(--muted)' }} />
              </div>
              <p style={{ color: 'var(--muted)' }}>No inquiries yet. Once your profile is approved, inquiries will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="border rounded-xl p-4 hover:shadow-sm transition-shadow"
                  style={{ border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{inq.client_name}</h4>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        {inq.event_type}
                        {inq.custom_event_type ? ` · ${inq.custom_event_type}` : ''}
                        {inq.event_size ? ` · ${inq.event_size}` : ''}
                        {inq.event_duration ? ` · ${inq.event_duration}` : ''}
                        {inq.venue_type ? ` · ${inq.venue_type}` : ''}
                        · {inq.city} · {inq.event_date}
                      </p>
                    </div>
                    <StatusPill status={inq.status} />
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                    Price: {displayOptionalPrice(formatMoney(inq.artist_price), 'Not listed')}
                    {inq.client_offer ? ` · Offer: ${displayOptionalPrice(formatMoney(inq.client_offer), 'To be discussed')}` : ''}
                  </p>
                  {(inq.additional_details || inq.message) && (
                    <p className="text-xs line-clamp-1" style={{ color: 'var(--muted)' }}>
                      {inq.additional_details || inq.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ArtistDashboardShell>
  )
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    new: { bg: 'var(--surface-2)', text: 'var(--accent)' },
    contacted: { bg: 'var(--surface-2)', text: 'var(--accent)' },
    closed: { bg: 'var(--surface-2)', text: 'var(--muted)' },
  }
  const c = colors[status] ?? colors.new
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-medium capitalize" style={{ background: c.bg, color: c.text }}>
      {status}
    </span>
  )
}

function displayOptionalPrice(value: string, fallback: string) {
  const trimmed = value.trim()
  return trimmed && trimmed !== '—' ? trimmed : fallback
}

function SubmitForReviewButton({
  artistId,
  artistName,
  artistEmail,
  profileLink,
  category,
  city,
  actorUserId,
}: {
  artistId?: string
  artistName: string
  artistEmail: string
  profileLink: string
  category: string
  city: string
  actorUserId: string
}) {
  return (
    <form action={async () => {
      'use server'
      if (!artistId || !artistEmail) return
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      await supabase
        .from('artist_profiles')
        .update({ approval_status: 'pending' })
        .eq('id', artistId)

      try {
        const siteUrl = getSiteUrl()
        const payload = buildArtistLifecycleEmailPayload({
          artistName,
          artistEmail,
          loginEmail: artistEmail,
          dashboardLink: new URL('/artist-dashboard', siteUrl).toString(),
          profileLink: new URL(profileLink, siteUrl).toString(),
          verificationLink: new URL('/verify-email', siteUrl).toString(),
          missingFields: [],
          supportEmail: 'support@showstellar.com',
          status: 'submitted_for_review',
          city,
          category,
        })

        await sendArtistCommunicationEmail({
          eventName: 'submitted_for_review',
          artistId,
          artistUserId: actorUserId,
          recipientEmail: artistEmail,
          payload,
          actorUserId,
        })
      } catch (error) {
        console.error('[artist-dashboard] submission email failed:', error)
      }
    }}>
      <button
        type="submit"
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: 'var(--navy)' }}
      >
        Submit for Review
      </button>
    </form>
  )
}

function formatMoney(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return '—'
  const numeric = typeof value === 'number' ? value : Number(String(value).replace(/[^\d.]/g, ''))
  if (!Number.isFinite(numeric)) return '—'
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(numeric)
  } catch {
    return `₹${numeric}`
  }
}
