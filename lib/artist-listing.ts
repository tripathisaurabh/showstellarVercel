import { createClient } from '@/lib/supabase/server'
import { hasPublicSupabaseConfig } from '@/lib/supabase/config'
import {
  artistMatchesCategory,
  normalizeArtistCategoryLabel,
} from '@/lib/artist-categories'
import {
  getArtistCategories,
  getArtistDisplayName,
  getArtistExperienceText,
  getArtistLocation,
  getArtistSummaryLine,
  type PublicArtistRecord,
} from '@/lib/artist-profile'

type MaybeString = string | null | undefined

export const DEFAULT_ARTIST_LISTING_LIMIT = 12
export const MAX_ARTIST_LISTING_LIMIT = 24

export type ArtistListingSort = 'featured' | 'newest' | 'rating' | 'experience'

export type PaginatedArtistListing = {
  items: PublicArtistRecord[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

export type ArtistListingQuery = {
  page?: number
  limit?: number
  city?: MaybeString
  category?: MaybeString
  categoryValues?: MaybeString[]
  q?: MaybeString
  sort?: ArtistListingSort
}

const FALLBACK_NAME = 'Artist profile'
const FALLBACK_PRICE = 'Contact for price'
const FALLBACK_CATEGORY = 'Updating soon'
const FALLBACK_LOCATION = 'Updating soon'
const FALLBACK_EXPERIENCE = 'Updating soon'
const FALLBACK_BIO = 'Updating soon'

const trim = (value?: MaybeString) => value?.trim() ?? ''

function clampInt(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.floor(value), min), max)
}

