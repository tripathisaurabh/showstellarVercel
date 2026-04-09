import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ResendButton from './ResendButton'
import ShowStellarMascotState from '@/components/ShowStellarMascotState'

export const dynamic = 'force-dynamic'

export const metadata = { robots: { index: false, follow: false } }

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string | string[] }>
}) {
  const resolvedSearchParams = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const email = user?.email ?? null
  const alreadyVerified = !!user?.email_confirmed_at
  const stateValue = Array.isArray(resolvedSearchParams.state) ? resolvedSearchParams.state[0] : resolvedSearchParams.state
  const signupSuccessState = stateValue === 'signup-success'

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8" style={{ background: 'var(--background)' }}>
      <div className="mx-auto w-full max-w-3xl">
        {alreadyVerified ? (
          <ShowStellarMascotState
            state="success"
            title="Email already verified"
            message="Your email address has been verified. You can access your dashboard."
            actions={
              <Link
                href="/artist-dashboard"
                className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                Go to Dashboard
              </Link>
            }
          />
        ) : (
          <ShowStellarMascotState
            state={signupSuccessState ? 'signup' : 'verification'}
            title={signupSuccessState ? 'Artist profile created successfully' : 'Verify your email'}
            message={
              email
                ? `We sent a verification link to ${email}. Click the link in that email to activate your account.`
                : 'Check your inbox for the verification link. Click it to activate your account.'
            }
            actions={
              <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
                {email ? (
                  <ResendButton email={email} />
                ) : (
                  <Link
                    href="/artist-login"
                    className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                  >
                    Back to Login
                  </Link>
                )}
                <Link
                  href="/artist-signup"
                  className="rounded-full border px-5 py-3 text-sm font-semibold transition-colors hover:bg-[var(--surface-2)]"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                >
                  Sign up again
                </Link>
              </div>
            }
          />
        )}
      </div>
    </div>
  )
}
