'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import FeaturedCarousel, { type FeaturedArtistSlot } from '@/components/FeaturedCarousel'

const CITY_STORAGE_KEY = 'ss_city'

// Pure fetch — returns data, never calls setState
async function fetchCityArtists(cityName: string): Promise<FeaturedArtistSlot[] | null> {
  try {
    const res = await fetch(
      `/api/featured-artists?city=${encodeURIComponent(cityName)}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return null
    const data = await res.json() as { artists?: FeaturedArtistSlot[] }
    return data.artists ?? []
  } catch {
    return null
  }
}

// Pure fetch — resolves city name from coordinates via BigDataCloud (free, no key)
async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return null
    const geo = await res.json() as { city?: string; locality?: string; principalSubdivision?: string }
    return geo.city || geo.locality || geo.principalSubdivision || null
  } catch {
    return null
  }
}

type Props = { initialArtists: FeaturedArtistSlot[] }

export default function LocationAwareFeatured({ initialArtists }: Props) {
  const [artists, setArtists] = useState(initialArtists)
  const [city, setCity] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let timeoutId: number | null = null
    let idleId: number | null = null
    const callbackWindow = window as Window & {
      requestIdleCallback?: (cb: IdleRequestCallback, options?: IdleRequestOptions) => number
      cancelIdleCallback?: (id: number) => void
    }

    async function applyCity(cityName: string) {
      const result = await fetchCityArtists(cityName)
      if (!active || !result) return
      setArtists(result)
      setCity(cityName)
    }

    async function init() {
      // 1. Previously saved city → instant, no permission prompt
      const saved = localStorage.getItem(CITY_STORAGE_KEY)
      if (saved) {
        await applyCity(saved)
        return
      }

      // 2. Browser geolocation (deferred until idle) → reverse-geocode → fetch
      if (!('geolocation' in navigator)) return

      const runGeolocation = () => {
        navigator.geolocation.getCurrentPosition(
          async pos => {
            if (!active) return
            const detected = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
            if (!detected || !active) return
            localStorage.setItem(CITY_STORAGE_KEY, detected)
            await applyCity(detected)
          },
          () => { /* denied — keep initial */ },
          { timeout: 6000 }
        )
      }

      if (typeof callbackWindow.requestIdleCallback === 'function') {
        idleId = callbackWindow.requestIdleCallback(() => {
          void runGeolocation()
        }, { timeout: 2200 })
        return
      }

      timeoutId = window.setTimeout(() => {
        void runGeolocation()
      }, 1200)
    }

    void init()
    return () => {
      active = false
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
      if (idleId !== null && typeof callbackWindow.cancelIdleCallback === 'function') {
        callbackWindow.cancelIdleCallback(idleId)
      }
    }
  }, [])

  if (artists.length === 0) return null

  const title = city ? `Featured in ${city}` : 'Featured Artists Near You'
  const description = city
    ? `Top-rated artists available in ${city} — curated for your next event.`
    : 'Top-rated artists available near you — curated for your next event.'

  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] border border-[rgba(0,23,57,0.08)] bg-white px-4 py-8 shadow-[0_24px_64px_rgba(0,23,57,0.08)] sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <div className="mb-6 max-w-2xl">
            <div className="flex items-center gap-3">
              <Image
                src="/socialmedia.png"
                alt="ShowStellar"
                width={16}
                height={16}
                className="h-4 w-4 rounded-full object-contain"
              />
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted-light)]">Featured artists</p>
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">{title}</h2>
            <p className="mt-3 text-base leading-8 text-[var(--muted)]">{description}</p>
          </div>
          <FeaturedCarousel artists={artists} />
        </div>
      </div>
    </section>
  )
}
