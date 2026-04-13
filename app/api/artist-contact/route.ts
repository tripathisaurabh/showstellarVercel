import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimitRequest } from '@/lib/rate-limit'
import {
  isMissingEmailChangeRequestsTableError,
  isValidEmailAddress,
  isValidPhoneNumber,
  normalizeEmailAddress,
  normalizePhoneNumber,
} from '@/lib/contact-info'

type PhoneUpdateBody = {
  phoneNumber?: string
}

type EmailChangeRequestBody = {
  requestedEmail?: string
  reason?: string
}

export async function PATCH(request: Request) {
  const rateLimit = await rateLimitRequest(request, 'artist-contact-phone', 10, 60_000)
  if (!rateLimit.ok) {
    return NextResponse.json({ ok: false, error: 'Too many requests. Please try again shortly.' }, { status: 429 })
  }

  let body: PhoneUpdateBody
  try {
    body = (await request.json()) as PhoneUpdateBody
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 })
  }

  const phoneNumberInput = body.phoneNumber?.trim() ?? ''
  if (!phoneNumberInput) {
    return NextResponse.json({ ok: false, error: 'Enter your phone number' }, { status: 400 })
  }

  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumberInput)
  if (!isValidPhoneNumber(normalizedPhoneNumber)) {
    return NextResponse.json(
      { ok: false, error: 'Enter a valid phone number with 10 to 15 digits' },
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
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Artist profile not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('users')
    .update({ phone_number: normalizedPhoneNumber })
    .eq('id', user.id)

  if (error) {
    console.error('[artist-contact] phone update failed:', error)
    return NextResponse.json({ ok: false, error: 'Failed to update phone number' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, phoneNumber: normalizedPhoneNumber })
}

export async function POST(request: Request) {
  const rateLimit = await rateLimitRequest(request, 'artist-contact-email-request', 5, 60_000)
  if (!rateLimit.ok) {
    return NextResponse.json({ ok: false, error: 'Too many requests. Please try again shortly.' }, { status: 429 })
  }

  let body: EmailChangeRequestBody
  try {
    body = (await request.json()) as EmailChangeRequestBody
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 })
  }

  const requestedEmail = normalizeEmailAddress(body.requestedEmail ?? '')
  const reason = body.reason?.trim() ?? ''

  if (!requestedEmail) {
    return NextResponse.json({ ok: false, error: 'Enter the new email address' }, { status: 400 })
  }

  if (!isValidEmailAddress(requestedEmail)) {
    return NextResponse.json({ ok: false, error: 'Enter a valid email address' }, { status: 400 })
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
    .select('role, email')
    .eq('id', user.id)
    .maybeSingle()

  if (userRecord?.role !== 'artist') {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 })
  }

  const { data: profile } = await supabase
    .from('artist_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Artist profile not found' }, { status: 404 })
  }

  const { error: requestsTableError } = await supabase
    .from('email_change_requests')
    .select('id')
    .limit(1)

  if (isMissingEmailChangeRequestsTableError(requestsTableError)) {
    return NextResponse.json(
      { ok: false, error: 'Email change requests are not enabled yet. Please try again later.' },
      { status: 503 }
    )
  }

  const currentEmail = normalizeEmailAddress(userRecord?.email ?? '')
  if (!currentEmail) {
    return NextResponse.json({ ok: false, error: 'No email address is saved for this account' }, { status: 400 })
  }

  if (requestedEmail === currentEmail) {
    return NextResponse.json({ ok: false, error: 'Use a different email address from your current one' }, { status: 400 })
  }

  const { data: existingRequest, error: existingRequestError } = await supabase
    .from('email_change_requests')
    .select('id, requested_email, status')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existingRequestError) {
    console.error('[artist-contact] existing request lookup failed:', existingRequestError)
    return NextResponse.json({ ok: false, error: 'Failed to submit email change request' }, { status: 500 })
  }

  if (existingRequest) {
    return NextResponse.json(
      { ok: false, error: 'You already have a pending email change request' },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('email_change_requests').insert({
    artist_id: profile.id,
    user_id: user.id,
    current_email: currentEmail,
    requested_email: requestedEmail,
    reason: reason || null,
    status: 'pending',
  })

  if (error) {
    const duplicateRequest =
      error.code === '23505' ||
      (typeof error.message === 'string' && error.message.toLowerCase().includes('duplicate'))

    if (duplicateRequest) {
      return NextResponse.json(
        { ok: false, error: 'You already have a pending email change request' },
        { status: 409 }
      )
    }

    console.error('[artist-contact] email request insert failed:', error)
    return NextResponse.json({ ok: false, error: 'Failed to submit email change request' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    message: 'Your email change request has been submitted. Our team will review it shortly.',
  })
}
