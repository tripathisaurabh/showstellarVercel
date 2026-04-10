import { NextResponse } from 'next/server'
import {
  ARTIST_CATEGORY_OPTIONS,
  MAX_CUSTOM_ARTIST_CATEGORY_LENGTH,
  MAX_TOTAL_ARTIST_CATEGORIES,
  ensureArtistCategorySeeded,
  partitionArtistCategories,
  splitCategoryInput,
} from '@/lib/artist-categories'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { rateLimitRequest } from '@/lib/rate-limit'
import { slugifyArtistName } from '@/lib/artist-profile'

type GoogleCompleteBody = {
  full_name?: string
  phone_number?: string
  city?: string
  categories?: string[]
  custom_categories?: string[]
  category?: string
}

type CategoryRow = {
  id: string
  name: string | null
}

type UserRoleRow = {
  role: string | null
}

type ArtistProfileRow = {
  id: string
  slug: string | null
  stage_name: string | null
  approval_status: string | null
}

export async function POST(request: Request) {
  const rateLimit = await rateLimitRequest(request, 'google-complete', 5, 60_000)
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      }
    )
  }

  let body: GoogleCompleteBody

  try {
    body = (await request.json()) as GoogleCompleteBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const fullName = body.full_name?.trim()
  const phoneNumber = body.phone_number?.trim()
  const city = body.city?.trim()
  const requestedCategories = [
    ...(body.categories ?? []),
    ...(body.custom_categories ?? []),
    ...splitCategoryInput(body.category),
  ]

  if (!fullName) {
    return NextResponse.json({ error: 'Enter your full name' }, { status: 400 })
  }

  if (!phoneNumber) {
    return NextResponse.json({ error: 'Enter your phone number' }, { status: 400 })
  }

  if (!city) {
    return NextResponse.json({ error: 'Enter your city' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const admin = getAdminSupabaseClient()
  const seedResult = await ensureArtistCategorySeeded(admin)
  if (!seedResult.ok) {
    console.error('[google-complete] category seed failed:', seedResult.error)
    return NextResponse.json({ error: 'Unable to complete profile' }, { status: 500 })
  }

  const { data: categoryRows, error: categoryError } = await admin
    .from('categories')
    .select('id, name')
    .order('name')
    .returns<CategoryRow[]>()

  if (categoryError) {
    console.error('[google-complete] category lookup failed:', categoryError)
    return NextResponse.json({ error: 'Unable to complete profile' }, { status: 500 })
  }

  const allowedCategoryNames = (categoryRows ?? [])
    .map(row => row.name)
    .filter((name): name is string => Boolean(name))
  const { categories, customCategories } = partitionArtistCategories(
    requestedCategories,
    allowedCategoryNames.length > 0 ? allowedCategoryNames : ARTIST_CATEGORY_OPTIONS
  )

  const totalCategories = categories.length + customCategories.length

  if (totalCategories === 0) {
    return NextResponse.json({ error: 'Select at least one category' }, { status: 400 })
  }

  if (totalCategories > MAX_TOTAL_ARTIST_CATEGORIES) {
    return NextResponse.json(
      { error: `Select no more than ${MAX_TOTAL_ARTIST_CATEGORIES} categories` },
      { status: 400 }
    )
  }

  if (customCategories.some(category => category.length > MAX_CUSTOM_ARTIST_CATEGORY_LENGTH)) {
    return NextResponse.json(
      { error: `Custom categories must be ${MAX_CUSTOM_ARTIST_CATEGORY_LENGTH} characters or fewer` },
      { status: 400 }
    )
  }

  const categoryIdMap = new Map(
    (categoryRows ?? [])
      .filter((row): row is CategoryRow & { name: string } => Boolean(row.name))
      .map(row => [row.name.toLowerCase(), row.id] as const)
  )
  const primaryCategoryId =
    categories
      .map(category => categoryIdMap.get(category.toLowerCase()))
      .find((value): value is string => Boolean(value)) ?? null

  const { data: existingUser, error: existingUserError } = await admin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (existingUserError) {
    console.error('[google-complete] user lookup failed:', existingUserError)
    return NextResponse.json({ error: 'Unable to complete profile' }, { status: 500 })
  }

  const existingUserRole = (existingUser as UserRoleRow | null)?.role ?? null

  if (existingUserRole === 'admin') {
    return NextResponse.json({ error: 'This account is an admin account' }, { status: 403 })
  }

  const usersTable = admin.from('users') as unknown as {
    upsert(values: Record<string, unknown>, options?: { onConflict?: string }): Promise<{ error: { message?: string } | null }>
  }
  const artistProfilesTable = admin.from('artist_profiles') as unknown as {
    select?: never
    insert(values: Record<string, unknown>): Promise<{ error: { message?: string } | null }>
    update(values: Record<string, unknown>): {
      eq(column: string, value: string): Promise<{ error: { message?: string } | null }>
    }
  }

  const userUpsert = await usersTable.upsert(
    {
      id: user.id,
      role: 'artist',
      full_name: fullName,
      phone_number: phoneNumber,
      email: user.email,
    },
    { onConflict: 'id' }
  )

  if (userUpsert.error) {
    console.error('[google-complete] user upsert failed:', userUpsert.error)
    return NextResponse.json({ error: 'Unable to complete profile' }, { status: 500 })
  }

  const profileLookup = await admin
    .from('artist_profiles')
    .select('id, slug, stage_name, approval_status')
    .eq('user_id', user.id)
    .maybeSingle()

  const existingProfile = profileLookup.data as ArtistProfileRow | null
  const profileLookupError = profileLookup.error

  if (profileLookupError) {
    console.error('[google-complete] profile lookup failed:', profileLookupError)
    return NextResponse.json({ error: 'Unable to complete profile' }, { status: 500 })
  }

  const slugBase = slugifyArtistName(fullName) || 'showstellar-artist'
  const fallbackSlug = `${slugBase}-${crypto.randomUUID().replace(/-/g, '').slice(0, 6)}`

  const profilePayload = {
    user_id: user.id,
    slug: existingProfile?.slug ?? fallbackSlug,
    stage_name: existingProfile?.stage_name ?? fullName,
    category_id: primaryCategoryId,
    categories,
    custom_categories: customCategories,
    city,
    approval_status: existingProfile?.approval_status ?? 'draft',
  }

  if (existingProfile) {
    const { error: profileUpdateError } = await artistProfilesTable.update(profilePayload).eq(
      'id',
      existingProfile.id
    )

    if (profileUpdateError) {
      console.error('[google-complete] profile update failed:', profileUpdateError)
      return NextResponse.json({ error: 'Unable to complete profile' }, { status: 500 })
    }
  } else {
    const { error: profileInsertError } = await artistProfilesTable.insert(profilePayload)

    if (profileInsertError) {
      console.error('[google-complete] profile insert failed:', profileInsertError)
      return NextResponse.json({ error: 'Unable to complete profile' }, { status: 500 })
    }
  }

  return NextResponse.json({
    ok: true,
    publicPath: `/artist/${profilePayload.slug}`,
  })
}
