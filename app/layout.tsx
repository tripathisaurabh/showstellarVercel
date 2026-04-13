import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import { absoluteUrl, getSiteUrl, seoDefaults } from '@/lib/seo'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plus-jakarta-sans',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: seoDefaults.title,
    template: `%s | ${seoDefaults.siteName}`,
  },
  description: seoDefaults.description,
  keywords: seoDefaults.keywords,
  verification: {
    google: '-ujyGv9qQtY6v2YWnzRpvh1o-ES9OW2Il6nkGjunQR0',
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: absoluteUrl('/'),
    siteName: seoDefaults.siteName,
    title: seoDefaults.title,
    description: seoDefaults.description,
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
    title: seoDefaults.title,
    description: seoDefaults.description,
    images: [absoluteUrl(seoDefaults.image)],
  },
  icons: {
    icon: '/fivcon.png',
    shortcut: '/fivcon.png',
    apple: '/appicon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
