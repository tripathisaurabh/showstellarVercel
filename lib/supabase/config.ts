const FALLBACK_SUPABASE_URL = 'https://placeholder.supabase.co'
const FALLBACK_SUPABASE_ANON_KEY = 'placeholder-anon-key'
const FALLBACK_SUPABASE_SERVICE_ROLE_KEY = 'placeholder-service-role-key'

let warnedPublicConfig = false
let warnedAdminConfig = false

export function hasPublicSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? FALLBACK_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? FALLBACK_SUPABASE_ANON_KEY

  if (!hasPublicSupabaseConfig() && !warnedPublicConfig) {
    warnedPublicConfig = true
    console.warn('[ShowStellar] Supabase public env is missing. Using fallback config to avoid build/runtime crashes.')
  }

  return { url, anonKey }
}

export function hasAdminSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE))
}

export function getAdminSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? FALLBACK_SUPABASE_URL
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE ??
    FALLBACK_SUPABASE_SERVICE_ROLE_KEY

  if (!hasAdminSupabaseConfig() && !warnedAdminConfig) {
    warnedAdminConfig = true
    console.warn('[ShowStellar] Supabase admin env is missing. Using fallback config to avoid build/runtime crashes.')
  }

  return { url, serviceRoleKey }
}
