import type { EmailTemplateDefinition } from '@/lib/email-center/types'
import {
  buildBrandedEmailHtml,
  buildBrandedEmailText,
  EMAIL_CENTER_SAMPLE_VALUES,
} from '@/lib/email-center/utils'

export const profileApprovedTemplate: EmailTemplateDefinition = {
  key: 'profile-approved',
  label: 'Profile Approved',
  defaultSubject: 'Your ShowStellar profile has been approved',
  description: 'Confirm that the artist profile is approved and ready for the artist to review.',
  notes: 'Use after admin review when the profile is approved and the artist can continue onboarding.',
  fields: [
    { name: 'artistName', label: 'Artist Name', type: 'text', required: true, placeholder: 'Rahul Sharma' },
    {
      name: 'loginUrl',
      label: 'Login URL',
      type: 'url',
      required: true,
      placeholder: 'https://showstellar.com/artist-login',
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
    loginUrl: EMAIL_CENTER_SAMPLE_VALUES.loginUrl,
    supportEmail: EMAIL_CENTER_SAMPLE_VALUES.supportEmail,
  }),
  renderHtml: data =>
    buildBrandedEmailHtml({
      title: 'Your profile has been approved',
      intro: `Hi ${data.artistName}, your ShowStellar profile has been reviewed and approved.`,
      sections: [
        'You can now sign in to review your profile, refresh your media, and keep your information current.',
        'A complete and polished profile helps bookings move faster and improves your visibility on the platform.',
        `If anything looks incorrect, contact ${data.supportEmail} and our team will help you update it.`,
      ],
      ctaLabel: 'Open your artist dashboard',
      ctaUrl: data.loginUrl,
      closing: 'Thanks for being part of ShowStellar.',
      footer: 'ShowStellar artist approvals',
    }),
  renderPreview: data =>
    buildBrandedEmailHtml({
      title: 'Your profile has been approved',
      intro: `Hi ${data.artistName}, your ShowStellar profile has been reviewed and approved.`,
      sections: [
        'You can now sign in to review your profile, refresh your media, and keep your information current.',
        'A complete and polished profile helps bookings move faster and improves your visibility on the platform.',
        `If anything looks incorrect, contact ${data.supportEmail} and our team will help you update it.`,
      ],
      ctaLabel: 'Open your artist dashboard',
      ctaUrl: data.loginUrl,
      closing: 'Thanks for being part of ShowStellar.',
      footer: 'ShowStellar artist approvals preview',
    }),
  renderText: data =>
    buildBrandedEmailText({
      title: 'Your profile has been approved',
      intro: `Hi ${data.artistName}, your ShowStellar profile has been reviewed and approved.`,
      sections: [
        'You can now sign in to review your profile, refresh your media, and keep your information current.',
        'A complete and polished profile helps bookings move faster and improves your visibility on the platform.',
        `If anything looks incorrect, contact ${data.supportEmail} and our team will help you update it.`,
      ],
      ctaLabel: 'Open your artist dashboard',
      ctaUrl: data.loginUrl,
      closing: 'Thanks for being part of ShowStellar.',
      footer: 'ShowStellar artist approvals',
    }),
}
