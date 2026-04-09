import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { sanitizeInternalPath } from '@/lib/auth-redirect'
import { AUTH_FLOW_COOKIE, AUTH_FLOW_RECOVERY } from '@/lib/auth-flow'

type RoleRow = {
  role: string | null
}

function setRecoveryFlowCookie(response: NextResponse) {
  response.cookies.set(AUTH_FLOW_COOKIE, AUTH_FLOW_RECOVERY, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 15,
  })
}

/**
 * Handles Supabase email verification redirects.
 *
 * Supabase redirects here after the user clicks their verification link with
 * either ?token_hash=...&type=signup (email link flow) or ?code=... (PKCE flow).
 * We exchange the token for a session, set the session cookies on the redirect
 * response, then send the user to the dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const code = searchParams.get('code')
  const nextPath = sanitizeInternalPath(searchParams.get('next'), '/artist-dashboard')
  const recoveryFlow = type === 'recovery' || nextPath === '/reset-password'
  const initialPath = recoveryFlow ? '/reset-password' : nextPath

  const successRedirect = NextResponse.redirect(new URL(initialPath, origin))
  const errorRedirect = NextResponse.redirect(
    new URL(recoveryFlow ? '/reset-password?reason=expired' : '/artist-login?reason=verification-failed', origin)
  )

  const makeClient = (response: NextResponse) =>
    createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })

            if (recoveryFlow) {
              setRecoveryFlowCookie(response)
            }
          },
        },
      }
    )

  // Email link flow (token_hash + type)
  if (tokenHash && type) {
    const supabase = makeClient(successRedirect)
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'signup' | 'email' | 'recovery' | 'email_change' | 'magiclink',
    })
    if (!error) return successRedirect
    console.error('[auth/callback] verifyOtp failed:', error)
    return errorRedirect
  }

  // PKCE flow (code)
  if (code) {
    const supabase = makeClient(successRedirect)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (recoveryFlow) {
        return successRedirect
      }

      if (user) {
        const admin = getAdminSupabaseClient()
        const userLookup = await admin
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        const userRecord = userLookup.data as RoleRow | null

        const profileLookup = await admin
          .from('artist_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        const profileRecord = profileLookup.data as { id?: string } | null

        if (userRecord?.role === 'admin' && user.email_confirmed_at) {
          successRedirect.headers.set('Location', new URL('/admin', origin).toString())
          return successRedirect
        }

        if (userRecord?.role === 'artist' && profileRecord?.id) {
          successRedirect.headers.set('Location', new URL('/artist-dashboard', origin).toString())
          return successRedirect
        }

        if (user.email_confirmed_at) {
          successRedirect.headers.set(
            'Location',
            new URL('/artist-signup?oauth=google', origin).toString()
          )
          return successRedirect
        }

        successRedirect.headers.set('Location', new URL('/artist-login', origin).toString())
        return successRedirect
      }

      return successRedirect
    }
    console.error('[auth/callback] exchangeCodeForSession failed:', error)
    return errorRedirect
  }

  if (recoveryFlow) {
    return successRedirect
  }

  return errorRedirect
}
