'use client'

import dynamic from 'next/dynamic'
import type { EmailTemplateData, EmailTemplateDefinition } from '@/lib/email-center/types'
import SendStatus from '@/components/email-center/SendStatus'

const TemplateFields = dynamic(() => import('@/components/email-center/TemplateFields'), {
  loading: () => (
    <div className="rounded-2xl border border-dashed px-4 py-5 text-sm" style={{ borderColor: 'rgba(0, 23, 57, 0.12)', color: 'var(--muted)', background: 'rgba(255,255,255,0.7)' }}>
      Loading template fields…
    </div>
  ),
})

type EmailFormProps = {
  templates: EmailTemplateDefinition[]
  selectedTemplateKey: string
  to: string
  subject: string
  artistName: string
  selectedArtistId?: string
  templateData: EmailTemplateData
  disabled: boolean
  adminEmail: string
  statusTone: 'idle' | 'sending' | 'success' | 'error'
  statusMessage: string | null
  onTemplateChange: (templateKey: string) => void
  onToChange: (value: string) => void
  onSubjectChange: (value: string) => void
  onArtistNameChange: (value: string) => void
  onTemplateFieldChange: (fieldName: string, value: string) => void
  onLoadSampleData: () => void
  onSendEmail: () => void
  onSendTest: () => void
}

export default function EmailForm({
  templates,
  selectedTemplateKey,
  to,
  subject,
  artistName,
  selectedArtistId,
  templateData,
  disabled,
  adminEmail,
  statusTone,
  statusMessage,
  onTemplateChange,
  onToChange,
  onSubjectChange,
  onArtistNameChange,
  onTemplateFieldChange,
  onLoadSampleData,
  onSendEmail,
  onSendTest,
}: EmailFormProps) {
  const selectedTemplate =
    templates.find(template => template.key === selectedTemplateKey) ?? templates[0]

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border bg-white p-6 shadow-[0_20px_50px_rgba(0,23,57,0.08)]" style={{ borderColor: 'rgba(0, 23, 57, 0.10)' }}>
        <div className="mb-5">
          <div className="text-sm font-semibold tracking-[0.18em] uppercase" style={{ color: 'var(--navy)' }}>
            Template + Recipient
          </div>
          <p className="mt-2 text-sm leading-6" style={{ color: 'var(--muted)' }}>
            Choose the email type, review the purpose, then enter the target artist details.
          </p>
        </div>

        {artistName ? (
          <div
            className="mb-4 rounded-2xl border px-4 py-3 text-sm"
            style={{
              borderColor: 'rgba(0, 23, 57, 0.10)',
              background: 'rgba(0, 23, 57, 0.03)',
              color: 'var(--foreground)',
            }}
          >
            <span className="font-semibold">Selected artist:</span> {artistName}
            {selectedArtistId ? <span className="ml-2 text-xs" style={{ color: 'var(--muted)' }}>({selectedArtistId})</span> : null}
          </div>
        ) : null}

        <div className="grid gap-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Email Template
            </span>
            <select
              value={selectedTemplateKey}
              onChange={event => onTemplateChange(event.target.value)}
              disabled={disabled}
              className="h-12 w-full rounded-2xl border bg-white px-4 text-sm outline-none transition-all focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ borderColor: 'rgba(0, 23, 57, 0.12)' }}
            >
              {templates.map(template => (
                <option key={template.key} value={template.key}>
                  {template.label}
                </option>
              ))}
            </select>
          </label>

          <div
            className="rounded-2xl border px-4 py-4"
            style={{
              borderColor: 'rgba(0, 23, 57, 0.10)',
              background: 'linear-gradient(180deg, rgba(0,23,57,0.03) 0%, rgba(255,255,255,0.96) 100%)',
            }}
          >
            <div className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--navy)' }}>
              Template Notes
            </div>
            <div className="mt-2 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              {selectedTemplate.description}
            </div>
            <div className="mt-2 text-sm leading-6" style={{ color: 'var(--muted)' }}>
              {selectedTemplate.notes}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                To Email *
              </span>
              <input
                type="email"
                value={to}
                onChange={event => onToChange(event.target.value)}
                placeholder="artist@example.com"
                disabled={disabled}
                className="h-12 w-full rounded-2xl border bg-white px-4 text-sm outline-none transition-all focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ borderColor: 'rgba(0, 23, 57, 0.12)' }}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Optional Artist Name
              </span>
              <input
                type="text"
                value={artistName}
                onChange={event => onArtistNameChange(event.target.value)}
                placeholder="Rahul Sharma"
                disabled={disabled}
                className="h-12 w-full rounded-2xl border bg-white px-4 text-sm outline-none transition-all focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ borderColor: 'rgba(0, 23, 57, 0.12)' }}
              />
            </label>

            <div
              className="rounded-2xl border px-4 py-4 text-sm"
              style={{
                borderColor: 'rgba(0, 23, 57, 0.10)',
                background: 'rgba(0,23,57,0.025)',
                color: 'var(--muted)',
              }}
            >
              Test sends go to <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{adminEmail || 'your admin email'}</span>.
            </div>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Subject *
              </span>
              <input
                type="text"
                value={subject}
                onChange={event => onSubjectChange(event.target.value)}
                placeholder={selectedTemplate.defaultSubject}
                disabled={disabled}
                className="h-12 w-full rounded-2xl border bg-white px-4 text-sm outline-none transition-all focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ borderColor: 'rgba(0, 23, 57, 0.12)' }}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border bg-white p-6 shadow-[0_20px_50px_rgba(0,23,57,0.08)]" style={{ borderColor: 'rgba(0, 23, 57, 0.10)' }}>
        <div className="mb-5">
          <div className="text-sm font-semibold tracking-[0.18em] uppercase" style={{ color: 'var(--navy)' }}>
            Dynamic Variables
          </div>
          <p className="mt-2 text-sm leading-6" style={{ color: 'var(--muted)' }}>
            Only the fields required by the selected template are shown here.
          </p>
        </div>
        <TemplateFields
          fields={selectedTemplate.fields}
          templateData={templateData}
          onChange={onTemplateFieldChange}
          disabled={disabled}
        />
      </section>

      <section className="rounded-[28px] border bg-white p-6 shadow-[0_20px_50px_rgba(0,23,57,0.08)]" style={{ borderColor: 'rgba(0, 23, 57, 0.10)' }}>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onLoadSampleData}
            disabled={disabled}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border px-4 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              borderColor: 'rgba(0, 23, 57, 0.10)',
              color: 'var(--foreground)',
              background: '#ffffff',
            }}
          >
            Load sample data
          </button>

          <button
            type="button"
            onClick={onSendTest}
            disabled={disabled || !adminEmail}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border px-4 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              borderColor: 'rgba(0, 23, 57, 0.10)',
              color: 'var(--navy)',
              background: 'rgba(0, 23, 57, 0.04)',
            }}
          >
            Send test to me
          </button>

          <button
            type="button"
            onClick={onSendEmail}
            disabled={disabled}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #001739 0%, #173466 100%)',
              boxShadow: '0 14px 30px rgba(0, 23, 57, 0.18)',
            }}
          >
            {disabled ? 'Sending…' : 'Send email'}
          </button>
        </div>

        <div className="mt-4">
          <SendStatus tone={statusTone} message={statusMessage} />
        </div>
      </section>
    </div>
  )
}
