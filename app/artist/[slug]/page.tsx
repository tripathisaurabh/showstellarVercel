import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hasPublicSupabaseConfig } from '@/lib/supabase/config'
import BookingModal from '@/components/DeferredBookingModal'
import Footer from '@/components/Footer'
import { ChevronRight, MapPin, Star } from 'lucide-react'
import {
  getArtistCategories,
  getArtistDisplayName,
  getArtistInitials,
  getArtistLocation,
  getArtistPublicPath,
  getArtistSummaryLine,
  splitArtistTextList,
  splitArtistParagraphs,
  type PublicArtistRecord,
} from '@/lib/artist-profile'
import { absoluteUrl, seoDefaults } from '@/lib/seo'

async function loadArtistBySlug(supabase: Awaited<ReturnType<typeof createClient>>, slug: string) {
  const baseQuery = supabase
    .from('artist_profiles')
    .select('*, users(full_name, phone_number, email), primary_category:categories(name), categories, custom_categories, artist_media(*)')
    .eq('approval_status', 'approved')

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)

  if (isUuid) {
    const { data } = await baseQuery.eq('id', slug).maybeSingle()
    return data as PublicArtistRecord | null
  }

  const { data: slugMatch } = await baseQuery.eq('slug', slug).maybeSingle()
  let artist = slugMatch as PublicArtistRecord | null

  if (!artist) {
    const { data: idMatch } = await baseQuery.eq('id', slug).maybeSingle()
    artist = idMatch as PublicArtistRecord | null
  }

  if (!artist) {
    const slugSuffix = slug.split('-').filter(Boolean).pop()
    if (slugSuffix && slugSuffix.length >= 4) {
      const { data: suffixMatch } = await baseQuery.ilike('slug', `%-${slugSuffix}`).limit(1)
      artist = (suffixMatch?.[0] as PublicArtistRecord | null) ?? null
    }
  }

  return artist
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  if (!hasPublicSupabaseConfig()) {
    return {
      title: 'Artist not found',
      robots: { index: false, follow: false },
    }
  }

  const supabase = await createClient()
  const artist = await loadArtistBySlug(supabase, slug)

  if (!artist) {
    return {
      title: 'Artist not found',
      robots: { index: false, follow: false },
    }
  }

  const displayName = getArtistDisplayName(artist)
  const categoryData = getArtistCategories(artist)
  const categoryName = categoryData.primary
  const location = getArtistLocation(artist)
  const canonicalPath = getArtistPublicPath(artist)
  const summary = getArtistSummaryLine(artist)

  return {
    title: `${displayName} | ${categoryName}`,
    description: `${summary}${location ? ` Book ${displayName} in ${location}.` : ` Book ${displayName} for your next event.`}`,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${displayName} | ShowStellar`,
      description: summary,
      url: absoluteUrl(canonicalPath),
      images: artist.profile_image
        ? [{ url: artist.profile_image, width: 1200, height: 900, alt: displayName }]
        : [{ url: absoluteUrl(seoDefaults.image), width: 1200, height: 630, alt: displayName }],
    },
  }
}

export default async function ArtistProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!hasPublicSupabaseConfig()) {
    notFound()
  }

  const supabase = await createClient()
  const artist = await loadArtistBySlug(supabase, slug)

  if (!artist) notFound()

  const canonicalPath = getArtistPublicPath(artist)
  if (artist.slug && canonicalPath !== `/artist/${slug}`) {
    redirect(canonicalPath)
  }
  const headerList = await headers()
  const forwardedProto = headerList.get('x-forwarded-proto')
  const forwardedHost = headerList.get('x-forwarded-host') ?? headerList.get('host')
  const origin =
    forwardedProto && forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const artistProfileUrl = new URL(canonicalPath, origin).toString()

  const displayName   = getArtistDisplayName(artist)
  const location      = getArtistLocation(artist)
  const initials      = getArtistInitials(artist)
  const categoryData  = getArtistCategories(artist)
  const categoryName  = categoryData.primary
  const media         = (artist.artist_media ?? []).filter(Boolean)
  const images        = media.filter(m => m.type === 'image')
  const videos        = media.filter(m => m.type === 'video')
  const eventTypes    = splitArtistTextList(artist.event_types)
  const languages     = splitArtistTextList(artist.languages_spoken)
  const bioParagraphs = splitArtistParagraphs(artist.bio)
  const summaryLine   = getArtistSummaryLine(artist)
  const priceDisplay = artist.pricing_start != null
    ? `₹${Number(artist.pricing_start).toLocaleString()}`
    : null
  const rating        = artist.rating != null ? Number(artist.rating) : null
  const experienceYears = artist.experience_years != null ? Number(artist.experience_years) : null
  const hasDetails    = eventTypes.length > 0 || languages.length > 0 || !!location || !!artist.performance_style || experienceYears != null
  const hasMedia      = images.length > 0 || videos.length > 0

  const CARD = {
    background: '#ffffff',
    border: '1px solid var(--border)',
    borderRadius: '16px',
  } as const

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb" style={{ color: 'var(--muted)' }}>
          <Link href="/" className="hover:opacity-70 transition-opacity">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          <Link href="/artists" className="hover:opacity-70 transition-opacity">Artists</Link>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          <span style={{ color: 'var(--foreground)' }}>{displayName}</span>
        </nav>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

        {/* ── Artist header (full width above the two-column split) ── */}
        <div className="mb-8" style={{ ...CARD, padding: '32px' }}>
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">

            {/* Avatar */}
            <div
              className="shrink-0 overflow-hidden flex items-center justify-center text-2xl font-bold"
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '20px',
                background: 'var(--surface-2)',
                border: '3px solid var(--border)',
                boxShadow: '0 4px 16px rgba(0,23,57,0.1)',
              }}
            >
              {artist.profile_image ? (
                <Image
                  src={artist.profile_image}
                  alt={displayName}
                  width={96}
                  height={96}
                  priority
                  sizes="96px"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span style={{ color: 'var(--foreground)' }}>{initials}</span>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {categoryData.combined.slice(0, 3).map(category => (
                  <span
                    key={category}
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ background: 'rgba(193,117,245,0.14)', color: '#c175f5' }}
                  >
                    {category}
                  </span>
                ))}
                {artist.is_featured && (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ background: 'var(--surface-2)', color: 'var(--accent-violet)' }}
                  >
                    <Star className="w-3 h-3 fill-current" />
                    Featured
                  </span>
                )}
              </div>

              <h1
                className="font-extrabold leading-none mb-2"
                style={{
                  color: 'var(--foreground)',
                  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                  letterSpacing: '-0.03em',
                }}
              >
                {displayName}
              </h1>

              {location && (
                <div className="flex items-center gap-1.5 mb-3" style={{ color: 'var(--muted)' }}>
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="text-sm">{location}</span>
                </div>
              )}

              {summaryLine && (
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--muted)', maxWidth: '560px' }}>
                  {summaryLine}
                </p>
              )}

              {categoryData.combined.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {categoryData.combined.map(category => (
                    <span
                      key={category}
                      className="text-xs font-medium px-3 py-1.5 rounded-full"
                      style={{ background: 'var(--surface-2)', color: 'var(--foreground)' }}
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}

              {/* Trust badges */}
              <div className="flex flex-wrap gap-2">
                {rating !== null && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: 'rgba(193,117,245,0.16)', color: 'var(--foreground)' }}>
                    <Star className="w-3 h-3 fill-current" />
                    {rating.toFixed(1)} Rating
                  </span>
                )}
                {experienceYears !== null && experienceYears > 0 && (
                  <span className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--accent)' }}>
                    {experienceYears} yrs experience
                  </span>
                )}
                <span className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--foreground)' }}>
                  ✓ Verified Artist
                </span>
                <span className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--foreground)' }}>
                  ⚡ Fast Response
                </span>
                <span className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--foreground)' }}>
                  🔒 Secure Booking
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Two-column layout: left content + right sticky booking ── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-start">

          {/* LEFT: main content */}
          <div className="space-y-6">

            {/* About */}
            <section style={CARD}>
              <div style={{ padding: '28px 32px' }}>
                <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--foreground)' }}>About</h2>
                <div className="space-y-3" style={{ maxWidth: '680px' }}>
                  {bioParagraphs.length > 0 ? (
                    bioParagraphs.slice(0, 3).map((para, i) => (
                      <p key={i} className="text-sm leading-7" style={{ color: 'var(--muted)' }}>
                        {para}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm leading-7" style={{ color: 'var(--muted)' }}>
                      Details about this artist will be updated soon.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Details */}
            {hasDetails && (
              <section style={CARD}>
                <div style={{ padding: '28px 32px' }}>
                  <h2 className="text-base font-semibold mb-5" style={{ color: 'var(--foreground)' }}>Details</h2>
                  <dl>
                    {([
                      eventTypes.length > 0    ? ['Event types',  eventTypes.join(', ')]                         : null,
                      languages.length > 0     ? ['Languages',    languages.join(', ')]                           : null,
                      location                 ? ['Based in',     location]                                       : null,
                      artist.performance_style ? ['Style',        artist.performance_style]                       : null,
                      experienceYears != null  ? ['Experience',   `${experienceYears} ${experienceYears === 1 ? 'year' : 'years'}`] : null,
                    ] as ([string, string] | null)[])
                      .filter((row): row is [string, string] => row !== null)
                      .map(([label, value], i, arr) => (
                        <div
                          key={label}
                          className="flex gap-4 py-3"
                          style={{
                            borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                          }}
                        >
                          <dt className="text-sm w-28 shrink-0" style={{ color: 'var(--muted)' }}>{label}</dt>
                          <dd className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{value}</dd>
                        </div>
                      ))}
                  </dl>
                </div>
              </section>
            )}

            {/* Mobile-only booking card — between Details and Media on small screens */}
            <div className="lg:hidden">
              <BookingCard
                artistId={artist.id}
                displayName={displayName}
                priceDisplay={priceDisplay}
                categoryName={categoryData.summary || categoryName}
                location={location}
                performanceStyle={artist.performance_style}
                eventTypes={artist.event_types}
                languages={artist.languages_spoken}
                artistPhone={artist.users?.phone_number ?? null}
                artistEmail={artist.users?.email ?? null}
                artistProfileUrl={artistProfileUrl}
              />
            </div>

            {/* Media */}
            {hasMedia && (
              <section style={{ ...CARD, contentVisibility: 'auto', containIntrinsicSize: '1px 560px' }}>
                <div style={{ padding: '28px 32px' }}>
                  <h2 className="text-base font-semibold mb-5" style={{ color: 'var(--foreground)' }}>Photos & Videos</h2>

                  {images.length > 0 && (
                    <div
                      className="grid gap-3 mb-6"
                      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}
                    >
                      {images.map((img, i) => (
                        <div
                          key={img.id}
                          className="overflow-hidden relative"
                          style={{ borderRadius: '10px', aspectRatio: '16/9' }}
                        >
                          <Image
                            src={img.media_url}
                            alt={`${displayName} — photo ${i + 1}`}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                            className="object-cover transition-transform duration-300 hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {videos.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {videos.map(vid => (
                        <video
                          key={vid.id}
                          src={vid.media_url}
                          controls
                          preload="none"
                          style={{ width: '100%', borderRadius: '10px', background: '#000' }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT: sticky booking card (desktop only) */}
          <div className="hidden lg:block lg:sticky lg:top-24">
            <BookingCard
              artistId={artist.id}
              displayName={displayName}
              priceDisplay={priceDisplay}
              categoryName={categoryData.summary || categoryName}
              location={location}
              performanceStyle={artist.performance_style}
              eventTypes={artist.event_types}
              languages={artist.languages_spoken}
              artistPhone={artist.users?.phone_number ?? null}
              artistEmail={artist.users?.email ?? null}
              artistProfileUrl={artistProfileUrl}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function BookingCard({
  artistId,
  displayName,
  priceDisplay,
  categoryName,
  location,
  performanceStyle,
  eventTypes,
  languages,
  artistPhone,
  artistEmail,
  artistProfileUrl,
}: {
  artistId: string
  displayName: string
  priceDisplay: string | null
  categoryName?: string | null
  location?: string | null
  performanceStyle?: string | null
  eventTypes?: string | null
  languages?: string | null
  artistPhone?: string | null
  artistEmail?: string | null
  artistProfileUrl?: string | null
}) {
  const priceFallback = 'Price not listed for this artist yet'

  return (
    <div
      style={{
        background: 'linear-gradient(155deg, #001739 0%, #0a2148 100%)',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 16px 48px rgba(0,23,57,0.25)',
      }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-widest mb-2"
        style={{ color: 'rgba(255,255,255,0.75)' }}
      >
        Starting from
      </p>

      {priceDisplay ? (
        <div className="flex items-baseline gap-2 mb-7">
          <span className="font-extrabold text-white" style={{ fontSize: '2.25rem', letterSpacing: '-0.03em' }}>
            {priceDisplay}
          </span>
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>per event</span>
        </div>
      ) : (
        <div className="mb-7">
          <p className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {priceFallback}
          </p>
          <p className="mt-2 text-sm leading-6" style={{ color: 'rgba(255,255,255,0.72)' }}>
            You can still send your inquiry. The artist can share pricing after reviewing your request.
          </p>
        </div>
      )}

      <BookingModal
        artistId={artistId}
        artistName={displayName}
        artistPhone={artistPhone}
        artistEmail={artistEmail}
        artistCategory={categoryName ?? null}
        artistLocation={location ?? null}
        artistPrice={priceDisplay}
        artistProfileUrl={artistProfileUrl}
        artistPerformanceStyle={performanceStyle ?? null}
        artistEventTypes={eventTypes ?? null}
        artistLanguages={languages ?? null}
      />

      <p className="text-xs text-center mt-4" style={{ color: 'rgba(255,255,255,0.65)' }}>
        Free inquiry · No account needed
      </p>
    </div>
  )
}
