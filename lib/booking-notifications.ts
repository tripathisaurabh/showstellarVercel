export type BookingNotificationPayload = {
  artist: {
    name: string
    phone?: string | null
    email?: string | null
    category?: string | null
    location?: string | null
    price?: string | null
    profileUrl?: string | null
    performanceStyle?: string | null
    eventTypes?: string | null
    languages?: string | null
  }
  client: {
    name: string
    phone: string
    email?: string | null
  }
  inquiry: {
    eventType: string
    customEventType?: string | null
    eventSize?: string | null
    eventDuration?: string | null
    venueType?: string | null
    eventDate?: string | null
    city?: string | null
    artistPrice?: string | null
    clientOffer?: string | null
    additionalDetails?: string | null
    budget?: string | null
    message?: string | null
  }
}

const stripPhone = (value?: string | null) => value?.replace(/[^\d]/g, '') ?? ''

export function buildWhatsAppUrl(phone?: string | null, message?: string | null) {
  const normalized = stripPhone(phone)
  if (!normalized) return ''
  const text = encodeURIComponent(message ?? '')
  return `https://wa.me/${normalized}${text ? `?text=${text}` : ''}`
}

export function buildMailtoUrl(email?: string | null, subject?: string | null, body?: string | null) {
  if (!email) return ''
  const params = new URLSearchParams()
  if (subject) params.set('subject', subject)
  if (body) params.set('body', body)
  const query = params.toString()
  return `mailto:${email}${query ? `?${query}` : ''}`
}

function joinLines(lines: Array<string | null | undefined>) {
  return lines.filter(Boolean).join('\n')
}

export function buildArtistToClientMessage(payload: BookingNotificationPayload) {
  const { artist, client } = payload
  const artistPriceLine = artist.price ?? 'Price not listed for this artist yet'

  return joinLines([
    `Hello ${client.name},`,
    '',
    `Thanks for reaching out. Here are the artist details for your booking.`,
    '',
    `Artist: ${artist.name}`,
    artist.category ? `Category: ${artist.category}` : null,
    artist.location ? `Location: ${artist.location}` : null,
    artist.phone ? `Phone: ${artist.phone}` : null,
    artist.email ? `Email: ${artist.email}` : null,
    `Starting from: ${artistPriceLine}`,
    artist.performanceStyle ? `Performance style: ${artist.performanceStyle}` : null,
    artist.eventTypes ? `Event types: ${artist.eventTypes}` : null,
    artist.languages ? `Languages: ${artist.languages}` : null,
    artist.profileUrl ? `Profile: ${artist.profileUrl}` : null,
    '',
    'The artist will follow up with you shortly.',
  ])
}

export function buildClientToArtistMessage(payload: BookingNotificationPayload) {
  const { artist, client, inquiry } = payload
  const artistPriceLine = inquiry.artistPrice ?? 'Not listed'

  return joinLines([
    `Hello ${artist.name},`,
    '',
    `You have a new booking inquiry on ShowStellar from ${client.name}.`,
    '',
    `Client: ${client.name}`,
    `Phone: ${client.phone}`,
    client.email ? `Email: ${client.email}` : null,
    '',
    `Event: ${inquiry.eventType}`,
    inquiry.customEventType ? `Custom event type: ${inquiry.customEventType}` : null,
    inquiry.eventSize ? `Event size: ${inquiry.eventSize}` : null,
    inquiry.eventDuration ? `Duration: ${inquiry.eventDuration}` : null,
    inquiry.venueType ? `Venue: ${inquiry.venueType}` : null,
    inquiry.eventDate ? `Date: ${inquiry.eventDate}` : null,
    inquiry.city ? `City: ${inquiry.city}` : null,
    `Artist price: ${artistPriceLine}`,
    inquiry.clientOffer ? `Client offer: ${inquiry.clientOffer}` : null,
    inquiry.additionalDetails ? `Additional details: ${inquiry.additionalDetails}` : null,
    inquiry.message ? `Message: ${inquiry.message}` : null,
    '',
    'Please contact the client to continue the booking.',
  ])
}

export function buildClientArtistSummary(payload: BookingNotificationPayload) {
  const { artist } = payload
  const artistPriceLine = artist.price ?? 'Price not listed for this artist yet'

  return joinLines([
    `Artist: ${artist.name}`,
    artist.category ? `Category: ${artist.category}` : null,
    artist.location ? `Location: ${artist.location}` : null,
    artist.phone ? `Phone: ${artist.phone}` : null,
    artist.email ? `Email: ${artist.email}` : null,
    `Starting from: ${artistPriceLine}`,
    artist.performanceStyle ? `Performance style: ${artist.performanceStyle}` : null,
    artist.eventTypes ? `Event types: ${artist.eventTypes}` : null,
    artist.languages ? `Languages: ${artist.languages}` : null,
    artist.profileUrl ? `Profile: ${artist.profileUrl}` : null,
  ])
}

export function buildArtistInquirySummary(payload: BookingNotificationPayload) {
  const { client, inquiry } = payload
  const artistPriceLine = inquiry.artistPrice ?? 'Not listed'

  return joinLines([
    `Client: ${client.name}`,
    `Phone: ${client.phone}`,
    client.email ? `Email: ${client.email}` : null,
    '',
    `Event: ${inquiry.eventType}`,
    inquiry.customEventType ? `Custom event type: ${inquiry.customEventType}` : null,
    inquiry.eventSize ? `Event size: ${inquiry.eventSize}` : null,
    inquiry.eventDuration ? `Duration: ${inquiry.eventDuration}` : null,
    inquiry.venueType ? `Venue: ${inquiry.venueType}` : null,
    inquiry.eventDate ? `Date: ${inquiry.eventDate}` : null,
    inquiry.city ? `City: ${inquiry.city}` : null,
    `Artist price: ${artistPriceLine}`,
    inquiry.clientOffer ? `Client offer: ${inquiry.clientOffer}` : null,
    inquiry.additionalDetails ? `Additional details: ${inquiry.additionalDetails}` : null,
    inquiry.message ? `Message: ${inquiry.message}` : null,
  ])
}
