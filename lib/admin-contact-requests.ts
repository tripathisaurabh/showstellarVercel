import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { getArtistDisplayName, getArtistPublicPath } from '@/lib/artist-profile'

export type EmailChangeRequestRecord = {
  id: string
  artist_id: string
  user_id: string
  current_email: string
  requested_email: string
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string | null
  updated_at: string | null
  artist_profiles?: {
    id: string
    slug: string | null
    stage_name: string | null
    city: string | null
    locality: string | null
    users?: {
      full_name?: string | null
      email?: string | null
    } | null
  } | null
}

export type EmailChangeRequestCard = {
  id: string
  artistId: string
  artistName: string
  artistPublicPath: string
  city: string
  currentEmail: string
  requestedEmail: string
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string | null
  updatedAt: string | null
}

export async function loadEmailChangeRequests() {
  const adminClient = getAdminSupabaseClient()

  const { data, error } = await (adminClient.from('email_change_requests') as unknown as {
    select(columns: string): {
      order(column: string, options?: { ascending?: boolean }): Promise<{ data: EmailChangeRequestRecord[] | null; error: { message?: string } | null }>
    }
  })
    .select(
      'id, artist_id, user_id, current_email, requested_email, reason, status, created_at, updated_at, artist_profiles(id, slug, stage_name, city, locality, users(full_name, email))'
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin-contact-requests] failed to load email change requests:', error)
    return []
  }

  const requests = (data ?? []).map(request => {
    const artist = request.artist_profiles ?? null
    return {
      id: request.id,
      artistId: request.artist_id,
      artistName: artist
        ? getArtistDisplayName({
            id: artist.id,
            slug: artist.slug,
            stage_name: artist.stage_name,
            city: artist.city,
            locality: artist.locality,
            users: {
              full_name: artist.users?.full_name ?? null,
              email: artist.users?.email ?? null,
            },
          })
        : 'Artist profile',
      artistPublicPath: artist
        ? getArtistPublicPath({
            id: artist.id,
            slug: artist.slug,
          })
        : `/artist/${request.artist_id}`,
      city: artist?.city ?? artist?.locality ?? 'Updating soon',
      currentEmail: request.current_email,
      requestedEmail: request.requested_email,
      reason: request.reason,
      status: request.status,
      createdAt: request.created_at,
      updatedAt: request.updated_at,
    } satisfies EmailChangeRequestCard
  })

  return requests
}
