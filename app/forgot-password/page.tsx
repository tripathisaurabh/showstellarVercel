'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import ShowStellarFeedbackBanner from '@/components/ShowStellarFeedbackBanner'
import { createClient } from '@/lib/supabase/client'

const RESET_COOLDOWN_MS = 8_000

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!cooldownUntil) return

    const interval = window.setInterval(() => {
      setNow(Date.now())
    }, 250)

    return () => window.clearInterval(interval)
  }, [cooldownUntil])

  const remainingSeconds = useMemo(() => {
    if (!cooldownUntil) return 0

    return Math.max(0, Math.ceil((cooldownUntil - now) / 1000))
  }, [cooldownUntil, now])

  const isCooldownActive = remainingSeconds > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSent(false)
    if (isCooldownActive) {
      setError(`Please wait ${remainingSeconds} seconds before requesting another reset link.`)
      return
    }
    setLoading(true)

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      })

      if (resetError) {
        const message = resetError.message?.toLowerCase() ?? ''
        if (message.includes('only request this after 8 seconds')) {
          setCooldownUntil(Date.now() + RESET_COOLDOWN_MS)
          setError('Please wait a few seconds before requesting another reset link.')
          return
        }

        console.error('[forgot-password] reset link request failed:', resetError)
        throw new Error('Unable to send reset link right now. Please try again.')
      }

      setSent(true)
      setCooldownUntil(Date.now() + RESET_COOLDOWN_MS)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to send reset link right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-20" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-white p-8 shadow-sm lg:p-10" style={{ border: '1px solid var(--border)' }}>
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'var(--navy)' }}>
            <Mail className="h-7 w-7 text-white" />
          </div>

          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
              Forgot password?
            </h1>
            <p style={{ color: 'var(--muted)' }}>
              We&apos;ll send a secure reset link to your email address.
            </p>
          </div>

          {sent && (
            <ShowStellarFeedbackBanner
              state="success"
              density="compact"
              className="mb-6"
              title="Check your inbox"
              message="If the email exists, we sent a password reset link."
            />
          )}

          {error && (
            <ShowStellarFeedbackBanner
              state="error"
              density="compact"
              className="mb-6"
              title="A problem occurred"
              message={error}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl bg-white px-4 py-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--accent-violet)]"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || isCooldownActive}
              className="w-full rounded-xl py-3.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--navy)' }}
            >
              {loading
                ? 'Sending reset link…'
                : isCooldownActive
                  ? `Please wait ${remainingSeconds}s`
                  : 'Send reset link'}
            </button>

            <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>
              Remembered your password?{' '}
              <Link href="/artist-login" className="font-semibold hover:underline" style={{ color: 'var(--foreground)' }}>
                Back to login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
