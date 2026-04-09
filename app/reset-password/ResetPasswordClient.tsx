'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ShowStellarFeedbackBanner from '@/components/ShowStellarFeedbackBanner'
import AuthPasswordField from '@/components/AuthPasswordField'
import { createClient } from '@/lib/supabase/client'

type Props = {
  email: string | null
  clearRecoveryCookiePath: string
}

export default function ResetPasswordClient({ email, clearRecoveryCookiePath }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  async function clearRecoveryCookie() {
    try {
      await fetch(clearRecoveryCookiePath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    } catch {
      // Non-fatal. The cookie is short-lived and tied to the recovery session.
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const nextPassword = password.trim()

    if (nextPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (nextPassword !== confirmPassword.trim()) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password: nextPassword })

      if (updateError) {
        const message = updateError.message?.toLowerCase() ?? ''
        if (message.includes('session') || message.includes('expired') || message.includes('token')) {
          throw new Error('Your reset link has expired. Request a fresh reset email to continue.')
        }

        throw new Error('Unable to update password right now. Please try again.')
      }

      setSuccess('Password updated successfully. Signing you out now.')
      await clearRecoveryCookie()
      await supabase.auth.signOut()
      await new Promise(resolve => setTimeout(resolve, 900))
      router.push('/artist-login?reason=password-updated')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to update password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-20" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-white p-8 shadow-sm lg:p-10" style={{ border: '1px solid var(--border)' }}>
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'var(--navy)' }}>
            <Lock className="h-7 w-7 text-white" />
          </div>

          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
              Reset password
            </h1>
            <p style={{ color: 'var(--muted)' }}>
              {email
                ? `Create a new password for ${email}.`
                : 'Create a new password to complete your recovery session.'}
            </p>
          </div>

          {success && (
            <ShowStellarFeedbackBanner
              state="success"
              density="compact"
              className="mb-6"
              title="Password updated"
              message={success}
            />
          )}

          {error && (
            <ShowStellarFeedbackBanner
              state="error"
              density="compact"
              className="mb-6"
              title="A problem occurred"
              message={error}
              actions={
                <Link href="/forgot-password" className="text-sm font-semibold hover:underline" style={{ color: 'var(--foreground)' }}>
                  Request a new reset link
                </Link>
              }
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthPasswordField
              label="New password"
              value={password}
              onChange={setPassword}
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
              hint="Use a strong password you do not reuse elsewhere."
            />

            <AuthPasswordField
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Re-enter your new password"
              required
              minLength={8}
              autoComplete="new-password"
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl py-3.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--navy)' }}
            >
              {submitting ? 'Updating password…' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
