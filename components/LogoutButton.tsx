'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm px-4 py-2.5 rounded-xl transition-colors hover:opacity-80 border"
      style={{ border: '1px solid var(--border)', color: 'var(--muted)', background: '#fff' }}
    >
      Log out
    </button>
  )
}
