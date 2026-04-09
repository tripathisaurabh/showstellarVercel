import Link from 'next/link'
import BrandLogo from '@/components/BrandLogo'
import { Mail, Phone, MapPin } from 'lucide-react'
import { siFacebook, siInstagram, siX } from 'simple-icons'

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(0,23,57,0.08)] bg-white text-[var(--foreground)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.8fr_0.9fr_0.95fr]">
          <div>
            <BrandLogo href="/" className="shrink-0" variant="wide" imageClassName="h-10 sm:h-11" />
            <p className="mt-4 max-w-lg text-[17px] leading-7 text-[var(--muted)]">
              Your backstage pass to unforgettable memories. We&apos;re building the future of event entertainment,
              connecting amazing artists with celebrations that matter.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {[
                { icon: siInstagram, label: 'Instagram', href: 'https://www.instagram.com/showstellar.official/' },
                { icon: siFacebook, label: 'Facebook', href: 'https://www.facebook.com/' },
                { icon: siX, label: 'X', href: 'https://x.com/' },
                { label: 'LinkedIn', href: 'https://in.linkedin.com/company/show-stellar' },
              ].map(({ icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group inline-flex items-center gap-3 rounded-full border border-[rgba(0,23,57,0.10)] bg-[var(--surface-2)] px-4 py-2.5 text-[var(--muted)] shadow-[0_8px_22px_rgba(0,23,57,0.06)] transition-all hover:-translate-y-0.5 hover:border-[rgba(0,23,57,0.16)] hover:bg-white hover:text-[var(--foreground)]"
                  >
                  {icon ? (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" role="img" aria-hidden="true" fill="currentColor">
                      <path d={icon.path} />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" role="img" aria-hidden="true" fill="currentColor">
                      <path d="M19 3A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H19ZM8.34 18V9.98H5.65V18h2.69ZM7 8.88C7.84 8.88 8.5 8.2 8.5 7.36C8.5 6.52 7.84 5.84 7 5.84C6.16 5.84 5.5 6.52 5.5 7.36C5.5 8.2 6.16 8.88 7 8.88ZM18.35 18V13.64C18.35 11.45 17.2 10.45 15.66 10.45C14.42 10.45 13.87 11.12 13.55 11.59V9.98H10.87C10.9 10.65 10.87 18 10.87 18H13.56V13.51C13.56 13.27 13.58 13.04 13.66 12.88C13.87 12.4 14.35 11.9 15.16 11.9C16.22 11.9 16.64 12.64 16.64 13.7V18H18.35Z" />
                    </svg>
                  )}
                  <span className="text-sm font-medium">{label}</span>
                </a>
              ))}
            </div>
          </div>

          <FooterGroup
            title="Quick Links"
            items={[
              { href: '/', label: 'Home' },
              { href: '/about', label: 'About Us' },
              { href: '/contact', label: 'Contact Us' },
              { href: '/artists', label: 'Browse Artists' },
            ]}
          />

          <FooterGroup
            title="Categories"
            items={[
              { href: '/artists?category=Singer', label: 'Live Singers' },
              { href: '/artists?category=DJ', label: 'Party DJs' },
              { href: '/artists?category=Comedian', label: 'Comedy Acts' },
              { href: '/artists?category=Emcee%20%2F%20Host', label: 'Event Hosts' },
            ]}
          />

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--muted-light)]">Contact</p>
            <ul className="mt-5 space-y-5">
              <li>
                <a href="mailto:support@showstellar.com" className="flex items-center gap-3 text-[17px] text-[var(--muted)] transition-colors hover:text-[var(--foreground)]">
                  <Mail className="h-5 w-5 text-[var(--foreground)]" />
                  <span>support@showstellar.com</span>
                </a>
              </li>
              <li>
                <a href="tel:+919321517975" className="flex items-center gap-3 text-[17px] text-[var(--muted)] transition-colors hover:text-[var(--foreground)]">
                  <Phone className="h-5 w-5 text-[var(--foreground)]" />
                  <span>+91 93215 17975</span>
                </a>
              </li>
              <li>
                <div className="flex items-center gap-3 text-[17px] text-[var(--muted)]">
                  <MapPin className="h-5 w-5 text-[var(--foreground)]" />
                  <span>Mumbai Maharashtra, India</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-[rgba(0,23,57,0.08)] pt-6 text-sm text-[var(--muted)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2025 ShowStellar. All rights reserved.</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/privacy-policy" className="transition-colors hover:text-[var(--foreground)]">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="transition-colors hover:text-[var(--foreground)]">
                Terms of Service
              </Link>
              <Link href="/support" className="transition-colors hover:text-[var(--foreground)]">
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterGroup({
  title,
  items,
}: {
  title: string
  items: { href: string; label: string }[]
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--muted-light)]">{title}</p>
      <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:block sm:space-y-4">
        {items.map(item => (
          <li key={item.label}>
            <Link href={item.href} className="text-[15px] text-[var(--muted)] transition-colors hover:text-[var(--foreground)] sm:text-[17px]">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
