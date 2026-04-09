import type { Metadata } from 'next'
import Footer from '@/components/Footer'
import { absoluteUrl, seoDefaults } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read how ShowStellar handles user data, booking details, and account information.',
  alternates: {
    canonical: absoluteUrl('/privacy-policy'),
  },
  openGraph: {
    title: `Privacy Policy | ${seoDefaults.siteName}`,
    description: 'Read how ShowStellar handles user data, booking details, and account information.',
    url: absoluteUrl('/privacy-policy'),
  },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-light)]">Legal</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Privacy Policy</h1>
        <p className="mt-6 text-base leading-8 text-[var(--muted)]">
          ShowStellar collects the information needed to create accounts, process booking inquiries, and improve the
          experience for artists and clients.
        </p>

        <div className="mt-10 space-y-8 rounded-3xl border border-[color:var(--border)] bg-white p-8 shadow-sm">
          <PolicySection title="Information we collect">
            Account details, artist profile details, contact information, booking inquiry data, and basic analytics data.
          </PolicySection>
          <PolicySection title="How we use data">
            To operate the platform, show artist profiles, process inquiries, send notifications, and support the service.
          </PolicySection>
          <PolicySection title="Sharing">
            We do not sell personal data. We may share data with service providers that help run booking, messaging, and hosting infrastructure.
          </PolicySection>
          <PolicySection title="Contact">
            For questions about privacy, email support@showstellar.com.
          </PolicySection>
        </div>
      </section>
      <Footer />
    </div>
  )
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{children}</p>
    </section>
  )
}
