import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import type { ReactNode } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Star,
} from 'lucide-react'
import Footer from '@/components/Footer'
import { type FeaturedArtistSlot } from '@/components/FeaturedCarousel'
import { getArtistDisplayName, getArtistLocation, getArtistPublicPath, getArtistCategories, type PublicArtistRecord } from '@/lib/artist-profile'
import { StepsCarousel } from '@/components/StepsCarousel'
import { absoluteUrl, seoDefaults } from '@/lib/seo'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'

const LocationAwareFeatured = dynamic(() => import('@/components/LocationAwareFeatured'), {
  loading: () => null,
})

const categories = [
  {
    name: 'Singers',
    filterCategory: 'Singer',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop',
  },
  {
    name: 'Live Musicians',
    filterCategory: 'Live Musician',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=300&fit=crop',
  },
  {
    name: 'DJs',
    filterCategory: 'DJ',
    image: 'https://images.unsplash.com/photo-1544785349-c4a5301826fd?q=80&w=2340&auto=format&fit=crop',
  },
  {
    name: 'Dancers',
    filterCategory: 'Dancer',
    image: 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=400&h=300&fit=crop',
  },
  {
    name: 'Photographers',
    filterCategory: 'Photographer',
    image: 'https://images.unsplash.com/photo-1623783356340-95375aac85ce?q=80&w=2348&auto=format&fit=crop',
  },
  {
    name: 'Mehendi Artists',
    filterCategory: 'Mehendi Artist',
    image: 'https://images.unsplash.com/photo-1605100598080-ef218d438f24?q=80&w=2340&auto=format&fit=crop',
  },
  {
    name: 'Makeup Artists',
    filterCategory: 'Makeup Artist',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=300&fit=crop',
  },
  {
    name: 'Beauty Parlours',
    filterCategory: 'Beauty Parlour / Salon',
    image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=400&h=300&fit=crop',
  },
]

const steps = [
  {
    number: '01',
    title: 'Discover Artists',
    description: 'Browse verified talent across singers, DJs, dancers, emcees, photographers, comedians, magicians, and more.',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&h=600&fit=crop',
  },
  {
    number: '02',
    title: 'Explore Profiles',
    description: 'Review pricing, location, style, availability, and portfolio highlights before making a choice.',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
  },
  {
    number: '03',
    title: 'Send Inquiry',
    description: 'Share your event details and preferences through one simple booking form.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop',
  },
  {
    number: '04',
    title: 'Confirm Booking',
    description: 'Connect with the artist, finalize details, and lock in your event confidently.',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop',
  },
]

const trustPoints = ['Verified profiles', 'Direct artist inquiry', 'Premium event talent']

const getCachedFeaturedArtistSlots = unstable_cache(
  async (): Promise<FeaturedArtistSlot[]> => {
    const supabase = getAdminSupabaseClient()
    const { data: featured, error } = await supabase
      .from('artist_profiles')
      .select('id, slug, stage_name, locality, city, state, bio, pricing_start, profile_image, profile_image_cropped, is_featured, rating, experience_years, approval_status, users(full_name), primary_category:categories(name), categories, custom_categories')
      .eq('approval_status', 'approved')
      .eq('is_featured', true)
      .limit(12)

    if (error) {
      console.error('[homepage] featured artists lookup failed:', error)
      return []
    }

    const featuredArtists = [...((featured ?? []) as PublicArtistRecord[])].sort((a, b) => {
      const aR = a.rating != null ? Number(a.rating) : -1
      const bR = b.rating != null ? Number(b.rating) : -1
      if (aR !== bR) return bR - aR
      const aE = a.experience_years != null ? Number(a.experience_years) : -1
      const bE = b.experience_years != null ? Number(b.experience_years) : -1
      return bE - aE
    })

    return featuredArtists.map(artist => ({
      href: getArtistPublicPath(artist),
      displayName: getArtistDisplayName(artist),
      categories: getArtistCategories(artist).combined,
      location: getArtistLocation(artist) || null,
      profileImage: artist.profile_image_cropped ?? artist.profile_image ?? null,
      pricingStart: artist.pricing_start != null ? Number(artist.pricing_start) : null,
      bio: artist.bio ?? null,
      isFeatured: !!artist.is_featured,
      experienceYears: artist.experience_years != null ? Number(artist.experience_years) : null,
    }))
  },
  ['homepage-featured-artists-v1'],
  { revalidate: 300, tags: ['public-featured-artists'] }
)

export const metadata: Metadata = {
  title: {
    absolute: seoDefaults.title,
  },
  description: seoDefaults.description,
  keywords: seoDefaults.keywords,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: seoDefaults.title,
    description: seoDefaults.description,
    url: absoluteUrl('/'),
    images: [
      {
        url: absoluteUrl(seoDefaults.image),
        width: 1200,
        height: 630,
        alt: seoDefaults.siteName,
      },
    ],
  },
}

