'use client'

type Props = {
  label?: string
  loading?: boolean
  disabled?: boolean
  onClick: () => void | Promise<void>
  className?: string
}

export default function GoogleAuthButton({
  label = 'Continue with Google',
  loading,
  disabled,
  onClick,
  className = '',
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex w-full items-center justify-center gap-3 rounded-xl border border-[color:var(--border)]/10 bg-white px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition-all hover:-translate-y-0.5 hover:border-[color:var(--border)]/20 hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
        <path fill="#001739" d="M21.35 11.1h-9.17v2.9h5.26c-.23 1.24-.95 2.29-2.02 2.99v2.48h3.27c1.91-1.76 3.02-4.34 3.02-7.37 0-.69-.06-1.34-.17-2z" />
        <path fill="#c175f5" d="M12.18 22c2.72 0 5-0.9 6.66-2.46l-3.27-2.48c-.9.6-2.05.95-3.39.95-2.61 0-4.82-1.76-5.61-4.13H3.2v2.58C4.85 19.83 8.24 22 12.18 22z" />
        <path fill="#1a1a1a" d="M6.57 13.88a5.7 5.7 0 0 1 0-3.76V7.54H3.2a9.96 9.96 0 0 0 0 8.92l3.37-2.58z" />
        <path fill="#001739" d="M12.18 5.49c1.48 0 2.82.51 3.87 1.5l2.9-2.9C17.17 2.43 14.9 1.5 12.18 1.5 8.24 1.5 4.85 3.67 3.2 7.54l3.37 2.58c.79-2.37 3-4.63 5.61-4.63z" />
      </svg>
      <span>{loading ? 'Connecting…' : label}</span>
    </button>
  )
}
