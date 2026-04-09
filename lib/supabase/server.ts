import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getPublicSupabaseConfig } from '@/lib/supabase/config'

export async function createClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = getPublicSupabaseConfig()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server component — cookies can't be set here, middleware handles it
        }
      },
    },
  })
}
