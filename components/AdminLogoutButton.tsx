'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export default function AdminLogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border transition-colors hover:opacity-80"
      style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
    >
      <LogOut className="w-4 h-4" />
      Log out
    </button>
  )
}
