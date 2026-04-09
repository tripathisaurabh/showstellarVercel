import { NextResponse } from 'next/server'
import {
  buildArtistToClientMessage,
  buildClientToArtistMessage,
  buildClientArtistSummary,
  type BookingNotificationPayload,
} from '@/lib/booking-notifications'
import { buildBrandedEmailTemplate } from '@/lib/email-template'
import { getSiteUrl } from '@/lib/seo'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import {
  getArtistDisplayName,
  getArtistLocation,
  getArtistPublicPath,
  type PublicArtistRecord,
} from '@/lib/artist-profile'
import { getArtistCategorySummary } from '@/lib/artist-categories'
import { sendEmailIfConfigured } from '@/utils/email'
import { rateLimitRequest } from '@/lib/rate-limit'

const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01'
type MaybeString = string | null | undefined
function normalizePhone(value?: string | null) {
  return value?.replace(/[^\d]/g, '') ?? ''
}

function parseMoney(value?: string | number | null) {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null

  const cleaned = value.replace(/[^\d.]/g, '').trim()
  if (!cleaned) return null

  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function formatMoney(value?: string | number | null) {
  const amount = parseMoney(value)
  if (amount === null) return null

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `₹${amount}`
  }
}

function compactStrings(values?: MaybeString[] | null) {
  return (values ?? []).filter((value): value is string => Boolean(value))
}

async function sendTwilioWhatsApp({
  accountSid,
  authToken,
  from,
  to,
  body,
}: {
  accountSid: string
  authToken: string
  from: string
  to: string
  body: string
}) {
  const response = await fetch(`${TWILIO_API_BASE}/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: from,
      To: to,
      Body: body,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Twilio WhatsApp failed: ${detail}`)
  }
}

