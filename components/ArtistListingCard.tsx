import Image from 'next/image'
import Link from 'next/link'
import type { PublicArtistRecord } from '@/lib/artist-profile'
import { getArtistListingDisplayData } from '@/lib/artist-listing'

type Props = {
  artist: PublicArtistRecord
}

export default function ArtistListingCard({ artist }: Props) {
  const {
    displayName,
    priceText,
    categoryText,
    locationText,
    experienceText,
    bioText,
    imageUrl,
    isFeatured,
    href,
  } = getArtistListingDisplayData(artist)

  return (
    <Link href={href} className="group block h-full">
      <article className="flex h-[500px] flex-col overflow-hidden rounded-[1.75rem] border border-[rgba(0,23,57,0.08)] bg-white shadow-[0_20px_48px_rgba(0,23,57,0.10)] transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(0,23,57,0.14)] hover:shadow-[0_28px_64px_rgba(0,23,57,0.18)] sm:h-[520px] lg:h-[560px]">
        <div className="relative flex h-[220px] items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#eef2f7_100%)] sm:h-[240px] lg:h-[280px]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={displayName}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.01]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(180deg,#ffffff_0%,#eef2f7_100%)] text-4xl sm:text-5xl">
              🎭
            </div>
          )}
          {isFeatured && (
            <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-[var(--navy)] px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_10px_24px_rgba(0,23,57,0.2)] sm:left-4 sm:top-4 sm:text-xs">
              Featured
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[1rem] font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-[1.05rem]">
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

          <div className="mt-3 space-y-2 text-[13px] leading-5 text-[var(--muted)] sm:text-sm sm:leading-6">
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
      </article>
    </Link>
  )
}
