import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getAdminSupabaseConfig } from '@/lib/supabase/config'

let adminClient: ReturnType<typeof createSupabaseClient> | null = null

export function getAdminSupabaseClient() {
  const { url: supabaseUrl, serviceRoleKey } = getAdminSupabaseConfig()

  if (!adminClient) {
    adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return adminClient
}
