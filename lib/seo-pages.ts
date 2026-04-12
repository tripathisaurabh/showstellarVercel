import { cache } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { hasPublicSupabaseConfig } from '@/lib/supabase/config'
import {
  artistMatchesCategory,
  normalizeArtistCategoryLabel,
  normalizeCategoryKey,
} from '@/lib/artist-categories'
import {
  getArtistCategories,
  getArtistDisplayName,
  getArtistLocation,
  splitArtistTextList,
  type PublicArtistRecord,
} from '@/lib/artist-profile'
import { absoluteUrl, seoDefaults } from '@/lib/seo'

type MaybeString = string | null | undefined

type SeoCategoryDefinition = {
  slug: string
  singularLabel: string
  pluralLabel: string
  internalCategories: string[]
  aliases?: string[]
}

export type SeoCityCategoryPageData = {
  citySlug: string
  cityLabel: string
  category: SeoCategoryDefinition
  canonicalPath: string
  artists: PublicArtistRecord[]
}

const trim = (value: MaybeString) => value?.trim() ?? ''

export const SEO_CATEGORY_DEFINITIONS: SeoCategoryDefinition[] = [
  {
    slug: 'djs',
    singularLabel: 'DJ',
    pluralLabel: 'DJs',
    internalCategories: ['DJ'],
    aliases: ['dj', 'disc-jockey', 'music-dj'],
  },
  {
    slug: 'singers',
    singularLabel: 'Singer',
    pluralLabel: 'Singers',
    internalCategories: ['Singer', 'Bollywood Singer', 'Wedding Singer', 'Devotional Singer', 'Classical Singer', 'Folk Singer', 'Qawwali Singer'],
    aliases: ['singer', 'female-singer', 'male-singer', 'vocalist', 'vocalists'],
  },
  {
    slug: 'wedding-anchors',
    singularLabel: 'Wedding Anchor',
    pluralLabel: 'Wedding Anchors',
    internalCategories: ['Emcee / Host', 'Anchor'],
    aliases: ['wedding-anchor', 'anchor', 'emcee', 'emcee-host', 'host'],
  },
  {
    slug: 'live-musicians',
    singularLabel: 'Live Musician',
    pluralLabel: 'Live Musicians',
    internalCategories: ['Live Musician', 'Band', 'Live Band', 'Acoustic Duo', 'Guitarist', 'Keyboardist', 'Drummer', 'Percussionist', 'Saxophonist', 'Violinist', 'Flutist', 'Tabla Player'],
    aliases: ['musician', 'live-musician', 'musicians', 'band', 'bands'],
  },
  {
    slug: 'dancers',
    singularLabel: 'Dancer',
    pluralLabel: 'Dancers',
    internalCategories: ['Dancer', 'Bharatanatyam Dancer', 'Bhangra Dancer', 'Hip Hop Dancer', 'Contemporary Dancer', 'Belly Dancer', 'Choreographer'],
    aliases: ['dance', 'dancer'],
  },
  {
    slug: 'magicians',
    singularLabel: 'Magician',
    pluralLabel: 'Magicians',
    internalCategories: ['Magician'],
    aliases: ['magician', 'illusionist'],
  },
  {
    slug: 'comedians',
    singularLabel: 'Comedian',
    pluralLabel: 'Comedians',
    internalCategories: ['Comedian'],
    aliases: ['comedian', 'standup-comedian', 'stand-up-comedian'],
  },
  {
    slug: 'photographers',
    singularLabel: 'Photographer',
    pluralLabel: 'Photographers',
    internalCategories: ['Photographer', 'Drone Photographer', 'Videographer'],
    aliases: ['photo', 'photographer', 'videographer'],
  },
  {
    slug: 'makeup-artists',
    singularLabel: 'Makeup Artist',
    pluralLabel: 'Makeup Artists',
    internalCategories: ['Makeup Artist', 'Beauty Parlour / Salon', 'Hair Stylist', 'Nail Artist'],
    aliases: ['makeup-artist', 'beauty', 'beauty-salon', 'salon', 'hair-stylist', 'nail-artist'],
  },
  {
    slug: 'mehendi-artists',
    singularLabel: 'Mehendi Artist',
    pluralLabel: 'Mehendi Artists',
    internalCategories: ['Mehendi Artist', 'Bridal Mehendi Artist'],
    aliases: ['mehendi-artist', 'mehndi-artist', 'henna-artist', 'bridal-mehendi'],
  },
  {
    slug: 'event-decorators',
    singularLabel: 'Event Decorator',
    pluralLabel: 'Event Decorators',
    internalCategories: ['Event Decorator'],
    aliases: ['decorator', 'event-decorator'],
  },
  {
    slug: 'event-planners',
    singularLabel: 'Event Planner',
    pluralLabel: 'Event Planners',
    internalCategories: ['Event Planner'],
    aliases: ['planner', 'event-planner'],
  },
  {
    slug: 'kids-entertainers',
    singularLabel: 'Kids Entertainer',
    pluralLabel: 'Kids Entertainers',
    internalCategories: ['Kids Entertainer'],
    aliases: ['kids-entertainer', 'children-entertainer'],
  },
  {
    slug: 'storytellers',
    singularLabel: 'Storyteller',
    pluralLabel: 'Storytellers',
    internalCategories: ['Storyteller'],
    aliases: ['storyteller'],
  },
  {
    slug: 'celebrity-appearances',
    singularLabel: 'Celebrity Appearance',
    pluralLabel: 'Celebrity Appearances',
    internalCategories: ['Celebrity Appearance'],
    aliases: ['celebrity', 'celebrity-appearance'],
  },
]

