import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import EmailCenterShell from '@/components/email-center/EmailCenterShell'
import { getAdminSession } from '@/lib/admin-access'
import { loadAdminArtistEmailSeed } from '@/lib/admin-dashboard'
import type { AdminEmailArtistSeed } from '@/lib/admin-dashboard'

export const metadata: Metadata = {
  title: 'Email Center',
  description: 'Manually send branded ShowStellar emails to artists.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type EmailCenterSearchParams = {
  artistId?: string
  template?: string
}

export default async function EmailCenterPage({
  searchParams,
}: {
  searchParams?: Promise<EmailCenterSearchParams>
}) {
  const params = (await searchParams) ?? {}
  const { user, isAdmin, adminClient, userRecord } = await getAdminSession()

  // Proxy already protects /admin/* routes. Keep a server-side guard here as defense in depth.
  if (!user || !adminClient) {
    redirect('/admin/login?reason=unauthenticated')
  }

  if (!isAdmin) {
    redirect('/admin/login?reason=not-admin')
  }

  let selectedArtist: AdminEmailArtistSeed | null = null

  if (params.artistId) {
    selectedArtist = await loadAdminArtistEmailSeed(params.artistId)
  }

  return (
    <EmailCenterShell
      adminEmail={userRecord?.email ?? user.email ?? ''}
      selectedArtist={selectedArtist}
      initialTemplateKey={params.template?.trim() || undefined}
    />
  )
}
