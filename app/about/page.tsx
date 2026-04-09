import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Heart, Sparkles, Trophy, Users } from 'lucide-react'
import Footer from '@/components/Footer'
import { absoluteUrl, seoDefaults } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn how ShowStellar connects event organizers with verified artists across Mumbai and India.',
  keywords: seoDefaults.keywords,
  alternates: {
    canonical: absoluteUrl('/about'),
  },
  openGraph: {
    title: `About ${seoDefaults.siteName}`,
    description: 'Learn how ShowStellar connects event organizers with verified artists across Mumbai and India.',
    url: absoluteUrl('/about'),
    images: [
      {
        url: absoluteUrl(seoDefaults.image),
        width: 1200,
        height: 630,
        alt: seoDefaults.siteName,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `About ${seoDefaults.siteName}`,
    description: 'Learn how ShowStellar connects event organizers with verified artists across Mumbai and India.',
    images: [absoluteUrl(seoDefaults.image)],
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-light)]">About ShowStellar</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Building better event entertainment in Mumbai and across India
          </h1>
          <p className="mt-6 text-base leading-8 text-[var(--muted)] sm:text-lg">
            ShowStellar connects people who are planning memorable events with artists who know how to make them unforgettable.
            The goal is simple: help clients find the right performer faster and help artists get discovered by the right bookings.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-[color:var(--border)] bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold">Our story</h2>
            <div className="mt-4 space-y-4 text-[15px] leading-8 text-[var(--muted)]">
              <p>
                ShowStellar started with a simple belief: every celebration deserves the right artist.
                From intimate birthdays to corporate events and weddings, the right performance changes the whole experience.
              </p>
              <p>
                We are building a platform where event organizers can browse verified talent, review profiles, and send inquiries with confidence.
                Artists get a clearer way to present themselves and receive real booking opportunities.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-[color:var(--border)] bg-[var(--accent)] p-8 text-white shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <Heart className="h-6 w-6 text-pink-300" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold">Our mission</h2>
            <p className="mt-4 text-sm leading-7 text-white/75">
              Make live entertainment easier to discover, easier to trust, and easier to book.
              That means better visibility for artists and better outcomes for people planning events.
            </p>
          </div>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Sparkles,
              title: 'Experience that feels premium',
              description: 'The platform is built to present artists clearly and make browsing feel polished.',
            },
            {
              icon: Users,
              title: 'Community first',
              description: 'Artists and clients both need a process that is simple, transparent, and respectful.',
            },
            {
              icon: Trophy,
              title: 'Quality matters',
              description: 'We focus on verified profiles, strong presentation, and booking readiness.',
            },
          ].map(item => (
            <div key={item.title} className="rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-sm">
              <item.icon className="h-6 w-6 text-[var(--foreground)]" />
              <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-3xl border border-[color:var(--border)] bg-white p-8 shadow-sm">
          <div className="grid gap-8 md:grid-cols-4">
            {[
              ['Mumbai', 'Core market'],
              ['India', 'Expanding reach'],
              ['Verified', 'Artist profiles'],
              ['Direct', 'Booking inquiries'],
            ].map(([value, label]) => (
              <div key={label}>
                <div className="text-3xl font-semibold">{value}</div>
                <div className="mt-1 text-sm text-[var(--muted)]">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 rounded-3xl bg-[var(--accent)] px-6 py-8 text-center text-white sm:px-8 lg:flex-row lg:text-left">
          <div>
            <h2 className="text-2xl font-semibold">Want to get started?</h2>
            <p className="mt-2 text-sm leading-7 text-white/75">
              Browse artists or create your artist profile and join the platform.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 lg:justify-end">
            <Link
              href="/artists"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
            >
              Browse Artists
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/artist-signup"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
            >
              Join as Artist
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
