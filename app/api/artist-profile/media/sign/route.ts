import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import {
  ADMIN_MEDIA_MAX_SIZE_MB,
  buildAdminStoragePath,
  getAdminFileTypeError,
  getArtistMediaLimitError,
  getSafeFileExtension,
} from '@/lib/admin-file-upload'

type MediaSignBody = {
  fileName?: string
  fileType?: string
  fileSize?: number
}

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let body: MediaSignBody

  try {
    body = (await request.json()) as MediaSignBody
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 })
  }

  const file = {
    name: body.fileName?.trim() || 'upload.bin',
    type: body.fileType?.trim() || '',
    size: typeof body.fileSize === 'number' ? body.fileSize : 0,
  }

  const validationError = getAdminFileTypeError(file, 'media')
  if (validationError) {
    return NextResponse.json({ ok: false, error: validationError }, { status: 400 })
  }

  if (file.size > ADMIN_MEDIA_MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json(
      { ok: false, error: `${file.name} is too large. Maximum allowed size is ${ADMIN_MEDIA_MAX_SIZE_MB}MB.` },
      { status: 400 }
    )
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
    console.error('[artist-media-sign] profile lookup failed:', profileError)
    return NextResponse.json({ ok: false, error: 'Unable to prepare media upload' }, { status: 500 })
  }

  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Artist profile not found' }, { status: 404 })
  }

  const { data: existingMedia, error: existingMediaError } = await adminClient
    .from('artist_media')
    .select('id')
    .eq('artist_id', profile.id)

  if (existingMediaError) {
    console.error('[artist-media-sign] existing media lookup failed:', existingMediaError)
    return NextResponse.json({ ok: false, error: 'Unable to prepare media upload' }, { status: 500 })
  }

  const limitError = getArtistMediaLimitError(existingMedia?.length ?? 0, 1)
  if (limitError) {
    return NextResponse.json({ ok: false, error: limitError }, { status: 400 })
  }

  const path = buildAdminStoragePath('gallery', profile.id, file, {
    extension: getSafeFileExtension(file),
  })

  const signedResult = await adminClient.storage.from('artist-media').createSignedUploadUrl(path, {
    upsert: true,
  })

  if (signedResult.error || !signedResult.data) {
    console.error('[artist-media-sign] signed upload url failed:', signedResult.error)
    return NextResponse.json({ ok: false, error: 'Unable to prepare media upload' }, { status: 500 })
  }

  const type = file.type.startsWith('video') ? 'video' : 'image'
  const publicUrl = adminClient.storage.from('artist-media').getPublicUrl(path).data.publicUrl

  return NextResponse.json({
    ok: true,
    path,
    token: signedResult.data.token,
    publicUrl,
    type,
  })
}
