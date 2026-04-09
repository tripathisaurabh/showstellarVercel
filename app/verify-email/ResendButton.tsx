'use client'

import { useState } from 'react'
import { Mail, Loader2 } from 'lucide-react'

export default function ResendButton({ email }: { email: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  async function handleResend() {
    setState('loading')
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' })
      setState(res.ok ? 'sent' : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'sent') {
    return (
      <div
        className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium"
        style={{ background: 'var(--surface-2)', color: 'var(--accent)', border: '1px solid rgba(193,117,245,0.18)' }}
      >
        <Mail className="w-4 h-4 flex-shrink-0" />
        Verification email sent to {email}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleResend}
        disabled={state === 'loading'}
        className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: 'var(--navy)' }}
      >
        {state === 'loading' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Mail className="w-4 h-4" />
        )}
        {state === 'loading' ? 'Sending…' : 'Resend Verification Email'}
      </button>
      {state === 'error' && (
        <p className="text-xs text-center" style={{ color: 'var(--error)' }}>
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  )
}
