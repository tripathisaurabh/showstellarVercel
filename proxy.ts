import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl
  const isArtistRoute = pathname.startsWith('/artist-dashboard')
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')
  const isVerificationRoute = pathname === '/verify-email' || pathname === '/auth/callback'

  let userRole: string | null = null
  let hasArtistProfile = false

  if (user) {
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
    userRole = userData?.role ?? null

    const { data: profileData } = await supabase.from('artist_profiles').select('id').eq('user_id', user.id).maybeSingle()
    hasArtistProfile = !!profileData?.id
  }

  if (
    user &&
    !user.email_confirmed_at &&
    !isVerificationRoute &&
    (isArtistRoute || isAdminRoute || pathname === '/artist-login' || pathname === '/artist-signup' || pathname === '/admin/login')
  ) {
    return NextResponse.redirect(new URL('/verify-email', request.url))
  }

  if (isArtistRoute && !user) {
    return NextResponse.redirect(new URL('/artist-login', request.url))
  }

  if (isArtistRoute && user && userRole !== 'artist' && !hasArtistProfile) {
    return NextResponse.redirect(new URL('/artist-login?reason=not-artist', request.url))
  }

  if (isAdminRoute && pathname !== '/admin/login' && !user) {
    return NextResponse.redirect(new URL('/admin/login?reason=unauthenticated', request.url))
  }

  if (isAdminRoute && pathname !== '/admin/login' && user && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/admin/login?reason=not-admin', request.url))
  }

  if (user && (pathname === '/artist-login' || pathname === '/artist-signup')) {
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    if (userRole === 'artist' || hasArtistProfile) {
      return NextResponse.redirect(new URL('/artist-dashboard', request.url))
    }
  }

  if (user && pathname === '/admin/login' && userRole === 'admin') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/artist-dashboard/:path*', '/artist-login', '/artist-signup', '/admin', '/admin/:path*'],
}
