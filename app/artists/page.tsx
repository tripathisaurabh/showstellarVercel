import type { Metadata } from 'next'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import Footer from '@/components/Footer'
import ArtistFilters from '@/components/ArtistFilters'
import ArtistListingCard from '@/components/ArtistListingCard'
import PaginationControls from '@/components/PaginationControls'
import { createClient } from '@/lib/supabase/server'
import { hasPublicSupabaseConfig } from '@/lib/supabase/config'
import { Search } from 'lucide-react'
import {
  DEFAULT_ARTIST_LISTING_LIMIT,
  buildPaginatedCanonicalPath,
  buildPaginatedDescription,
  buildPaginatedListingHref,
  buildPaginatedTitle,
  fetchPaginatedArtistListings,
  normalizeArtistListingPage,
} from '@/lib/artist-listing'
import type { PublicArtistRecord } from '@/lib/artist-profile'
import { normalizeArtistCategoryLabel } from '@/lib/artist-categories'
import { absoluteUrl, seoDefaults } from '@/lib/seo'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'

type BrowseSearchParams = {
  category?: string
  city?: string
  q?: string
  page?: string
}

function normalizeCategory(value?: string | null) {
  const normalized = value?.trim().toLowerCase() ?? ''
  if (!normalized) return ''

  if (normalized.endsWith('s') && normalized.length > 3) {
    return normalized.slice(0, -1)
  }

  return normalized
}

function buildArtistsPageTitle(category?: string | null) {
  const normalized = normalizeArtistCategoryLabel(category)
  const labels: Record<string, string> = {
    Singer: 'Singers',
    'Bollywood Singer': 'Bollywood Singers',
    'Wedding Singer': 'Wedding Singers',
    'Devotional Singer': 'Devotional Singers',
    'Live Musician': 'Live Musicians',
    Band: 'Bands',
    'Live Band': 'Live Bands',
    'Acoustic Duo': 'Acoustic Duos',
    DJ: 'DJs',
    Dancer: 'Dancers',
    'Bharatanatyam Dancer': 'Bharatanatyam Dancers',
    'Bhangra Dancer': 'Bhangra Dancers',
    'Hip Hop Dancer': 'Hip Hop Dancers',
    'Contemporary Dancer': 'Contemporary Dancers',
    'Belly Dancer': 'Belly Dancers',
    Choreographer: 'Choreographers',
    'Emcee / Host': 'Emcees & Hosts',
    Anchor: 'Anchors',
    Comedian: 'Comedians',
    Magician: 'Magicians',
    Mentalist: 'Mentalists',
    Photographer: 'Photographers',
    'Drone Photographer': 'Drone Photographers',
    Videographer: 'Videographers',
    'Makeup Artist': 'Makeup Artists',
    'Beauty Parlour / Salon': 'Beauty Parlours & Salons',
    'Hair Stylist': 'Hair Stylists',
    'Nail Artist': 'Nail Artists',
    'Mehendi Artist': 'Mehendi Artists',
    'Bridal Mehendi Artist': 'Bridal Mehendi Artists',
    'Tattoo Artist': 'Tattoo Artists',
    'Event Decorator': 'Event Decorators',
    'Event Planner': 'Event Planners',
    Guitarist: 'Guitarists',
    Keyboardist: 'Keyboardists',
    Drummer: 'Drummers',
    Percussionist: 'Percussionists',
    Saxophonist: 'Saxophonists',
    Violinist: 'Violinists',
    Flutist: 'Flutists',
    'Tabla Player': 'Tabla Players',
    'Qawwali Singer': 'Qawwali Singers',
    'Folk Singer': 'Folk Singers',
    'Classical Singer': 'Classical Singers',
    'Kids Entertainer': 'Kids Entertainers',
    Storyteller: 'Storytellers',
    'Caricature Artist': 'Caricature Artists',
    'Face Painter': 'Face Painters',
    'Balloon Artist': 'Balloon Artists',
    'Celebrity Appearance': 'Celebrity Appearances',
    'Puppet Show Artist': 'Puppet Show Artists',
    Other: 'Artists',
  }

  return labels[normalized] ?? 'Browse Artists'
}

function buildArtistsPageDescription(category?: string | null, city?: string | null) {
  const categoryTitle = buildArtistsPageTitle(category)
  if (category && city) {
    return `Browse verified ${categoryTitle.toLowerCase()} in ${city} for weddings, corporate events, private parties, and live shows on ShowStellar.`
  }

  if (category) {
    return `Browse verified ${categoryTitle.toLowerCase()} for weddings, corporate events, private parties, and live shows on ShowStellar.`
  }

  if (city) {
    return `Browse verified artists in ${city} for weddings, corporate events, private parties, and live shows on ShowStellar.`
  }

  return seoDefaults.description
}

