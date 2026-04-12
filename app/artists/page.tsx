import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { hasPublicSupabaseConfig } from '@/lib/supabase/config'
import { Search } from 'lucide-react'
import Footer from '@/components/Footer'
import ArtistFilters from '@/components/ArtistFilters'
import {
  getArtistDisplayName,
  getArtistExperienceText,
  getArtistLocation,
  getArtistPublicPath,
  getArtistCategories,
  getArtistSummaryLine,
  type PublicArtistRecord,
} from '@/lib/artist-profile'
import { artistMatchesCategory, normalizeArtistCategoryLabel } from '@/lib/artist-categories'
import { absoluteUrl, seoDefaults } from '@/lib/seo'

interface SearchParams { category?: string; city?: string; q?: string }

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
    'Choreographer': 'Choreographers',
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
    'Storyteller': 'Storytellers',
    'Caricature Artist': 'Caricature Artists',
    'Face Painter': 'Face Painters',
    'Balloon Artist': 'Balloon Artists',
    'Celebrity Appearance': 'Celebrity Appearances',
    'Puppet Show Artist': 'Puppet Show Artists',
    Other: 'Artists',
  }

  return labels[normalized] ?? 'Browse Artists'
}

const FALLBACK_NAME = 'Artist profile'
const FALLBACK_PRICE = 'Contact for price'
const FALLBACK_CATEGORY = 'Updating soon'
const FALLBACK_LOCATION = 'Updating soon'
const FALLBACK_EXPERIENCE = 'Updating soon'
const FALLBACK_BIO = 'Updating soon'

const trimText = (value?: string | null) => value?.trim() ?? ''

function getBrowseArtistDisplayName(artist: PublicArtistRecord) {
  const name = trimText(getArtistDisplayName(artist))
  if (!name || name === 'ShowStellar Artist') return FALLBACK_NAME
  return name
}

function getBrowseArtistPriceText(value?: number | string | null) {
  const price = value != null ? Number(value) : null
  if (price === null || Number.isNaN(price) || price <= 0) return FALLBACK_PRICE
  return `₹${price.toLocaleString()}`
}

function getBrowseArtistCategoryText(artist: PublicArtistRecord) {
  const categories = getArtistCategories(artist).combined
    .map(trimText)
    .filter(Boolean)

  if (categories.length === 0) return FALLBACK_CATEGORY

  const visible = categories.slice(0, 2)
  const extra = categories.length - visible.length
  return extra > 0 ? `${visible.join(', ')} +${extra}` : visible.join(', ')
}

function getBrowseArtistLocationText(artist: PublicArtistRecord) {
  return trimText(getArtistLocation(artist) || artist.city) || FALLBACK_LOCATION
}

function getBrowseArtistExperienceText(value?: number | null) {
  if (value == null || value < 0) return FALLBACK_EXPERIENCE
  return `${Math.floor(value)} ${Math.floor(value) === 1 ? 'year' : 'years'}`
}

