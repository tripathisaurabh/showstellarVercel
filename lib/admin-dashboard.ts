import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import {
  getArtistCategories,
  getArtistDisplayName,
  getArtistLocation,
  getArtistPublicPath,
  type PublicArtistRecord,
} from '@/lib/artist-profile'

type AuthUserRecord = {
  id: string
  email: string | null
  email_confirmed_at: string | null
  created_at?: string | null
}

function parseMoney(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null

  const cleaned = value.replace(/[^\d.]/g, '').trim()
  if (!cleaned) return null

  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function formatMoney(value: string | number | null | undefined) {
  const amount = parseMoney(value)
  if (amount === null) return '—'

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

export type AdminArtistRow = PublicArtistRecord & {
  users?: {
    id?: string
    full_name?: string | null
    phone_number?: string | null
    email?: string | null
    created_at?: string | null
  } | null
  created_at?: string | null
  email_confirmed_at?: string | null
  email_verified?: boolean
  inquiry_count?: number
  categories?: Array<string | null> | null
  custom_categories?: Array<string | null> | null
  primary_category?: {
    name?: string | null
  } | null
}

export type AdminInquiryRow = {
  id: string
  artist_id: string
  client_name: string | null
  client_phone: string | null
  client_email: string | null
  event_type: string | null
  custom_event_type?: string | null
  event_size?: string | null
  event_duration?: string | null
  venue_type?: string | null
  event_date: string | null
  city: string | null
  artist_price?: string | number | null
  client_offer?: string | number | null
  additional_details?: string | null
  budget: string | null
  message: string | null
  status: string
  created_at?: string | null
  artist_profiles?: AdminArtistRow | null
}

export type AdminArtistCard = {
  id: string
  userId: string | null
  slug: string | null
  displayName: string
  fullName: string | null
  categoryName: string
  categoryNames: string[]
  customCategories: string[]
  categorySummary: string
  city: string
  location: string
  email: string
  phoneNumber: string
  locality: string
  state: string
  preferredWorkingLocations: string
  approvalStatus: 'draft' | 'pending' | 'approved' | 'rejected'
  isFeatured: boolean
  emailVerified: boolean
  emailConfirmedAt: string | null
  inquiryCount: number
  createdAt: string | null
  updatedAt: string | null
  publicProfilePath: string
  bio: string | null
  pricingStart: number | string | null
  stageName: string | null
  profileImage: string | null
  performanceStyle: string | null
  eventTypes: string | null
  languagesSpoken: string | null
  mediaCount: number
  rating: number | null
  experienceYears: number | null
}

export type AdminInquiryCard = {
  id: string
  artistId: string
  artistName: string
  artistSlug: string | null
  artistApprovalStatus: 'draft' | 'pending' | 'approved' | 'rejected'
  artistEmailVerified: boolean
  artistIsFeatured: boolean
  artistPublicPath: string
  artistCategoryName: string
  artistCategoryNames: string[]
  artistCustomCategories: string[]
  artistCategorySummary: string
  artistCity: string
  clientName: string
  clientPhone: string
  clientEmail: string
  eventType: string
  customEventType: string | null
  eventSize: string
  eventDuration: string
  venueType: string
  eventDate: string | null
  city: string
  artistPrice: string
  clientOffer: string
  additionalDetails: string
  budget: string
  message: string
  status: string
  createdAt: string | null
}

export type AdminDashboardMetrics = {
  totalArtists: number
  approvedArtists: number
  draftArtists: number
  rejectedArtists: number
  unverifiedArtists: number
  featuredArtists: number
  totalBookingInquiries: number
  newInquiries: number
}

export type AdminDashboardData = {
  artists: AdminArtistCard[]
  inquiries: AdminInquiryCard[]
  metrics: AdminDashboardMetrics
  categories: string[]
  cities: string[]
}

export type AdminArtistDetailData = {
  artist: AdminArtistCard & {
    media: Array<{
      id: string
      media_url: string
      type: 'image' | 'video'
    }>
  }
  inquiries: AdminInquiryCard[]
}

export type AdminInquiryDetailData = {
  inquiry: AdminInquiryCard & {
    artist: AdminArtistCard & {
      media: Array<{
        id: string
        media_url: string
        type: 'image' | 'video'
      }>
    }
  }
}

type VerificationMap = Map<string, AuthUserRecord>

async function fetchVerificationMap(adminClient: ReturnType<typeof getAdminSupabaseClient>) {
  const map: VerificationMap = new Map()
  let page = 1

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 })

    if (error) {
      console.error('[admin-dashboard] auth user lookup failed:', error)
      break
    }

    const users = data?.users ?? []
    for (const user of users as AuthUserRecord[]) {
      if (user.email) {
        map.set(user.email.toLowerCase(), user)
      }
    }

    if (!data?.nextPage) break
    page = data.nextPage
  }

  return map
}

