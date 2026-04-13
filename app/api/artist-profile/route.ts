import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  ARTIST_CATEGORY_OPTIONS,
  MAX_CUSTOM_ARTIST_CATEGORY_LENGTH,
  MAX_TOTAL_ARTIST_CATEGORIES,
  ensureArtistCategorySeeded,
  normalizeArtistCategorySelection,
  splitCategoryInput,
} from '@/lib/artist-categories'
import { getArtistPublicPath } from '@/lib/artist-profile'

type ArtistProfileUpdateBody = {
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
  profile_image?: string
  profile_image_cropped?: string
  profile_image_original?: string | null
  categories?: string[]
  custom_categories?: string[]
  category?: string
  experience_years?: string | number | null
}

export async function PATCH(request: Request) {
  let body: ArtistProfileUpdateBody

  try {
    body = (await request.json()) as ArtistProfileUpdateBody
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userRecord } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (userRecord?.role !== 'artist') {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 })
  }

  const { data: profile } = await supabase
    .from('artist_profiles')
    .select('id, slug, user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Artist profile not found' }, { status: 404 })
  }

  const seedResult = await ensureArtistCategorySeeded(supabase)
  if (!seedResult.ok) {
    console.error('[artist-profile] category seed failed:', seedResult.error)
    return NextResponse.json({ ok: false, error: 'Failed to save profile' }, { status: 500 })
  }

  const { data: categoryRows, error: categoryError } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')

  if (categoryError) {
    console.error('[artist-profile] category lookup failed:', categoryError)
    return NextResponse.json({ ok: false, error: 'Failed to save profile' }, { status: 500 })
  }

  const allowedCategories = (categoryRows ?? []).map(row => row.name).filter(Boolean) as string[]
  const selection = normalizeArtistCategorySelection({
    categories: [...(body.categories ?? []), ...splitCategoryInput(body.category)],
    customCategories: body.custom_categories ?? [],
    allowedCategories: allowedCategories.length > 0 ? allowedCategories : ARTIST_CATEGORY_OPTIONS,
  })

  const totalCategories = selection.categories.length + selection.customCategories.length

  if (totalCategories === 0) {
    return NextResponse.json({ ok: false, error: 'Select at least one category' }, { status: 400 })
  }

  if (totalCategories > MAX_TOTAL_ARTIST_CATEGORIES) {
    return NextResponse.json(
      { ok: false, error: `Select no more than ${MAX_TOTAL_ARTIST_CATEGORIES} categories` },
      { status: 400 }
    )
  }

  if (selection.customCategories.some(category => category.length > MAX_CUSTOM_ARTIST_CATEGORY_LENGTH)) {
    return NextResponse.json(
      { ok: false, error: `Custom categories must be ${MAX_CUSTOM_ARTIST_CATEGORY_LENGTH} characters or fewer` },
      { status: 400 }
    )
  }

  const categoryIdMap = new Map((categoryRows ?? []).map(row => [row.name.toLowerCase(), row.id] as const))
  const primaryCategoryId = selection.categories
    .map(category => categoryIdMap.get(category.toLowerCase()))
    .find((value): value is string => Boolean(value)) ?? null

  const pricingStart =
    typeof body.pricing_start === 'number'
      ? body.pricing_start
      : typeof body.pricing_start === 'string' && body.pricing_start.trim() !== ''
        ? Number(body.pricing_start)
        : null

  // experience_years: artist-editable, 0–80
  let experienceYears: number | null = null
  if (body.experience_years !== undefined && body.experience_years !== null && body.experience_years !== '') {
    const parsed = Math.floor(Number(body.experience_years))
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 80) {
      return NextResponse.json({ ok: false, error: 'Experience years must be between 0 and 80' }, { status: 400 })
    }
    experienceYears = parsed
  }

  const profileImage = body.profile_image?.trim() || null
  const profileImageCropped = body.profile_image_cropped?.trim() || profileImage
  const profileImageOriginal = body.profile_image_original?.trim() || null

  const updatePayload = {
    stage_name: body.stage_name?.trim() || null,
    bio: body.bio ?? null,
    pricing_start: Number.isFinite(pricingStart) ? pricingStart : null,
    locality: body.locality?.trim() || null,
    city: body.city?.trim() || null,
    state: body.state?.trim() || null,
    preferred_working_locations: body.preferred_working_locations?.trim() || null,
    performance_style: body.performance_style?.trim() || null,
    event_types: body.event_types?.trim() || null,
    languages_spoken: body.languages_spoken?.trim() || null,
    profile_image: profileImageCropped,
    profile_image_cropped: profileImageCropped,
    profile_image_original: profileImageOriginal,
    categories: selection.categories,
    custom_categories: selection.customCategories,
    category_id: primaryCategoryId,
    experience_years: experienceYears,
  }

  let { error: updateError } = await supabase
    .from('artist_profiles')
    .update(updatePayload as Record<string, unknown>)
    .eq('id', profile.id)

  const isMissingColumnError =
    updateError?.code === '42703' ||
    updateError?.code === 'PGRST204' ||
    (typeof updateError?.message === 'string' &&
      updateError.message.includes("Could not find the 'profile_image_cropped' column"))

  if (isMissingColumnError) {
    const fallbackPayload = {
      stage_name: updatePayload.stage_name,
      bio: updatePayload.bio,
      pricing_start: updatePayload.pricing_start,
      locality: updatePayload.locality,
      city: updatePayload.city,
      state: updatePayload.state,
      performance_style: updatePayload.performance_style,
      event_types: updatePayload.event_types,
      languages_spoken: updatePayload.languages_spoken,
      profile_image: profileImageCropped,
      categories: updatePayload.categories,
      custom_categories: updatePayload.custom_categories,
      category_id: updatePayload.category_id,
      experience_years: updatePayload.experience_years,
    }

    const fallbackResult = await supabase
      .from('artist_profiles')
      .update(fallbackPayload as Record<string, unknown>)
      .eq('id', profile.id)

    updateError = fallbackResult.error
  }

  if (updateError) {
    console.error('[artist-profile] update failed:', updateError)
    return NextResponse.json({ ok: false, error: 'Failed to save profile' }, { status: 500 })
  }

  const publicPath = getArtistPublicPath({
    id: profile.id,
    slug: profile.slug,
  })

  return NextResponse.json({
    ok: true,
    publicPath,
    categories: selection.categories,
    customCategories: selection.customCategories,
  })
}
