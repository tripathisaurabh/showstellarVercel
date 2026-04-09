import type { MetadataRoute } from 'next'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { absoluteUrl } from '@/lib/seo'

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
      .select('slug, id, created_at')
      .eq('approval_status', 'approved')

    const artistRoutes =
      data?.map((artist: { slug?: string | null; id: string; created_at?: string | null }) => ({
        url: absoluteUrl(`/artist/${artist.slug ?? artist.id}`),
        lastModified: artist.created_at ? new Date(artist.created_at) : new Date(),
      })) ?? []

    return [...staticRoutes, ...artistRoutes]
  } catch {
    return staticRoutes
  }
}
