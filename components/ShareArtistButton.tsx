'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Copy, Share2 } from 'lucide-react'

type Props = {
  title: string
  url: string
  className?: string
}

export default function ShareArtistButton({ title, url, className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'copied' | 'shared'>('idle')
  const rootRef = useRef<HTMLDivElement | null>(null)

  const shareText = useMemo(() => `Check out ${title} on ShowStellar`, [title])

  async function copyUrl() {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      setStatus('copied')
      return
    }

    const input = document.createElement('input')
    input.value = url
    input.setAttribute('readonly', 'true')
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    setStatus('copied')
  }

  async function shareProfile() {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({
          title,
          text: shareText,
          url,
        })
        setStatus('shared')
        return
      }

      await copyUrl()
    } catch {
      await copyUrl().catch(() => {
        // Keep the UI quiet if the browser blocks sharing/copying.
      })
    }
  }

  useEffect(() => {
    function onDocumentPointerDown(event: PointerEvent) {
      if (!rootRef.current) return
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function onDocumentKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onDocumentPointerDown)
    document.addEventListener('keydown', onDocumentKeyDown)

    return () => {
      document.removeEventListener('pointerdown', onDocumentPointerDown)
      document.removeEventListener('keydown', onDocumentKeyDown)
    }
  }, [])

  const statusLabel = status === 'copied' ? 'Copied' : status === 'shared' ? 'Shared' : 'Share'

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--surface-2)]"
        style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">{statusLabel === 'Share' ? 'Share profile' : statusLabel}</span>
        <span className="sr-only">Share artist profile</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Share options"
          className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-2xl border bg-white p-1 shadow-[0_18px_48px_rgba(0,23,57,0.16)]"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            type="button"
            onClick={() => {
              void shareProfile()
              setOpen(false)
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--foreground)' }}
            role="menuitem"
          >
            <Share2 className="h-4 w-4 shrink-0" />
            <span>Share profile</span>
          </button>

          <button
            type="button"
            onClick={() => {
              void copyUrl()
              setOpen(false)
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--foreground)' }}
            role="menuitem"
          >
            <Copy className="h-4 w-4 shrink-0" />
            <span>Copy URL</span>
          </button>
        </div>
      )}

      <span className="sr-only" aria-live="polite">
        {status === 'idle' ? '' : statusLabel}
      </span>
    </div>
  )
}
