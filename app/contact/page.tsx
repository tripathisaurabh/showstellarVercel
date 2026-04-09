import type { Metadata } from 'next'
import Link from 'next/link'
import type { ComponentType } from 'react'
import { Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react'
import Footer from '@/components/Footer'
import { absoluteUrl, seoDefaults } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact ShowStellar for artist bookings, support, and partnership inquiries.',
  keywords: seoDefaults.keywords,
  alternates: {
    canonical: absoluteUrl('/contact'),
  },
  openGraph: {
    title: `Contact ${seoDefaults.siteName}`,
    description: 'Contact ShowStellar for artist bookings, support, and partnership inquiries.',
    url: absoluteUrl('/contact'),
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
    title: `Contact ${seoDefaults.siteName}`,
    description: 'Contact ShowStellar for artist bookings, support, and partnership inquiries.',
    images: [absoluteUrl(seoDefaults.image)],
  },
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-light)]">Contact ShowStellar</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Reach us for bookings, support, or artist onboarding
          </h1>
          <p className="mt-6 text-base leading-8 text-[var(--muted)] sm:text-lg">
            Use the contact details below if you want help with an inquiry, need support, or want to discuss a partnership.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-[color:var(--border)] bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold">Contact details</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              For bookings and general questions, email us and we’ll route it to the right team.
            </p>

            <div className="mt-8 space-y-5">
              <ContactItem
                icon={Mail}
                label="Email"
                value="support@showstellar.com"
                href="mailto:support@showstellar.com"
              />
              <ContactItem
                icon={Phone}
                label="Phone"
                value="+91 9321517975"
                href="tel:+919321517975"
              />
              <ContactItem
                icon={MapPin}
                label="Location"
                value="Mumbai, Maharashtra, India"
              />
              <ContactItem
                icon={MessageCircle}
                label="Social"
                value="Instagram / LinkedIn"
              />
            </div>
          </div>

          <div className="rounded-3xl bg-[var(--accent)] p-8 text-white shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <Send className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold">What to include in your message</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-white/75">
              <li>• Artist name or category</li>
              <li>• Event date and city</li>
              <li>• Artist price or offer range</li>
              <li>• Any timing, language, or performance preferences</li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/artists"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
              >
                Browse Artists
              </Link>
              <Link
                href="/artist-signup"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
              >
                Join as Artist
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14">
          <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              {
                q: 'How do I book an artist?',
                a: 'Browse artists, open a profile, and send an inquiry with your event details.',
              },
              {
                q: 'How do artists get approved?',
                a: 'Artist profiles are reviewed before they go live so clients can browse with more confidence.',
              },
              {
                q: 'Can I contact the team directly?',
                a: 'Yes. Email support@showstellar.com for general support or booking help.',
              },
              {
                q: 'Do you support events across India?',
                a: 'Yes. The platform is focused on Mumbai first and can support bookings across India.',
              },
            ].map(item => (
              <div key={item.q} className="rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-sm">
                <h3 className="text-base font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

function ContactItem({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  href?: string
}) {
  const content = (
    <div className="flex items-start gap-4 rounded-2xl border border-[color:var(--border)] bg-[var(--background)] p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
        <Icon className="h-5 w-5 text-[var(--foreground)]" />
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-light)]">{label}</div>
        <div className="mt-1 text-sm font-medium text-[var(--foreground)]">{value}</div>
      </div>
    </div>
  )

  if (!href) return content

  return (
    <a href={href} className="block transition-transform hover:-translate-y-0.5">
      {content}
    </a>
  )
}