function sanitizeQuery(value?: MaybeString) {
  return trim(value)
    .replace(/[,%()*{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeArtistListingPage(value?: string | number | null) {
  const raw = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(Number(raw)) || Number(raw) < 1) return 1
  return Math.floor(Number(raw))
}

export function normalizeArtistListingLimit(value?: string | number | null) {
  const raw = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(Number(raw)) || Number(raw) < 1) return DEFAULT_ARTIST_LISTING_LIMIT
  return clampInt(Number(raw), 1, MAX_ARTIST_LISTING_LIMIT)
}

export function buildPaginatedListingHref(
  pathname: string,
  current: Record<string, string | undefined>,
  page: number
) {
  const params = new URLSearchParams()

  const q = trim(current.q)
  const category = trim(current.category)
  const city = trim(current.city)

  if (q) params.set('q', q)
  if (category) params.set('category', category)
  if (city) params.set('city', city)
  if (page > 1) params.set('page', String(page))

  const qs = params.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

export function buildPaginatedCanonicalPath(
  pathname: string,
  current: Record<string, string | undefined>,
  page: number
) {
  return buildPaginatedListingHref(pathname, current, page)
}

export function buildPaginatedTitle(baseTitle: string, page: number) {
  return page > 1 ? `${baseTitle} - Page ${page} | ShowStellar` : `${baseTitle} | ShowStellar`
}

export function buildPaginatedDescription(baseDescription: string, page: number) {
  return page > 1 ? `${baseDescription} Page ${page}.` : baseDescription
}

function getCurrentCategoryLabel(artist: PublicArtistRecord) {
  const categories = getArtistCategories(artist).combined.map(value => trim(value)).filter(Boolean)
  if (categories.length === 0) return FALLBACK_CATEGORY

  const visible = categories.slice(0, 2)
  const extra = categories.length - visible.length
  return extra > 0 ? `${visible.join(', ')} +${extra}` : visible.join(', ')
}

function getCurrentPriceLabel(value?: number | string | null) {
  const price = value != null ? Number(value) : null
  if (price === null || Number.isNaN(price) || price <= 0) return FALLBACK_PRICE
  return `₹${price.toLocaleString()}`
}

function getCurrentLocationLabel(artist: PublicArtistRecord) {
  return trim(getArtistLocation(artist) || artist.city) || FALLBACK_LOCATION
}

function getCurrentExperienceLabel(artist: PublicArtistRecord) {
  return getArtistExperienceText(artist) || FALLBACK_EXPERIENCE
}

function getCurrentBioLabel(artist: PublicArtistRecord) {
  return trim(artist.bio) || getArtistSummaryLine(artist) || FALLBACK_BIO
}

export function getArtistListingDisplayData(artist: PublicArtistRecord) {
  const displayName = trim(getArtistDisplayName(artist)) || FALLBACK_NAME

  return {
    displayName,
    priceText: getCurrentPriceLabel(artist.pricing_start),
    categoryText: getCurrentCategoryLabel(artist),
    locationText: getCurrentLocationLabel(artist),
    experienceText: getCurrentExperienceLabel(artist),
    bioText: getCurrentBioLabel(artist),
    imageUrl: artist.profile_image_cropped ?? artist.profile_image ?? null,
    isFeatured: !!artist.is_featured,
    href: artist.slug ? `/artist/${artist.slug}` : `/artist/${artist.id}`,
  }
}

export function getArtistListingCardCategories(artist: PublicArtistRecord) {
  return getArtistCategories(artist).combined
}

export function artistMatchesListingCategory(artist: PublicArtistRecord, category?: MaybeString) {
  const normalized = normalizeArtistCategoryLabel(category)
  if (!trim(normalized)) return true

  return artistMatchesCategory(
    {
      categories: artist.categories,
      custom_categories: artist.custom_categories,
      primaryCategory: artist.primary_category?.name ?? null,
    },
    normalized
  )
}

type ListingRow = {
  id: string
  slug?: MaybeString
  stage_name?: MaybeString
  locality?: MaybeString
  city?: MaybeString
  state?: MaybeString
  bio?: MaybeString
  performance_style?: MaybeString
  event_types?: MaybeString
  languages_spoken?: MaybeString
  pricing_start?: number | string | null
  profile_image?: MaybeString
  profile_image_cropped?: MaybeString
  profile_image_original?: MaybeString
  is_featured?: boolean | null
  approval_status?: MaybeString
  rating?: number | string | null
  experience_years?: number | null
  category_id?: string | null
  categories?: Array<MaybeString> | null
  custom_categories?: Array<MaybeString> | null
  created_at?: MaybeString
  users?: {
    full_name?: MaybeString
  } | null
  primary_category?: {
    name?: MaybeString
  } | null
}

function buildListingQuery(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase
    .from('artist_profiles')
    .select(
      'id, slug, stage_name, locality, city, state, bio, performance_style, event_types, languages_spoken, pricing_start, profile_image, profile_image_cropped, profile_image_original, is_featured, approval_status, rating, experience_years, category_id, categories, custom_categories, created_at, users(full_name), primary_category:categories(name)',
      { count: 'exact' }
    )
    .eq('approval_status', 'approved')
}

function applyListingFilters(
  query: ReturnType<typeof buildListingQuery>,
  filters: ArtistListingQuery
) {
  const city = trim(filters.city)
  const category = trim(filters.category)
  const categoryValues = (filters.categoryValues ?? []).map(trim).filter(Boolean)
  const q = sanitizeQuery(filters.q)

  if (city) {
    query = query.or(`city.ilike.%${city}%,locality.ilike.%${city}%,state.ilike.%${city}%`)
  }

  const categoryFilters = categoryValues.length > 0
    ? categoryValues.map(value => normalizeArtistCategoryLabel(value)).filter(Boolean)
    : category
      ? [normalizeArtistCategoryLabel(category)].filter(Boolean)
      : []

  if (categoryFilters.length > 0) {
    query = query.or(
      categoryFilters
        .map(value => `categories.cs.{${value}},custom_categories.cs.{${value}}`)
        .join(',')
    )
  }

  if (q) {
    const qCategory = normalizeArtistCategoryLabel(q)
    const textFilters = [
      `stage_name.ilike.%${q}%`,
      `bio.ilike.%${q}%`,
      `city.ilike.%${q}%`,
      `locality.ilike.%${q}%`,
      `state.ilike.%${q}%`,
      `slug.ilike.%${q}%`,
      `categories.cs.{${qCategory}}`,
      `custom_categories.cs.{${qCategory}}`,
    ]

    query = query.or(textFilters.join(','))
  }

  return query
}

function applyListingOrdering(
  query: ReturnType<typeof buildListingQuery>,
  sort: ArtistListingSort
) {
  if (sort === 'newest') {
    return query.order('created_at', { ascending: false })
  }

  if (sort === 'rating') {
    return query.order('rating', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })
  }

  if (sort === 'experience') {
    return query.order('experience_years', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })
  }

  return query
    .order('is_featured', { ascending: false, nullsFirst: false })
    .order('rating', { ascending: false, nullsFirst: false })
    .order('experience_years', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
}

function mapListingRowToArtist(row: ListingRow): PublicArtistRecord {
  return {
    id: row.id,
    slug: row.slug,
    stage_name: row.stage_name,
    locality: row.locality,
    city: row.city,
    state: row.state,
    bio: row.bio,
    performance_style: row.performance_style,
    event_types: row.event_types,
    languages_spoken: row.languages_spoken,
    pricing_start: row.pricing_start,
    profile_image: row.profile_image,
    profile_image_cropped: row.profile_image_cropped,
    profile_image_original: row.profile_image_original,
    is_featured: row.is_featured,
    approval_status: row.approval_status,
    rating: row.rating,
    experience_years: row.experience_years,
    category_id: row.category_id,
    categories: row.categories,
    custom_categories: row.custom_categories,
    created_at: row.created_at,
    users: row.users
      ? {
          full_name: row.users.full_name,
        }
      : undefined,
    primary_category: row.primary_category
      ? {
          name: row.primary_category.name,
        }
      : undefined,
  }
}

export async function fetchPaginatedArtistListings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: ArtistListingQuery
): Promise<PaginatedArtistListing> {
  const page = Math.max(1, Math.floor(filters.page ?? 1))
  const limit = clampInt(filters.limit ?? DEFAULT_ARTIST_LISTING_LIMIT, 1, MAX_ARTIST_LISTING_LIMIT)
  const offset = (page - 1) * limit

  if (!hasPublicSupabaseConfig()) {
    return { items: [], total: 0, page, limit, totalPages: 0, hasMore: false }
  }

  const query = applyListingOrdering(
    applyListingFilters(buildListingQuery(supabase), filters),
    filters.sort ?? 'featured'
  ).range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('[artist-listing] query failed:', error)
    return { items: [], total: 0, page, limit, totalPages: 0, hasMore: false }
  }

  const items = ((data ?? []) as ListingRow[])
    .map(mapListingRowToArtist)
    .filter(artist => artistMatchesListingCategory(artist, filters.category))

  const total = count ?? items.length
  const totalPages = total > 0 ? Math.max(1, Math.ceil(total / limit)) : 0

  return {
    items,
    total,
    page,
    limit,
    totalPages,
    hasMore: totalPages > 0 ? page < totalPages : false,
  }
}
