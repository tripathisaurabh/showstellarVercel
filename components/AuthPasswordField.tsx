'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  minLength?: number
  autoComplete?: string
  hint?: string
  disabled?: boolean
}

export default function AuthPasswordField({
  label,
  value,
  onChange,
  placeholder,
  required,
  minLength,
  autoComplete,
  hint,
  disabled,
}: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="flex flex-col gap-1.5 sm:gap-2">
      <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          disabled={disabled}
          className="w-full rounded-xl bg-white px-4 py-3 pr-12 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--accent-violet)]"
          style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
        />
        <button
          type="button"
          onClick={() => setVisible(prev => !prev)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint ? (
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}
