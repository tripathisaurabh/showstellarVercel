import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-access'
import {
  ADMIN_MEDIA_MAX_SIZE_MB,
  buildAdminStoragePath,
  getAdminFileTypeError,
  getSafeFileExtension,
} from '@/lib/admin-file-upload'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  context: { params: Promise<{ artistId: string }> }
) {
  const { artistId } = await context.params

  if (!artistId) {
    return NextResponse.json({ ok: false, error: 'Missing artistId' }, { status: 400 })
  }

  const { adminClient, isAdmin } = await getAdminSession()

  if (!adminClient || !isAdmin) {
    return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid form payload' }, { status: 400 })
  }

  const fileValue = formData.get('file')
  if (!(fileValue instanceof File)) {
    return NextResponse.json({ ok: false, error: 'Missing media file' }, { status: 400 })
  }

  const validationError = getAdminFileTypeError(fileValue, 'media')
  if (validationError) {
    return NextResponse.json({ ok: false, error: validationError }, { status: 400 })
  }

  if (fileValue.size > ADMIN_MEDIA_MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json(
      { ok: false, error: `File must be ${ADMIN_MEDIA_MAX_SIZE_MB}MB or smaller.` },
      { status: 400 }
    )
  }

  const { data: profile, error: profileError } = await adminClient
    .from('artist_profiles')
    .select('id')
    .eq('id', artistId)
    .maybeSingle()

  if (profileError) {
    console.error('[admin-media] profile lookup failed:', profileError)
    return NextResponse.json({ ok: false, error: 'Unable to upload media' }, { status: 500 })
  }

  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Artist not found' }, { status: 404 })
  }

  const mediaType = fileValue.type.startsWith('video') ? 'video' : 'image'
  const extension = mediaType === 'video' ? getSafeFileExtension(fileValue) : getSafeFileExtension(fileValue)
  const path = buildAdminStoragePath('gallery', artistId, fileValue, { extension })

  const upload = await adminClient.storage.from('artist-media').upload(
    path,
    Buffer.from(await fileValue.arrayBuffer()),
    {
      upsert: true,
      contentType: fileValue.type || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
    }
  )

  if (upload.error) {
    console.error('[admin-media] upload failed:', upload.error)
    return NextResponse.json({ ok: false, error: 'Unable to upload media' }, { status: 500 })
  }

  const publicUrl = adminClient.storage.from('artist-media').getPublicUrl(path).data.publicUrl

  const insertResult = await (adminClient.from('artist_media') as unknown as {
    insert(values: Record<string, unknown>): {
      select(columns: string): {
        maybeSingle(): Promise<{ data: { id: string; media_url: string; type: 'image' | 'video' } | null; error: { message?: string } | null }>
      }
    }
  })
    .insert({ artist_id: artistId, media_url: publicUrl, type: mediaType })
    .select('id, media_url, type')
    .maybeSingle()

  if (insertResult.error || !insertResult.data) {
    console.error('[admin-media] insert failed:', insertResult.error)
    return NextResponse.json({ ok: false, error: 'Unable to save media' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    media: insertResult.data,
  })
}
