const DEFAULT_SITE_URL = 'http://localhost:3000'
let warnedMissingSiteUrl = false

export function getSiteUrl() {
  const explicitSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const vercelUrl = process.env.VERCEL_URL?.trim()

  if (explicitSiteUrl) {
    return explicitSiteUrl.replace(/\/+$/, '')
  }

  if (process.env.NODE_ENV === 'production' && vercelUrl) {
    return `https://${vercelUrl.replace(/\/+$/, '')}`
  }

  if (process.env.NODE_ENV === 'production') {
    if (!warnedMissingSiteUrl) {
      warnedMissingSiteUrl = true
      console.warn('[ShowStellar] NEXT_PUBLIC_SITE_URL is missing in production; falling back to localhost for generated URLs.')
    }
  }

  return DEFAULT_SITE_URL.replace(/\/+$/, '')
}

export function absoluteUrl(path: string) {
  return new URL(path, getSiteUrl()).toString()
}

export const seoDefaults = {
  siteName: 'ShowStellar',
  title: 'ShowStellar | Book Live Artists in Mumbai & India',
  description: 'Book live artists, singers, DJs, and performers in Mumbai and across India for weddings, parties, and corporate events.',
  keywords: [
    'book artists Mumbai',
    'hire singers Mumbai',
    'DJ booking Mumbai',
    'live performers India',
    'event entertainment Mumbai',
    'wedding performers India',
    'corporate event artists India',
    'ShowStellar',
  ],
  image: '/socialmedia.png',
}
