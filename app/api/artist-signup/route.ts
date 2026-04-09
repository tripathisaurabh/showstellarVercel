import { NextResponse } from 'next/server'
import {
  ARTIST_CATEGORY_OPTIONS,
  partitionArtistCategories,
  splitCategoryInput,
} from '@/lib/artist-categories'
import { buildBrandedEmailTemplate } from '@/lib/email-template'
import { getSiteUrl } from '@/lib/seo'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { rateLimitRequest } from '@/lib/rate-limit'
import { sendEmailIfConfigured } from '@/utils/email'

type SignupBody = {
  full_name?: string
  phone_number?: string
  email?: string
  password?: string
  category?: string
  categories?: string[]
  custom_categories?: string[]
  city?: string
}

type CategoryRow = {
  id: string
  name: string | null
}

export async function POST(request: Request) {
  const rateLimit = await rateLimitRequest(request, 'artist-signup', 5, 60_000)
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: 'Too many signup attempts. Please try again shortly.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      }
    )
  }

  let body: SignupBody

  try {
    body = (await request.json()) as SignupBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const fullName = body.full_name?.trim()
  const phoneNumber = body.phone_number?.trim()
  const email = body.email?.trim().toLowerCase()
  const password = body.password ?? ''
  const city = body.city?.trim()
  const requestedCategories = [
    ...(body.categories ?? []),
    ...(body.custom_categories ?? []),
    ...splitCategoryInput(body.category),
  ]

  if (!fullName || !phoneNumber || !email || !password || !city) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const supabase = getAdminSupabaseClient()
  const { data: categoryRows, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')
    .returns<CategoryRow[]>()

  if (categoriesError) {
    console.error('[artist-signup] category lookup failed:', categoriesError)
    return NextResponse.json({ error: 'Unable to create artist account' }, { status: 400 })
  }

  const allowedCategoryNames = (categoryRows ?? [])
    .map(row => row.name)
    .filter((name): name is string => Boolean(name))
  const { categories, customCategories } = partitionArtistCategories(
    requestedCategories,
    allowedCategoryNames.length > 0 ? allowedCategoryNames : ARTIST_CATEGORY_OPTIONS
  )

  if (categories.length + customCategories.length === 0) {
    return NextResponse.json({ error: 'Select at least one category' }, { status: 400 })
  }

  if (categories.length + customCategories.length > 10) {
    return NextResponse.json({ error: 'Select no more than 10 categories' }, { status: 400 })
  }

  if (customCategories.some(item => item.length > 50)) {
    return NextResponse.json({ error: 'Custom categories must be 50 characters or fewer' }, { status: 400 })
  }

  const categoryIdMap = new Map(
    (categoryRows ?? [])
      .filter((row): row is CategoryRow & { name: string } => Boolean(row.name))
      .map(row => [row.name.toLowerCase(), row.id] as const)
  )
  const primaryCategoryId = categories
    .map(category => categoryIdMap.get(category.toLowerCase()))
    .find((value): value is string => Boolean(value)) ?? null

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
  })

  if (authError || !authData.user) {
    console.error('[artist-signup] auth user creation failed:', authError)
    return NextResponse.json({ error: 'Unable to create artist account' }, { status: 400 })
  }

  const usersTable = supabase.from('users') as unknown as {
    insert: (values: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
    delete: () => { eq: (column: string, value: string) => Promise<unknown> }
  }
  const artistProfilesTable = supabase.from('artist_profiles') as unknown as {
    insert: (values: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
  }

  const { error: userInsertError } = await usersTable.insert({
    id: authData.user.id,
    role: 'artist',
    full_name: fullName,
    phone_number: phoneNumber,
    email,
  })

  if (userInsertError) {
    console.error('[artist-signup] users row insert failed:', userInsertError)
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: 'Unable to create artist account' }, { status: 400 })
  }

  const { error: profileError } = await artistProfilesTable.insert({
    user_id: authData.user.id,
    category_id: primaryCategoryId,
    categories,
    custom_categories: customCategories,
    city,
    approval_status: 'draft',
  })

  if (profileError) {
    console.error('[artist-signup] artist profile insert failed:', profileError)
    await usersTable.delete().eq('id', authData.user.id)
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: 'Unable to create artist account' }, { status: 400 })
  }

  // Send verification email — non-fatal if it fails so signup can still complete.
  const siteUrl = getSiteUrl()
  try {
    const linkResult = await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: { redirectTo: `${siteUrl}/auth/callback` },
    })

    let actionLink: string | undefined = linkResult.data?.properties?.action_link

    if (!actionLink) {
      console.warn('[artist-signup] signup link generation returned no action link, retrying with magiclink')
      const fallbackResult = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: `${siteUrl}/auth/callback` },
      })
      actionLink = fallbackResult.data?.properties?.action_link
    }

    if (actionLink) {
      await sendEmailIfConfigured({
        to: email,
        subject: 'Verify your ShowStellar email',
        html: buildVerificationEmail({ name: fullName, verifyUrl: actionLink, siteUrl }),
      })
    } else {
      console.error('[artist-signup] verification link generation failed:', linkResult.error)
    }
  } catch (err) {
    console.error('[artist-signup] verification email failed:', err)
  }

  return NextResponse.json({ ok: true })
}

function buildVerificationEmail({ name, verifyUrl, siteUrl }: { name: string; verifyUrl: string; siteUrl: string }) {
  return buildBrandedEmailTemplate({
    siteUrl,
    title: 'Verify your email',
    intro: `Hi ${name},`,
    body: 'Welcome to ShowStellar.\nPlease confirm your email to activate your artist profile.',
    buttonText: 'Verify Email',
    buttonHref: verifyUrl,
    footerText: 'If you did not create an account, you can safely ignore this email.',
    mascotPath: '/illustrations/feedback/verification-star.svg',
  })
}
