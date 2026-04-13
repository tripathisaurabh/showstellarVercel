import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-access'
import {
  ARTIST_CATEGORY_OPTIONS,
  MAX_CUSTOM_ARTIST_CATEGORY_LENGTH,
  MAX_TOTAL_ARTIST_CATEGORIES,
  ensureArtistCategorySeeded,
  normalizeArtistCategorySelection,
  splitCategoryInput,
} from '@/lib/artist-categories'

type UpdateBody = {
  fullName?: string
  phoneNumber?: string
  approvalStatus?: 'draft' | 'pending' | 'approved' | 'rejected'
  isFeatured?: boolean
  rating?: number | string | null
  experienceYears?: number | string | null
  stage_name?: string
  bio?: string
  pricing_start?: string | number | null
  locality?: string
  city?: string
  state?: string
  preferred_working_locations?: string
  performance_style?: string
  event_types?: string
  languages_spoken?: string
  categories?: string[]
  custom_categories?: string[]
  category?: string
  profile_image?: string
  profile_image_cropped?: string
  profile_image_original?: string | null
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ artistId: string }> }
) {
  const { artistId } = await context.params

  if (!artistId) {
    return NextResponse.json({ ok: false, error: 'Missing artistId' }, { status: 400 })
  }

  const { adminClient, isAdmin, user } = await getAdminSession()

  if (!adminClient || !isAdmin) {
    return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 })
  }

  let body: UpdateBody
  try {
    body = (await request.json()) as UpdateBody
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload' }, { status: 400 })
  }

  const { data: profile, error: profileError } = await (adminClient.from('artist_profiles') as unknown as {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<{ data: { id: string; user_id: string | null } | null; error: { message?: string } | null }>
      }
    }
  })
    .select('id, user_id')
    .eq('id', artistId)
    .maybeSingle()

  if (profileError) {
    return NextResponse.json({ ok: false, error: 'Failed to load artist profile' }, { status: 500 })
  }

  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Artist not found' }, { status: 404 })
  }

  if (!profile.user_id) {
    return NextResponse.json({ ok: false, error: 'Artist user link missing' }, { status: 500 })
  }

  const shouldSeedCategories =
    Array.isArray(body.categories) ||
    Array.isArray(body.custom_categories) ||
    Boolean(body.category)

  if (shouldSeedCategories) {
    const seedResult = await ensureArtistCategorySeeded(adminClient)
    if (!seedResult.ok) {
      return NextResponse.json({ ok: false, error: 'Failed to update artist' }, { status: 500 })
    }
  }

  const { data: categoryRows, error: categoryError } = await (adminClient.from('categories') as unknown as {
    select(columns: string): {
      order(column: string): Promise<{ data: Array<{ id: string; name: string | null }> | null; error: { message?: string } | null }>
    }
  })
    .select('id, name')
    .order('name')

  if (categoryError) {
    return NextResponse.json({ ok: false, error: 'Failed to update artist' }, { status: 500 })
  }

  const updates: Record<string, unknown> = {}
  const userUpdates: Record<string, unknown> = {}

  if (body.fullName !== undefined) {
    userUpdates.full_name = body.fullName.trim() || null
  }

  if (body.phoneNumber !== undefined) {
    userUpdates.phone_number = body.phoneNumber.trim() || null
  }

  if (body.approvalStatus) {
    if (!['draft', 'pending', 'approved', 'rejected'].includes(body.approvalStatus)) {
      return NextResponse.json({ ok: false, error: 'Invalid approval status' }, { status: 400 })
    }

    updates.approval_status = body.approvalStatus
  }

  if (typeof body.isFeatured === 'boolean') {
    updates.is_featured = body.isFeatured
  }

  if (body.rating !== undefined) {
    const parsedRating =
      typeof body.rating === 'number'
        ? body.rating
        : typeof body.rating === 'string' && body.rating.trim() !== ''
          ? Number(body.rating)
          : null

    if (parsedRating !== null && (!Number.isFinite(parsedRating) || parsedRating < 0 || parsedRating > 5)) {
      return NextResponse.json({ ok: false, error: 'Rating must be between 0 and 5' }, { status: 400 })
    }
    updates.rating = parsedRating
  }

  if (body.experienceYears !== undefined) {
    const parsedExperienceYears =
      typeof body.experienceYears === 'number'
        ? body.experienceYears
        : typeof body.experienceYears === 'string' && body.experienceYears.trim() !== ''
          ? Number(body.experienceYears)
          : null

    if (parsedExperienceYears !== null && (!Number.isFinite(parsedExperienceYears) || parsedExperienceYears < 0)) {
      return NextResponse.json({ ok: false, error: 'Experience years must be 0 or greater' }, { status: 400 })
    }
    updates.experience_years = parsedExperienceYears
  }

  if (
    body.stage_name !== undefined ||
    body.bio !== undefined ||
    body.pricing_start !== undefined ||
    body.locality !== undefined ||
    body.city !== undefined ||
    body.state !== undefined ||
    body.preferred_working_locations !== undefined ||
    body.performance_style !== undefined ||
    body.event_types !== undefined ||
    body.languages_spoken !== undefined ||
    body.profile_image !== undefined ||
    body.profile_image_cropped !== undefined ||
    body.profile_image_original !== undefined ||
    body.categories !== undefined ||
    body.custom_categories !== undefined ||
    body.category !== undefined
  ) {
  const allowedCategories = (categoryRows ?? [])
    .map(row => row.name)
    .filter((name): name is string => Boolean(name))
  const selection = normalizeArtistCategorySelection({
    categories: [...(body.categories ?? []), ...splitCategoryInput(body.category)],
    customCategories: body.custom_categories ?? [],
    allowedCategories: allowedCategories.length > 0 ? allowedCategories : ARTIST_CATEGORY_OPTIONS,
  })

    if (
      selection.customCategories.some(category => category.length > MAX_CUSTOM_ARTIST_CATEGORY_LENGTH)
    ) {
      return NextResponse.json(
        { ok: false, error: `Custom categories must be ${MAX_CUSTOM_ARTIST_CATEGORY_LENGTH} characters or fewer` },
        { status: 400 }
      )
    }

    const totalCategories = selection.categories.length + selection.customCategories.length
    if (totalCategories > MAX_TOTAL_ARTIST_CATEGORIES) {
      return NextResponse.json(
        { ok: false, error: `Select no more than ${MAX_TOTAL_ARTIST_CATEGORIES} categories` },
        { status: 400 }
      )
    }

    const categoryIdMap = new Map(
      (categoryRows ?? [])
        .filter((row): row is { id: string; name: string } => Boolean(row.name))
        .map(row => [row.name.toLowerCase(), row.id] as const)
    )
    const primaryCategoryId = selection.categories
      .map(category => categoryIdMap.get(category.toLowerCase()))
      .find((value): value is string => Boolean(value)) ?? null

    if (body.stage_name !== undefined) updates.stage_name = body.stage_name.trim() || null
    if (body.bio !== undefined) updates.bio = body.bio ?? null
    if (body.pricing_start !== undefined) {
      const pricingStart =
        typeof body.pricing_start === 'number'
          ? body.pricing_start
          : typeof body.pricing_start === 'string' && body.pricing_start.trim() !== ''
            ? Number(body.pricing_start)
            : null

      if (pricingStart !== null && !Number.isFinite(pricingStart)) {
        return NextResponse.json({ ok: false, error: 'Invalid pricing start value' }, { status: 400 })
      }

      updates.pricing_start = pricingStart
    }
    if (body.locality !== undefined) updates.locality = body.locality.trim() || null
    if (body.city !== undefined) updates.city = body.city.trim() || null
    if (body.state !== undefined) updates.state = body.state.trim() || null
    if (body.preferred_working_locations !== undefined) {
      updates.preferred_working_locations = body.preferred_working_locations.trim() || null
    }
    if (body.performance_style !== undefined) updates.performance_style = body.performance_style.trim() || null
    if (body.event_types !== undefined) updates.event_types = body.event_types.trim() || null
    if (body.languages_spoken !== undefined) updates.languages_spoken = body.languages_spoken.trim() || null

    const profileImage = body.profile_image?.trim() || null
    const profileImageCropped = body.profile_image_cropped?.trim() || profileImage
    const profileImageOriginal = body.profile_image_original?.trim() || null

    if (body.profile_image !== undefined || body.profile_image_cropped !== undefined || body.profile_image_original !== undefined) {
      updates.profile_image = profileImageCropped
      updates.profile_image_cropped = profileImageCropped
      updates.profile_image_original = profileImageOriginal
    }

    if (body.categories !== undefined || body.custom_categories !== undefined || body.category !== undefined) {
      updates.categories = selection.categories
      updates.custom_categories = selection.customCategories
      updates.category_id = primaryCategoryId
    }
  }

  if (Object.keys(updates).length === 0) {
    if (Object.keys(userUpdates).length === 0) {
      return NextResponse.json({ ok: false, error: 'No updates provided' }, { status: 400 })
    }
  }

  if (Object.keys(updates).length > 0) {
    const updateResult = await (adminClient
      .from('artist_profiles') as unknown as {
        update(values: Record<string, unknown>): { eq(column: string, value: string): Promise<{ error: { message?: string } | null }> }
      })
      .update(updates)
      .eq('id', artistId)
    const { error } = updateResult

    const missingColumnErrorCode = (error as { code?: string } | null | undefined)?.code
    const isMissingColumnError =
      missingColumnErrorCode === '42703' ||
      missingColumnErrorCode === 'PGRST204' ||
      (typeof error?.message === 'string' &&
        (error.message.includes("preferred_working_locations") ||
          error.message.includes("profile_image_cropped")))

    if (isMissingColumnError) {
      const legacyUpdates = { ...updates }
      delete legacyUpdates.preferred_working_locations
      delete legacyUpdates.profile_image_cropped

      const fallbackResult = await (adminClient
        .from('artist_profiles') as unknown as {
          update(values: Record<string, unknown>): { eq(column: string, value: string): Promise<{ error: { message?: string } | null }> }
        })
        .update(legacyUpdates)
        .eq('id', artistId)

      if (fallbackResult.error) {
        console.error('[admin] artist update failed:', fallbackResult.error)
        return NextResponse.json({ ok: false, error: 'Failed to update artist' }, { status: 500 })
      }
    } else if (error) {
      console.error('[admin] artist update failed:', error)
      return NextResponse.json({ ok: false, error: 'Failed to update artist' }, { status: 500 })
    }
  }

  if (Object.keys(userUpdates).length > 0) {
    const { error: userUpdateError } = await (adminClient.from('users') as unknown as {
      update(values: Record<string, unknown>): {
        eq(column: string, value: string): Promise<{ error: { message?: string } | null }>
      }
    })
      .update(userUpdates)
      .eq('id', profile.user_id)

    if (userUpdateError) {
      console.error('[admin] user update failed:', userUpdateError)
      return NextResponse.json({ ok: false, error: 'Failed to update artist' }, { status: 500 })
    }
  }

  console.info(
    JSON.stringify({
      event: 'admin_moderation',
      adminUserId: user.id,
      targetArtistId: artistId,
      action: body.approvalStatus
        ? `approval_status:${body.approvalStatus}`
        : body.isFeatured !== undefined
          ? `featured:${body.isFeatured}`
          : 'unknown',
      timestamp: new Date().toISOString(),
    })
  )

  return NextResponse.json({ ok: true })
}