function normalizeStatus(value: string | null | undefined): 'draft' | 'pending' | 'approved' | 'rejected' {
  if (value === 'pending' || value === 'approved' || value === 'rejected') return value
  return 'draft'
}

function buildArtistCard(
  row: AdminArtistRow,
  verificationMap: VerificationMap,
  inquiryCounts: Map<string, number>
): AdminArtistCard {
  const email = row.users?.email?.trim().toLowerCase() ?? ''
  const authRecord = email ? verificationMap.get(email) ?? null : null
  const categoryData = getArtistCategories(row)

  return {
    id: row.id,
    userId: row.users?.id ?? null,
    slug: row.slug ?? null,
    displayName: getArtistDisplayName(row),
    fullName: row.users?.full_name ?? null,
    categoryName: categoryData.primary,
    categoryNames: categoryData.combined,
    customCategories: categoryData.custom,
    categorySummary: categoryData.summary,
    city: row.city ?? '',
    locality: row.locality ?? '',
    state: row.state ?? '',
    preferredWorkingLocations: row.preferred_working_locations ?? '',
    location: getArtistLocation(row),
    email: row.users?.email ?? '',
    phoneNumber: row.users?.phone_number ?? '',
    approvalStatus: normalizeStatus(row.approval_status),
    isFeatured: !!row.is_featured,
    emailVerified: !!authRecord?.email_confirmed_at,
    emailConfirmedAt: authRecord?.email_confirmed_at ?? null,
    inquiryCount: inquiryCounts.get(row.id) ?? 0,
    createdAt: row.created_at ?? null,
    updatedAt: row.created_at ?? null,
    publicProfilePath: getArtistPublicPath(row),
    bio: row.bio ?? null,
    pricingStart: row.pricing_start ?? null,
    stageName: row.stage_name ?? null,
    profileImage: row.profile_image_cropped ?? row.profile_image ?? null,
    performanceStyle: row.performance_style ?? null,
    eventTypes: row.event_types ?? null,
    languagesSpoken: row.languages_spoken ?? null,
    mediaCount: row.artist_media?.length ?? 0,
    rating: row.rating != null ? Number(row.rating) : null,
    experienceYears: row.experience_years != null ? Number(row.experience_years) : null,
  }
}

function buildInquiryCard(
  row: AdminInquiryRow,
  verificationMap: VerificationMap
): AdminInquiryCard {
  const artist = row.artist_profiles ?? null
  const email = artist?.users?.email?.trim().toLowerCase() ?? ''
  const authRecord = email ? verificationMap.get(email) ?? null : null
  const artistName = artist ? getArtistDisplayName(artist) : 'Artist'
  const artistCategoryData = artist ? getArtistCategories(artist) : null

  return {
    id: row.id,
    artistId: row.artist_id,
    artistName,
    artistSlug: artist?.slug ?? null,
    artistApprovalStatus: normalizeStatus(artist?.approval_status),
    artistEmailVerified: !!authRecord?.email_confirmed_at,
    artistIsFeatured: !!artist?.is_featured,
    artistPublicPath: artist ? getArtistPublicPath(artist) : `/artist/${row.artist_id}`,
    artistCategoryName: artistCategoryData?.primary ?? 'Uncategorized',
    artistCategoryNames: artistCategoryData?.combined ?? [],
    artistCustomCategories: artistCategoryData?.custom ?? [],
    artistCategorySummary: artistCategoryData?.summary ?? 'Uncategorized',
    artistCity: artist?.city ?? '',
    clientName: row.client_name ?? '',
    clientPhone: row.client_phone ?? '',
    clientEmail: row.client_email ?? '',
    eventType: row.event_type ?? '',
    customEventType: row.custom_event_type ?? null,
    eventSize: row.event_size ?? '',
    eventDuration: row.event_duration ?? '',
    venueType: row.venue_type ?? '',
    eventDate: row.event_date ?? null,
    city: row.city ?? '',
    artistPrice: formatMoney(row.artist_price ?? artist?.pricing_start),
    clientOffer: formatMoney(row.client_offer ?? row.budget),
    additionalDetails: row.additional_details ?? '',
    budget: row.budget ?? '',
    message: row.message ?? '',
    status: row.status,
    createdAt: row.created_at ?? null,
  }
}

