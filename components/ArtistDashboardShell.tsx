'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, User, LogOut, Menu } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import BrandLogo from '@/components/BrandLogo'

interface Props {
  children: React.ReactNode
  artistName?: string
}

export default function ArtistDashboardShell({ children, artistName }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navItems = [
    { href: '/artist-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/artist-dashboard/profile', label: 'Edit Profile', icon: User },
  ]

  const initials = artistName
    ? artistName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AR'

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Top Header */}
      <header className="bg-white border-b sticky top-0 z-40" style={{ borderColor: 'var(--border)' }}>
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl transition-colors"
              style={{ color: 'var(--foreground)' }}
            >
              <Menu className="w-6 h-6" />
            </button>
            <BrandLogo href="/" className="shrink-0" variant="compact" imageClassName="h-8 sm:h-9" />
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-semibold text-sm" style={{ background: 'var(--navy)' }}>
              {initials}
            </div>
            <div className="hidden sm:block">
              <div className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>{artistName ?? 'Artist'}</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Artist</div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r z-30
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `} style={{ borderColor: 'var(--border)' }}>
          <nav className="p-6 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                    isActive ? 'text-white' : 'hover:opacity-80'
                  }`}
                  style={{
                    background: isActive ? 'var(--navy)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--foreground)',
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </Link>
              )
            })}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors hover:bg-red-50 hover:text-red-600"
              style={{ color: 'var(--foreground)' }}
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-[rgba(0,23,57,0.2)] z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