const getCachedPublicCategoryNames = unstable_cache(
  async (): Promise<string[]> => {
    const adminClient = getAdminSupabaseClient()
    const { data, error } = await adminClient
      .from('categories')
      .select('name')
      .order('name')

    if (error) {
      console.error('[artists-page] category options lookup failed:', error)
      return []
    }

    const rows = (data ?? []) as Array<{ name: string | null }>
    return rows
      .map(row => row.name?.trim())
      .filter((name): name is string => Boolean(name))
  },
  ['artists-page-category-options-v1'],
  { revalidate: 3600, tags: ['public-categories'] }
)

export async function generateMetadata({ searchParams }: { searchParams: Promise<BrowseSearchParams> }): Promise<Metadata> {
  const params = await searchParams
  const page = normalizeArtistListingPage(params.page)
  const categoryTitle = buildArtistsPageTitle(params.category)
  const baseTitle = params.category ? `${categoryTitle} in India` : 'Browse Artists'
  const title = buildPaginatedTitle(baseTitle, page)
  const description = buildPaginatedDescription(buildArtistsPageDescription(params.category, params.city), page)
  const canonical = buildPaginatedCanonicalPath(
    '/artists',
    { q: params.q, category: params.category, city: params.city },
    page
  )

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(canonical),
      images: [{ url: absoluteUrl(seoDefaults.image), width: 1200, height: 630, alt: 'Browse artists on ShowStellar' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteUrl(seoDefaults.image)],
    },
  }
}

export default async function BrowseArtistsPage({ searchParams }: { searchParams: Promise<BrowseSearchParams> }) {
  const params = await searchParams
  const page = normalizeArtistListingPage(params.page)
  const city = params.city ?? ''
  const category = params.category ?? ''
  const query = params.q ?? ''

  let items: PublicArtistRecord[] = []
  let total = 0
  let totalPages = 0
  let categoryOptions: string[] = []

  if (hasPublicSupabaseConfig()) {
    const supabase = await createClient()
    const canonicalCategory = normalizeArtistCategoryLabel(category)

    const [listing, cachedCategoryNames] = await Promise.all([
      fetchPaginatedArtistListings(supabase, {
        page,
        limit: DEFAULT_ARTIST_LISTING_LIMIT,
        city,
        category,
        categoryValues: canonicalCategory ? [canonicalCategory] : undefined,
        q: query,
        sort: 'newest',
      }),
      getCachedPublicCategoryNames(),
    ])

    if (listing.totalPages > 0 && page > listing.totalPages) {
      const target = buildPaginatedListingHref('/artists', { q: query, city, category }, listing.totalPages)
      redirect(target)
    }

    items = listing.items

    total = listing.total
    totalPages = listing.totalPages

    categoryOptions = Array.from(
      new Set([
        ...cachedCategoryNames,
        ...items.flatMap(artist => [...(artist.categories ?? []), ...(artist.custom_categories ?? [])].filter(Boolean) as string[]),
      ])
    ).sort((a, b) => a.localeCompare(b))
  }

  const activeCategory =
    categoryOptions.find(c => normalizeCategory(c) === normalizeCategory(category)) ?? category ?? ''

  const showingCount = items.length
  const startCount = total > 0 ? (page - 1) * DEFAULT_ARTIST_LISTING_LIMIT + 1 : 0
  const endCount = total > 0 ? Math.min(total, startCount + showingCount - 1) : 0
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <section className="border-b bg-white py-3 sm:py-5 md:sticky md:top-20 md:z-40" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ArtistFilters
            categoryOptions={categoryOptions}
            initialCategory={activeCategory}
            initialCity={city}
            initialQuery={query}
          />
        </div>
      </section>

      <section className="py-4 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-between gap-4 sm:mb-6">
            <p style={{ color: 'var(--muted)' }}>
              {total > 0 ? (
                <>
                  Showing <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{startCount}-{endCount}</span> of{' '}
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{total}</span> artists
                </>
              ) : (
                <>
                  Showing <span className="font-semibold" style={{ color: 'var(--foreground)' }}>0</span> artists
                </>
              )}
            </p>
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-white p-10 text-center sm:p-16">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl" style={{ background: 'var(--surface-2)' }}>
                <Search className="h-10 w-10" style={{ color: 'var(--muted)' }} />
              </div>
              <h3 className="mb-3 text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
                No artists found
              </h3>
              <p className="mb-6" style={{ color: 'var(--muted)' }}>
                Try adjusting your filters, category, or city.
              </p>
              <Link
                href="/artists"
                className="inline-block rounded-xl border px-6 py-3 text-sm font-semibold transition-colors hover:opacity-80"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
              >
                Clear filters
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {items.map(artist => (
                  <ArtistListingCard key={artist.id} artist={artist} />
                ))}
              </div>

              <PaginationControls
                pathname="/artists"
                query={{ q: query || undefined, category: category || undefined, city: city || undefined }}
                page={page}
                totalPages={totalPages}
                label="Browse artists pagination"
              />
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