export async function loadAdminDashboardData() {
  const adminClient = getAdminSupabaseClient()
  const verificationMap = await fetchVerificationMap(adminClient)

  const [artistsResult, inquiriesResult] = await Promise.all([
    adminClient
      .from('artist_profiles')
      .select('id, slug, stage_name, category_id, locality, city, state, preferred_working_locations, bio, performance_style, event_types, languages_spoken, pricing_start, profile_image, profile_image_cropped, profile_image_original, is_featured, approval_status, created_at, users(id, full_name, phone_number, email, created_at), primary_category:categories(name), categories, custom_categories, artist_media(id)')
      .order('created_at', { ascending: false }),
    adminClient
      .from('booking_inquiries')
      .select('id, artist_id, client_name, client_phone, client_email, event_type, custom_event_type, event_size, event_duration, venue_type, event_date, city, artist_price, client_offer, additional_details, budget, message, status, created_at, artist_profiles(id, slug, stage_name, pricing_start, approval_status, is_featured, city, preferred_working_locations, created_at, users(id, full_name, phone_number, email, created_at), primary_category:categories(name), categories, custom_categories)')
      .order('created_at', { ascending: false }),
  ])

  if (artistsResult.error) {
    throw artistsResult.error
  }

  if (inquiriesResult.error) {
    throw inquiriesResult.error
  }

  const artistRows = ((artistsResult.data ?? []) as AdminArtistRow[]).map(row =>
    buildArtistCard(row, verificationMap, new Map())
  )

  const inquiryRowsRaw = (inquiriesResult.data ?? []) as AdminInquiryRow[]
  const inquiryCounts = new Map<string, number>()
  for (const row of inquiryRowsRaw) {
    inquiryCounts.set(row.artist_id, (inquiryCounts.get(row.artist_id) ?? 0) + 1)
  }

  const artists = artistRows.map(artist => ({
    ...artist,
    inquiryCount: inquiryCounts.get(artist.id) ?? 0,
  }))

  const inquiries = inquiryRowsRaw.map(row => buildInquiryCard(row, verificationMap))

  const metrics: AdminDashboardMetrics = {
    totalArtists: artists.length,
    approvedArtists: artists.filter(artist => artist.approvalStatus === 'approved').length,
    draftArtists: artists.filter(artist => artist.approvalStatus === 'draft').length,
    rejectedArtists: artists.filter(artist => artist.approvalStatus === 'rejected').length,
    unverifiedArtists: artists.filter(artist => !artist.emailVerified).length,
    featuredArtists: artists.filter(artist => artist.isFeatured).length,
    totalBookingInquiries: inquiries.length,
    newInquiries: inquiries.filter(inquiry => inquiry.status === 'new').length,
  }

  return {
    artists,
    inquiries,
    metrics,
    categories: Array.from(new Set(artists.flatMap(artist => [...artist.categoryNames, ...artist.customCategories]).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    ),
    cities: Array.from(new Set(artists.map(artist => artist.city).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    ),
  } satisfies AdminDashboardData
}

export async function loadAdminArtistDetail(artistId: string) {
  const adminClient = getAdminSupabaseClient()
  const verificationMap = await fetchVerificationMap(adminClient)

  const { data: artistData, error: artistError } = await adminClient
    .from('artist_profiles')
    .select('id, slug, stage_name, category_id, locality, city, state, preferred_working_locations, bio, performance_style, event_types, languages_spoken, pricing_start, profile_image, profile_image_cropped, profile_image_original, is_featured, approval_status, created_at, users(id, full_name, phone_number, email, created_at), primary_category:categories(name), categories, custom_categories, artist_media(id, media_url, type)')
    .eq('id', artistId)
    .maybeSingle()

  if (artistError) {
    throw artistError
  }

  if (!artistData) {
    return null
  }

  const { data: inquiriesData, error: inquiriesError } = await adminClient
    .from('booking_inquiries')
    .select('id, artist_id, client_name, client_phone, client_email, event_type, custom_event_type, event_size, event_duration, venue_type, event_date, city, artist_price, client_offer, additional_details, budget, message, status, created_at, artist_profiles(id, slug, stage_name, pricing_start, approval_status, is_featured, city, preferred_working_locations, profile_image, profile_image_cropped, profile_image_original, created_at, users(id, full_name, phone_number, email, created_at), primary_category:categories(name), categories, custom_categories)')
    .eq('artist_id', artistId)
    .order('created_at', { ascending: false })

  if (inquiriesError) {
    throw inquiriesError
  }

  const artist = buildArtistCard(artistData as AdminArtistRow, verificationMap, new Map())
  const inquiries = (inquiriesData ?? []).map(row => buildInquiryCard(row as AdminInquiryRow, verificationMap))

  return {
    artist: {
      ...artist,
      media: (artistData as AdminArtistRow).artist_media ?? [],
      inquiryCount: inquiries.length,
    },
    inquiries,
  } satisfies AdminArtistDetailData
}

export async function loadAdminInquiryDetail(inquiryId: string) {
  const adminClient = getAdminSupabaseClient()
  const verificationMap = await fetchVerificationMap(adminClient)

  const { data: inquiryData, error } = await adminClient
    .from('booking_inquiries')
    .select('id, artist_id, client_name, client_phone, client_email, event_type, custom_event_type, event_size, event_duration, venue_type, event_date, city, artist_price, client_offer, additional_details, budget, message, status, created_at, artist_profiles(id, slug, stage_name, pricing_start, approval_status, is_featured, city, preferred_working_locations, profile_image, profile_image_cropped, profile_image_original, created_at, users(id, full_name, phone_number, email, created_at), primary_category:categories(name), categories, custom_categories, artist_media(id, media_url, type))')
    .eq('id', inquiryId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!inquiryData) {
    return null
  }

  const inquiry = buildInquiryCard(inquiryData as AdminInquiryRow, verificationMap)
  const artistData = (inquiryData as AdminInquiryRow).artist_profiles

  if (!artistData) {
    return null
  }

  const artist = buildArtistCard(artistData as AdminArtistRow, verificationMap, new Map())

  return {
    inquiry: {
      ...inquiry,
      artist: {
        ...artist,
        media: (artistData as AdminArtistRow).artist_media ?? [],
      },
    },
  } satisfies AdminInquiryDetailData
}

export function filterAdminArtists(
  artists: AdminArtistCard[],
  filters: {
    q?: string
    category?: string
    city?: string
    approval?: string
    verification?: string
    featured?: string
  }
) {
  const q = filters.q?.trim().toLowerCase() ?? ''
  const category = filters.category?.trim().toLowerCase() ?? ''
  const city = filters.city?.trim().toLowerCase() ?? ''
  const approval = filters.approval?.trim().toLowerCase() ?? ''
  const verification = filters.verification?.trim().toLowerCase() ?? ''
  const featured = filters.featured?.trim().toLowerCase() ?? ''

  return artists.filter(artist => {
    const haystack = [
      artist.displayName,
      artist.email,
      artist.phoneNumber,
      artist.categoryName,
      artist.categorySummary,
      ...artist.categoryNames,
      ...artist.customCategories,
      artist.city,
      artist.location,
      artist.preferredWorkingLocations,
    ]
      .join(' ')
      .toLowerCase()

    if (q && !haystack.includes(q)) return false
    if (category && !artist.categoryNames.some(item => item.toLowerCase() === category) && !artist.customCategories.some(item => item.toLowerCase() === category)) return false
    if (city && artist.city.toLowerCase() !== city) return false
    if (approval && artist.approvalStatus !== approval) return false
    if (verification === 'verified' && !artist.emailVerified) return false
    if (verification === 'unverified' && artist.emailVerified) return false
    if (featured === 'featured' && !artist.isFeatured) return false
    if (featured === 'not_featured' && artist.isFeatured) return false

    return true
  })
}
