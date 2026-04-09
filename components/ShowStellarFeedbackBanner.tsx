'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'
import { SHOWSTELLAR_FEEDBACK, type ShowStellarFeedbackState } from '@/lib/showstellar-feedback'

type BannerDensity = 'compact' | 'regular'

export default function ShowStellarFeedbackBanner({
  state,
  title,
  message,
  density = 'regular',
  className = '',
  actions,
}: {
  state: ShowStellarFeedbackState
  title?: string
  message?: string
  density?: BannerDensity
  className?: string
  actions?: ReactNode
}) {
  const config = SHOWSTELLAR_FEEDBACK[state]
  const isCompact = density === 'compact'

  return (
    <div
      className={`rounded-2xl border bg-white ${isCompact ? 'p-4' : 'p-5 sm:p-6'} ${className}`}
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-start gap-4">
        <div className={`relative ${isCompact ? 'h-14 w-14' : 'h-16 w-16'} shrink-0 ${config.animationClass}`}>
          <Image src={config.asset} alt={config.alt} fill sizes="64px" className="object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
            {title ?? config.eyebrow}
          </p>
          {message && (
            <p className={`${isCompact ? 'mt-1 text-sm' : 'mt-1.5 text-sm sm:text-[15px]'} leading-6`} style={{ color: 'var(--muted)' }}>
              {message}
            </p>
          )}
          {actions ? <div className="mt-4 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </div>
    </div>
  )
}

