'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { normalizeArtistCategoryLabel } from '@/lib/artist-categories'

export type FeaturedArtistSlot = {
  href: string
  displayName: string | null
  categories: string[]
  location: string | null
  profileImage: string | null
  pricingStart: number | null
  bio: string | null
  isFeatured: boolean
  experienceYears: number | string | null
}

const GAP_PX = 20 // matches gap-5

const FALLBACK_NAME = 'Artist profile'
const FALLBACK_PRICE = 'Contact for price'
const FALLBACK_CATEGORY = 'Updating soon'
const FALLBACK_LOCATION = 'Updating soon'
const FALLBACK_EXPERIENCE = 'Updating soon'
const FALLBACK_BIO = 'Updating soon'

const trimText = (value?: string | null) => value?.trim() ?? ''

function getFeaturedDisplayName(value?: string | null) {
  const name = trimText(value)
  if (!name || name === 'ShowStellar Artist') return FALLBACK_NAME
  return name
}

function getFeaturedPriceText(value: number | null) {
  if (value === null || Number.isNaN(value)) return FALLBACK_PRICE
  return `₹${value.toLocaleString()}`
}

function getFeaturedCategoryText(categories?: string[] | null) {
  const list = (categories ?? [])
    .map(normalizeArtistCategoryLabel)
    .map(trimText)
    .filter(Boolean)

  if (list.length === 0) return FALLBACK_CATEGORY

  const visible = list.slice(0, 2)
  const extraCount = list.length - visible.length
  return extraCount > 0 ? `${visible.join(', ')} +${extraCount}` : visible.join(', ')
}

function getFeaturedLocationText(value?: string | null) {
  const location = trimText(value)
  return location || FALLBACK_LOCATION
}

function getFeaturedExperienceText(value: number | string | null) {
  if (value === null || value === undefined || value === '') return FALLBACK_EXPERIENCE
  const years = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(years) || years < 0) return FALLBACK_EXPERIENCE
  const normalized = Math.floor(years)
  return `${normalized} ${normalized === 1 ? 'year' : 'years'}`
}

function getFeaturedBioText(value?: string | null) {
  const bio = trimText(value)
  return bio || FALLBACK_BIO
}

export default function FeaturedCarousel({ artists }: { artists: FeaturedArtistSlot[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const isPaused = useRef(false)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(artists.length > 3)

  const needsCarousel = artists.length > 3

  const updateEdges = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 2)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
  }, [])

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
    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current)
    }
  }, [needsCarousel, cardScrollAmount])

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
      {needsCarousel && (
        <div className="mb-5 flex justify-end gap-2">
          <button
            onClick={() => scrollDir('left')}
            disabled={!canLeft}
            aria-label="Previous artists"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(0,23,57,0.10)] bg-white shadow-[0_8px_18px_rgba(0,23,57,0.06)] transition-all hover:-translate-y-0.5 hover:border-[rgba(0,23,57,0.14)] hover:bg-[var(--accent-violet)] hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-inherit"
            style={{ color: '#001739' }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scrollDir('right')}
            disabled={!canRight}
            aria-label="Next artists"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(0,23,57,0.10)] bg-white shadow-[0_8px_18px_rgba(0,23,57,0.06)] transition-all hover:-translate-y-0.5 hover:border-[rgba(0,23,57,0.14)] hover:bg-[var(--accent-violet)] hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-inherit"
            style={{ color: '#001739' }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

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
            <article className="flex h-[500px] flex-col overflow-hidden rounded-[1.75rem] border border-[rgba(0,23,57,0.08)] bg-white shadow-[0_20px_48px_rgba(0,23,57,0.10)] transition-all duration-200 hover:-translate-y-1 hover:border-[rgba(0,23,57,0.14)] hover:shadow-[0_28px_64px_rgba(0,23,57,0.18)] sm:h-[520px] lg:h-[560px]">
              <div className="relative h-[200px] flex-shrink-0 overflow-hidden bg-[linear-gradient(180deg,#f8f9fc_0%,#eef3f9_100%)] sm:h-[220px] lg:h-[250px]">
                {artist.profileImage ? (
                  <Image
                    src={artist.profileImage}
                    alt={getFeaturedDisplayName(artist.displayName)}
                    fill
                    sizes="(max-width: 640px) 86vw, (max-width: 1024px) calc(50vw - 32px), (max-width: 1280px) calc(33vw - 32px)"
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
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

              <div className="flex flex-1 flex-col border-t border-[rgba(0,23,57,0.06)] bg-white px-4 py-3.5 sm:px-5 sm:py-4.5">
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-[var(--foreground)] sm:text-lg">
                      {getFeaturedDisplayName(artist.displayName)}
                    </h3>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Price</div>
                      <div className="mt-0.5 text-sm font-semibold text-[var(--foreground)]">
                        {getFeaturedPriceText(artist.pricingStart)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 space-y-2 text-sm leading-6 text-[var(--muted)]">
                    <p className="line-clamp-1">
                      <span className="font-semibold text-[var(--foreground)]">Category:</span> {getFeaturedCategoryText(artist.categories)}
                    </p>
                    <p className="line-clamp-1">
                      <span className="font-semibold text-[var(--foreground)]">Location:</span> {getFeaturedLocationText(artist.location)}
                    </p>
                    <p className="line-clamp-1">
                      <span className="font-semibold text-[var(--foreground)]">Experience:</span> {getFeaturedExperienceText(artist.experienceYears)}
                    </p>
                    <p className="line-clamp-2">
                      <span className="font-semibold text-[var(--foreground)]">Bio:</span> {getFeaturedBioText(artist.bio)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-[rgba(0,23,57,0.06)] pt-3.5 text-sm text-[var(--muted)]">
                  <span className="inline-flex items-center gap-1 font-medium text-[var(--navy)]">
                    View profile
                    <ArrowRight className="h-4 w-4" />
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