export default async function HomePage() {
  const featuredSlots = await getCachedFeaturedArtistSlots()

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebSite',
                name: seoDefaults.siteName,
                url: absoluteUrl('/'),
                potentialAction: {
                  '@type': 'SearchAction',
                  target: `${absoluteUrl('/artists')}?q={search_term_string}`,
                  'query-input': 'required name=search_term_string',
                },
              },
              {
                '@type': 'Organization',
                name: seoDefaults.siteName,
                url: absoluteUrl('/'),
                logo: absoluteUrl('/logo.png'),
                sameAs: [
                  'https://www.instagram.com/showstellar.official',
                  'https://in.linkedin.com/company/show-stellar',
                ],
              },
            ],
          }),
        }}
      />
      <main>
        <section className="relative min-h-[640px] overflow-hidden text-white sm:min-h-[720px] lg:min-h-[840px]">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&h=1080&fit=crop"
              alt="Premium event background"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/95 to-[#0a2148]/90" />
          </div>

          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 h-72 w-72 rounded-full bg-[var(--accent-violet)] blur-3xl" />
            <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-white blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
                  <Star className="h-4 w-4 text-[var(--accent-violet)]" fill="currentColor" />
                  <span>India&apos;s Premium Artist Booking Platform</span>
                </div>

                <h1 className="mt-6 max-w-xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
                  Discover Extraordinary<br />
                  <span style={{ color: 'var(--accent-violet)' }}>
                    Talent
                  </span>{' '}
                  for Your Events
                </h1>

                <p className="mt-6 max-w-xl text-base leading-8 text-white/80 sm:text-lg">
                  Connect with verified professional artists - singers, DJs, dancers, comedians, and more. Make your events unforgettable.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/artists"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--foreground)] shadow-[0_18px_40px_rgba(0,23,57,0.18)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[var(--surface-2)]"
                  >
                    Browse Artists
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/artist-signup"
                    className="inline-flex items-center gap-2 rounded-full border border-white text-sm font-semibold text-white transition-colors hover:bg-white hover:text-[var(--foreground)]"
                    style={{ padding: '0.75rem 1.5rem' }}
                  >
                    Join as Artist
                  </Link>
                </div>

                <div className="mt-8 flex flex-wrap gap-2">
                  {trustPoints.map(point => (
                    <span
                      key={point}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-[var(--accent-violet)]" />
                      {point}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative hidden lg:block">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="relative h-64 w-full overflow-hidden rounded-2xl shadow-2xl">
                      <Image
                        src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400"
                        alt="Artist performing"
                        fill
                        sizes="(min-width: 1024px) 18rem, 100vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="relative h-48 w-full overflow-hidden rounded-2xl shadow-2xl">
                      <Image
                        src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400"
                        alt="Event performance"
                        fill
                        sizes="(min-width: 1024px) 18rem, 100vw"
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-6 pt-12">
                    <div className="relative h-48 w-full overflow-hidden rounded-2xl shadow-2xl">
                      <Image
                        src="https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400"
                        alt="DJ performing"
                        fill
                        sizes="(min-width: 1024px) 18rem, 100vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="relative h-64 w-full overflow-hidden rounded-2xl shadow-2xl">
                      <Image
                        src="https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400"
                        alt="Dance performance"
                        fill
                        sizes="(min-width: 1024px) 18rem, 100vw"
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-12 pb-14 sm:py-14 sm:pb-16 lg:py-16">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-6 max-w-2xl text-center sm:mb-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-light)]">CATEGORIES</p>
              <h2 className="mb-3 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
                Browse by Category
              </h2>
              <p className="text-sm leading-7 text-[var(--muted)] sm:text-base sm:leading-8">
                Find the perfect talent for your event from our curated range of professional artists.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-4">
              {categories.map((category, index) => {
                const isLastOddItem = index === categories.length - 1 && categories.length % 2 === 1

                return (
                <Link
                  key={category.name}
                  href={`/artists?category=${encodeURIComponent(category.filterCategory)}`}
                  className={`group relative overflow-hidden rounded-[1.5rem] border border-[color:var(--border)]/10 bg-white shadow-[0_14px_34px_rgba(0,23,57,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--border)]/20 hover:shadow-[0_22px_48px_rgba(0,23,57,0.14)] ${
                    category.name === 'Singers' || category.name === 'Bands' ? 'md:col-span-1' : ''
                  } ${category.name === 'Singers' ? 'md:col-span-1' : ''} ${
                    isLastOddItem ? 'md:col-span-1' : ''
                  }`}
                >
                  <div className="relative aspect-[4/3] min-h-[140px] md:min-h-[0]">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      sizes="(min-width: 768px) 25vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,23,57,0.86)] via-[rgba(0,23,57,0.18)] to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <h3 className="text-lg font-semibold tracking-tight text-white sm:text-xl">{category.name}</h3>
                    </div>
                  </div>
                </Link>
                )
              })}
            </div>
          </div>
        </section>

        {featuredSlots.length > 0 && (
          <LocationAwareFeatured initialArtists={featuredSlots} />
        )}

        <section id="how-it-works" className="border-y border-[color:var(--border)] bg-[var(--surface-2)]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="rounded-[2.5rem] border border-[color:var(--border)] bg-white px-5 py-8 shadow-[0_28px_80px_rgba(0,23,57,0.08)] sm:px-8 sm:py-10 lg:px-12 lg:py-14">
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]">How it works</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-5xl">
                  How ShowStellar Works
                </h2>
                <p className="mt-4 text-base leading-8 text-[var(--muted)] sm:text-lg">
                  A simple four-step booking journey that helps clients go from discovery to confirmed artist booking with confidence.
                </p>
              </div>

              <div className="mt-10 hidden gap-5 md:grid md:grid-cols-2 xl:grid-cols-4">
                {steps.map((step, index) => (
                  <article
                    key={step.number}
                    className="group overflow-hidden rounded-[1.5rem] border border-[color:var(--border)]/10 bg-[var(--surface-2)] shadow-[0_12px_28px_rgba(0,23,57,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(0,23,57,0.12)]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={step.image}
                        alt={step.title}
                        fill
                        sizes="(min-width: 1280px) 18vw, (min-width: 768px) 45vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#001739]/65 via-[rgba(0,23,57,0.10)] to-transparent" />
                      <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground)] shadow-[0_10px_24px_rgba(0,23,57,0.08)] backdrop-blur">
                        Step {index + 1}
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]">{step.number}</p>
                        <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted-light)]">How it works</span>
                      </div>

                      <h3 className="mt-3 text-lg font-semibold tracking-tight text-[var(--foreground)]">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        {step.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-10 md:hidden">
                <StepsCarousel steps={steps} />
              </div>
            </div>
          </div>
        </section>

        <SectionShell eyebrow="Why ShowStellar" title="Built for high-trust event booking" description="The marketplace is designed to help clients scan quickly, compare clearly, and book with confidence.">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="space-y-6">
              <div className="rounded-[2rem] bg-[var(--accent)] p-8 text-white shadow-[0_22px_54px_rgba(0,23,57,0.2)]">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/60">Trust and value</p>
                <h3 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
                  Premium artists, presented like a real marketplace, not a directory.
                </h3>
                <p className="mt-4 max-w-xl text-base leading-8 text-white/70">
                  Every profile is built to show the right details up front: real media, concise bios, clear pricing, and location context that helps clients decide faster.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    title: 'Curated talent',
                    lines: [
                      'Profiles are approved and presented with a premium-first visual system.',
                      'Clear media, pricing, and category cues help users compare quickly.',
                    ],
                  },
                  {
                    title: 'Direct inquiry',
                    lines: [
                      'Clients can move from discovery to booking without unnecessary friction.',
                      'Location, style, and portfolio structure make each profile feel complete.',
                    ],
                  },
                ].map(item => (
                  <div key={item.title} className="flex h-full flex-col rounded-[1.5rem] border border-[color:var(--border)]/8 bg-white p-4 shadow-[0_12px_28px_rgba(0,23,57,0.05)] sm:rounded-[1.75rem] sm:p-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[0.9rem] bg-[var(--surface-2)] sm:h-10 sm:w-10 sm:rounded-xl">
                      <CheckCircle2 className="h-4.5 w-4.5 text-[var(--foreground)] sm:h-5 sm:w-5" />
                    </div>
                    <h4 className="mt-3 text-[15px] font-semibold leading-snug text-[var(--foreground)] sm:mt-4 sm:text-lg">
                      {item.title}
                    </h4>
                    <div className="mt-2 space-y-1.5 text-[13px] leading-5 text-[var(--muted)] sm:mt-3 sm:text-sm sm:leading-6">
                      {item.lines.map(line => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:pt-10">
              <div className="relative overflow-hidden rounded-[2rem] shadow-[0_24px_60px_rgba(0,23,57,0.16)]">
                <Image
                  src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=2340&auto=format&fit=crop"
                  alt="Live event atmosphere"
                  width={1600}
                  height={1200}
                  priority={false}
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="h-[260px] w-full object-cover sm:h-[320px] lg:h-[380px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#001739]/30 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                  <div className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] backdrop-blur">
                    Live event energy
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionShell>

        <section className="bg-white py-4 pb-20 sm:pb-24 lg:pb-24 lg:pt-4">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2.25rem] border border-[rgba(0,23,57,0.08)] bg-[linear-gradient(180deg,#ffffff_0%,#f5f7fb_100%)] px-6 py-10 text-[var(--foreground)] shadow-[0_24px_60px_rgba(0,23,57,0.08)] sm:px-8 sm:py-12 lg:px-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted-light)]">For artists</p>
                <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                  Build a profile that feels worthy of premium bookings.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--muted)]">
                  Join ShowStellar to showcase your work, pricing, and media in a polished public profile that helps clients book with confidence.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/artist-signup"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(0,23,57,0.14)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#0a2148]"
                >
                  Join as artist
                </Link>
                <Link
                  href="/artist-login"
                  className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,23,57,0.10)] bg-white px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)]"
                >
                  Artist login
                </Link>
              </div>
            </div>
          </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function SectionShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="bg-white py-16 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted-light)]">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">{title}</h2>
          <p className="mt-4 text-base leading-8 text-[var(--muted)]">{description}</p>
        </div>
        {children}
      </div>
    </section>
  )
}
