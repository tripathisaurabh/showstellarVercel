import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Footer from '@/components/Footer'
import {
  buildCityCategoryBreadcrumbJsonLd,
  buildCityCategoryCollectionJsonLd,
  buildCityCategoryItemListJsonLd,
  buildCityCategoryMetadata,
  buildCityCategoryPath,
  getSeoRelatedCategories,
  getSeoRelatedCities,
  loadSeoCityCategoryPage,
  slugifyCity,
} from '@/lib/seo-pages'
import {
  getArtistCategories,
  getArtistDisplayName,
  getArtistLocation,
  getArtistPublicPath,
  getArtistSummaryLine,
  type PublicArtistRecord,
} from '@/lib/artist-profile'

type PageParams = Promise<{ city: string; category: string }>

const FALLBACK_NAME = 'Artist profile'
const FALLBACK_PRICE = 'Contact for price'
const FALLBACK_CATEGORY = 'Updating soon'
const FALLBACK_LOCATION = 'Updating soon'
const FALLBACK_EXPERIENCE = 'Updating soon'
const FALLBACK_BIO = 'Updating soon'

const trimText = (value?: string | null) => value?.trim() ?? ''

function getDisplayName(artist: PublicArtistRecord) {
  const name = trimText(getArtistDisplayName(artist))
  return name || FALLBACK_NAME
}

function getPriceText(value?: number | string | null) {
  const price = value != null ? Number(value) : null
  if (price === null || Number.isNaN(price) || price <= 0) return FALLBACK_PRICE
  return `₹${price.toLocaleString()}`
}

function getCategoryText(artist: PublicArtistRecord) {
  const categories = getArtistCategories(artist).combined.map(trimText).filter(Boolean)
  if (categories.length === 0) return FALLBACK_CATEGORY
  const visible = categories.slice(0, 2)
  const extra = categories.length - visible.length
  return extra > 0 ? `${visible.join(', ')} +${extra}` : visible.join(', ')
}

function getLocationText(artist: PublicArtistRecord) {
  return trimText(getArtistLocation(artist) || artist.city) || FALLBACK_LOCATION
}

function getExperienceText(value?: number | null) {
  if (value == null || value <= 0) return FALLBACK_EXPERIENCE
  return `${value} ${value === 1 ? 'year' : 'years'}`
}

function getBioText(artist: PublicArtistRecord) {
  return trimText(artist.bio) || getArtistSummaryLine(artist) || FALLBACK_BIO
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { city, category } = await params
  const page = await loadSeoCityCategoryPage(city, category)

  if (!page || page.artists.length === 0) {
    return {
      title: 'Artists not found | ShowStellar',
      robots: { index: false, follow: false },
    }
  }

  return buildCityCategoryMetadata(page.cityLabel, page.category.pluralLabel, page.citySlug, page.category.slug, page.artists.length)
}

