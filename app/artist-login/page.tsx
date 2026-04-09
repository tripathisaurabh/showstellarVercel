'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { LogIn } from 'lucide-react'
import ShowStellarFeedbackBanner from '@/components/ShowStellarFeedbackBanner'
import GoogleAuthButton from '@/components/GoogleAuthButton'
import AuthPasswordField from '@/components/AuthPasswordField'
import { createClient } from '@/lib/supabase/client'
import { buildAuthCallbackUrl } from '@/lib/auth-redirect'

export default function ArtistLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const reasonMessage = useMemo(() => {
    if (reason === 'password-updated') {
      return {
        state: 'success' as const,
        title: 'Password updated',
        message: 'Your password was updated successfully. Please sign in again.',
      }
    }

    if (reason === 'verification-failed') {
      return {
        state: 'verification' as const,
        title: 'Check your inbox',
        message: 'We could not verify your email from that link. Please request a new verification email if needed.',
      }
    }

    if (reason === 'not-artist') {
      return {
        state: 'error' as const,
        title: 'Access restricted',
        message: 'This account is not currently linked to an artist profile.',
      }
    }

    return null
  }, [reason])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch('/api/artist-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Invalid credentials')
      }

      router.push('/artist-dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setError('')
    setOauthLoading(true)
    try {
      const supabase = createClient()
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: buildAuthCallbackUrl('/artist-dashboard'),
        },
      })

      if (oauthError) throw oauthError
      if (data.url) {
        window.location.assign(data.url)
        return
      }

      throw new Error('Unable to start Google sign-in')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to continue with Google')
      setOauthLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-20" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-white p-8 shadow-sm lg:p-10" style={{ border: '1px solid var(--border)' }}>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'var(--navy)' }}>
            <LogIn className="h-8 w-8 text-white" />
          </div>

          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
              Welcome Back
            </h1>
            <p style={{ color: 'var(--muted)' }}>Login to your artist account</p>
          </div>

          {reasonMessage && (
            <ShowStellarFeedbackBanner
              state={reasonMessage.state}
              density="compact"
              className="mb-6"
              title={reasonMessage.title}
              message={reasonMessage.message}
            />
          )}

          {error && (
            <ShowStellarFeedbackBanner
              state={error.toLowerCase().includes('verify your email') ? 'verification' : 'error'}
              density="compact"
              className="mb-6"
              title={error.toLowerCase().includes('verify your email') ? 'Check your inbox' : 'A problem occurred'}
              message={error}
              actions={
                error.toLowerCase().includes('verify your email') ? (
                  <Link href="/verify-email" className="text-sm font-semibold hover:underline" style={{ color: 'var(--foreground)' }}>
                    Open verification page
                  </Link>
                ) : null
              }
            />
          )}

          <div className="space-y-3">
            <GoogleAuthButton loading={oauthLoading} onClick={handleGoogleLogin} />
            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-[var(--border)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                Or with email
              </span>
              <div className="h-px flex-1 bg-[var(--border)]" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
                autoComplete="email"
                className="w-full rounded-xl bg-white px-4 py-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--accent-violet)]"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
              />
            </div>

            <AuthPasswordField
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="Enter your password"
              required
              minLength={8}
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between gap-3 text-sm">
              <Link href="/forgot-password" className="font-semibold hover:underline" style={{ color: 'var(--foreground)' }}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--navy)' }}
            >
              {loading ? 'Logging in…' : 'Login'}
            </button>

            <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>
              Don&apos;t have an account?{' '}
              <Link href="/artist-signup" className="font-semibold hover:underline" style={{ color: 'var(--foreground)' }}>
                Sign up here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
