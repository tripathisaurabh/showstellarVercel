import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import EmailCenterShell from '@/components/email-center/EmailCenterShell'
import { getAdminSession } from '@/lib/admin-access'

export const metadata: Metadata = {
  title: 'Email Center',
  description: 'Manually send branded ShowStellar emails to artists.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function EmailCenterPage() {
  const { user, isAdmin, adminClient, userRecord } = await getAdminSession()

  // Proxy already protects /admin/* routes. Keep a server-side guard here as defense in depth.
  if (!user || !adminClient) {
    redirect('/admin/login?reason=unauthenticated')
  }

  if (!isAdmin) {
    redirect('/admin/login?reason=not-admin')
  }

  return <EmailCenterShell adminEmail={userRecord?.email ?? user.email ?? ''} />
}