export default async function CityCategorySeoPage({ params }: { params: PageParams }) {
  const { city, category } = await params
  const page = await loadSeoCityCategoryPage(city, category)

  if (!page || page.artists.length === 0) {
    notFound()
  }

  const { cityLabel, category: categoryDef, canonicalPath, artists } = page
  const title = `${categoryDef.pluralLabel} in ${cityLabel}`
  const intro = `Looking to book ${categoryDef.pluralLabel.toLowerCase()} in ${cityLabel}? ShowStellar helps you compare verified profiles, pricing, languages, experience, and performance style in one place.`
  const guidance = `This page is useful for weddings, birthdays, sangeets, corporate events, and private celebrations where you want the right artist without sorting through unrelated results. Review each profile for photo quality, event types, and booking fit before reaching out.`
  const relatedCategories = getSeoRelatedCategories(categoryDef.slug, 4)
  const relatedCities = getSeoRelatedCities(cityLabel, 4)

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              buildCityCategoryCollectionJsonLd(cityLabel, categoryDef.pluralLabel, canonicalPath),
              buildCityCategoryItemListJsonLd(artists, canonicalPath),
              buildCityCategoryBreadcrumbJsonLd(cityLabel, categoryDef.pluralLabel, canonicalPath),
            ],
          }),
        }}
      />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center gap-2 text-sm text-[var(--muted)]" aria-label="Breadcrumb">
          <Link href="/" className="transition-opacity hover:opacity-70">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/artists" className="transition-opacity hover:opacity-70">Artists</Link>
          <span aria-hidden="true">/</span>
          <span className="text-[var(--foreground)]">{categoryDef.pluralLabel} in {cityLabel}</span>
        </nav>

        <section className="rounded-[2rem] border border-[var(--border)] bg-white px-5 py-7 shadow-[0_18px_44px_rgba(0,23,57,0.06)] sm:px-8 sm:py-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-light)]">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-violet)]" />
            <span>Featured artists</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">
            {intro}
          </p>
          <p className="mt-3 max-w-3xl text-base leading-8 text-[var(--muted)]">
            {guidance}
          </p>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-[var(--muted)]">
              Showing <span className="font-semibold text-[var(--foreground)]">{artists.length}</span> verified artists
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {artists.map((artist, index) => {
              const displayName = getDisplayName(artist)
              const priceText = getPriceText(artist.pricing_start)
              const categoryText = getCategoryText(artist)
              const locationText = getLocationText(artist)
              const experienceText = getExperienceText(artist.experience_years)
              const bioText = getBioText(artist)
              const image = artist.profile_image_cropped ?? artist.profile_image ?? null

              return (
                <Link key={artist.id} href={getArtistPublicPath(artist)} className="group block h-full">
                  <article className="flex h-[500px] flex-col overflow-hidden rounded-[1.75rem] border border-[rgba(0,23,57,0.08)] bg-white shadow-[0_20px_48px_rgba(0,23,57,0.10)] transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(0,23,57,0.14)] hover:shadow-[0_28px_64px_rgba(0,23,57,0.18)] sm:h-[520px] lg:h-[560px]">
                    <div className="relative flex h-[220px] items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#eef2f7_100%)] sm:h-[240px] lg:h-[280px]">
                      {image ? (
                        <Image
                          src={image}
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

                    <div className="flex flex-1 flex-col px-4 py-3.5 sm:px-5 sm:py-4.5">
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-4">
                          <h2 className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-[var(--foreground)] sm:text-lg">
                            {displayName}
                          </h2>
                          <div className="flex-shrink-0 text-right">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Price</div>
                            <div className="mt-0.5 text-sm font-semibold text-[var(--foreground)]">
                              {priceText}
                            </div>
                          </div>
                        </div>

                        <div className="mt-2.5 space-y-2 text-sm leading-6 text-[var(--muted)]">
                          <p className="line-clamp-1">
                            <span className="font-semibold text-[var(--foreground)]">Category:</span> {categoryText}
                          </p>
                          <p className="line-clamp-1">
                            <span className="font-semibold text-[var(--foreground)]">Location:</span> {locationText}
                          </p>
                          <p className="line-clamp-1">
                            <span className="font-semibold text-[var(--foreground)]">Experience:</span> {experienceText}
                          </p>
                          <p className="line-clamp-2">
                            <span className="font-semibold text-[var(--foreground)]">Bio:</span> {bioText}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[rgba(0,23,57,0.06)] pt-3.5 text-sm text-[var(--muted)]">
                        <span className="inline-flex items-center gap-1 font-medium text-[var(--navy)]">
                          View profile
                          <span aria-hidden="true">→</span>
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-[0_18px_44px_rgba(0,23,57,0.06)]">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              What to check before booking {categoryDef.singularLabel.toLowerCase()} in {cityLabel}
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--muted)]">
              <p>
                Compare profile photos, event types, languages, and experience so the artist matches your audience and venue.
              </p>
              <p>
                For weddings, birthdays, and corporate events, it helps to shortlist performers who have a similar style, budget, and availability window before you start the conversation.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Check whether the artist has performed at similar events before.</li>
                <li>Confirm the expected setup, timing, and location in advance.</li>
                <li>Review the price shown on the profile and ask about travel or add-ons if needed.</li>
              </ul>
            </div>
          </article>

          <aside className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-[0_18px_44px_rgba(0,23,57,0.06)]">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Related searches</h2>
            <div className="mt-4 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-light)]">More categories in {cityLabel}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {relatedCategories.map(item => (
                    <Link
                      key={item.slug}
                      href={buildCityCategoryPath(page.citySlug, item.slug)}
                      className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)]"
                    >
                      {item.pluralLabel}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-light)]">Same category in nearby cities</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {relatedCities.map(relatedCity => (
                    <Link
                      key={relatedCity}
                      href={`/${slugifyCity(relatedCity)}/${categoryDef.slug}`}
                      className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)]"
                    >
                      {categoryDef.pluralLabel} in {relatedCity}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-8 rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-[0_18px_44px_rgba(0,23,57,0.06)]">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">FAQ</h2>
          <div className="mt-4 space-y-3">
            {[
              {
                q: `How do I choose the right ${categoryDef.singularLabel.toLowerCase()}?`,
                a: `Look at the artist's photos, experience, event types, and location so you can match the style to your event.`,
              },
              {
                q: `Can I book ${categoryDef.pluralLabel.toLowerCase()} for corporate events?`,
                a: `Yes. Many artists on ShowStellar can perform at weddings, birthdays, private parties, and corporate functions. Check the profile details before you inquire.`,
              },
              {
                q: `What if the price is missing?`,
                a: `Some artists prefer to discuss pricing after understanding the event details. You can still view the profile and send an inquiry.`,
              },
            ].map(item => (
              <details key={item.q} className="rounded-[1.25rem] border border-[var(--border)] px-4 py-3">
                <summary className="cursor-pointer text-sm font-semibold text-[var(--foreground)]">{item.q}</summary>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
