import type { EmailTemplateData, EmailTemplateDefinition } from '@/lib/email-center/types'

type EmailPreviewProps = {
  template: EmailTemplateDefinition
  to: string
  subject: string
  from: string
  templateData: EmailTemplateData
}

export default function EmailPreview({
  template,
  to,
  subject,
  from,
  templateData,
}: EmailPreviewProps) {
  const html = template.renderPreview?.(templateData) ?? template.renderHtml(templateData)

  return (
    <div
      className="overflow-hidden rounded-[28px] border bg-white shadow-[0_24px_80px_rgba(0,23,57,0.12)]"
      style={{ borderColor: 'rgba(0, 23, 57, 0.10)' }}
    >
      <div
        className="flex items-center justify-between gap-4 border-b px-5 py-4"
        style={{
          borderColor: 'rgba(0, 23, 57, 0.08)',
          background: 'linear-gradient(180deg, rgba(0,23,57,0.03) 0%, rgba(255,255,255,0.96) 100%)',
        }}
      >
        <div>
          <div className="text-sm font-semibold tracking-[0.18em] uppercase" style={{ color: 'var(--navy)' }}>
            Live Preview
          </div>
          <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
            Email client style rendering
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#f87171]" />
          <span className="h-3 w-3 rounded-full bg-[#fbbf24]" />
          <span className="h-3 w-3 rounded-full bg-[#34d399]" />
        </div>
      </div>

      <div className="border-b px-5 py-4 text-sm" style={{ borderColor: 'rgba(0, 23, 57, 0.08)' }}>
        <div className="grid gap-2">
          <PreviewMeta label="From" value={from} />
          <PreviewMeta label="To" value={to || 'recipient@example.com'} />
          <PreviewMeta label="Subject" value={subject || template.defaultSubject} />
        </div>
      </div>

      <div className="max-h-[820px] overflow-auto p-4 md:p-5" style={{ background: '#e9eef7' }}>
        <div className="rounded-[24px] border bg-white p-2 shadow-[0_12px_36px_rgba(0,23,57,0.08)]" style={{ borderColor: 'rgba(0, 23, 57, 0.10)' }}>
          <iframe
            title={`${template.label} preview`}
            srcDoc={html}
            className="h-[720px] w-full rounded-[20px] bg-white"
          />
        </div>
      </div>
    </div>
  )
}

function PreviewMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[72px_1fr] items-start gap-3">
      <span className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted-light)' }}>
        {label}
      </span>
      <span className="break-all text-sm" style={{ color: 'var(--foreground)' }}>
        {value}
      </span>
    </div>
  )
}
