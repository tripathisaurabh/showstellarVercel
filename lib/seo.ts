const DEFAULT_SITE_URL = 'https://www.showstellar.in'
const DEV_FALLBACK_SITE_URL = 'http://localhost:3000'
let warnedMissingSiteUrl = false

function normalizeSiteUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, '')
  try {
    const url = new URL(trimmed)
    const hostname = url.hostname.toLowerCase()

    if (hostname === 'showstellar.com' || hostname === 'www.showstellar.com' || hostname === 'showstellar.in' || hostname === 'www.showstellar.in') {
      url.protocol = 'https:'
      url.hostname = 'www.showstellar.in'
      url.port = ''
      return url.toString().replace(/\/+$/, '')
    }

    return url.toString().replace(/\/+$/, '')
  } catch {
    return trimmed
  }
}

export function getSiteUrl() {
  const explicitSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  if (explicitSiteUrl) {
    return normalizeSiteUrl(explicitSiteUrl)
  }

  if (process.env.NODE_ENV === 'production') {
    if (!warnedMissingSiteUrl) {
      warnedMissingSiteUrl = true
      console.warn('[ShowStellar] NEXT_PUBLIC_SITE_URL is missing in production; falling back to https://www.showstellar.in for generated URLs.')
    }
  }

  return normalizeSiteUrl(process.env.NODE_ENV === 'production' ? DEFAULT_SITE_URL : DEV_FALLBACK_SITE_URL)
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
