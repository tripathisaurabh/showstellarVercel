import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/seo'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { rateLimitRequest } from '@/lib/rate-limit'
import {
  buildArtistLifecycleEmailPayload,
  sendArtistCommunicationEmail,
} from '@/lib/email/artist-communication'

type ArtistProfileRow = {
  id: string
  slug: string | null
  stage_name: string | null
  locality: string | null
  city: string | null
  state: string | null
  preferred_working_locations: string | null
  bio: string | null
  performance_style: string | null
  event_types: string | null
  languages_spoken: string | null
  pricing_start: string | number | null
  profile_image: string | null
  profile_image_cropped: string | null
  profile_image_original: string | null
  approval_status: string | null
  categories: string[] | null
  custom_categories: string[] | null
  primary_category: { name: string | null } | Array<{ name: string | null }> | null
}

export async function POST(request: Request) {
  const rateLimit = await rateLimitRequest(request, 'resend-verification', 3, 300_000)
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before trying again.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (user.email_confirmed_at) {
    // Already verified — treat as success so the UI can move forward
    return NextResponse.json({ ok: true })
  }

  if (!user.email) {
    return NextResponse.json({ error: 'No email on account' }, { status: 400 })
  }

  const siteUrl = getSiteUrl()
  const admin = getAdminSupabaseClient()
  const { data: userRow } = await supabase
    .from('users')
    .select('id, full_name, phone_number, email')
    .eq('id', user.id)
    .maybeSingle()

  const { data: profileRow } = await supabase
    .from('artist_profiles')
    .select('id, slug, stage_name, locality, city, state, preferred_working_locations, bio, performance_style, event_types, languages_spoken, pricing_start, profile_image, profile_image_cropped, profile_image_original, approval_status, categories, custom_categories, primary_category:categories(name)')
    .eq('user_id', user.id)
    .maybeSingle() as unknown as { data: ArtistProfileRow | null }

  const primaryCategoryName = Array.isArray(profileRow?.primary_category)
    ? profileRow.primary_category[0]?.name ?? ''
    : profileRow?.primary_category?.name ?? ''

  try {
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
      options: { redirectTo: `${siteUrl}/auth/callback` },
    })

    if (linkError || !linkData?.properties?.action_link) {
      console.error('[resend-verification] generateLink failed:', linkError)
      return NextResponse.json({ error: 'Unable to generate verification link' }, { status: 500 })
    }

    const payload = buildArtistLifecycleEmailPayload({
      artistName: profileRow?.stage_name ?? userRow?.full_name ?? user.email,
      artistEmail: user.email,
      loginEmail: user.email,
      dashboardLink: `${siteUrl}/artist-dashboard`,
      profileLink: profileRow?.slug ? `${siteUrl}/artist/${profileRow.slug}` : `${siteUrl}/artist-dashboard/profile`,
      verificationLink: linkData.properties.action_link,
      missingFields: [],
      supportEmail: 'support@showstellar.com',
      city: profileRow?.city ?? '',
      category: primaryCategoryName,
      status: profileRow?.approval_status ?? 'verification_pending',
    })

    const emailResult = await sendArtistCommunicationEmail({
      eventName: 'verification_pending',
      artistId: profileRow?.id ?? null,
      artistUserId: user.id,
      recipientEmail: user.email,
      payload,
      actorUserId: user.id,
    })

    if (!emailResult.ok && !emailResult.skipped) {
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
    }
  } catch (err) {
    console.error('[resend-verification] unexpected error:', err)
    return NextResponse.json({ error: 'Unable to send verification email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
