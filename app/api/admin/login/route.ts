import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { rateLimitRequest } from '@/lib/rate-limit'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'

type LoginBody = {
  email?: string
  password?: string
}

export async function POST(request: Request) {
  const rateLimit = await rateLimitRequest(request, 'admin-login', 5, 60_000)
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

  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !authData.user) {
    console.error('[admin-login] sign-in failed:', error)
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const adminClient = getAdminSupabaseClient()
  const { data: adminUser, error: roleError } = await adminClient
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle()

  const adminRole = (adminUser as { role?: string | null } | null)?.role ?? null

  if (roleError || adminRole !== 'admin') {
    await supabase.auth.signOut()
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  return response
}
