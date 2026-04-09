import Image from 'next/image'
import type { ReactNode } from 'react'
import { SHOWSTELLAR_FEEDBACK, type ShowStellarFeedbackState } from '@/lib/showstellar-feedback'

type Layout = 'page' | 'card' | 'inline'

export default function ShowStellarMascotState({
  state,
  title,
  message,
  layout = 'page',
  actions,
  className = '',
  showEyebrow = true,
}: {
  state: ShowStellarFeedbackState
  title?: string
  message?: string
  layout?: Layout
  actions?: ReactNode
  className?: string
  showEyebrow?: boolean
}) {
  const config = SHOWSTELLAR_FEEDBACK[state]
  const resolvedTitle = title ?? config.eyebrow
  const isLoading = state === 'loading'

  if (layout === 'inline') {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        <div className={`relative h-10 w-10 shrink-0 ${config.animationClass}`}>
          <Image src={config.asset} alt={config.alt} fill sizes="40px" className="object-contain" />
        </div>
        <div className="min-w-0">
          {showEyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
              {resolvedTitle}
            </p>
          )}
          {message && (
            <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
              {message}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (layout === 'card') {
    return (
      <div
        className={`rounded-2xl border bg-white p-4 sm:p-5 ${className}`}
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-start gap-4">
          <div className={`relative h-16 w-16 shrink-0 ${config.animationClass}`}>
            <Image src={config.asset} alt={config.alt} fill sizes="64px" className="object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            {showEyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                {resolvedTitle}
              </p>
            )}
            {title && title !== resolvedTitle && (
              <p className="mt-1 text-sm font-semibold sm:text-base" style={{ color: 'var(--foreground)' }}>
                {title}
              </p>
            )}
            {message && (
              <p className="mt-1 text-sm leading-6" style={{ color: 'var(--muted)' }}>
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-[calc(100vh-80px)] px-4 py-10 sm:px-6 lg:px-8 ${className}`}>
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center text-center">
        <div className={`relative h-28 w-28 sm:h-36 sm:w-36 ${config.animationClass}`}>
          <Image src={config.asset} alt={config.alt} fill sizes="144px" priority className="object-contain" />
        </div>
        {showEyebrow && (
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--muted)' }}>
            {resolvedTitle}
          </p>
        )}
        {title && title !== resolvedTitle && (
          <h1 className="mt-3 text-2xl font-semibold sm:text-3xl" style={{ color: 'var(--foreground)' }}>
            {title}
          </h1>
        )}
        {message && (
          <p className="mt-3 max-w-md text-sm sm:text-base" style={{ color: 'var(--muted)' }}>
            {message}
          </p>
        )}
        {isLoading ? (
          <div className="mt-8 w-full max-w-md space-y-3">
            <div className="h-3 rounded-full bg-[var(--surface-2)] shimmer" />
            <div className="h-3 w-5/6 rounded-full bg-[var(--surface-2)] shimmer" />
            <div className="h-3 w-2/3 rounded-full bg-[var(--surface-2)] shimmer" />
          </div>
        ) : null}
        {actions ? <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{actions}</div> : null}
      </div>
    </div>
  )
}
