type SendStatusProps = {
  tone: 'idle' | 'sending' | 'success' | 'error'
  message: string | null
}

const TONE_STYLES = {
  idle: {
    background: 'rgba(0, 23, 57, 0.04)',
    border: 'rgba(0, 23, 57, 0.08)',
    color: 'var(--muted)',
  },
  sending: {
    background: 'rgba(193, 117, 245, 0.10)',
    border: 'rgba(193, 117, 245, 0.24)',
    color: 'var(--navy)',
  },
  success: {
    background: 'rgba(0, 23, 57, 0.06)',
    border: 'rgba(0, 23, 57, 0.14)',
    color: 'var(--navy)',
  },
  error: {
    background: 'rgba(26, 26, 26, 0.05)',
    border: 'rgba(26, 26, 26, 0.12)',
    color: '#111827',
  },
} as const

export default function SendStatus({ tone, message }: SendStatusProps) {
  if (!message) {
    return null
  }

  const style = TONE_STYLES[tone]

  return (
    <div
      className="rounded-2xl border px-4 py-3 text-sm leading-6"
      style={{
        background: style.background,
        borderColor: style.border,
        color: style.color,
      }}
    >
      {message}
    </div>
  )
}
