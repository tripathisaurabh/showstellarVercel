import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimitRequest } from '@/lib/rate-limit'
import {
  getArtistDisplayName,
  getArtistLocation,
  getArtistPublicPath,
  getArtistCategories,
  type PublicArtistRecord,
} from '@/lib/artist-profile'
import type { FeaturedArtistSlot } from '@/components/FeaturedCarousel'

export async function GET(request: Request) {
  const rateLimit = await rateLimitRequest(request, 'featured-artists', 30, 60_000)
  if (!rateLimit.ok) {
    return NextResponse.json(
      { artists: [] },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      }
    )
  }

  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city')?.trim() ?? ''

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('artist_profiles')
    .select('*, users(full_name), primary_category:categories(name), categories, custom_categories')
    .eq('approval_status', 'approved')
    .eq('is_featured', true)
    .limit(20)

  if (error) {
    console.error('[featured-artists] query failed:', error)
    return NextResponse.json({ artists: [] }, { status: 500 })
  }

  const artists = (data ?? []) as PublicArtistRecord[]

  // Ranking: 1) city match  2) rating desc  3) experience desc
  const norm = (s: string | null | undefined) => (s ?? '').toLowerCase().trim()
  const cityNorm = norm(city)

  const scored = artists.map(a => {
    const artistCity = norm(a.city)
    const cityMatch =
      cityNorm.length > 0 &&
      (artistCity.includes(cityNorm) || cityNorm.includes(artistCity))
    const rating = a.rating != null ? Number(a.rating) : -1
    const exp = a.experience_years != null ? Number(a.experience_years) : -1
    return { artist: a, cityMatch, rating, exp }
  })

  scored.sort((a, b) => {
    if (a.cityMatch !== b.cityMatch) return a.cityMatch ? -1 : 1
    if (a.rating !== b.rating) return b.rating - a.rating
    return b.exp - a.exp
  })

  const slots: FeaturedArtistSlot[] = scored.slice(0, 6).map(({ artist }) => ({
    href: getArtistPublicPath(artist),
    displayName: getArtistDisplayName(artist),
    categoryLabel: getArtistCategories(artist).summary || 'Artist',
    location: getArtistLocation(artist) || null,
    profileImage: artist.profile_image ?? null,
    pricingStart: artist.pricing_start != null ? Number(artist.pricing_start) : null,
    bio: artist.bio ?? null,
    isFeatured: !!artist.is_featured,
    rating: artist.rating != null ? Number(artist.rating) : null,
    experienceYears: artist.experience_years != null ? Number(artist.experience_years) : null,
  }))

  return NextResponse.json({ artists: slots })
}