function getBrowseArtistBioText(artist: PublicArtistRecord) {
  return trimText(artist.bio) || getArtistSummaryLine(artist) || FALLBACK_BIO
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const params = await searchParams
  const categoryTitle = buildArtistsPageTitle(params.category)
  const query = new URLSearchParams()

  if (params.q) query.set('q', params.q)
  if (params.category) query.set('category', params.category)
  if (params.city) query.set('city', params.city)

  const canonical = query.toString() ? `/artists?${query.toString()}` : '/artists'

  return {
    title: categoryTitle === 'Browse Artists' ? categoryTitle : `${categoryTitle} in India`,
    description: params.category
      ? `Browse verified ${categoryTitle.toLowerCase()} on ShowStellar for weddings, corporate events, private parties, and live shows.`
      : seoDefaults.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${categoryTitle} | ShowStellar`,
      description: params.category
        ? `Discover verified ${categoryTitle.toLowerCase()} for your next event.`
        : seoDefaults.description,
      url: absoluteUrl(canonical),
    },
  }
}

export default async function BrowseArtistsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  let artists: PublicArtistRecord[] = []
  let categories: Array<{ name: string }> = []

  if (hasPublicSupabaseConfig()) {
    const supabase = await createClient()

    let query = supabase
      .from('artist_profiles')
      .select('*, users(full_name), primary_category:categories(name), categories, custom_categories, rating, experience_years, is_featured, approval_status')
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false })

    if (params.city) query = query.ilike('city', `%${params.city}%`)

    const artistsResult = await query
    const categoriesResult = await supabase.from('categories').select('name').order('name')
    artists = (artistsResult.data ?? []) as PublicArtistRecord[]
    categories = (categoriesResult.data ?? []) as Array<{ name: string }>
  }

  const artistRows = (artists ?? []) as PublicArtistRecord[]
  const categoryRows = (categories ?? []) as Array<{ name: string }>
  const categoryOptions = Array.from(
    new Set([
      ...categoryRows.map(c => c.name),
      ...artistRows.flatMap(artist => [...(artist.categories ?? []), ...(artist.custom_categories ?? [])].filter(Boolean) as string[]),
    ])
  ).sort((a, b) => a.localeCompare(b))
  const activeCategory =
    categoryOptions.find(c => normalizeCategory(c) === normalizeCategory(params.category)) ?? params.category ?? ''

  const filtered = artistRows.filter(a => {
    if (!artistMatchesCategory(a, activeCategory)) return false
    if (params.q) {
      const q = params.q.toLowerCase()
      const name = getArtistDisplayName(a).toLowerCase()
      const cat = getArtistCategories(a).summary.toLowerCase()
      const location = getArtistLocation(a).toLowerCase() || a.city?.toLowerCase() || ''
      const rawLocation = `${a.locality ?? ''} ${a.city ?? ''} ${a.state ?? ''}`.toLowerCase()
      if (!name.includes(q) && !cat.includes(q) && !location.includes(q) && !rawLocation.includes(q)) return false
    }
    return true
  }) ?? []

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Page Header — hidden on mobile to save above-the-fold space */}
      {/* <section className="hidden sm:block border-b bg-white py-10" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-1.5 text-4xl font-bold" style={{ color: 'var(--foreground)' }}>Browse Artists</h1>
          <p className="max-w-2xl text-lg" style={{ color: 'var(--muted)' }}>Discover talented professionals for your next event</p>
        </div>
      </section> */}

      {/* Filters */}
      <section className="border-b bg-white py-3 sm:py-5 md:sticky md:top-20 md:z-40" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ArtistFilters
            categoryOptions={categoryOptions}
            initialCategory={activeCategory}
            initialCity={params.city ?? ''}
            initialQuery={params.q ?? ''}
          />
        </div>
      </section>

      {/* Results */}
      <section className="py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <p style={{ color: 'var(--muted)' }}>
              Showing <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{filtered.length}</span> artists
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border p-16 text-center" style={{ border: '1px solid var(--border)' }}>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--surface-2)' }}>
                <Search className="w-10 h-10" style={{ color: 'var(--muted)' }} />
              </div>
              <h3 className="text-2xl font-semibold mb-3" style={{ color: 'var(--foreground)' }}>No artists found</h3>
              <p className="mb-6" style={{ color: 'var(--muted)' }}>Try adjusting your filters or search query</p>
              <Link
                href="/artists"
                className="inline-block px-6 py-3 rounded-xl text-sm font-semibold border transition-colors hover:opacity-80"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
              >
                Clear Filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((artist, index) => {
                const displayName = getBrowseArtistDisplayName(artist)
                const priceText = getBrowseArtistPriceText(artist.pricing_start)
                const categoryText = getBrowseArtistCategoryText(artist)
                const locationText = getBrowseArtistLocationText(artist)
                const experienceText = getArtistExperienceText(artist) ?? getBrowseArtistExperienceText(artist.experience_years)
                const bioText = getBrowseArtistBioText(artist)

                return (
                <Link key={artist.id} href={getArtistPublicPath(artist)} className="group block h-full">
                  <div
                    className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border bg-white transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_24px_56px_rgba(0,23,57,0.16)]"
                    style={{ border: '1px solid var(--border)' }}
                  >
                    <div className="relative flex h-[220px] items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#eef2f7_100%)] sm:h-[240px] lg:h-[280px]">
                      {artist.profile_image_cropped || artist.profile_image ? (
                        <Image
                          src={artist.profile_image_cropped ?? artist.profile_image ?? ''}
                          alt={displayName}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          priority={index < 3}
                          className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.01]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(180deg,#ffffff_0%,#eef2f7_100%)] text-4xl sm:text-5xl">🎭</div>
                      )}
                      {artist.is_featured && (
                        <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-[var(--navy)] px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_10px_24px_rgba(0,23,57,0.2)] sm:left-4 sm:top-4 sm:text-xs">
                          Featured
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-[1rem] font-semibold leading-tight tracking-tight sm:text-[1.05rem]" style={{ color: 'var(--foreground)' }}>
                            {displayName}
                          </h3>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                            Price
                          </p>
                          <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                            {priceText}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2 text-[13px] leading-5 sm:text-sm sm:leading-6" style={{ color: 'var(--muted)' }}>
                        <p className="line-clamp-1">
                          <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Category:</span> {categoryText}
                        </p>
                        <p className="line-clamp-1">
                          <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Location:</span> {locationText}
                        </p>
                        <p className="line-clamp-1">
                          <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Experience:</span> {experienceText}
                        </p>
                        <p className="line-clamp-2">
                          <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Bio:</span> {bioText}
                        </p>
                      </div>

                      <div className="mt-auto pt-4">
                        <span className="inline-flex items-center gap-2 text-[13px] font-semibold sm:text-sm" style={{ color: 'var(--navy)' }}>
                          View Profile
                          <span aria-hidden="true">→</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
