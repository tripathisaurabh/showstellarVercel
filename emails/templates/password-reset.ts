import type { EmailTemplateDefinition } from '@/lib/email-center/types'
import {
  buildBrandedEmailHtml,
  buildBrandedEmailText,
  EMAIL_CENTER_SAMPLE_VALUES,
} from '@/lib/email-center/utils'

export const passwordResetTemplate: EmailTemplateDefinition = {
  key: 'password-reset',
  label: 'Password Reset / Set Password',
  defaultSubject: 'Set your ShowStellar password',
  description: 'Send a secure password setup or reset action to an artist.',
  notes: 'Use when an artist needs to create a password for the first time or complete a manual reset.',
  fields: [
    { name: 'artistName', label: 'Artist Name', type: 'text', required: true, placeholder: 'Rahul Sharma' },
    {
      name: 'resetUrl',
      label: 'Reset URL',
      type: 'url',
      required: true,
      placeholder: 'https://showstellar.com/reset-password',
    },
    {
      name: 'supportEmail',
      label: 'Support Email',
      type: 'email',
      required: true,
      placeholder: 'support@showstellar.com',
    },
  ],
  getInitialData: () => ({
    artistName: '',
    resetUrl: EMAIL_CENTER_SAMPLE_VALUES.resetUrl,
    supportEmail: EMAIL_CENTER_SAMPLE_VALUES.supportEmail,
  }),
  renderHtml: data =>
    buildBrandedEmailHtml({
      title: 'Set your password',
      intro: `Hi ${data.artistName}, use the secure link below to set or reset your ShowStellar password.`,
      sections: [
        'For security, complete the password setup as soon as possible and avoid sharing the link.',
        'Once your password is updated, you can sign in and continue working from your artist dashboard.',
        `If the link does not work or has expired, contact ${data.supportEmail}.`,
      ],
      ctaLabel: 'Set password',
      ctaUrl: data.resetUrl,
      closing: 'If you did not expect this email, you can ignore it and reach out to support.',
      footer: 'ShowStellar password access',
    }),
  renderPreview: data =>
    buildBrandedEmailHtml({
      title: 'Set your password',
      intro: `Hi ${data.artistName}, use the secure link below to set or reset your ShowStellar password.`,
      sections: [
        'For security, complete the password setup as soon as possible and avoid sharing the link.',
        'Once your password is updated, you can sign in and continue working from your artist dashboard.',
        `If the link does not work or has expired, contact ${data.supportEmail}.`,
      ],
      ctaLabel: 'Set password',
      ctaUrl: data.resetUrl,
      closing: 'If you did not expect this email, you can ignore it and reach out to support.',
      footer: 'ShowStellar password access preview',
    }),
  renderText: data =>
    buildBrandedEmailText({
      title: 'Set your password',
      intro: `Hi ${data.artistName}, use the secure link below to set or reset your ShowStellar password.`,
      sections: [
        'For security, complete the password setup as soon as possible and avoid sharing the link.',
        'Once your password is updated, you can sign in and continue working from your artist dashboard.',
        `If the link does not work or has expired, contact ${data.supportEmail}.`,
      ],
      ctaLabel: 'Set password',
      ctaUrl: data.resetUrl,
      closing: 'If you did not expect this email, you can ignore it and reach out to support.',
      footer: 'ShowStellar password access',
    }),
}
