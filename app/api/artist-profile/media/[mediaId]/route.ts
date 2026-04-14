import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ mediaId: string }> }
) {
  const { mediaId } = await context.params

  if (!mediaId) {
    return NextResponse.json({ ok: false, error: 'Missing media identifier' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = getAdminSupabaseClient()

  const { data: profile, error: profileError } = await (adminClient
    .from('artist_profiles') as unknown as {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<{ data: { id: string } | null; error: { message?: string } | null }>
      }
    }
  })
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[artist-media-delete] profile lookup failed:', profileError)
    return NextResponse.json({ ok: false, error: 'Unable to delete media' }, { status: 500 })
  }

  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Artist profile not found' }, { status: 404 })
  }

  const { data: media, error: mediaError } = await adminClient
    .from('artist_media')
    .select('id, artist_id')
    .eq('id', mediaId)
    .eq('artist_id', profile.id)
    .maybeSingle()

  if (mediaError) {
    console.error('[artist-media-delete] lookup failed:', mediaError)
    return NextResponse.json({ ok: false, error: 'Unable to delete media' }, { status: 500 })
  }

  if (!media) {
    return NextResponse.json({ ok: false, error: 'Media item not found' }, { status: 404 })
  }

  const deleteResult = await adminClient.from('artist_media').delete().eq('id', mediaId).eq('artist_id', profile.id)

  if (deleteResult.error) {
    console.error('[artist-media-delete] delete failed:', deleteResult.error)
    return NextResponse.json({ ok: false, error: 'Unable to delete media' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
