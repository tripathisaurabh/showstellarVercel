import type { EmailTemplateDefinition } from '@/lib/email-center/types'
import {
  buildBrandedEmailHtml,
  buildBrandedEmailText,
  EMAIL_CENTER_SAMPLE_VALUES,
} from '@/lib/email-center/utils'

export const artistAccountCreatedTemplate: EmailTemplateDefinition = {
  key: 'artist-account-created',
  label: 'Artist Account Created',
  defaultSubject: 'Your ShowStellar artist account is ready',
  description: 'Welcome a newly created artist account with login credentials and next steps.',
  notes: 'Best used right after account creation when the artist needs their first login details.',
  fields: [
    { name: 'artistName', label: 'Artist Name', type: 'text', required: true, placeholder: 'Rahul Sharma' },
    { name: 'artistEmail', label: 'Artist Email', type: 'email', required: true, placeholder: 'rahul@example.com' },
    {
      name: 'temporaryPassword',
      label: 'Temporary Password',
      type: 'password',
      required: true,
      placeholder: 'Temp@1234',
    },
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
    artistEmail: '',
    temporaryPassword: '',
    loginUrl: EMAIL_CENTER_SAMPLE_VALUES.loginUrl,
    supportEmail: EMAIL_CENTER_SAMPLE_VALUES.supportEmail,
  }),
  renderHtml: data =>
    buildBrandedEmailHtml({
      title: 'Your artist account is ready',
      headerLogoUrl: 'https://showstellar.com/headerlogo.png',
      headerLogoAlt: 'ShowStellar',
      headerLogoWidth: 176,
      intro: `Hi ${data.artistName}, welcome to ShowStellar. We've created your artist account and your login details are ready below.`,
      sections: [
        `Sign in with **${data.artistEmail}** to access your dashboard and start setting up your presence.`,
        `Temporary password: **${data.temporaryPassword}**`,
        'Once you log in, update your password and review your artist profile details before sharing your account.',
        `If you need help at any point, contact ${data.supportEmail}.`,
      ],
      ctaLabel: 'Sign in to ShowStellar',
      ctaUrl: data.loginUrl,
      closing: 'We are excited to have you on ShowStellar.',
      footer: 'ShowStellar artist onboarding',
    }),
  renderPreview: data =>
    buildBrandedEmailHtml({
      title: 'Your artist account is ready',
      headerLogoUrl: 'https://showstellar.com/headerlogo.png',
      headerLogoAlt: 'ShowStellar',
      headerLogoWidth: 176,
      intro: `Hi ${data.artistName}, welcome to ShowStellar. We've created your artist account and your login details are ready below.`,
      sections: [
        `Sign in with **${data.artistEmail}** to access your dashboard and start setting up your presence.`,
        `Temporary password: **${data.temporaryPassword}**`,
        'Once you log in, update your password and review your artist profile details before sharing your account.',
        `If you need help at any point, contact ${data.supportEmail}.`,
      ],
      ctaLabel: 'Sign in to ShowStellar',
      ctaUrl: data.loginUrl,
      closing: 'We are excited to have you on ShowStellar.',
      footer: 'ShowStellar artist onboarding preview',
    }),
  renderText: data =>
    buildBrandedEmailText({
      title: 'Your artist account is ready',
      intro: `Hi ${data.artistName}, welcome to ShowStellar. We've created your artist account and your login details are ready below.`,
      sections: [
        `Sign in with ${data.artistEmail} to access your dashboard and start setting up your presence.`,
        `Temporary password: ${data.temporaryPassword}`,
        'Once you log in, update your password and review your artist profile details before sharing your account.',
        `If you need help at any point, contact ${data.supportEmail}.`,
      ],
      ctaLabel: 'Sign in to ShowStellar',
      ctaUrl: data.loginUrl,
      closing: 'We are excited to have you on ShowStellar.',
      footer: 'ShowStellar artist onboarding',
    }),
}
