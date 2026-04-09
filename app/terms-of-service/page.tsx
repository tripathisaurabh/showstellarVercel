import type { Metadata } from 'next'
import Footer from '@/components/Footer'
import { absoluteUrl, seoDefaults } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the terms for using ShowStellar to browse artists, submit inquiries, and manage profiles.',
  alternates: {
    canonical: absoluteUrl('/terms-of-service'),
  },
  openGraph: {
    title: `Terms of Service | ${seoDefaults.siteName}`,
    description: 'Read the terms for using ShowStellar to browse artists, submit inquiries, and manage profiles.',
    url: absoluteUrl('/terms-of-service'),
  },
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-light)]">Legal</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Terms of Service</h1>
        <p className="mt-6 text-base leading-8 text-[var(--muted)]">
          These terms explain how you may use the ShowStellar platform to discover artists, submit inquiries, and
          manage your artist or client account.
        </p>

        <div className="mt-10 space-y-8 rounded-3xl border border-[color:var(--border)] bg-white p-8 shadow-sm">
          <PolicySection title="Acceptable use">
            Use the platform lawfully and provide accurate booking and account information.
          </PolicySection>
          <PolicySection title="Bookings">
            Booking inquiries are requests to connect clients and artists. Final arrangements are confirmed by the parties involved.
          </PolicySection>
          <PolicySection title="Accounts">
            You are responsible for maintaining the security of your login credentials and account activity.
          </PolicySection>
          <PolicySection title="Contact">
            For questions about these terms, email support@showstellar.com.
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