export async function POST(request: Request) {
  const rateLimit = await rateLimitRequest(request, 'booking-notify', 5, 60_000)
  if (!rateLimit.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many booking requests. Please try again shortly.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      }
    )
  }

  let body: BookingSubmissionBody
  const siteUrl = getSiteUrl()

  try {
    body = (await request.json()) as BookingSubmissionBody
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload' }, { status: 400 })
  }

  if (!body.artistId) {
    return NextResponse.json({ ok: false, error: 'Missing artistId' }, { status: 400 })
  }

  const reqClientName = body.client?.name?.trim()
  const reqClientPhone = body.client?.phone?.trim()
  const reqEventType = body.inquiry?.eventType?.trim()
  const reqCity = body.inquiry?.city?.trim()

  if (!reqClientName || !reqClientPhone || !reqEventType || !reqCity) {
    return NextResponse.json({ ok: false, error: 'Missing required booking fields' }, { status: 400 })
  }

  if (reqClientName.length > 200 || reqClientPhone.length > 30 || reqEventType.length > 200 || reqCity.length > 200) {
    return NextResponse.json({ ok: false, error: 'One or more fields exceed maximum length' }, { status: 400 })
  }

  const payload: BookingNotificationPayload = {
    artist: body.artist,
    client: body.client,
    inquiry: body.inquiry,
  }

  const supabase = getAdminSupabaseClient()
  const { data: artistRecord, error: artistFetchError } = await supabase
    .from('artist_profiles')
    .select('id, slug, stage_name, locality, city, state, pricing_start, users(full_name, phone_number, email), primary_category:categories(name), categories, custom_categories')
    .eq('id', body.artistId)
    .maybeSingle()

  if (artistFetchError) {
    console.error('[booking] artist lookup failed:', artistFetchError)
    return NextResponse.json(
      { ok: false, error: 'Failed to process your booking. Please try again.' },
      { status: 500 }
    )
  }

  if (!artistRecord) {
    return NextResponse.json({ ok: false, error: 'Artist not found' }, { status: 404 })
  }

  const artistProfile = artistRecord as PublicArtistRecord

  const artistPriceValue = parseMoney(artistProfile.pricing_start)
  const artistPriceDisplay = artistPriceValue === null ? null : formatMoney(artistPriceValue)

  let normalizedBooking: NormalizedBooking

  try {
    normalizedBooking = normalizeBookingPayload(body)
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Missing required booking fields' },
      { status: 400 }
    )
  }
  const resolvedArtist = mergeArtistContact(payload.artist, artistProfile, siteUrl)
  const normalizedPayload: BookingNotificationPayload = {
    ...payload,
    artist: resolvedArtist,
    inquiry: {
      ...payload.inquiry,
      eventType: normalizedBooking.eventType,
      customEventType: normalizedBooking.customEventType,
      eventSize: normalizedBooking.eventSize,
      eventDuration: normalizedBooking.eventDuration,
      venueType: normalizedBooking.venueType,
      eventDate: normalizedBooking.eventDate,
      city: normalizedBooking.city,
      artistPrice: artistPriceDisplay,
      clientOffer: normalizedBooking.clientOffer ? formatMoney(normalizedBooking.clientOffer) : null,
      additionalDetails: normalizedBooking.additionalDetails,
      budget: normalizedBooking.clientOffer ? formatMoney(normalizedBooking.clientOffer) : null,
      message: normalizedBooking.additionalDetails,
    },
  }

  const bookingRow = {
    client_name: normalizedBooking.clientName,
    client_phone: normalizedBooking.clientPhone,
    client_email: normalizedBooking.clientEmail ?? null,
    event_type: normalizedBooking.eventType,
    custom_event_type: normalizedBooking.customEventType ?? null,
    event_size: normalizedBooking.eventSize,
    event_duration: normalizedBooking.eventDuration,
    venue_type: normalizedBooking.venueType,
    event_date: normalizedBooking.eventDate ?? null,
    city: normalizedBooking.city,
    artist_price: artistPriceValue,
    client_offer: normalizedBooking.clientOffer,
    additional_details: normalizedBooking.additionalDetails ?? null,
    budget: normalizedBooking.clientOffer ? formatMoney(normalizedBooking.clientOffer) : null,
    message: normalizedBooking.additionalDetails ?? null,
  }

  const bookingInquiries = supabase.from('booking_inquiries') as unknown as {
    insert(values: Record<string, unknown>): Promise<{ error: { message?: string } | null }>
  }

  const { error: insertError } = await bookingInquiries.insert({
    artist_id: body.artistId,
    ...bookingRow,
    status: 'new',
  })

  if (insertError) {
    console.error('[booking] insert failed:', insertError)
    return NextResponse.json(
      { ok: false, error: 'Failed to process your booking. Please try again.' },
      { status: 500 }
    )
  }

  const results: Array<{ channel: string; status: 'sent' | 'skipped'; reason?: string }> = []
  const clientSummary = buildClientArtistSummary(normalizedPayload)
  const artistDetails = buildClientToArtistMessage(normalizedPayload)

  if (normalizedPayload.client.email) {
    const emailResult = await sendEmailIfConfigured({
      to: normalizedPayload.client.email,
      subject: `Artist details for ${normalizedPayload.artist.name}`,
      html: buildBrandedEmailTemplate({
        siteUrl,
        title: 'Artist details for your booking',
        intro: `Hi ${normalizedPayload.client.name},`,
        body: clientSummary,
        buttonText: 'View Artist Profile',
        buttonHref: normalizedPayload.artist.profileUrl ?? undefined,
        footerText: 'The artist will follow up with you shortly.',
        mascotPath: '/illustrations/feedback/success-star.svg',
      }),
    })
    results.push({
      channel: 'email-client',
      status: emailResult.skipped ? 'skipped' : 'sent',
      reason: emailResult.skipped ? emailResult.reason : undefined,
    })
  } else {
    results.push({
      channel: 'email-client',
      status: 'skipped',
      reason: 'Missing client email',
    })
  }

  if (normalizedPayload.artist.email) {
    const emailResult = await sendEmailIfConfigured({
      to: normalizedPayload.artist.email,
      subject: `New booking inquiry from ${normalizedPayload.client.name}`,
      html: buildBrandedEmailTemplate({
        siteUrl,
        title: 'New booking inquiry',
        intro: `Hi ${normalizedPayload.artist.name},`,
        body: artistDetails,
        buttonText: 'Open Dashboard',
        buttonHref: `${siteUrl}/artist-dashboard`,
        footerText: 'Please contact the client to continue the booking.',
        mascotPath: '/illustrations/feedback/loading-star.svg',
      }),
    })
    results.push({
      channel: 'email-artist',
      status: emailResult.skipped ? 'skipped' : 'sent',
      reason: emailResult.skipped ? emailResult.reason : undefined,
    })
  } else {
    results.push({
      channel: 'email-artist',
      status: 'skipped',
      reason: 'Missing artist email',
    })
  }

  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
  const twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM

  const clientPhone = normalizePhone(normalizedPayload.client.phone)
  const artistPhone = normalizePhone(normalizedPayload.artist.phone)

  if (twilioAccountSid && twilioAuthToken && twilioWhatsAppFrom && clientPhone) {
    try {
      await sendTwilioWhatsApp({
        accountSid: twilioAccountSid,
        authToken: twilioAuthToken,
        from: twilioWhatsAppFrom,
        to: `whatsapp:+${clientPhone}`,
        body: buildArtistToClientMessage(normalizedPayload),
      })
      results.push({ channel: 'whatsapp-client', status: 'sent' })
    } catch (err) {
      console.error('[booking] whatsapp-client failed:', err)
      results.push({ channel: 'whatsapp-client', status: 'skipped', reason: 'Twilio send failed' })
    }
  } else {
    results.push({
      channel: 'whatsapp-client',
      status: 'skipped',
      reason: 'Missing Twilio WhatsApp env vars or client phone',
    })
  }

  if (twilioAccountSid && twilioAuthToken && twilioWhatsAppFrom && artistPhone) {
    try {
      await sendTwilioWhatsApp({
        accountSid: twilioAccountSid,
        authToken: twilioAuthToken,
        from: twilioWhatsAppFrom,
        to: `whatsapp:+${artistPhone}`,
        body: artistDetails,
      })
      results.push({ channel: 'whatsapp-artist', status: 'sent' })
    } catch (err) {
      console.error('[booking] whatsapp-artist failed:', err)
      results.push({ channel: 'whatsapp-artist', status: 'skipped', reason: 'Twilio send failed' })
    }
  } else {
    results.push({
      channel: 'whatsapp-artist',
      status: 'skipped',
      reason: 'Missing Twilio WhatsApp env vars or artist phone',
    })
  }

  return NextResponse.json({ ok: true, results })
}

