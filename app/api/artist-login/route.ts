import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { rateLimitRequest } from '@/lib/rate-limit'

type LoginBody = {
  email?: string
  password?: string
}

export async function POST(request: Request) {
  const rateLimit = await rateLimitRequest(request, 'artist-login', 10, 60_000)
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again shortly.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      }
    )
  }

  let body: LoginBody

  try {
    body = (await request.json()) as LoginBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  const password = body.password ?? ''

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const response = NextResponse.json({ ok: true })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('[artist-login] sign-in failed:', error)

    const errorMessage = error.message?.toLowerCase() ?? ''
    if (errorMessage.includes('email not confirmed') || errorMessage.includes('email not verified')) {
      return NextResponse.json(
        { code: 'email_not_verified', error: 'Please verify your email address first.' },
        { status: 403 }
      )
    }

    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  return response
}
