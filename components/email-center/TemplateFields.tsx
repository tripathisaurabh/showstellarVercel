import type { EmailTemplateData, EmailTemplateFieldDefinition } from '@/lib/email-center/types'

type TemplateFieldsProps = {
  fields: EmailTemplateFieldDefinition[]
  templateData: EmailTemplateData
  onChange: (fieldName: string, value: string) => void
  disabled?: boolean
}

export default function TemplateFields({
  fields,
  templateData,
  onChange,
  disabled = false,
}: TemplateFieldsProps) {
  const dynamicFields = fields.filter(field => field.name !== 'artistName')

  if (dynamicFields.length === 0) {
    return (
      <div
        className="rounded-2xl border border-dashed px-4 py-5 text-sm"
        style={{
          borderColor: 'rgba(0, 23, 57, 0.12)',
          color: 'var(--muted)',
          background: 'rgba(255,255,255,0.7)',
        }}
      >
        This template only uses the shared recipient details above.
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {dynamicFields.map(field => (
        <label key={field.name} className="block">
          <span className="mb-2 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            {field.label}
            {field.required ? ' *' : ''}
          </span>
          {field.description ? (
            <span className="mb-2 block text-xs leading-5" style={{ color: 'var(--muted)' }}>
              {field.description}
            </span>
          ) : null}
          <input
            type={field.type === 'password' ? 'text' : field.type}
            value={templateData[field.name] ?? ''}
            onChange={event => onChange(field.name, event.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className="h-12 w-full rounded-2xl border bg-white px-4 text-sm outline-none transition-all focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              borderColor: 'rgba(0, 23, 57, 0.12)',
              color: 'var(--foreground)',
              boxShadow: '0 1px 2px rgba(0,23,57,0.04)',
            }}
          />
        </label>
      ))}
    </div>
  )
}
