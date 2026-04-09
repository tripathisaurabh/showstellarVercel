import Link from 'next/link'
import { cookies } from 'next/headers'
import ShowStellarMascotState from '@/components/ShowStellarMascotState'
import { createClient } from '@/lib/supabase/server'
import { AUTH_FLOW_COOKIE, AUTH_FLOW_RECOVERY } from '@/lib/auth-flow'
import ResetPasswordClient from './ResetPasswordClient'

export const metadata = { robots: { index: false, follow: false } }

type ResetPasswordPageProps = {
  searchParams?: Promise<{ reason?: string | string[] }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const cookieStore = await cookies()
  const recoveryMarker = cookieStore.get(AUTH_FLOW_COOKIE)?.value
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const hasRecoveryAccess = Boolean(user) && recoveryMarker === AUTH_FLOW_RECOVERY
  const email = user?.email ?? null
  const reasonValue = Array.isArray(resolvedSearchParams.reason)
    ? resolvedSearchParams.reason[0]
    : resolvedSearchParams.reason
  const expiredRequested = reasonValue === 'expired'

  if (!hasRecoveryAccess) {
    return (
      <div className="px-4 py-10 sm:px-6 lg:px-8" style={{ background: 'var(--background)' }}>
        <div className="mx-auto w-full max-w-3xl">
          <ShowStellarMascotState
            state="lost"
            title="This reset link missed the stage"
            message={
              expiredRequested || !user
                ? 'Your reset link may have expired or was already used. Request a fresh reset email to set a new password.'
                : 'You need a fresh password reset session to continue. Request a reset email to proceed safely.'
            }
            actions={
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/forgot-password"
                  className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                >
                  Request new reset link
                </Link>
                <Link
                  href="/artist-login"
                  className="rounded-full border px-5 py-3 text-sm font-semibold transition-colors hover:bg-[var(--surface-2)]"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                >
                  Back to Login
                </Link>
              </div>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <ResetPasswordClient
      email={email}
      clearRecoveryCookiePath="/api/auth/complete-password-reset"
    />
  )
}