export const SEO_PRIORITY_CITIES = [
  'Mumbai',
  'Delhi',
  'Pune',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Ahmedabad',
  'Goa',
  'Jaipur',
] as const

function normalizeSlug(value: MaybeString) {
  return trim(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function humanizeSlug(value: MaybeString) {
  const slug = normalizeSlug(value)
  if (!slug) return ''
  return slug
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function pluralizeLabel(value: string) {
  if (!value) return value
  if (value.endsWith('s')) return value
  if (value === 'DJ') return 'DJs'
  if (value.endsWith('y')) return `${value.slice(0, -1)}ies`
  return `${value}s`
}

export function slugifyCity(value: MaybeString) {
  return normalizeSlug(value) || 'mumbai'
}

export function slugifyCategory(value: MaybeString) {
  return normalizeSlug(value)
}

export function resolveCityLabel(citySlug: MaybeString) {
  const normalized = normalizeSlug(citySlug)
  if (!normalized) return 'Mumbai'
  const cityAliases: Record<string, string> = {
    bangalore: 'Bangalore',
    bengaluru: 'Bangalore',
    mumbai: 'Mumbai',
    delhi: 'Delhi',
    'new-delhi': 'Delhi',
    pune: 'Pune',
    hyderabad: 'Hyderabad',
    chennai: 'Chennai',
    kolkata: 'Kolkata',
    ahmedabad: 'Ahmedabad',
    goa: 'Goa',
    jaipur: 'Jaipur',
    noida: 'Noida',
    gurgaon: 'Gurgaon',
    gurugram: 'Gurgaon',
    lucknow: 'Lucknow',
    chandigarh: 'Chandigarh',
    indore: 'Indore',
    surat: 'Surat',
    thane: 'Thane',
    'navi-mumbai': 'Navi Mumbai',
  }

  return cityAliases[normalized] ?? (humanizeSlug(normalized) || 'Mumbai')
}

export function resolveSeoCategoryDefinition(categorySlug: MaybeString): SeoCategoryDefinition | null {
  const normalized = normalizeSlug(categorySlug)
  if (!normalized) return null

  const explicit = SEO_CATEGORY_DEFINITIONS.find(def =>
    def.slug === normalized ||
    def.aliases?.includes(normalized) ||
    def.internalCategories.some(label => normalizeSlug(label) === normalized)
  )
  if (explicit) return explicit

  const canonicalCategory = normalizeArtistCategoryLabel(categorySlug)
  if (!canonicalCategory) return null

  return {
    slug: slugifyCategory(canonicalCategory),
    singularLabel: canonicalCategory,
    pluralLabel: pluralizeLabel(canonicalCategory),
    internalCategories: [canonicalCategory],
  }
}

export function resolveSeoCategoryLabel(categorySlug: MaybeString, plural = false) {
  const def = resolveSeoCategoryDefinition(categorySlug)
  if (!def) return humanizeSlug(categorySlug) || 'Artists'
  return plural ? def.pluralLabel : def.singularLabel
}

export function getArtistSeoCategoryLabel(artist: PublicArtistRecord) {
  const categoryData = getArtistCategories(artist)
  const match = SEO_CATEGORY_DEFINITIONS.find(def =>
    def.internalCategories.some(category =>
      categoryData.combined.some(artistCategory => normalizeCategoryKey(artistCategory) === normalizeCategoryKey(category))
    )
  )

  if (match) return match.singularLabel
  return categoryData.primary || 'Artist'
}

export function getArtistSeoCategorySlug(artist: PublicArtistRecord) {
  const categoryData = getArtistCategories(artist)
  const match = SEO_CATEGORY_DEFINITIONS.find(def =>
    def.internalCategories.some(category =>
      categoryData.combined.some(artistCategory => normalizeCategoryKey(artistCategory) === normalizeCategoryKey(category))
    )
  )

  if (match) return match.slug

  const primary = categoryData.primary || 'artist'
  return slugifyCategory(primary) || 'artist'
}

export function getArtistSeoCityLabel(artist: PublicArtistRecord) {
  return trim(artist.city) || trim(artist.locality) || getArtistLocation(artist)
}

export function artistMatchesSeoCategory(artist: PublicArtistRecord, categorySlug?: MaybeString) {
  const def = resolveSeoCategoryDefinition(categorySlug)
  if (!def) return false

  return def.internalCategories.some(category =>
    artistMatchesCategory(
      {
        categories: artist.categories,
        custom_categories: artist.custom_categories,
        primaryCategory: artist.primary_category?.name ?? null,
      },
      category
    )
  )
}

export function isArtistSeoIndexable(artist: PublicArtistRecord) {
  if (trim(artist.approval_status) !== 'approved') return false
  if (!trim(artist.slug)) return false

  const displayName = trim(getArtistDisplayName(artist))
  const hasLocation = Boolean(trim(artist.city) || trim(artist.locality) || trim(artist.state))
  const hasCategories = getArtistCategories(artist).combined.length > 0
  const hasPublicContent =
    Boolean(trim(artist.bio)) ||
    Boolean(trim(artist.profile_image)) ||
    Boolean(trim(artist.profile_image_cropped)) ||
    Boolean(artist.profile_image_original) ||
    (artist.artist_media?.length ?? 0) > 0

  return Boolean(displayName && hasLocation && hasCategories && hasPublicContent)
}

export function getSeoCategoryKeywords(cityLabel: string, categoryLabel: string) {
  const lowerCity = cityLabel.toLowerCase()
  const lowerCategory = categoryLabel.toLowerCase()

  return [
    `${lowerCategory} in ${lowerCity}`,
    `${lowerCategory} for events in ${lowerCity}`,
    `book ${lowerCategory} ${lowerCity}`,
    `hire ${lowerCategory} ${lowerCity}`,
    `${categoryLabel} ${cityLabel}`,
    `ShowStellar`,
  ]
}

export function buildCityCategoryPath(citySlug: MaybeString, categorySlug: MaybeString) {
  const resolvedCity = slugifyCity(citySlug)
  const resolvedCategory = resolveSeoCategoryDefinition(categorySlug)?.slug ?? slugifyCategory(categorySlug)
  return `/${resolvedCity}/${resolvedCategory}`
}

export function buildArtistSeoLandingPath(artist: PublicArtistRecord) {
  if (!isArtistSeoIndexable(artist)) return null
  const city = trim(artist.city)
  const categorySlug = getArtistSeoCategorySlug(artist)
  if (!city || !categorySlug) return null
  return buildCityCategoryPath(city, categorySlug)
}

export function buildArtistSeoTitle(artist: PublicArtistRecord) {
  const name = getArtistDisplayName(artist)
  const category = getArtistSeoCategoryLabel(artist)
  const location = getArtistSeoCityLabel(artist)
  const eventTypes = splitArtistTextList(artist.event_types)

  const eventText = eventTypes[0] ? ` for ${eventTypes[0]}` : ''
  const locationText = location ? ` in ${location}` : ''

  return `${name} – ${category}${eventText}${locationText} | ShowStellar`
}

export function buildArtistSeoDescription(artist: PublicArtistRecord) {
  const name = getArtistDisplayName(artist)
  const category = getArtistSeoCategoryLabel(artist)
  const location = getArtistSeoCityLabel(artist)
  const eventTypes = splitArtistTextList(artist.event_types).slice(0, 2)
  const languages = splitArtistTextList(artist.languages_spoken).slice(0, 2)
  const experience = artist.experience_years != null && Number(artist.experience_years) > 0
    ? `${Number(artist.experience_years)}+ years`
    : ''

  const intro = `Book ${name}, a ${category.toLowerCase()}${location ? ` in ${location}` : ''}`
  const details = [
    experience ? `with ${experience} of experience` : '',
    eventTypes.length ? `for ${eventTypes.join(' and ').toLowerCase()}` : '',
    languages.length ? `available in ${languages.join(', ').toLowerCase()}` : '',
  ].filter(Boolean).join(', ')

  return `${intro}${details ? ` ${details}` : ''}. View profile, pricing, and booking details on ShowStellar.`
}

export function buildCityCategoryTitle(cityLabel: string, categoryLabel: string) {
  return `Book ${categoryLabel} in ${cityLabel} | Verified Event Artists | ShowStellar`
}

export function buildCityCategoryDescription(cityLabel: string, categoryLabel: string) {
  return `Book verified ${categoryLabel.toLowerCase()} in ${cityLabel} for weddings, birthdays, sangeets, and corporate events. Explore profiles, pricing, languages, and experience on ShowStellar.`
}

export function buildCityCategoryMetadata(cityLabel: string, categoryLabel: string, citySlug: string, categorySlug: string, artistCount: number): Metadata {
  const canonical = buildCityCategoryPath(citySlug, categorySlug)
  const title = artistCount > 0
    ? buildCityCategoryTitle(cityLabel, categoryLabel)
    : `Find ${categoryLabel} in ${cityLabel} | ShowStellar`

  return {
    title,
    description: buildCityCategoryDescription(cityLabel, categoryLabel),
    keywords: getSeoCategoryKeywords(cityLabel, categoryLabel),
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description: buildCityCategoryDescription(cityLabel, categoryLabel),
      url: absoluteUrl(canonical),
      images: [{ url: absoluteUrl(seoDefaults.image), width: 1200, height: 630, alt: `${categoryLabel} in ${cityLabel}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: buildCityCategoryDescription(cityLabel, categoryLabel),
      images: [absoluteUrl(seoDefaults.image)],
    },
  }
}

export function buildArtistMetadata(artist: PublicArtistRecord): Metadata {
  const canonical = getArtistDisplayName(artist)
  const title = buildArtistSeoTitle(artist)
  const description = buildArtistSeoDescription(artist)
  const path = artist.slug ? `/artist/${artist.slug}` : `/artist/${artist.id}`
  const image = artist.profile_image_cropped ?? artist.profile_image ?? seoDefaults.image
  const imageUrl = image.startsWith('http') ? image : absoluteUrl(image)
  const indexable = isArtistSeoIndexable(artist)

  return {
    title,
    description,
    keywords: [
      getArtistDisplayName(artist),
      getArtistSeoCategoryLabel(artist),
      ...(getArtistLocation(artist) ? [getArtistLocation(artist)] : []),
      ...(splitArtistTextList(artist.event_types).slice(0, 2)),
      'ShowStellar',
    ],
    alternates: {
      canonical: path,
    },
    robots: indexable
      ? undefined
      : {
          index: false,
          follow: false,
          nocache: true,
        },
    openGraph: {
      title: `${canonical} | ShowStellar`,
      description,
      url: absoluteUrl(path),
      images: [{ url: imageUrl, width: 1200, height: 900, alt: canonical }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export function buildArtistBreadcrumbJsonLd(artist: PublicArtistRecord, canonicalPath: string) {
  const displayName = getArtistDisplayName(artist)
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Artists', item: absoluteUrl('/artists') },
      { '@type': 'ListItem', position: 3, name: displayName, item: absoluteUrl(canonicalPath) },
    ],
  }
}

export function buildArtistServiceJsonLd(artist: PublicArtistRecord, canonicalPath: string) {
  const displayName = getArtistDisplayName(artist)
  const category = getArtistSeoCategoryLabel(artist)
  const location = getArtistSeoCityLabel(artist)
  const image = artist.profile_image_cropped ?? artist.profile_image ?? seoDefaults.image
  const imageUrl = image.startsWith('http') ? image : absoluteUrl(image)

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${displayName} booking`,
    serviceType: `${category} booking`,
    areaServed: location || undefined,
    url: absoluteUrl(canonicalPath),
    image: imageUrl,
    description: buildArtistSeoDescription(artist),
  }
}

export function buildCityCategoryBreadcrumbJsonLd(cityLabel: string, categoryLabel: string, canonicalPath: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Artists', item: absoluteUrl('/artists') },
      { '@type': 'ListItem', position: 3, name: `${categoryLabel} in ${cityLabel}`, item: absoluteUrl(canonicalPath) },
    ],
  }
}

export function buildCityCategoryCollectionJsonLd(cityLabel: string, categoryLabel: string, canonicalPath: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${categoryLabel} in ${cityLabel}`,
    url: absoluteUrl(canonicalPath),
    description: buildCityCategoryDescription(cityLabel, categoryLabel),
  }
}

export function buildCityCategoryItemListJsonLd(artists: PublicArtistRecord[], basePath: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: artists.map((artist, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: getArtistDisplayName(artist),
      url: absoluteUrl(artist.slug ? `/artist/${artist.slug}` : `/artist/${artist.id}`),
    })),
    url: absoluteUrl(basePath),
  }
}

function dedupeArtistsById(artists: PublicArtistRecord[]) {
  const seen = new Set<string>()
  const output: PublicArtistRecord[] = []
  for (const artist of artists) {
    if (seen.has(artist.id)) continue
    seen.add(artist.id)
    output.push(artist)
  }
  return output
}

function sortSeoArtists(artists: PublicArtistRecord[]) {
  return [...artists].sort((a, b) => {
    const aFeatured = a.is_featured ? 1 : 0
    const bFeatured = b.is_featured ? 1 : 0
    if (aFeatured !== bFeatured) return bFeatured - aFeatured

    const aRating = a.rating != null ? Number(a.rating) : -1
    const bRating = b.rating != null ? Number(b.rating) : -1
    if (aRating !== bRating) return bRating - aRating

    const aExp = a.experience_years != null ? Number(a.experience_years) : -1
    const bExp = b.experience_years != null ? Number(b.experience_years) : -1
    return bExp - aExp
  })
}

function buildArtistSelectQuery(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase
    .from('artist_profiles')
    .select('*, users(full_name), primary_category:categories(name), categories, custom_categories, rating, experience_years, is_featured, approval_status')
    .eq('approval_status', 'approved')
}

export const loadSeoCityCategoryPage = cache(async (citySlug: string, categorySlug: string): Promise<SeoCityCategoryPageData | null> => {
  const category = resolveSeoCategoryDefinition(categorySlug)
  if (!category) return null

  const cityLabel = resolveCityLabel(citySlug)
  const canonicalPath = buildCityCategoryPath(citySlug, category.slug)

  if (!hasPublicSupabaseConfig()) {
    return {
      citySlug: slugifyCity(citySlug),
      cityLabel,
      category,
      canonicalPath,
      artists: [],
    }
  }

  const supabase = await createClient()
  const [cityResult, localityResult, stateResult] = await Promise.all([
    buildArtistSelectQuery(supabase).ilike('city', `%${cityLabel}%`),
    buildArtistSelectQuery(supabase).ilike('locality', `%${cityLabel}%`),
    buildArtistSelectQuery(supabase).ilike('state', `%${cityLabel}%`),
  ])

  const merged = dedupeArtistsById([
    ...((cityResult.data ?? []) as PublicArtistRecord[]),
    ...((localityResult.data ?? []) as PublicArtistRecord[]),
    ...((stateResult.data ?? []) as PublicArtistRecord[]),
  ])

  const artists = sortSeoArtists(
    merged.filter(artist => isArtistSeoIndexable(artist) && artistMatchesSeoCategory(artist, category.slug))
  )

  return {
    citySlug: slugifyCity(citySlug),
    cityLabel,
    category,
    canonicalPath,
    artists,
  }
})

export function collectSeoCityCategoryRoutes(artists: PublicArtistRecord[]) {
  const routes = new Set<string>()

  for (const artist of artists) {
    if (!isArtistSeoIndexable(artist)) continue
    const city = trim(artist.city || artist.locality)
    if (!city) continue

    for (const category of getArtistCategories(artist).combined) {
      const def = resolveSeoCategoryDefinition(category)
      if (!def) continue
      routes.add(buildCityCategoryPath(city, def.slug))
    }
  }

  return Array.from(routes)
}

export function getSeoRelatedCategories(categorySlug: string, limit = 4) {
  const current = resolveSeoCategoryDefinition(categorySlug)
  const list = SEO_CATEGORY_DEFINITIONS.filter(def => def.slug !== current?.slug)
  return list.slice(0, limit)
}

export function getSeoRelatedCities(cityLabel: string, limit = 4) {
  const current = resolveCityLabel(cityLabel)
  return SEO_PRIORITY_CITIES
    .filter(city => city !== current)
    .slice(0, limit)
}

export function buildSeoCategoryPairsFromArtists(artists: PublicArtistRecord[]) {
  const pairs = new Set<string>()
  for (const artist of artists) {
    if (!isArtistSeoIndexable(artist)) continue
    const city = trim(artist.city || artist.locality)
    if (!city) continue
    const citySlug = slugifyCity(city)
    for (const category of getArtistCategories(artist).combined) {
      const def = resolveSeoCategoryDefinition(category)
      if (!def) continue
      pairs.add(`${citySlug}::${def.slug}`)
    }
  }
  return Array.from(pairs).map(pair => {
    const [citySlug, categorySlug] = pair.split('::')
    return { citySlug, categorySlug }
  })
}
