import type { AdminArtistCard } from '@/lib/admin-dashboard'
import { getSiteUrl } from '@/lib/seo'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { getArtistCategories, getArtistLocation, getArtistSummaryLine, type PublicArtistRecord } from '@/lib/artist-profile'
import { getArtistEmailTemplate, type ArtistEmailPayload, type ArtistEmailTemplateKey } from '@/lib/email/templates/artist'
import { sendEmailIfConfigured } from '@/utils/email'

export const ARTIST_COMMUNICATION_CHANNELS = ['email'] as const

export type ArtistCommunicationChannel = (typeof ARTIST_COMMUNICATION_CHANNELS)[number]

export type ArtistCommunicationEventName =
  | 'account_created'
  | 'verification_pending'
  | 'profile_incomplete'
  | 'profile_incomplete_urgency'
  | 'submitted_for_review'
  | 'profile_under_review'
  | 'needs_changes'
  | 'approved'
  | 'published'
  | 'inactive_followup'
  | 'missing_media'
  | 'welcome_to_showstellar'
  | 'manual_admin_send'

const EVENT_TEMPLATE_MAP: Record<Exclude<ArtistCommunicationEventName, 'manual_admin_send'>, ArtistEmailTemplateKey> = {
  account_created: 'account_created',
  verification_pending: 'verification_reminder',
  profile_incomplete: 'profile_incomplete_reminder',
  profile_incomplete_urgency: 'profile_incomplete_urgency',
  submitted_for_review: 'profile_submitted_successfully',
  profile_under_review: 'profile_under_review',
  needs_changes: 'changes_required_before_approval',
  approved: 'profile_approved',
  published: 'profile_published',
  inactive_followup: 'inactive_artist_followup',
  missing_media: 'missing_media_reminder',
  welcome_to_showstellar: 'welcome_to_showstellar',
}

const DEFAULT_SUPPORT_EMAIL = 'support@showstellar.com'

const trim = (value?: string | null) => value?.trim() ?? ''

type ArtistEmailSource = {
  artistName?: string | null
  artistEmail?: string | null
  loginEmail?: string | null
  dashboardLink?: string | null
  profileLink?: string | null
  verificationLink?: string | null
  missingFields?: string | string[] | null
  supportEmail?: string | null
  temporaryPassword?: string | null
  status?: string | null
  city?: string | null
  category?: string | null
  reason?: string | null
  note?: string | null
  requestedAt?: string | null
}

export type ArtistEmailCenterSeed = ArtistEmailPayload & {
  artistName: string
  artistEmail: string
  dashboardLink: string
  profileLink: string
  verificationLink: string
  missingFields: string
  supportEmail: string
  loginEmail: string
  temporaryPassword: string
  status: string
  city: string
  category: string
  reason: string
  note: string
  requestedAt: string
}

function siteLink(path: string) {
  return new URL(path, getSiteUrl()).toString()
}

function normalizeList(value?: string | string[] | null) {
  if (!value) return []

  const list = Array.isArray(value) ? value : value.split(/[\n,|]/g)
  return Array.from(
    new Set(
      list
        .map(item => trim(item))
        .filter(Boolean)
    )
  )
}

function deriveMissingFields(artist: Partial<PublicArtistRecord> & Partial<AdminArtistCard>) {
  const missing: string[] = []
  const profileImage =
    trim((artist as Partial<PublicArtistRecord>).profile_image) ||
    trim((artist as Partial<PublicArtistRecord>).profile_image_cropped) ||
    trim((artist as Partial<PublicArtistRecord>).profile_image_original) ||
    trim((artist as Partial<AdminArtistCard> & { profileImage?: string | null }).profileImage)
  const languages =
    trim((artist as Partial<PublicArtistRecord>).languages_spoken) ||
    trim((artist as Partial<AdminArtistCard> & { languagesSpoken?: string | null }).languagesSpoken)
  const pricing =
    (artist as Partial<PublicArtistRecord>).pricing_start ??
    (artist as Partial<AdminArtistCard> & { pricingStart?: string | number | null }).pricingStart
  const mediaCount = Array.isArray((artist as { media?: Array<unknown> }).media)
    ? (artist as { media?: Array<unknown> }).media?.length ?? 0
    : Array.isArray((artist as PublicArtistRecord).artist_media)
      ? (artist as PublicArtistRecord).artist_media?.length ?? 0
      : Array.isArray((artist as AdminArtistCard & { media?: Array<unknown> }).media)
        ? (artist as AdminArtistCard & { media?: Array<unknown> }).media?.length ?? 0
        : 0

  if (!trim(artist.bio)) missing.push('Bio')
  if (!trim(artist.city) && !trim(artist.locality) && !trim(artist.state)) missing.push('City')

  const categories = getArtistCategories(artist as PublicArtistRecord).combined
  if (categories.length === 0) missing.push('Categories')

  if (!profileImage) {
    missing.push('Profile photo')
  }

  if (mediaCount === 0) missing.push('Media')
  if (!trim(String(pricing ?? ''))) missing.push('Starting price')
  if (!languages) missing.push('Languages')

  return missing
}

