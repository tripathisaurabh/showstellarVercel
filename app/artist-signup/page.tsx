'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import CategorySelector from '@/components/CategorySelector'
import ShowStellarFeedbackBanner from '@/components/ShowStellarFeedbackBanner'
import GoogleAuthButton from '@/components/GoogleAuthButton'
import AuthPasswordField from '@/components/AuthPasswordField'
import { ARTIST_CATEGORY_OPTIONS } from '@/lib/artist-categories'
import { createClient } from '@/lib/supabase/client'
import { buildAuthCallbackUrl } from '@/lib/auth-redirect'

export default function ArtistSignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const oauthMode = searchParams.get('oauth') === 'google'

  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [loadingSession, setLoadingSession] = useState(oauthMode)
  const [error, setError] = useState('')
  const [sessionEmail, setSessionEmail] = useState('')
  const [sessionName, setSessionName] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    password: '',
    categories: [] as string[],
    custom_categories: [] as string[],
    city: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (!oauthMode) return

    async function loadSession() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Please continue with Google again to complete your profile.')
        setLoadingSession(false)
        return
      }

      setSessionEmail(user.email ?? '')
      setSessionName(
        (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          user.email?.split('@')[0] ??
          ''
      )
      setForm(current => ({
        ...current,
        full_name:
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          current.full_name,
        email: user.email ?? current.email,
      }))
      setLoadingSession(false)
    }

    loadSession()
  }, [oauthMode])

  const heading = oauthMode ? 'Complete Your Artist Profile' : 'Create Your Artist Profile'
  const subheading = oauthMode
    ? 'Finish setting up your ShowStellar artist account started with Google.'
    : 'Start your journey with ShowStellar'

  const visualTitle = oauthMode ? 'Finish your artist profile' : 'Join ShowStellar as an Artist'
  const visualDescription = oauthMode
    ? 'Complete your profile with a polished setup that helps clients understand your style, city, and performance categories.'
    : 'Create a professional profile that feels premium, clear, and ready for clients to discover.'

  const introBullets = useMemo(
    () => [
      'Create your professional profile and showcase your talent',
      'Get discovered by clients looking for premium artists',
      'Receive booking inquiries directly from interested clients',
      'Manage your profile and inquiries from one dashboard',
    ],
    []
  )

  async function handleGoogleSignIn() {
    setError('')
    setGoogleLoading(true)

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
      setGoogleLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = oauthMode ? '/api/auth/google-complete' : '/api/artist-signup'
      const payload = oauthMode
        ? {
            full_name: form.full_name,
            phone_number: form.phone_number,
            categories: form.categories,
            custom_categories: form.custom_categories,
            city: form.city,
          }
        : form

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const parsed = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(parsed?.error ?? 'Signup failed')
      }

      if (oauthMode) {
        router.push('/artist-dashboard')
      } else {
        router.push('/verify-email?state=signup-success')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen py-6 sm:py-10 lg:py-16 max-sm:bg-[#e9eef5]"
      style={{ background: 'var(--background)' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-start lg:gap-10 xl:gap-12">
          <section className="space-y-4 lg:sticky lg:top-8">
            <div className="overflow-hidden rounded-[32px] border bg-[var(--surface-2)] shadow-sm" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--muted)' }}>
                    Artist Spotlight
                  </p>
                  <p className="mt-1 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    Premium artist onboarding
                  </p>
                </div>
                <div
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{ borderColor: 'rgba(0,23,57,0.12)', color: 'var(--foreground)' }}
                >
                  ShowStellar
                </div>
              </div>

              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80"
                  alt="Live artist performance under stage lights"
                  fill
                  priority
                  sizes="(min-width: 1024px) 46vw, 100vw"
                  className="object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--accent)]/18 via-transparent to-transparent" />
              </div>
            </div>

            <div
              className="rounded-[28px] border bg-white p-5 shadow-sm sm:p-6 max-sm:border-[rgba(0,23,57,0.14)] max-sm:bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fc_100%)] max-sm:shadow-[0_18px_40px_rgba(0,23,57,0.10)]"
              style={{ borderColor: 'var(--border)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--muted)' }}>
                {oauthMode ? 'Complete in minutes' : 'Join as Artist'}
              </p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl" style={{ color: 'var(--foreground)' }}>
                {visualTitle}
              </h2>
              <p className="mt-3 text-sm leading-7 sm:text-[15px]" style={{ color: 'var(--muted)' }}>
                {visualDescription}
              </p>

              <ul className="mt-5 space-y-3">
                {introBullets.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm leading-6" style={{ color: 'var(--foreground)' }}>
                    <span
                      className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                      style={{ background: 'rgba(0,23,57,0.08)', color: 'var(--navy)' }}
                    >
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <div
            className="w-full rounded-[28px] border bg-white p-5 shadow-sm sm:p-6 lg:p-10 max-sm:border-[rgba(0,23,57,0.14)] max-sm:bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fc_100%)] max-sm:shadow-[0_18px_45px_rgba(0,23,57,0.10)]"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="mb-6 sm:mb-8">
              <h1 className="mb-2 text-3xl font-bold leading-tight" style={{ color: 'var(--foreground)' }}>
                {heading}
              </h1>
              <p style={{ color: 'var(--muted)' }}>{subheading}</p>
            </div>

            {oauthMode && (
              <ShowStellarFeedbackBanner
                state="signup"
                density="compact"
                className="mb-5"
                title="Continue with Google"
                message={`We found your Google account${sessionName ? `, ${sessionName}` : ''}. Complete the missing details below to activate your artist profile.`}
              />
            )}

            {error && (
              <ShowStellarFeedbackBanner
                state={error.toLowerCase().includes('verify your email') ? 'verification' : 'error'}
                density="compact"
                className="mb-5"
                title={error.toLowerCase().includes('verify your email') ? 'Check your inbox' : 'A problem occurred'}
                message={error}
              />
            )}

            {loadingSession && oauthMode ? (
              <div className="rounded-2xl border bg-[var(--surface-2)] px-4 py-5 text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
                Preparing your Google profile…
              </div>
            ) : (
              <>
                {!oauthMode && (
                  <div className="space-y-3">
                    <GoogleAuthButton loading={googleLoading} onClick={handleGoogleSignIn} />
                    <div className="flex items-center gap-3 py-1">
                      <div className="h-px flex-1 bg-[var(--border)]" />
                      <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                        Or with email
                      </span>
                      <div className="h-px flex-1 bg-[var(--border)]" />
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className={`space-y-4 sm:space-y-5 ${!oauthMode ? 'mt-6' : ''}`}>
                  <Field label="Full Name">
                    <Input
                      value={form.full_name}
                      onChange={v => set('full_name', v)}
                      placeholder="Your stage or real name"
                      required
                      disabled={oauthMode && loadingSession}
                    />
                  </Field>

                  <Field label="Phone Number">
                    <Input
                      value={form.phone_number}
                      onChange={v => set('phone_number', v)}
                      placeholder="+91 98765 43210"
                      required
                    />
                  </Field>

                  <Field label="Email">
                    <Input
                      type="email"
                      value={form.email}
                      onChange={v => set('email', v)}
                      placeholder="you@example.com"
                      required={!oauthMode}
                      disabled={oauthMode}
                    />
                    {oauthMode && sessionEmail ? (
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        Signed in as {sessionEmail}
                      </p>
                    ) : null}
                  </Field>

                  {!oauthMode && (
                    <AuthPasswordField
                      label="Password"
                      value={form.password}
                      onChange={v => set('password', v)}
                      placeholder="Min 8 characters"
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                  )}

                  <Field label="Categories">
                    <CategorySelector
                      options={Array.from(ARTIST_CATEGORY_OPTIONS)}
                      value={{
                        categories: form.categories,
                        customCategories: form.custom_categories,
                      }}
                      onChange={next =>
                        setForm(f => ({
                          ...f,
                          categories: next.categories,
                          custom_categories: next.customCategories,
                        }))
                      }
                    />
                  </Field>

                  <Field label="City">
                    <Input
                      value={form.city}
                      onChange={v => set('city', v)}
                      placeholder="e.g. Mumbai, Delhi"
                      required
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={loading || loadingSession}
                    className="w-full rounded-xl py-3.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'var(--navy)' }}
                  >
                    {loading
                      ? oauthMode
                        ? 'Completing profile…'
                        : 'Creating account…'
                      : oauthMode
                        ? 'Complete Profile'
                        : 'Create Account'}
                  </button>

                  <p className="pt-1 text-center text-sm sm:pt-2" style={{ color: 'var(--muted)' }}>
                    {oauthMode ? (
                      <>
                        Need a different Google account?{' '}
                        <button
                          type="button"
                          onClick={handleGoogleSignIn}
                          className="font-semibold hover:underline"
                          style={{ color: 'var(--foreground)' }}
                        >
                          Continue with Google again
                        </button>
                      </>
                    ) : (
                      <>
                        Already have an account?{' '}
                        <Link href="/artist-login" className="font-semibold hover:underline" style={{ color: 'var(--foreground)' }}>
                          Login here
                        </Link>
                      </>
                    )}
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 sm:gap-2">
      <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  minLength,
  disabled,
}: {
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  minLength?: number
  disabled?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      minLength={minLength}
      disabled={disabled}
      className="w-full rounded-xl bg-white px-4 py-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--accent-violet)] disabled:bg-[var(--surface-2)] max-sm:border-[rgba(0,23,57,0.16)] max-sm:bg-[var(--surface-2)]"
      style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
    />
  )
}
