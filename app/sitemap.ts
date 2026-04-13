import type { MetadataRoute } from 'next'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { absoluteUrl } from '@/lib/seo'
import type { PublicArtistRecord } from '@/lib/artist-profile'
import { collectSeoCityCategoryRoutes, isArtistSeoIndexable } from '@/lib/seo-pages'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: new Date() },
    { url: absoluteUrl('/about'), lastModified: new Date() },
    { url: absoluteUrl('/contact'), lastModified: new Date() },
    { url: absoluteUrl('/for-artist'), lastModified: new Date() },
    { url: absoluteUrl('/privacy-policy'), lastModified: new Date() },
    { url: absoluteUrl('/terms-of-service'), lastModified: new Date() },
    { url: absoluteUrl('/support'), lastModified: new Date() },
    { url: absoluteUrl('/artists'), lastModified: new Date() },
  ]

  try {
    const supabase = getAdminSupabaseClient()
    const { data } = await supabase
      .from('artist_profiles')
      .select('slug, id, created_at, stage_name, bio, profile_image, profile_image_cropped, profile_image_original, rating, experience_years, city, locality, state, categories, custom_categories, artist_media(id, media_url, type), users(full_name), primary_category:categories(name)')
      .eq('approval_status', 'approved')

    const approvedArtists = (data ?? []) as PublicArtistRecord[]

    const artistRoutes =
      approvedArtists
        .filter(artist => isArtistSeoIndexable(artist))
        .map((artist: PublicArtistRecord) => ({
          url: absoluteUrl(`/artist/${artist.slug ?? artist.id}`),
          lastModified: artist.created_at ? new Date(artist.created_at) : new Date(),
        }))

    const cityCategoryRoutes = collectSeoCityCategoryRoutes((data ?? []) as unknown as PublicArtistRecord[]).map(url => ({
      url: absoluteUrl(url),
      lastModified: new Date(),
    }))

    return [...staticRoutes, ...artistRoutes, ...cityCategoryRoutes]
  } catch {
    return staticRoutes
  }
}