function buildArtistEmailPayload(source: ArtistEmailSource): ArtistEmailPayload {
  return {
    artist_name: trim(source.artistName),
    artist_email: trim(source.artistEmail),
    dashboard_link: trim(source.dashboardLink) || siteLink('/artist-dashboard'),
    profile_link: trim(source.profileLink) || siteLink('/artist-dashboard/profile'),
    verification_link: trim(source.verificationLink) || siteLink('/verify-email'),
    missing_fields: normalizeList(source.missingFields),
    support_email: trim(source.supportEmail) || DEFAULT_SUPPORT_EMAIL,
    login_email: trim(source.loginEmail),
    temporary_password: trim(source.temporaryPassword),
    status: trim(source.status),
    city: trim(source.city),
    category: trim(source.category),
    reason: trim(source.reason),
    note: trim(source.note),
    requested_at: trim(source.requestedAt),
  }
}

export function buildArtistLifecycleEmailPayload(source: ArtistEmailSource): ArtistEmailPayload {
  return buildArtistEmailPayload(source)
}

export function buildArtistEmailCenterSeed(artist: AdminArtistCard) {
  const payload = buildArtistEmailPayload({
    artistName: artist.displayName ?? '',
    artistEmail: artist.email ?? '',
    loginEmail: artist.email ?? '',
    dashboardLink: siteLink('/artist-dashboard'),
    profileLink: siteLink(artist.publicProfilePath || `/artist/${artist.slug ?? artist.id}`),
    verificationLink: siteLink('/verify-email'),
    missingFields: deriveMissingFields(artist),
    supportEmail: DEFAULT_SUPPORT_EMAIL,
    status: artist.approvalStatus ?? '',
    city: artist.city ?? '',
    category: artist.categorySummary || artist.categoryName || '',
    requestedAt: new Date().toLocaleDateString('en-IN'),
  })

  return {
    artistName: payload.artist_name ?? '',
    artistEmail: payload.artist_email ?? '',
    loginEmail: payload.login_email ?? '',
    dashboardLink: payload.dashboard_link ?? '',
    profileLink: payload.profile_link ?? '',
    verificationLink: payload.verification_link ?? '',
    missingFields: Array.isArray(payload.missing_fields) ? payload.missing_fields.join(', ') : '',
    supportEmail: payload.support_email ?? '',
    temporaryPassword: payload.temporary_password ?? '',
    status: payload.status ?? '',
    city: payload.city ?? '',
    category: payload.category ?? '',
    reason: payload.reason ?? '',
    note: payload.note ?? '',
    requestedAt: payload.requested_at ?? '',
    artist_name: payload.artist_name ?? '',
    artist_email: payload.artist_email ?? '',
    login_email: payload.login_email ?? '',
    dashboard_link: payload.dashboard_link ?? '',
    profile_link: payload.profile_link ?? '',
    verification_link: payload.verification_link ?? '',
    missing_fields: Array.isArray(payload.missing_fields) ? payload.missing_fields.join(', ') : '',
    support_email: payload.support_email ?? '',
    temporary_password: payload.temporary_password ?? '',
  }
}

export function getArtistLifecycleTemplateKey(eventName: Exclude<ArtistCommunicationEventName, 'manual_admin_send'>) {
  return EVENT_TEMPLATE_MAP[eventName]
}

