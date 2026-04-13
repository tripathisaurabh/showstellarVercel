import type {
  EmailCenterPayload,
  EmailCenterSendLog,
  EmailCenterValidationResult,
  EmailTemplateData,
  EmailTemplateDefinition,
  EmailTemplateFieldDefinition,
} from '@/lib/email-center/types'

export const EMAIL_CENTER_SAMPLE_VALUES: EmailTemplateData = {
  artistName: 'Rahul Sharma',
  artistEmail: 'rahul@example.com',
  temporaryPassword: 'Temp@1234',
  loginUrl: 'https://www.showstellar.in/artist-login',
  resetUrl: 'https://www.showstellar.in/reset-password',
  supportEmail: 'support@showstellar.com',
  category: 'Singer',
  city: 'Mumbai',
}

const MAX_SUBJECT_LENGTH = 180
const MAX_FIELD_LENGTH = 1000

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function sanitizeInput(value: string) {
  return value.replace(/[\u0000-\u001F\u007F]/g, '').trim()
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function isValidUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export function getInitialTemplateData(template: EmailTemplateDefinition) {
  return template.getInitialData()
}

export function getSampleTemplateData(template: EmailTemplateDefinition) {
  return template.fields.reduce<EmailTemplateData>((acc, field) => {
    acc[field.name] = EMAIL_CENTER_SAMPLE_VALUES[field.name] ?? template.getInitialData()[field.name] ?? ''
    return acc
  }, {})
}

export function mergeTemplateDataForTemplateChange(
  previousData: EmailTemplateData,
  nextTemplate: EmailTemplateDefinition
) {
  const nextData = nextTemplate.getInitialData()

  for (const field of nextTemplate.fields) {
    const currentValue = previousData[field.name]
    if (typeof currentValue === 'string' && currentValue.trim()) {
      nextData[field.name] = currentValue
    }
  }

  return nextData
}

export function buildFieldError(field: EmailTemplateFieldDefinition, value: string) {
  if (field.required && !value) {
    return `${field.label} is required.`
  }

  if (!value) {
    return null
  }

  if (value.length > MAX_FIELD_LENGTH) {
    return `${field.label} is too long.`
  }

  if (field.type === 'email' && !isValidEmail(value)) {
    return `${field.label} must be a valid email address.`
  }

  if (field.type === 'url' && !isValidUrl(value)) {
    return `${field.label} must be a valid URL.`
  }

  return null
}

export function validateEmailCenterPayload(
  payload: EmailCenterPayload,
  template: EmailTemplateDefinition
): EmailCenterValidationResult {
  const errors: string[] = []
  const sanitizedTo = sanitizeInput(payload.to).toLowerCase()
  const sanitizedSubject = sanitizeInput(payload.subject)
  const sanitizedTemplateData = template.fields.reduce<EmailTemplateData>((acc, field) => {
    acc[field.name] = sanitizeInput(payload.templateData[field.name] ?? '')
    return acc
  }, {})

  if (!payload.sendTest) {
    if (!sanitizedTo) {
      errors.push('To Email is required.')
    } else if (!isValidEmail(sanitizedTo)) {
      errors.push('To Email must be a valid email address.')
    }
  }

  if (!sanitizedSubject) {
    errors.push('Subject is required.')
  } else if (sanitizedSubject.length > MAX_SUBJECT_LENGTH) {
    errors.push('Subject is too long.')
  }

  for (const field of template.fields) {
    const error = buildFieldError(field, sanitizedTemplateData[field.name] ?? '')
    if (error) {
      errors.push(error)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitizedTo,
    sanitizedSubject,
    sanitizedTemplateData,
  }
}

type BrandedEmailContent = {
  title: string
  intro: string
  headerLogoUrl?: string
  headerLogoAlt?: string
  headerLogoWidth?: number
  sections: string[]
  ctaLabel?: string
  ctaUrl?: string
  closing?: string
  footer?: string
}

export function buildBrandedEmailHtml({
  title,
  intro,
  headerLogoUrl,
  headerLogoAlt = 'ShowStellar',
  headerLogoWidth = 168,
  sections,
  ctaLabel,
  ctaUrl,
  closing = 'Need help? Reply to this email and the ShowStellar team will assist you.',
  footer = 'ShowStellar artist communications',
}: BrandedEmailContent) {
  const formatSectionHtml = (section: string) =>
    escapeHtml(section).replace(/\*\*(.+?)\*\*/g, '<strong style="color:#001739;font-weight:700;">$1</strong>')
  const resolvedHeaderLogoUrl = headerLogoUrl ?? 'https://showstellar.com/headerlogo.png'

  const sectionMarkup = sections
    .map(
      section => `
        <tr>
          <td style="padding:0 0 14px 0;font-size:15px;line-height:1.75;color:#1a1a1a;">
            ${formatSectionHtml(section)}
          </td>
        </tr>
      `
    )
    .join('')

  const ctaMarkup =
    ctaLabel && ctaUrl
      ? `
          <tr>
            <td style="padding:12px 0 18px 0;">
              <a
                href="${escapeHtml(ctaUrl)}"
                style="display:inline-block;padding:14px 22px;border-radius:14px;background:#001739;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:0.01em;"
              >
                ${escapeHtml(ctaLabel)}
              </a>
            </td>
          </tr>
        `
      : ''

  return `
    <!doctype html>
    <html>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(title)}</title>
      </head>
      <body style="margin:0;padding:0;background:#edf2f9;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#edf2f9;padding:28px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid rgba(0,23,57,0.08);box-shadow:0 18px 60px rgba(0,23,57,0.08);">
                <tr>
                  <td align="center" style="padding:22px 28px 24px 28px;background:#001739;">
                    <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;">
                      <tr>
                        <td align="center" style="padding:0 0 16px 0;">
                          <img
                            src="${escapeHtml(resolvedHeaderLogoUrl)}"
                            alt="${escapeHtml(headerLogoAlt)}"
                            width="${headerLogoWidth}"
                            style="display:block;width:${headerLogoWidth}px;max-width:100%;height:auto;margin:0 auto;border:0;outline:none;text-decoration:none;"
                          />
                        </td>
                      </tr>
                    </table>
                    <div style="font-size:30px;line-height:1.2;font-weight:700;color:#ffffff;">
                      ${escapeHtml(title)}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px 28px 16px 28px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:0 0 18px 0;font-size:15px;line-height:1.75;color:#304055;">
                          ${escapeHtml(intro)}
                        </td>
                      </tr>
                      ${sectionMarkup}
                      ${ctaMarkup}
                      <tr>
                        <td style="padding:6px 0 0 0;font-size:14px;line-height:1.7;color:#4f5c6f;">
                          ${escapeHtml(closing)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 28px 24px 28px;background:#f8f9fc;border-top:1px solid rgba(0,23,57,0.08);font-size:12px;line-height:1.7;color:#6f7d90;">
                    ${escapeHtml(footer)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

export function buildBrandedEmailText({
  title,
  intro,
  sections,
  ctaLabel,
  ctaUrl,
  closing,
  footer,
}: BrandedEmailContent) {
  return [
    title,
    '',
    intro,
    '',
    ...sections.flatMap(section => [section, '']),
    ctaLabel && ctaUrl ? `${ctaLabel}: ${ctaUrl}` : '',
    ctaLabel && ctaUrl ? '' : '',
    closing ?? '',
    '',
    footer ?? '',
  ]
    .filter(Boolean)
    .join('\n')
}

export function generatePlainTextFromHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|table|li|h1|h2|h3|h4|h5|h6)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n\s+\n/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

export function logEmailCenterSend(entry: EmailCenterSendLog) {
  const payload = JSON.stringify(entry)

  if (entry.action === 'failure') {
    console.error(`[email-center] ${payload}`)
    return
  }

  console.info(`[email-center] ${payload}`)
}
