import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Footer from '@/components/Footer'
import ArtistListingCard from '@/components/ArtistListingCard'
import PaginationControls from '@/components/PaginationControls'
import { normalizeArtistListingPage } from '@/lib/artist-listing'
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

type PageParams = Promise<{ city: string; category: string }>
type PageSearchParams = Promise<{ page?: string }>

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: PageParams
  searchParams: PageSearchParams
}): Promise<Metadata> {
  const { city, category } = await params
  const resolvedSearchParams = await searchParams
  const page = normalizeArtistListingPage(resolvedSearchParams.page)
  const pageData = await loadSeoCityCategoryPage(city, category, page)

  if (!pageData || pageData.totalPages === 0 || pageData.page > pageData.totalPages) {
    return {
      title: 'Artists not found | ShowStellar',
      robots: { index: false, follow: false },
    }
  }

  return buildCityCategoryMetadata(
    pageData.cityLabel,
    pageData.category.pluralLabel,
    pageData.citySlug,
    pageData.category.slug,
    pageData.total,
    pageData.page
  )
}

export default async function CityCategorySeoPage({
  params,
  searchParams,
}: {
  params: PageParams
  searchParams: PageSearchParams
}) {
  const { city, category } = await params
  const resolvedSearchParams = await searchParams
  const page = normalizeArtistListingPage(resolvedSearchParams.page)
  const pageData = await loadSeoCityCategoryPage(city, category, page)

  if (!pageData || pageData.totalPages === 0 || pageData.page > pageData.totalPages) {
    notFound()
  }

  const { cityLabel, category: categoryDef, canonicalPath, artists, total, totalPages } = pageData
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
              Showing <span className="font-semibold text-[var(--foreground)]">{artists.length}</span> of{' '}
              <span className="font-semibold text-[var(--foreground)]">{total}</span> verified artists
              {totalPages > 1 ? ` · Page ${page}` : ''}
            </p>
          </div>

          {artists.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-white p-10 text-center sm:p-16">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl" style={{ background: 'var(--surface-2)' }}>
                <span className="text-4xl">🎭</span>
              </div>
              <h3 className="mb-3 text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
                No artists found
              </h3>
              <p className="mb-6" style={{ color: 'var(--muted)' }}>
                Try exploring nearby cities or related categories.
              </p>
              <Link
                href="/artists"
                className="inline-block rounded-xl border px-6 py-3 text-sm font-semibold transition-colors hover:opacity-80"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
              >
                Browse all artists
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {artists.map(artist => (
                  <ArtistListingCard key={artist.id} artist={artist} />
                ))}
              </div>

              <PaginationControls
                pathname={buildCityCategoryPath(city, categoryDef.slug)}
                query={{}}
                page={page}
                totalPages={totalPages}
                label={`${categoryDef.pluralLabel} in ${cityLabel} pagination`}
              />
            </>
          )}
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
                      href={buildCityCategoryPath(pageData.citySlug, item.slug)}
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
