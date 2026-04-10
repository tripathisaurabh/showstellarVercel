'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ChevronLeft, ChevronRight, Star } from 'lucide-react'

export type FeaturedArtistSlot = {
  href: string
  displayName: string
  categoryLabel: string
  location: string | null
  profileImage: string | null
  pricingStart: number | null
  bio: string | null
  isFeatured: boolean
  rating: number | null
  experienceYears: number | null
}

const GAP_PX = 20 // matches gap-5

export default function FeaturedCarousel({ artists }: { artists: FeaturedArtistSlot[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const isPaused = useRef(false)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(artists.length > 3)

  const needsCarousel = artists.length > 3

  // ── edge detection ──────────────────────────────────────────────────────────
  const updateEdges = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 2)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
  }, [])

  // ── scroll by one card ──────────────────────────────────────────────────────
  const cardScrollAmount = useCallback(() => {
    const card = trackRef.current?.querySelector<HTMLElement>('[data-fc]')
    return card ? card.offsetWidth + GAP_PX : 0
  }, [])

  const scrollDir = useCallback((dir: 'left' | 'right') => {
    const el = trackRef.current
    if (!el) return
    const amount = cardScrollAmount()
    el.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' })
  }, [cardScrollAmount])

  // ── auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!needsCarousel) return

    const tick = () => {
      if (isPaused.current) return
      const el = trackRef.current
      if (!el) return
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
      el.scrollBy({ left: atEnd ? -el.scrollWidth : cardScrollAmount(), behavior: 'smooth' })
    }

    autoTimerRef.current = setInterval(tick, 4000)
    return () => { if (autoTimerRef.current) clearInterval(autoTimerRef.current) }
  }, [needsCarousel, cardScrollAmount])

  // ── pause/resume helpers ────────────────────────────────────────────────────
  const pauseAuto = () => { isPaused.current = true }
  const scheduleResume = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = setTimeout(() => { isPaused.current = false }, 2500)
  }

  const handleScroll = () => {
    updateEdges()
    pauseAuto()
    scheduleResume()
  }

  useEffect(() => { updateEdges() }, [updateEdges])

  return (
    <div
      className="relative"
      onMouseEnter={pauseAuto}
      onMouseLeave={() => { isPaused.current = false }}
    >
      {/* Arrow controls — shown only when carousel is needed */}
      {needsCarousel && (
        <div className="flex justify-end gap-2 mb-5">
          <button
            onClick={() => scrollDir('left')}
            disabled={!canLeft}
            aria-label="Previous artists"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(0,23,57,0.10)] bg-white shadow-[0_8px_18px_rgba(0,23,57,0.06)] transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-violet)] hover:text-white hover:border-[rgba(0,23,57,0.14)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-inherit"
            style={{ color: '#001739' }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollDir('right')}
            disabled={!canRight}
            aria-label="Next artists"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(0,23,57,0.10)] bg-white shadow-[0_8px_18px_rgba(0,23,57,0.06)] transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-violet)] hover:text-white hover:border-[rgba(0,23,57,0.14)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-inherit"
            style={{ color: '#001739' }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scroll track */}
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex items-stretch gap-5 overflow-x-auto py-1 no-scrollbar"
        style={{ scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }}
      >
        {artists.map((artist, i) => (
          <Link
            key={i}
            href={artist.href}
            data-fc
            className="group flex-shrink-0 w-[86%] sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]"
            style={{ scrollSnapAlign: 'start' }}
          >
            <article className="flex min-h-[500px] flex-col overflow-hidden rounded-[1.75rem] border border-[rgba(0,23,57,0.08)] bg-white shadow-[0_20px_48px_rgba(0,23,57,0.10)] transition-all duration-200 hover:-translate-y-1 hover:border-[rgba(0,23,57,0.14)] hover:shadow-[0_28px_64px_rgba(0,23,57,0.18)] sm:min-h-[520px] lg:min-h-[540px]">
              <div className="relative aspect-[4/3] overflow-hidden flex-shrink-0">
                {artist.profileImage ? (
                  <Image
                    src={artist.profileImage}
                    alt={artist.displayName}
                    fill
                    sizes="(max-width: 640px) 86vw, (max-width: 1024px) calc(50vw - 32px), calc(33vw - 32px)"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    loading={i < 3 ? 'eager' : 'lazy'}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,var(--surface-2),var(--background))] text-5xl">
                    🎭
                  </div>
                )}
                {artist.isFeatured && (
                  <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-[var(--navy)]/92 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                    Featured
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[var(--navy)]/22 to-transparent" />
              </div>
              <div className="flex flex-1 flex-col border-t border-[rgba(0,23,57,0.06)] bg-white p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-semibold tracking-tight text-[var(--foreground)]">
                      {artist.displayName}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                      {artist.categoryLabel || 'Artist'}
                      {artist.location ? ` • ${artist.location}` : ''}
                    </p>
                  </div>
                  {artist.pricingStart !== null && (
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Starts from</div>
                      <div className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                        ₹{artist.pricingStart.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                {(artist.rating !== null || (artist.experienceYears !== null && artist.experienceYears > 0)) && (
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)]/10 bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)]">
                      <Star className="h-3.5 w-3.5 fill-[var(--navy)] text-[var(--navy)]" />
                      {artist.rating !== null
                        ? artist.rating.toFixed(1)
                        : artist.experienceYears !== null && artist.experienceYears > 0
                          ? `${artist.experienceYears} yrs exp`
                          : 'New'}
                      {artist.rating !== null && artist.experienceYears !== null && artist.experienceYears > 0 ? (
                        <span className="font-medium text-[var(--muted)]">• {artist.experienceYears} yrs exp</span>
                      ) : null}
                    </span>
                  </div>
                )}

                {artist.bio && (
                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-[var(--muted)] sm:line-clamp-3">
                    <span className="font-semibold text-[var(--foreground)]">About:</span> {artist.bio}
                  </p>
                )}

                <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-sm text-[var(--muted)]">
                  <span className="inline-flex items-center gap-1 font-medium text-[var(--navy)]">
                    View profile
                    <ArrowRight className="h-4 w-4" />
                  </span>
                  <span className="text-xs uppercase tracking-[0.14em] text-[var(--muted-light)]">
                    Tap to open
                  </span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  )
}
