import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildBrandedEmailTemplate } from '@/lib/email-template'
import { getSiteUrl } from '@/lib/seo'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { rateLimitRequest } from '@/lib/rate-limit'
import { sendEmailIfConfigured } from '@/utils/email'

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

    const emailResult = await sendEmailIfConfigured({
      to: user.email,
      subject: 'Verify your ShowStellar email',
      html: buildVerificationEmail({ verifyUrl: linkData.properties.action_link, siteUrl }),
    })

    if (!emailResult.skipped && 'error' in emailResult) {
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
    }
  } catch (err) {
    console.error('[resend-verification] unexpected error:', err)
    return NextResponse.json({ error: 'Unable to send verification email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

function buildVerificationEmail({ verifyUrl, siteUrl }: { verifyUrl: string; siteUrl: string }) {
  return buildBrandedEmailTemplate({
    siteUrl,
    title: 'Verify your email',
    body: 'Click the button below to verify your email and activate your ShowStellar artist account.',
    buttonText: 'Verify Email',
    buttonHref: verifyUrl,
    footerText: 'If you did not request this email, you can safely ignore it.',
    mascotPath: '/illustrations/feedback/verification-star.svg',
  })
}
