'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowRight, LayoutDashboard, LogOut, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import BrandLogo from '@/components/BrandLogo'

type NavAccess = 'loading' | 'guest' | 'authenticated' | 'artist' | 'admin'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [navAccess, setNavAccess] = useState<NavAccess>('loading')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let alive = true

    async function loadNavigationAccess() {
      const { data } = await supabase.auth.getSession()
      const sessionUser = data.session?.user ?? null

      if (!alive) return

      if (!sessionUser) {
        setNavAccess('guest')
        return
      }

      const [userRoleResult, artistProfileResult] = await Promise.all([
        supabase.from('users').select('role').eq('id', sessionUser.id).maybeSingle(),
        supabase.from('artist_profiles').select('id').eq('user_id', sessionUser.id).maybeSingle(),
      ])

      if (!alive) return

      const userRole = userRoleResult.data?.role ?? null
      const hasArtistProfile = Boolean(artistProfileResult.data?.id)

      if (userRole === 'admin') {
        setNavAccess('admin')
        return
      }

      if (userRole === 'artist' || hasArtistProfile) {
        setNavAccess('artist')
        return
      }

      setNavAccess('authenticated')
    }

    void loadNavigationAccess()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null

      if (!nextUser) {
        setNavAccess('guest')
        return
      }

      void (async () => {
        const [userRoleResult, artistProfileResult] = await Promise.all([
          supabase.from('users').select('role').eq('id', nextUser.id).maybeSingle(),
          supabase.from('artist_profiles').select('id').eq('user_id', nextUser.id).maybeSingle(),
        ])

        const userRole = userRoleResult.data?.role ?? null
        const hasArtistProfile = Boolean(artistProfileResult.data?.id)

        if (userRole === 'admin') {
          setNavAccess('admin')
          return
        }

        if (userRole === 'artist' || hasArtistProfile) {
          setNavAccess('artist')
          return
        }

        setNavAccess('authenticated')
      })()
    })

    return () => {
      alive = false
      subscription.unsubscribe()
    }
  }, [])

  const isAdmin = pathname.startsWith('/admin')
  const isDashboard = pathname.startsWith('/artist-dashboard')
  if (isAdmin || isDashboard) return null

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href.startsWith('/#')) return pathname === '/'
    return pathname.startsWith(href)
  }

  const rightLinks = [
    { href: '/artists', label: 'Browse Artists', emphasized: true },
    { href: '/for-artist', label: 'For Artists' },
  ]

  const showDashboard = navAccess === 'artist'
  const showAdminLink = navAccess === 'admin'
  const showLoggedInControls = navAccess === 'authenticated' || navAccess === 'artist' || navAccess === 'admin'

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(0,23,57,0.08)] bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
        <BrandLogo href="/" className="shrink-0" variant="wide" imageClassName="h-9 sm:h-10" priority />

        <div className="hidden items-center gap-3 md:flex">
          <nav className="flex items-center gap-8 xl:gap-10">
            {rightLinks.map(item => (
              <Link
                key={item.label}
                href={item.href}
                className={[
                  'whitespace-nowrap text-sm font-medium transition-colors',
                  item.emphasized ? 'text-[var(--foreground)]' : 'text-[var(--muted)] hover:text-[var(--foreground)]',
                  isActive(item.href) ? 'text-[var(--foreground)]' : '',
                ].join(' ')}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {showLoggedInControls ? (
            <>
              {showDashboard && (
                <Link
                  href="/artist-dashboard"
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)]/10 bg-white px-4 py-2.5 text-sm font-medium text-[var(--foreground)] shadow-[0_10px_24px_rgba(0,23,57,0.05)] transition-all hover:-translate-y-0.5 hover:border-[color:var(--border)]/20 hover:bg-[var(--surface-2)]"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              )}
              {showAdminLink && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)]/10 bg-white px-4 py-2.5 text-sm font-medium text-[var(--foreground)] shadow-[0_10px_24px_rgba(0,23,57,0.05)] transition-all hover:-translate-y-0.5 hover:border-[color:var(--border)]/20 hover:bg-[var(--surface-2)]"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-2.5 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
              {navAccess === 'authenticated' && (
                <Link
                  href="/artist-signup"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(0,23,57,0.16)] transition-all hover:-translate-y-0.5 hover:bg-[#0a2148]"
                >
                  Join as Artist
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </>
          ) : (
            <>
              <Link
                href="/artist-login"
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)]/10 bg-white px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-all hover:-translate-y-0.5 hover:border-[color:var(--border)]/20 hover:bg-[var(--surface-2)]"
              >
                Sign In
              </Link>
              <Link
                href="/artist-signup"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(0,23,57,0.16)] transition-all hover:-translate-y-0.5 hover:bg-[#0a2148]"
              >
                Join as Artist
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-xl p-2 text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)] md:hidden"
          onClick={() => setOpen(prev => !prev)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu backdrop"
            className="fixed inset-0 z-40 bg-[rgba(0,23,57,0.2)] md:hidden"
            onClick={() => setOpen(false)}
          />

          <div className="fixed inset-x-0 top-20 z-50 border-b border-[rgba(0,23,57,0.08)] bg-white px-4 py-4 shadow-[0_18px_40px_rgba(0,23,57,0.08)] md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-2">
                {rightLinks.map(item => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={[
                    'rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                    item.emphasized ? 'text-[var(--foreground)]' : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]',
                  ].join(' ')}
                  onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}

              {showLoggedInControls ? (
                <>
                  {showDashboard && (
                    <Link
                      href="/artist-dashboard"
                      className="rounded-xl px-3 py-3 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)]"
                      onClick={() => setOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  {showAdminLink && (
                    <Link
                      href="/admin"
                      className="rounded-xl px-3 py-3 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)]"
                      onClick={() => setOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      void handleLogout()
                      setOpen(false)
                    }}
                    className="rounded-xl px-3 py-3 text-left text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
                  >
                    Log out
                  </button>
                  {navAccess === 'authenticated' && (
                    <Link
                      href="/artist-signup"
                      className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(0,23,57,0.16)] transition-all hover:bg-[#0a2148]"
                      onClick={() => setOpen(false)}
                    >
                      Join as Artist
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href="/artist-login"
                    className="rounded-xl px-3 py-3 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)]"
                    onClick={() => setOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/artist-signup"
                    className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(0,23,57,0.16)] transition-all hover:bg-[#0a2148]"
                    onClick={() => setOpen(false)}
                  >
                    Join as Artist
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  )
}
