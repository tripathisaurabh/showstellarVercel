export type EmailTemplateFieldType = 'text' | 'email' | 'url' | 'password'

export type EmailTemplateFieldDefinition = {
  name: string
  label: string
  type: EmailTemplateFieldType
  required: boolean
  placeholder?: string
  description?: string
}

export type EmailTemplateData = Record<string, string>

export type EmailTemplateDefinition = {
  key: string
  label: string
  defaultSubject: string
  description: string
  notes: string
  fields: EmailTemplateFieldDefinition[]
  getInitialData: () => EmailTemplateData
  renderHtml: (data: EmailTemplateData) => string
  renderPreview?: (data: EmailTemplateData) => string
  renderText?: (data: EmailTemplateData) => string
}

export type EmailCenterPayload = {
  artistId?: string
  artistName?: string
  artistEmail?: string
  to: string
  subject: string
  templateKey: string
  templateData: EmailTemplateData
  sendTest?: boolean
}

export type EmailCenterValidationResult = {
  valid: boolean
  errors: string[]
  sanitizedTo: string
  sanitizedSubject: string
  sanitizedTemplateData: EmailTemplateData
}

export type EmailCenterSendLog = {
  action: 'attempt' | 'success' | 'failure'
  templateKey: string
  artistId?: string | null
  artistName?: string | null
  subject: string
  to: string
  requestedBy: string | null
  sendTest: boolean
  messageId?: string
  error?: string
}
