import {
  combineArtistCategories,
} from '@/lib/artist-categories'

type MaybeString = string | null | undefined

export type PublicArtistRecord = {
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
    phone_number?: MaybeString
    email?: MaybeString
  } | null
  primary_category?: {
    name?: MaybeString
  } | null
  artist_media?: Array<{
    id: string
    media_url: string
    type: 'image' | 'video'
  }>
}

const trim = (value: MaybeString) => value?.trim() ?? ''

export function slugifyArtistName(value: string) {
  return trim(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function splitArtistTextList(value: MaybeString) {
  if (!value) return []
  return value
    .split(/[\n,|]/g)
    .map(item => item.trim())
    .filter(Boolean)
}

export function splitArtistParagraphs(value: MaybeString) {
  if (!value) return []
  return value
    .split(/\n+/g)
    .map(item => item.trim())
    .filter(Boolean)
}

export function getArtistDisplayName(artist: PublicArtistRecord) {
  const username = trim((artist as PublicArtistRecord & { username?: MaybeString }).username)

  return (
    trim(artist.stage_name) ||
    trim(artist.users?.full_name) ||
    username ||
    trim(artist.slug) ||
    'ShowStellar Artist'
  )
}

export function getArtistInitials(artist: PublicArtistRecord) {
  const name = getArtistDisplayName(artist)
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0] ?? '')
    .join('')
    .toUpperCase()

  return initials || 'SS'
}

export function getArtistLocation(artist: PublicArtistRecord) {
  const parts = [artist.locality, artist.city, artist.state]
    .map(trim)
    .filter(Boolean)

  const deduped: string[] = []
  for (const part of parts) {
    if (!deduped.includes(part)) deduped.push(part)
  }

  return deduped.join(', ')
}

export function getArtistCategories(artist: PublicArtistRecord) {
  const categoryData = combineArtistCategories({
    categories: artist.categories,
    custom_categories: artist.custom_categories,
    primaryCategory: artist.primary_category?.name ?? null,
  })

  return {
    predefined: categoryData.categories,
    custom: categoryData.customCategories,
    combined: categoryData.combined,
    primary: categoryData.primaryCategory || 'Artist',
    summary: categoryData.summary || 'Artist',
  }
}

export function getArtistPrimaryCategory(artist: PublicArtistRecord) {
  return getArtistCategories(artist).primary
}

export function getArtistCategorySummary(artist: PublicArtistRecord) {
  return getArtistCategories(artist).summary
}

export function getArtistPublicPath(artist: PublicArtistRecord) {
  return artist.slug ? `/artist/${artist.slug}` : `/artist/${artist.id}`
}

export function getArtistSummaryLine(artist: PublicArtistRecord) {
  const category = trim(getArtistPrimaryCategory(artist))
  const location = getArtistLocation(artist)
  const eventTypes = splitArtistTextList(artist.event_types)

  const locationPart = location ? `Based in ${location}.` : ''
  const eventPart = eventTypes.length ? `Available for ${eventTypes.slice(0, 2).join(' and ').toLowerCase()}.` : ''
  const fallback = category ? `${category} available for bookings.` : 'Available for bookings.'

  if (locationPart && eventPart) return `${locationPart} ${eventPart}`
  if (locationPart) return locationPart
  if (eventPart) return eventPart
  return fallback
}

export async function ensureUniqueArtistSlug(
  supabase: {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{ data: { id: string } | null; error: unknown }>
        }
      }
    }
  },
  baseName: string,
  currentId?: string
) {
  const baseSlug = slugifyArtistName(baseName) || 'showstellar-artist'
  const candidate = `${baseSlug}-${(currentId ?? crypto.randomUUID()).replace(/-/g, '').slice(0, 6)}`

  const { data: existing } = await supabase
    .from('artist_profiles')
    .select('id')
    .eq('slug', candidate)
    .maybeSingle()

  if (!existing || existing.id === currentId) {
  return candidate
}

  return `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`
}
