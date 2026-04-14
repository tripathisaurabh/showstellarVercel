import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import {
  ADMIN_PROFILE_IMAGE_MAX_SIZE_MB,
  buildAdminStoragePath,
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

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid form payload' }, { status: 400 })
  }

  const croppedValue = formData.get('profile_image_file')
  const originalValue = formData.get('profile_image_original_file')

  if (!(croppedValue instanceof File)) {
    return NextResponse.json({ ok: false, error: 'Missing profile image file' }, { status: 400 })
  }

  const validationError = getAdminFileTypeError(croppedValue, 'image')
  if (validationError) {
    return NextResponse.json({ ok: false, error: validationError }, { status: 400 })
  }

  if (croppedValue.size > ADMIN_PROFILE_IMAGE_MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json(
      { ok: false, error: `File must be ${ADMIN_PROFILE_IMAGE_MAX_SIZE_MB}MB or smaller.` },
      { status: 400 }
    )
  }

  const { data: profile, error: profileError } = await (adminClient
    .from('artist_profiles') as unknown as {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<{
          data: { id: string; profile_image_original: string | null } | null
          error: { message?: string; code?: string } | null
        }>
      }
    }
  })
    .select('id, profile_image_original')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[artist-photo] profile lookup failed:', profileError)
    return NextResponse.json({ ok: false, error: 'Unable to update profile photo' }, { status: 500 })
  }

  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Artist profile not found' }, { status: 404 })
  }

  const originalFile = originalValue instanceof File ? originalValue : null
  const croppedPath = buildAdminStoragePath('dp', profile.id, croppedValue, { extension: 'jpg' })
  const originalPath = originalFile
    ? buildAdminStoragePath('dp-original', profile.id, originalFile, {
        extension: getSafeFileExtension(originalFile),
      })
    : null

  const croppedUpload = await adminClient.storage.from('artist-media').upload(
    croppedPath,
    Buffer.from(await croppedValue.arrayBuffer()),
    {
      upsert: true,
      contentType: 'image/jpeg',
    }
  )

  if (croppedUpload.error) {
    console.error('[artist-photo] cropped upload failed:', croppedUpload.error)
    return NextResponse.json({ ok: false, error: 'Unable to upload profile photo' }, { status: 500 })
  }

  let originalPublicUrl: string | null = profile.profile_image_original ?? null
  if (originalFile && originalPath) {
    const originalUpload = await adminClient.storage.from('artist-media').upload(
      originalPath,
      Buffer.from(await originalFile.arrayBuffer()),
      {
        upsert: true,
        contentType: originalFile.type || 'application/octet-stream',
      }
    )

    if (originalUpload.error) {
      console.warn('[artist-photo] original upload failed:', originalUpload.error)
    } else {
      originalPublicUrl = adminClient.storage.from('artist-media').getPublicUrl(originalPath).data.publicUrl
    }
  }

  const croppedPublicUrl = adminClient.storage.from('artist-media').getPublicUrl(croppedPath).data.publicUrl

  const updatePayload = {
    profile_image: croppedPublicUrl,
    profile_image_cropped: croppedPublicUrl,
    profile_image_original: originalPublicUrl,
  }

  const updateResult = await (adminClient.from('artist_profiles') as unknown as {
    update(values: Record<string, unknown>): {
      eq(column: string, value: string): Promise<{ error: { message?: string; code?: string } | null }>
    }
  })
    .update(updatePayload)
    .eq('id', profile.id)

  if (updateResult.error) {
    const isMissingColumnError =
      updateResult.error.code === '42703' ||
      updateResult.error.code === 'PGRST204' ||
      (typeof updateResult.error.message === 'string' &&
        updateResult.error.message.includes("Could not find the 'profile_image_cropped' column"))

    if (!isMissingColumnError) {
      console.error('[artist-photo] update failed:', updateResult.error)
      return NextResponse.json({ ok: false, error: 'Unable to save profile photo' }, { status: 500 })
    }

    const fallbackResult = await (adminClient.from('artist_profiles') as unknown as {
      update(values: Record<string, unknown>): {
        eq(column: string, value: string): Promise<{ error: { message?: string; code?: string } | null }>
      }
    })
      .update({
        profile_image: croppedPublicUrl,
        profile_image_original: originalPublicUrl,
      })
      .eq('id', profile.id)

    if (fallbackResult.error) {
      console.error('[artist-photo] fallback update failed:', fallbackResult.error)
      return NextResponse.json({ ok: false, error: 'Unable to save profile photo' }, { status: 500 })
    }
  }

  return NextResponse.json({
    ok: true,
    profileImage: croppedPublicUrl,
    profileImageCropped: croppedPublicUrl,
    profileImageOriginal: originalPublicUrl,
  })
}
