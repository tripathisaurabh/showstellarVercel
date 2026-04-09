import type { Metadata } from 'next'
import Link from 'next/link'
import Footer from '@/components/Footer'
import { absoluteUrl, seoDefaults } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Support',
  description: 'Get help with bookings, login, artist profiles, and support requests from ShowStellar.',
  alternates: {
    canonical: absoluteUrl('/support'),
  },
  openGraph: {
    title: `Support | ${seoDefaults.siteName}`,
    description: 'Get help with bookings, login, artist profiles, and support requests from ShowStellar.',
    url: absoluteUrl('/support'),
  },
}

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-light)]">Help</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Support</h1>
        <p className="mt-6 text-base leading-8 text-[var(--muted)]">
          Need help with a booking, login, or profile update? Use the links below or email our support team.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { title: 'Email', body: 'support@showstellar.com', href: 'mailto:support@showstellar.com' },
            { title: 'Phone', body: '+91 93215 17975', href: 'tel:+919321517975' },
            { title: 'Browse artists', body: 'Discover talent', href: '/artists' },
          ].map(item => (
            <Link key={item.title} href={item.href} className="rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-sm transition-transform hover:-translate-y-0.5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-light)]">{item.title}</div>
              <div className="mt-2 text-base font-medium text-[var(--foreground)]">{item.body}</div>
            </Link>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  )
}
