import { artistAccountCreatedTemplate } from '@/emails/templates/artist-account-created'
import { completeProfileTemplate } from '@/emails/templates/complete-profile'
import { passwordResetTemplate } from '@/emails/templates/password-reset'
import { profileApprovedTemplate } from '@/emails/templates/profile-approved'
import { artistLifecycleEmailTemplateDefinitions } from '@/lib/email/templates/artist'
import type { EmailTemplateDefinition } from '@/lib/email-center/types'

export const emailTemplates: EmailTemplateDefinition[] = [
  artistAccountCreatedTemplate,
  profileApprovedTemplate,
  completeProfileTemplate,
  passwordResetTemplate,
  ...artistLifecycleEmailTemplateDefinitions,
]

export const emailTemplateRegistry = Object.fromEntries(
  emailTemplates.map(template => [template.key, template])
) as Record<string, EmailTemplateDefinition>

export function getEmailTemplateByKey(templateKey: string) {
  return emailTemplateRegistry[templateKey] ?? null
}
