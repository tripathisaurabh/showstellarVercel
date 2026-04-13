const PHONE_ALLOWED_LENGTH_MIN = 10
const PHONE_ALLOWED_LENGTH_MAX = 15

export function normalizePhoneNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''

  const hasLeadingPlus = trimmed.startsWith('+')
  const digitsOnly = trimmed.replace(/[^\d]/g, '')

  if (!digitsOnly) return ''
  return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly
}

export function isValidPhoneNumber(value: string) {
  const normalized = normalizePhoneNumber(value)
  if (!normalized) return false

  const digits = normalized.startsWith('+') ? normalized.slice(1) : normalized
  if (!/^\d+$/.test(digits)) return false
  if (digits.length < PHONE_ALLOWED_LENGTH_MIN || digits.length > PHONE_ALLOWED_LENGTH_MAX) return false
  if (/^(\d)\1+$/.test(digits)) return false

  return true
}

export function normalizeEmailAddress(value: string) {
  return value.trim().toLowerCase()
}

export function isValidEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function isMissingEmailChangeRequestsTableError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false
  return error.code === 'PGRST205' || (typeof error.message === 'string' && error.message.includes("Could not find the table 'public.email_change_requests'"))
}
