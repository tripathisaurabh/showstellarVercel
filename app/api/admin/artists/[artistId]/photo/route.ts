import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-access'
import {
  ADMIN_PROFILE_IMAGE_MAX_SIZE_MB,
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
        maybeSingle(): Promise<{ data: { id: string; profile_image_original: string | null } | null; error: { message?: string; code?: string } | null }>
      }
    }
  })
    .select('id, profile_image_original')
    .eq('id', artistId)
    .maybeSingle()

  if (profileError) {
    console.error('[admin-photo] profile lookup failed:', profileError)
    return NextResponse.json({ ok: false, error: 'Unable to update profile photo' }, { status: 500 })
  }

  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Artist not found' }, { status: 404 })
  }

  const originalFile = originalValue instanceof File ? originalValue : null
  const croppedPath = buildAdminStoragePath('dp', artistId, croppedValue, { extension: 'jpg' })
  const originalPath = originalFile
    ? buildAdminStoragePath('dp-original', artistId, originalFile, { extension: getSafeFileExtension(originalFile) })
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
    console.error('[admin-photo] cropped upload failed:', croppedUpload.error)
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
      console.warn('[admin-photo] original upload failed:', originalUpload.error)
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
    .eq('id', artistId)

  if (updateResult.error) {
    const isMissingColumnError =
      updateResult.error.code === '42703' ||
      updateResult.error.code === 'PGRST204' ||
      (typeof updateResult.error.message === 'string' &&
        updateResult.error.message.includes("Could not find the 'profile_image_cropped' column"))

    if (!isMissingColumnError) {
      console.error('[admin-photo] update failed:', updateResult.error)
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
      .eq('id', artistId)

    if (fallbackResult.error) {
      console.error('[admin-photo] fallback update failed:', fallbackResult.error)
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