function mergeArtistContact(
  payloadArtist: BookingNotificationPayload['artist'],
  artistRecord: PublicArtistRecord,
  siteUrl: string
): BookingNotificationPayload['artist'] {
  const displayName = getArtistDisplayName(artistRecord)
  const profileUrl = new URL(getArtistPublicPath(artistRecord), siteUrl).toString()

  return {
    ...payloadArtist,
    name: displayName,
    phone: artistRecord.users?.phone_number ?? payloadArtist.phone ?? null,
    email: artistRecord.users?.email ?? payloadArtist.email ?? null,
    price: formatMoney(artistRecord.pricing_start) ?? payloadArtist.price ?? null,
    category:
      getArtistCategorySummary(
        compactStrings(artistRecord.categories),
        compactStrings(artistRecord.custom_categories)
      ) ||
      payloadArtist.category ||
      null,
    location: getArtistLocation(artistRecord) || payloadArtist.location || null,
    profileUrl: toAbsoluteUrl(profileUrl, siteUrl),
  }
}

type BookingSubmissionBody = {
  artistId?: string
  booking?: {
    client_name: string
    client_phone: string
    client_email?: string | null
    event_type: string
    custom_event_type?: string | null
    event_size: string
    event_duration: string
    venue_type: string
    event_date?: string | null
    city: string
    artist_price?: string | number | null
    client_offer?: string | number | null
    additional_details?: string | null
  }
  artist: BookingNotificationPayload['artist']
  client: BookingNotificationPayload['client']
  inquiry: BookingNotificationPayload['inquiry']
}

type NormalizedBooking = {
  clientName: string
  clientPhone: string
  clientEmail: string | null
  eventType: string
  customEventType: string | null
  eventSize: string
  eventDuration: string
  venueType: string
  eventDate: string | null
  city: string
  clientOffer: number | null
  additionalDetails: string | null
}

function normalizeBookingPayload(body: BookingSubmissionBody): NormalizedBooking {
  const booking = body.booking
  const clientName = booking?.client_name?.trim() ?? body.client?.name?.trim() ?? ''
  const clientPhone = booking?.client_phone?.trim() ?? body.client?.phone?.trim() ?? ''
  const clientEmail = booking?.client_email?.trim() ?? body.client?.email?.trim() ?? null
  const eventType = booking?.event_type?.trim() ?? body.inquiry?.eventType?.trim() ?? ''
  const customEventType = booking?.custom_event_type?.trim() || body.inquiry?.customEventType?.trim() || null
  const eventSize = booking?.event_size?.trim() ?? body.inquiry?.eventSize?.trim() ?? ''
  const eventDuration = booking?.event_duration?.trim() ?? body.inquiry?.eventDuration?.trim() ?? ''
  const venueType = booking?.venue_type?.trim() ?? body.inquiry?.venueType?.trim() ?? ''
  const eventDate = booking?.event_date?.trim() ?? body.inquiry?.eventDate?.trim() ?? null
  const city = booking?.city?.trim() ?? body.inquiry?.city?.trim() ?? ''
  const clientOffer = parseMoney(booking?.client_offer ?? body.inquiry?.clientOffer ?? null)
  const additionalDetails =
    booking?.additional_details?.trim() ||
    body.inquiry?.additionalDetails?.trim() ||
    body.inquiry?.message?.trim() ||
    null

  if (!clientName || !clientPhone || !eventType || !eventSize || !eventDuration || !venueType || !eventDate || !city) {
    throw new Error('Missing required booking fields')
  }

  if (eventType === 'Other' && !customEventType) {
    throw new Error('Custom event type is required when Event Type is Other')
  }

  return {
    clientName,
    clientPhone,
    clientEmail,
    eventType,
    customEventType: eventType === 'Other' ? customEventType : null,
    eventSize,
    eventDuration,
    venueType,
    eventDate,
    city,
    clientOffer,
    additionalDetails,
  }
}

function toAbsoluteUrl(value?: string | null, base?: string) {
  if (!value) return null

  try {
    return new URL(value, base).toString()
  } catch {
    return value
  }
}
