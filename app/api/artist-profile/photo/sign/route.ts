import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import {
  ADMIN_PROFILE_IMAGE_MAX_SIZE_MB,
  buildAdminStoragePath,
  getAdminFileTypeError,
  getSafeFileExtension,
} from '@/lib/admin-file-upload'

type PhotoSignBody = {
  croppedFileName?: string
  croppedFileType?: string
  croppedFileSize?: number
  originalFileName?: string
  originalFileType?: string
  originalFileSize?: number
}

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let body: PhotoSignBody

  try {
    body = (await request.json()) as PhotoSignBody
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 })
  }

  const croppedFile = {
    name: body.croppedFileName?.trim() || 'profile-photo.jpg',
    type: body.croppedFileType?.trim() || 'image/jpeg',
    size: typeof body.croppedFileSize === 'number' ? body.croppedFileSize : 0,
  }

  const croppedValidationError = getAdminFileTypeError(croppedFile, 'image')
  if (croppedValidationError) {
    return NextResponse.json({ ok: false, error: croppedValidationError }, { status: 400 })
  }

  if (croppedFile.size > ADMIN_PROFILE_IMAGE_MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json(
      { ok: false, error: `${croppedFile.name} is too large. Maximum allowed size is ${ADMIN_PROFILE_IMAGE_MAX_SIZE_MB}MB.` },
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
        maybeSingle(): Promise<{ data: { id: string; profile_image_original: string | null } | null; error: { message?: string } | null }>
      }
    }
  })
    .select('id, profile_image_original')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[artist-photo-sign] profile lookup failed:', profileError)
    return NextResponse.json({ ok: false, error: 'Unable to prepare profile photo upload' }, { status: 500 })
  }

  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Artist profile not found' }, { status: 404 })
  }

  const croppedPath = buildAdminStoragePath('dp', profile.id, croppedFile, { extension: 'jpg' })
  const croppedSignedResult = await adminClient.storage.from('artist-media').createSignedUploadUrl(croppedPath, {
    upsert: true,
  })

  if (croppedSignedResult.error || !croppedSignedResult.data) {
    console.error('[artist-photo-sign] cropped signed upload url failed:', croppedSignedResult.error)
    return NextResponse.json({ ok: false, error: 'Unable to prepare profile photo upload' }, { status: 500 })
  }

  let original:
    | {
        path: string
        token: string
        publicUrl: string
      }
    | null = null

  if (body.originalFileName && body.originalFileType && typeof body.originalFileSize === 'number') {
    const originalFile = {
      name: body.originalFileName.trim(),
      type: body.originalFileType.trim(),
      size: body.originalFileSize,
    }

    const originalPath = buildAdminStoragePath('dp-original', profile.id, originalFile, {
      extension: getSafeFileExtension(originalFile),
    })
    const originalSignedResult = await adminClient.storage.from('artist-media').createSignedUploadUrl(originalPath, {
      upsert: true,
    })

    if (originalSignedResult.error || !originalSignedResult.data) {
      console.error('[artist-photo-sign] original signed upload url failed:', originalSignedResult.error)
      return NextResponse.json({ ok: false, error: 'Unable to prepare profile photo upload' }, { status: 500 })
    }

    original = {
      path: originalPath,
      token: originalSignedResult.data.token,
      publicUrl: adminClient.storage.from('artist-media').getPublicUrl(originalPath).data.publicUrl,
    }
  }

  return NextResponse.json({
    ok: true,
    cropped: {
      path: croppedPath,
      token: croppedSignedResult.data.token,
      publicUrl: adminClient.storage.from('artist-media').getPublicUrl(croppedPath).data.publicUrl,
    },
    original,
    existingOriginalUrl: profile.profile_image_original,
  })
}
