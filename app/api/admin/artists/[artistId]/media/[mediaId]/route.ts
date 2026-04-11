import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-access'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ artistId: string; mediaId: string }> }
) {
  const { artistId, mediaId } = await context.params

  if (!artistId || !mediaId) {
    return NextResponse.json({ ok: false, error: 'Missing media identifier' }, { status: 400 })
  }

  const { adminClient, isAdmin } = await getAdminSession()

  if (!adminClient || !isAdmin) {
    return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 })
  }

  const { data: media, error: mediaError } = await adminClient
    .from('artist_media')
    .select('id, artist_id')
    .eq('id', mediaId)
    .eq('artist_id', artistId)
    .maybeSingle()

  if (mediaError) {
    console.error('[admin-media-delete] lookup failed:', mediaError)
    return NextResponse.json({ ok: false, error: 'Unable to delete media' }, { status: 500 })
  }

  if (!media) {
    return NextResponse.json({ ok: false, error: 'Media item not found' }, { status: 404 })
  }

  const deleteResult = await adminClient.from('artist_media').delete().eq('id', mediaId).eq('artist_id', artistId)

  if (deleteResult.error) {
    console.error('[admin-media-delete] delete failed:', deleteResult.error)
    return NextResponse.json({ ok: false, error: 'Unable to delete media' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
