const DEFAULT_SITE_URL = 'http://localhost:3000'

export function getPublicSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).replace(/\/+$/, '')
}

export function buildAuthCallbackUrl(nextPath: string) {
  return new URL(`/auth/callback?next=${encodeURIComponent(nextPath)}`, getPublicSiteUrl()).toString()
}

export function sanitizeInternalPath(value?: string | null, fallback = '/artist-dashboard') {
  if (!value) return fallback

  const normalized = value.trim()
  if (!normalized.startsWith('/')) return fallback

  return normalized
}
