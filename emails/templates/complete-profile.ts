import type { EmailTemplateDefinition } from '@/lib/email-center/types'
import {
  buildBrandedEmailHtml,
  buildBrandedEmailText,
  EMAIL_CENTER_SAMPLE_VALUES,
} from '@/lib/email-center/utils'

export const completeProfileTemplate: EmailTemplateDefinition = {
  key: 'complete-profile',
  label: 'Complete Your Profile',
  defaultSubject: 'Complete your ShowStellar profile',
  description: 'Prompt an artist to finish their onboarding details inside the dashboard.',
  notes: 'Use when an artist account exists but the profile still needs content, media, or required details.',
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
      title: 'Complete your artist profile',
      intro: `Hi ${data.artistName}, your ShowStellar account is active, but your artist profile still needs a few final details.`,
      sections: [
        'Add your stage bio, categories, location, and media so clients can understand your work quickly.',
        'Profiles with complete details feel more trustworthy and convert better when booking inquiries arrive.',
        `If you get stuck, reply to this email or contact ${data.supportEmail}.`,
      ],
      ctaLabel: 'Finish your profile',
      ctaUrl: data.loginUrl,
      closing: 'A few minutes of setup now will make future opportunities much smoother.',
      footer: 'ShowStellar profile completion',
    }),
  renderPreview: data =>
    buildBrandedEmailHtml({
      title: 'Complete your artist profile',
      intro: `Hi ${data.artistName}, your ShowStellar account is active, but your artist profile still needs a few final details.`,
      sections: [
        'Add your stage bio, categories, location, and media so clients can understand your work quickly.',
        'Profiles with complete details feel more trustworthy and convert better when booking inquiries arrive.',
        `If you get stuck, reply to this email or contact ${data.supportEmail}.`,
      ],
      ctaLabel: 'Finish your profile',
      ctaUrl: data.loginUrl,
      closing: 'A few minutes of setup now will make future opportunities much smoother.',
      footer: 'ShowStellar profile completion preview',
    }),
  renderText: data =>
    buildBrandedEmailText({
      title: 'Complete your artist profile',
      intro: `Hi ${data.artistName}, your ShowStellar account is active, but your artist profile still needs a few final details.`,
      sections: [
        'Add your stage bio, categories, location, and media so clients can understand your work quickly.',
        'Profiles with complete details feel more trustworthy and convert better when booking inquiries arrive.',
        `If you get stuck, reply to this email or contact ${data.supportEmail}.`,
      ],
      ctaLabel: 'Finish your profile',
      ctaUrl: data.loginUrl,
      closing: 'A few minutes of setup now will make future opportunities much smoother.',
      footer: 'ShowStellar profile completion',
    }),
}
