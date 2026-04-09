import { getAdminSupabaseClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type AdminUserRecord = {
  id: string
  role: string | null
  email: string | null
}

export async function getAdminSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      user: null,
      adminClient: null,
      userRecord: null as AdminUserRecord | null,
      isAdmin: false,
    }
  }

  const adminClient = getAdminSupabaseClient()
  const { data: userRecord, error } = await adminClient
    .from('users')
    .select('id, role, email')
    .eq('id', user.id)
    .maybeSingle()

  const normalizedUserRecord = (error ? null : userRecord) as AdminUserRecord | null

  return {
    user,
    adminClient,
    userRecord: normalizedUserRecord,
    isAdmin: !error && normalizedUserRecord?.role === 'admin',
  }
}
