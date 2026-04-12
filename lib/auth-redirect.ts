import { getSiteUrl } from '@/lib/seo'

export function getPublicSiteUrl() {
  return getSiteUrl()
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
