'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminArtistActions({
  artistId,
  currentStatus,
  isFeatured,
}: {
  artistId: string
  currentStatus: string
  isFeatured: boolean
}) {
  const router = useRouter()
  const [loadingAction, setLoadingAction] = useState<'approve' | 'reject' | 'feature' | null>(null)
  const [error, setError] = useState('')

  async function updateStatus(status: 'approved' | 'rejected') {
    setError('')
    setLoadingAction(status === 'approved' ? 'approve' : 'reject')
    try {
      const response = await fetch(`/api/admin/artists/${artistId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalStatus: status }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? 'Failed to update artist status')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update artist status')
    } finally {
      setLoadingAction(null)
    }
  }

  async function toggleFeatured() {
    setError('')
    setLoadingAction('feature')
    try {
      const response = await fetch(`/api/admin/artists/${artistId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !isFeatured }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? 'Failed to update featured state')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update featured state')
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2 flex-wrap">
      {currentStatus !== 'approved' && (
        <button
          onClick={() => updateStatus('approved')}
          disabled={loadingAction !== null}
          className="text-xs px-3 py-1.5 rounded-lg font-medium text-white transition-opacity hover:opacity-80"
          style={{ background: 'var(--accent)' }}
        >
          Approve
        </button>
      )}
      {currentStatus !== 'rejected' && (
        <button
          onClick={() => updateStatus('rejected')}
          disabled={loadingAction !== null}
          className="text-xs px-3 py-1.5 rounded-lg font-medium text-white transition-opacity hover:opacity-80"
          style={{ background: 'var(--foreground)' }}
        >
          Reject
        </button>
      )}
      {currentStatus === 'approved' && (
        <button
          onClick={toggleFeatured}
          disabled={loadingAction !== null}
          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
          style={{
            background: isFeatured ? 'var(--surface-2)' : 'var(--accent-violet)',
            color: isFeatured ? 'var(--muted)' : '#fff',
            border: '1px solid var(--border)',
          }}
          >
          {isFeatured ? 'Unfeature' : '★ Feature'}
        </button>
      )}
      </div>
      {error && <p className="text-[11px] text-red-600 max-w-[220px] text-right">{error}</p>}
    </div>
  )
}
