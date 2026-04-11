import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import BrandLogo from '@/components/BrandLogo'
import AdminArtistProfileEditor from '@/components/AdminArtistProfileEditor'
import { getAdminSession } from '@/lib/admin-access'
import { loadAdminArtistDetail } from '@/lib/admin-dashboard'

export const dynamic = 'force-dynamic'

export default async function AdminArtistEditPage({
  params,
}: {
  params: Promise<{ artistId: string }>
}) {
  const { artistId } = await params
  const { adminClient, isAdmin } = await getAdminSession()

  if (!adminClient || !isAdmin) {
    redirect('/admin/login?reason=unauthenticated')
  }

  const data = await loadAdminArtistDetail(artistId)
  if (!data) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandLogo href="/admin" className="shrink-0" variant="compact" imageClassName="h-8" />
          <Link href={`/admin/artists/${artistId}`} className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
            <ArrowLeft className="h-4 w-4" />
            Back to detail
          </Link>
        </div>
      </header>

      <AdminArtistProfileEditor artist={data.artist} />
    </div>
  )
}