type ArtistCommunicationLog = {
  artistId: string | null
  artistUserId: string | null
  eventName: ArtistCommunicationEventName
  templateKey: string
  channel: ArtistCommunicationChannel
  recipientEmail: string | null
  subject: string
  status: 'attempt' | 'success' | 'failure' | 'skipped'
  messageId?: string | null
  error?: string | null
  payload: Record<string, unknown>
  actorUserId?: string | null
}

export async function recordArtistCommunicationEvent(log: ArtistCommunicationLog) {
  const adminClient = getAdminSupabaseClient()

  try {
    const artistCommunicationEventsTable = adminClient.from('artist_communication_events') as unknown as {
      insert(values: Record<string, unknown>): Promise<{ error: { message?: string } | null }>
    }

    const { error } = await artistCommunicationEventsTable.insert({
      artist_id: log.artistId,
      user_id: log.artistUserId,
      event_name: log.eventName,
      template_key: log.templateKey,
      channel: log.channel,
      recipient_email: log.recipientEmail,
      subject: log.subject,
      status: log.status,
      message_id: log.messageId ?? null,
      error: log.error ?? null,
      payload: log.payload,
      triggered_by: log.actorUserId ?? null,
    })

    if (error) {
      console.warn('[artist-email] audit log failed:', error)
    }
  } catch (error) {
    console.warn('[artist-email] audit log skipped:', error)
  }
}

export async function sendArtistCommunicationEmail({
  eventName,
  artistId,
  artistUserId,
  recipientEmail,
  payload,
  actorUserId,
  channel = 'email',
}: {
  eventName: ArtistCommunicationEventName
  artistId: string | null
  artistUserId: string | null
  recipientEmail: string
  payload: ArtistEmailPayload
  actorUserId?: string | null
  channel?: ArtistCommunicationChannel
}) {
  const templateKey =
    eventName === 'manual_admin_send'
      ? 'welcome_to_showstellar'
      : getArtistLifecycleTemplateKey(eventName)

  const template = getArtistEmailTemplate(templateKey, payload)

  await recordArtistCommunicationEvent({
    artistId,
    artistUserId,
    eventName,
    templateKey,
    channel,
    recipientEmail,
    subject: template.subject,
    status: 'attempt',
    payload: payload as Record<string, string>,
    actorUserId,
  })

  const sendResult = await sendEmailIfConfigured({
    to: recipientEmail,
    subject: template.subject,
    html: template.html,
  })

  if (sendResult.skipped) {
    await recordArtistCommunicationEvent({
      artistId,
      artistUserId,
      eventName,
      templateKey,
      channel,
      recipientEmail,
      subject: template.subject,
      status: 'skipped',
      payload,
      actorUserId,
    })

    return { ok: true as const, skipped: true as const, reason: sendResult.reason, templateKey, subject: template.subject }
  }

  if ('error' in sendResult) {
    await recordArtistCommunicationEvent({
      artistId,
      artistUserId,
      eventName,
      templateKey,
      channel,
      recipientEmail,
      subject: template.subject,
      status: 'failure',
      error: sendResult.error,
      payload,
      actorUserId,
    })

    return { ok: false as const, error: sendResult.error, templateKey, subject: template.subject }
  }

  await recordArtistCommunicationEvent({
    artistId,
    artistUserId,
    eventName,
    templateKey,
    channel,
    recipientEmail,
    subject: template.subject,
    status: 'success',
    messageId: sendResult.response.id,
      payload,
    actorUserId,
  })

  return { ok: true as const, skipped: false as const, messageId: sendResult.response.id, templateKey, subject: template.subject }
}

export function buildArtistNotificationFallbackSummary(
  artist: Partial<PublicArtistRecord> & Partial<AdminArtistCard>
) {
  const categories = getArtistCategories(artist as PublicArtistRecord).summary
  const location = getArtistLocation(artist as PublicArtistRecord) || artist.city || artist.locality || ''
  return trim(artist.bio) || getArtistSummaryLine(artist as PublicArtistRecord) || `${categories}${location ? ` · ${location}` : ''}` || 'Updating soon'
}
