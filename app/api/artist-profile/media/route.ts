import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import {
  ADMIN_MEDIA_MAX_SIZE_MB,
  buildAdminStoragePath,
  getArtistMediaLimitError,
  getAdminFileTypeError,
  getSafeFileExtension,
} from '@/lib/admin-file-upload'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
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
        maybeSingle(): Promise<{ data: { id: string; user_id: string } | null; error: { message?: string } | null }>
      }
    }
  })
    .select('id, user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[artist-media] profile lookup failed:', profileError)
    return NextResponse.json({ ok: false, error: 'Unable to upload media' }, { status: 500 })
  }

  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Artist profile not found' }, { status: 404 })
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

  const { data: existingMedia, error: existingMediaError } = await adminClient
    .from('artist_media')
    .select('id')
    .eq('artist_id', profile.id)

  if (existingMediaError) {
    console.error('[artist-media] existing media lookup failed:', existingMediaError)
    return NextResponse.json({ ok: false, error: 'Unable to upload media' }, { status: 500 })
  }

  const limitError = getArtistMediaLimitError(existingMedia?.length ?? 0, 1)
  if (limitError) {
    return NextResponse.json({ ok: false, error: limitError }, { status: 400 })
  }

  const mediaType = fileValue.type.startsWith('video') ? 'video' : 'image'
  const path = buildAdminStoragePath('gallery', profile.id, fileValue, {
    extension: getSafeFileExtension(fileValue),
  })

  const upload = await adminClient.storage.from('artist-media').upload(
    path,
    Buffer.from(await fileValue.arrayBuffer()),
    {
      upsert: true,
      contentType: fileValue.type || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
    }
  )

  if (upload.error) {
    console.error('[artist-media] upload failed:', upload.error)
    return NextResponse.json({ ok: false, error: 'Unable to upload media' }, { status: 500 })
  }

  const publicUrl = adminClient.storage.from('artist-media').getPublicUrl(path).data.publicUrl

  const insertResult = await (adminClient.from('artist_media') as unknown as {
    insert(values: Record<string, unknown>): {
      select(columns: string): {
        maybeSingle(): Promise<{
          data: { id: string; media_url: string; type: 'image' | 'video' } | null
          error: { message?: string } | null
        }>
      }
    }
  })
    .insert({ artist_id: profile.id, media_url: publicUrl, type: mediaType })
    .select('id, media_url, type')
    .maybeSingle()

  if (insertResult.error || !insertResult.data) {
    console.error('[artist-media] insert failed:', insertResult.error)
    return NextResponse.json({ ok: false, error: 'Unable to save media' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    media: insertResult.data,
  })
}
