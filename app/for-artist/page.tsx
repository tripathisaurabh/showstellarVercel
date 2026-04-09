import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, DollarSign, Heart, Shield, Star, Zap, User } from 'lucide-react'
import Footer from '@/components/Footer'
import { absoluteUrl, seoDefaults } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'For Artists',
  description:
    'Join ShowStellar’s founding artist program and get early visibility across Mumbai and India.',
  keywords: seoDefaults.keywords,
  alternates: {
    canonical: absoluteUrl('/for-artist'),
  },
  openGraph: {
    title: `For Artists | ${seoDefaults.siteName}`,
    description:
      'Join ShowStellar’s founding artist program and get early visibility across Mumbai and India.',
    url: absoluteUrl('/for-artist'),
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
    title: `For Artists | ${seoDefaults.siteName}`,
    description:
      'Join ShowStellar’s founding artist program and get early visibility across Mumbai and India.',
    images: [absoluteUrl(seoDefaults.image)],
  },
}

const benefits = [
  {
    icon: Star,
    title: 'Founding Status',
    description: 'Priority visibility and a founding artist position from day one.',
  },
  {
    icon: DollarSign,
    title: 'Higher Earnings',
    description: 'Keep a stronger share of your booking value as you grow on the platform.',
  },
  {
    icon: Shield,
    title: 'Early Access',
    description: 'Get in early before the marketplace opens to a wider public audience.',
  },
  {
    icon: Heart,
    title: 'Exclusive Community',
    description: 'Help shape the artist network with other early collaborators.',
  },
]

const steps = [
  {
    icon: User,
    title: 'Create Profile',
    description: 'Build a clean artist profile with your category, location, and booking details.',
  },
  {
    icon: Zap,
    title: 'Get Discovered',
    description: 'Clients can find your profile when they browse artists for their events.',
  },
  {
    icon: DollarSign,
    title: 'Perform & Earn',
    description: 'Receive inquiries, confirm bookings, and turn visibility into real work.',
  },
]

export default function ForArtistPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="relative overflow-hidden bg-[var(--accent)] text-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%),linear-gradient(180deg,#001739_0%,#0a2148_100%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
              Early Access Onboarding
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Be a Founding Artist
            </h1>
            <p className="mt-6 text-base leading-8 text-white/75 sm:text-lg">
              Join ShowStellar&apos;s founding artist program and get early visibility across Mumbai and India.
              The platform is designed to help artists present themselves clearly and receive better booking opportunities.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/artist-signup"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--foreground)] shadow-[0_18px_40px_rgba(0,23,57,0.18)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[var(--surface-2)]"
              >
                Apply for Early Access
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/artists"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Browse Artists
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-light)]">
            Why join early
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Founding Artist Benefits
          </h2>
          <p className="mt-4 text-base leading-8 text-[var(--muted)]">
            The founding artist program is built for performers who want a better start, stronger presentation, and earlier access to bookings.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {benefits.map(item => (
            <div
              key={item.title}
              className="rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-[0_14px_30px_rgba(0,23,57,0.04)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/5">
                <item.icon className="h-6 w-6 text-[var(--foreground)]" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-light)]">
              Program flow
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              How the program works
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-3xl border border-[color:var(--border)] bg-[var(--background)] p-6 shadow-[0_12px_24px_rgba(0,23,57,0.03)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
                    <step.icon className="h-5 w-5 text-[var(--foreground)]" />
                  </div>
                  <div className="text-sm font-semibold tracking-[0.18em] text-[var(--muted-light)]">
                    0{index + 1}
                  </div>
                </div>
                <h3 className="mt-6 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="rounded-3xl bg-[var(--accent)] px-6 py-10 text-white sm:px-8 lg:flex lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              Ready to apply
            </p>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
              Apply for Founding Artist Status
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/75">
              Create your artist profile on the signup page and join the platform with early access positioning.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 lg:mt-0">
            <Link
              href="/artist-signup"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[var(--surface-2)]"
            >
              Join as Artist
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/artists"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Browse Artists
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
