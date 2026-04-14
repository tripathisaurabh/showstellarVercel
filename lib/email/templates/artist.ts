import type {
  EmailTemplateData,
  EmailTemplateDefinition,
  EmailTemplateFieldDefinition,
  EmailTemplateFieldType,
} from '@/lib/email-center/types'
import { getSiteUrl } from '@/lib/seo'

export const ARTIST_EMAIL_TEMPLATE_KEYS = [
  'invite_artist_to_join',
  'account_created',
  'verification_reminder',
  'profile_incomplete_reminder',
  'profile_incomplete_urgency',
  'profile_submitted_successfully',
  'profile_under_review',
  'changes_required_before_approval',
  'profile_approved',
  'profile_published',
  'inactive_artist_followup',
  'missing_media_reminder',
  'welcome_to_showstellar',
] as const

export type ArtistEmailTemplateKey = (typeof ARTIST_EMAIL_TEMPLATE_KEYS)[number]

export type ArtistEmailPayload = {
  artist_name?: string
  artist_email?: string
  join_link?: string
  dashboard_link?: string
  profile_link?: string
  verification_link?: string
  missing_fields?: string | string[]
  support_email?: string
  login_email?: string
  temporary_password?: string
  status?: string
  city?: string
  category?: string
  reason?: string
  note?: string
  requested_at?: string
}

type EmailSection =
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; title?: string; items: string[] }
  | { type: 'details'; title?: string; items: Array<{ label: string; value: string }> }

type RenderedArtistEmail = {
  subject: string
  html: string
  text: string
}

type TemplateContext = {
  title: string
  intro: string
  sections: EmailSection[]
  cta?: { label: string; href: string }
  footer: string
  badge?: string
  supportEmail: string
}

type TemplateConfig = {
  key: ArtistEmailTemplateKey
  label: string
  description: string
  notes: string
  defaultSubject: string
  fields: EmailTemplateFieldDefinition[]
  initialData: () => EmailTemplateData
  subject: (payload: ArtistEmailPayload) => string
  build: (payload: ArtistEmailPayload) => TemplateContext
}

const DEFAULT_SUPPORT_EMAIL = 'support@showstellar.com'

const ARTIST_EMAIL_SITE_URL = getSiteUrl()

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function normalizeText(value?: string | null) {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

function normalizeList(value?: string | string[] | null) {
  if (!value) return []
  const raw = Array.isArray(value) ? value : value.split(/[\n,|]/g)
  return Array.from(
    new Set(
      raw
        .map(item => normalizeText(item))
        .filter(Boolean)
    )
  )
}

function siteLink(path: string) {
  return new URL(path, ARTIST_EMAIL_SITE_URL).toString()
}

function sharedInitialData(): EmailTemplateData {
  return {
    artist_name: '',
    artist_email: '',
    join_link: siteLink('/artist-signup'),
    dashboard_link: siteLink('/artist-dashboard'),
    profile_link: siteLink('/artist-dashboard/profile'),
    verification_link: siteLink('/verify-email'),
    missing_fields: '',
    support_email: DEFAULT_SUPPORT_EMAIL,
    login_email: '',
    temporary_password: '',
    status: '',
    city: '',
    category: '',
    reason: '',
    note: '',
    requested_at: '',
  }
}

function baseFields(
  extras: Array<{
    name: string
    label: string
    type?: EmailTemplateFieldType
    required?: boolean
    placeholder?: string
    description?: string
  }> = []
) {
  const fields: EmailTemplateFieldDefinition[] = [
    { name: 'artist_name', label: 'Artist name', type: 'text', required: true, placeholder: 'Rahul Sharma' },
    { name: 'artist_email', label: 'Artist email', type: 'email', required: false, placeholder: 'rahul@example.com' },
    ...extras.map(field => ({
      type: 'text' as EmailTemplateFieldType,
      required: false,
      ...field,
    })),
    { name: 'support_email', label: 'Support email', type: 'email', required: true, placeholder: DEFAULT_SUPPORT_EMAIL },
  ]

  return fields
}

function sectionsFromFieldPairs(pairs: Array<[string, string | null | undefined]>) {
  return pairs
    .map(([label, value]) => ({ label, value: normalizeText(value) }))
    .filter(item => item.value)
}

function bulletSection(title: string, items: string[]): EmailSection[] {
  return items.length ? [{ type: 'bullets' as const, title, items }] : []
}

function detailSection(title: string, items: Array<{ label: string; value: string }>): EmailSection[] {
  return items.length ? [{ type: 'details' as const, title, items }] : []
}

function renderSectionHtml(section: EmailSection) {
  if (section.type === 'paragraph') {
    return `<tr><td style="padding:0 0 16px 0;font-size:15px;line-height:1.75;color:#304055;">${escapeHtml(section.text)}</td></tr>`
  }

  if (section.type === 'bullets') {
    return `
      <tr>
        <td style="padding:0 0 16px 0;">
          ${section.title ? `<div style="font-size:13px;line-height:1.7;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#001739;margin-bottom:10px;">${escapeHtml(section.title)}</div>` : ''}
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;">
            ${section.items
              .map(
                item => `
                  <tr>
                    <td style="padding:0 0 8px 0;font-size:15px;line-height:1.7;color:#1a1a1a;">
                      <span style="display:inline-block;width:7px;height:7px;border-radius:999px;background:#001739;margin:0 10px 2px 0;vertical-align:middle;"></span>
                      ${escapeHtml(item)}
                    </td>
                  </tr>
                `
              )
              .join('')}
          </table>
        </td>
      </tr>
    `
  }

  return `
    <tr>
      <td style="padding:0 0 16px 0;">
        ${section.title ? `<div style="font-size:13px;line-height:1.7;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#001739;margin-bottom:10px;">${escapeHtml(section.title)}</div>` : ''}
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;">
          ${section.items
            .map(
              item => `
                <tr>
                  <td style="padding:0 0 10px 0;font-size:14px;line-height:1.65;color:#304055;">
                    <strong style="color:#001739;">${escapeHtml(item.label)}:</strong>
                    <span style="color:#1a1a1a;"> ${escapeHtml(item.value)}</span>
                  </td>
                </tr>
              `
            )
            .join('')}
        </table>
      </td>
    </tr>
  `
}

function renderSectionText(section: EmailSection) {
  if (section.type === 'paragraph') {
    return section.text
  }

  if (section.type === 'bullets') {
    const lines = section.title ? [section.title, ...section.items.map(item => `• ${item}`)] : section.items.map(item => `• ${item}`)
    return lines.join('\n')
  }

  const lines = section.title ? [section.title] : []
  return [...lines, ...section.items.map(item => `${item.label}: ${item.value}`)].join('\n')
}

function buildArtistEmailDocument(context: TemplateContext): RenderedArtistEmail {
  const siteLogoUrl = siteLink('/headerlogo.png')
  const htmlSections = context.sections.map(renderSectionHtml).join('')
  const textSections = context.sections.map(renderSectionText).filter(Boolean)
  const ctaHtml = context.cta
    ? `
        <tr>
          <td style="padding:0 0 20px 0;">
            <a
              href="${escapeHtml(context.cta.href)}"
              style="display:inline-block;padding:14px 22px;border-radius:14px;background:#001739;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:0.01em;"
            >
              ${escapeHtml(context.cta.label)}
            </a>
          </td>
        </tr>
      `
    : ''

  const ctaText = context.cta ? `${context.cta.label}: ${context.cta.href}` : ''

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(context.title)}</title>
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
                            src="${escapeHtml(siteLogoUrl)}"
                            alt="ShowStellar"
                            width="176"
                            style="display:block;width:176px;max-width:100%;height:auto;margin:0 auto;border:0;outline:none;text-decoration:none;"
                          />
                        </td>
                      </tr>
                    </table>
                    ${context.badge ? `<div style="display:inline-block;margin:0 auto 10px;padding:7px 12px;border-radius:999px;background:rgba(255,255,255,0.12);color:#ffffff;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">${escapeHtml(context.badge)}</div>` : ''}
                    <div style="font-size:30px;line-height:1.2;font-weight:700;color:#ffffff;">
                      ${escapeHtml(context.title)}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px 28px 16px 28px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:0 0 18px 0;font-size:15px;line-height:1.75;color:#304055;">
                          ${escapeHtml(context.intro)}
                        </td>
                      </tr>
                      ${htmlSections}
                      ${ctaHtml}
                      <tr>
                        <td style="padding:6px 0 0 0;font-size:14px;line-height:1.7;color:#4f5c6f;">
                          ${escapeHtml(`Need help? Reply to this email or contact ${context.supportEmail}.`)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 28px 24px 28px;background:#f8f9fc;border-top:1px solid rgba(0,23,57,0.08);font-size:12px;line-height:1.7;color:#6f7d90;">
                    ShowStellar artist communications · ${escapeHtml(context.footer)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `

  const text = [
    context.title,
    '',
    context.intro,
    '',
    ...textSections.flatMap(section => [section, '']),
    ctaText ? ctaText : '',
    ctaText ? '' : '',
    `Need help? Reply to this email or contact ${context.supportEmail}.`,
    '',
    `ShowStellar artist communications · ${context.footer}`,
  ]
    .filter(Boolean)
    .join('\n')

  return { subject: context.title, html, text }
}

function defaultPayload(payload: ArtistEmailPayload) {
  return {
    artist_name: normalizeText(payload.artist_name),
    artist_email: normalizeText(payload.artist_email),
    join_link: normalizeText(payload.join_link) || siteLink('/artist-signup'),
    dashboard_link: normalizeText(payload.dashboard_link) || siteLink('/artist-dashboard'),
    profile_link: normalizeText(payload.profile_link) || siteLink('/artist-dashboard/profile'),
    verification_link: normalizeText(payload.verification_link),
    missing_fields: normalizeList(payload.missing_fields),
    support_email: normalizeText(payload.support_email) || DEFAULT_SUPPORT_EMAIL,
    login_email: normalizeText(payload.login_email),
    temporary_password: normalizeText(payload.temporary_password),
    status: normalizeText(payload.status),
    city: normalizeText(payload.city),
    category: normalizeText(payload.category),
    reason: normalizeText(payload.reason),
    note: normalizeText(payload.note),
    requested_at: normalizeText(payload.requested_at),
  }
}

function artistLinkSummary(payload: ReturnType<typeof defaultPayload>) {
  const items = sectionsFromFieldPairs([
    ['Artist', payload.artist_name],
    ['Email', payload.artist_email],
    ['Login email', payload.login_email],
    ['Status', payload.status],
    ['City', payload.city],
    ['Category', payload.category],
  ])

  return detailSection('Artist Details', items)
}

function getTemplateConfig(templateKey: ArtistEmailTemplateKey): TemplateConfig {
  const configs: Record<ArtistEmailTemplateKey, TemplateConfig> = {
    invite_artist_to_join: {
      key: 'invite_artist_to_join',
      label: 'Invite Artist to Join',
      description: 'Invite a new artist to sign up on ShowStellar.',
      notes: 'Use this for outbound artist recruitment when you want to share the ShowStellar value proposition and direct them to the signup page.',
      defaultSubject: 'Join ShowStellar as an artist',
      fields: baseFields([
        { name: 'join_link', label: 'Join link', type: 'url', required: true, placeholder: siteLink('/artist-signup') },
        { name: 'city', label: 'City', type: 'text', required: false, placeholder: 'Mumbai' },
        { name: 'category', label: 'Category', type: 'text', required: false, placeholder: 'Singer' },
        { name: 'note', label: 'Custom note', type: 'text', required: false, placeholder: 'We would love to feature your work on ShowStellar.' },
      ]),
      initialData: () => ({ ...sharedInitialData(), note: '' }),
      subject: payload => {
        const data = defaultPayload(payload)
        const categoryLabel = data.category ? ` as a ${data.category}` : ''
        return `Join ShowStellar${categoryLabel}`
      },
      build: payload => {
        const data = defaultPayload(payload)
        const inviteBullets = [
          data.category ? `Create your artist profile${data.city ? ` for ${data.city}` : ''} and get discovered by clients looking for ${data.category.toLowerCase()} talent.` : 'Create your artist profile and get discovered by clients looking for live talent.',
          'Share your photos, videos, and performance details in one place.',
          'Receive relevant booking inquiries through the platform.',
        ]

        if (data.note) {
          inviteBullets.push(data.note)
        }

        return {
          title: 'Join ShowStellar',
          intro: `Hi ${data.artist_name || 'Artist'}, we would love to invite you to join ShowStellar and create your artist profile.`,
          sections: [
            {
              type: 'paragraph',
              text: 'ShowStellar helps artists present their work professionally and connect with clients planning weddings, private events, and brand experiences.',
            },
            ...bulletSection('Why join', inviteBullets),
            ...(data.category || data.city || data.artist_email
              ? detailSection('Invitation details', sectionsFromFieldPairs([
                  ['Artist', data.artist_name],
                  ['Email', data.artist_email],
                  ['Category', data.category],
                  ['City', data.city],
                ]))
              : []),
          ],
          cta: { label: 'Join ShowStellar', href: data.join_link },
          footer: 'Artist invitation',
          badge: 'Invitation',
          supportEmail: data.support_email,
        }
      },
    },
    account_created: {
      key: 'account_created',
      label: 'Account Created',
      description: 'Send when an admin creates an artist account.',
      notes: 'Use when an artist receives login credentials, dashboard access, or a first-time setup email.',
      defaultSubject: 'Your ShowStellar artist account is ready',
      fields: baseFields([
        { name: 'login_email', label: 'Login email', type: 'email', required: true, placeholder: 'rahul@example.com' },
        { name: 'temporary_password', label: 'Temporary password', type: 'password', required: false, placeholder: 'Temp@1234' },
        { name: 'dashboard_link', label: 'Dashboard link', type: 'url', required: true, placeholder: siteLink('/artist-dashboard') },
        { name: 'profile_link', label: 'Profile link', type: 'url', required: true, placeholder: siteLink('/artist-dashboard/profile') },
      ]),
      initialData: () => ({
        ...sharedInitialData(),
        login_email: '',
        temporary_password: '',
      }),
      subject: () => `Your ShowStellar artist account is ready`,
      build: payload => {
        const data = defaultPayload(payload)
        const sections: EmailSection[] = [
          {
            type: 'paragraph',
            text: `Hi ${data.artist_name || 'Artist'}, your ShowStellar artist account has been created and your dashboard is ready.`,
          },
          ...bulletSection('Next steps', [
            data.login_email ? `Sign in with ${data.login_email}.` : 'Sign in with the email address on this account.',
            data.temporary_password ? `Temporary password: ${data.temporary_password}.` : 'Set a secure password after your first sign-in.',
            `Open your dashboard: ${data.dashboard_link}.`,
            `Review your public profile: ${data.profile_link}.`,
          ]),
          ...(data.artist_email || data.status || data.city || data.category ? artistLinkSummary(data) : []),
        ]

        return {
          title: 'Your artist account is ready',
          intro: `Hi ${data.artist_name || 'Artist'}, welcome to ShowStellar. Your account is active and ready for first sign-in.`,
          sections,
          cta: { label: 'Open dashboard', href: data.dashboard_link },
          footer: 'Artist onboarding',
          badge: 'Account Created',
          supportEmail: data.support_email,
        }
      },
    },
    verification_reminder: {
      key: 'verification_reminder',
      label: 'Verification Reminder',
      description: 'Remind an artist to verify their email address.',
      notes: 'Use when the account exists but email verification still needs to be completed.',
      defaultSubject: 'Verify your ShowStellar email',
      fields: baseFields([
        { name: 'verification_link', label: 'Verification link', type: 'url', required: true, placeholder: siteLink('/verify-email') },
        { name: 'dashboard_link', label: 'Dashboard link', type: 'url', required: false, placeholder: siteLink('/artist-dashboard') },
      ]),
      initialData: () => ({ ...sharedInitialData() }),
      subject: () => 'Verify your ShowStellar email',
      build: payload => {
        const data = defaultPayload(payload)
        return {
          title: 'Verify your email',
          intro: `Hi ${data.artist_name || 'Artist'}, please verify your email so your ShowStellar account can be fully activated.`,
          sections: [
            {
              type: 'paragraph',
              text: 'Email verification helps keep your account secure and ensures you receive booking and profile updates.',
            },
            ...bulletSection('What to do', [
              `Click the verification link: ${data.verification_link || 'Add your verification link'}.`,
              data.dashboard_link ? `You can revisit your dashboard here: ${data.dashboard_link}.` : '',
              `If you need help, reply to this email or contact ${data.support_email}.`,
            ].filter(Boolean) as string[]),
            ...(data.artist_email || data.status ? artistLinkSummary(data) : []),
          ],
          cta: data.verification_link ? { label: 'Verify email', href: data.verification_link } : undefined,
          footer: 'Email verification',
          badge: 'Verification Pending',
          supportEmail: data.support_email,
        }
      },
    },
    profile_incomplete_reminder: {
      key: 'profile_incomplete_reminder',
      label: 'Profile Incomplete Reminder',
      description: 'Prompt artists to finish the essential profile fields.',
      notes: 'Use when the artist has signed up but has not finished key profile details yet.',
      defaultSubject: 'Complete your ShowStellar profile',
      fields: baseFields([
        { name: 'dashboard_link', label: 'Dashboard link', type: 'url', required: true, placeholder: siteLink('/artist-dashboard') },
        { name: 'profile_link', label: 'Profile link', type: 'url', required: true, placeholder: siteLink('/artist-dashboard/profile') },
        { name: 'missing_fields', label: 'Missing fields', type: 'text', required: true, placeholder: 'Bio, city, categories' },
      ]),
      initialData: () => ({ ...sharedInitialData(), missing_fields: '' }),
      subject: () => 'Complete your ShowStellar profile',
      build: payload => {
        const data = defaultPayload(payload)
        const missingFields = data.missing_fields
        return {
          title: 'Complete your artist profile',
          intro: `Hi ${data.artist_name || 'Artist'}, your account is live, but your profile still needs a few details before clients can book confidently.`,
          sections: [
            {
              type: 'paragraph',
              text: 'A complete profile helps clients understand your style, availability, and booking fit.',
            },
            ...bulletSection('Missing details', missingFields.length ? missingFields : ['Bio', 'City', 'Categories', 'Media']),
            ...(data.dashboard_link || data.profile_link
              ? detailSection('Quick links', [
                  { label: 'Dashboard', value: data.dashboard_link },
                  { label: 'Profile editor', value: data.profile_link },
                ])
              : []),
          ],
          cta: { label: 'Complete profile', href: data.profile_link || data.dashboard_link },
          footer: 'Profile completion',
          badge: 'Profile Incomplete',
          supportEmail: data.support_email,
        }
      },
    },
    profile_incomplete_urgency: {
      key: 'profile_incomplete_urgency',
      label: 'Profile Incomplete Urgency',
      description: 'Send a stronger reminder when a profile stays incomplete.',
      notes: 'Use when the artist has not updated the profile after the first reminder.',
      defaultSubject: 'Reminder: finish your ShowStellar profile',
      fields: baseFields([
        { name: 'dashboard_link', label: 'Dashboard link', type: 'url', required: true, placeholder: siteLink('/artist-dashboard') },
        { name: 'profile_link', label: 'Profile link', type: 'url', required: true, placeholder: siteLink('/artist-dashboard/profile') },
        { name: 'missing_fields', label: 'Missing fields', type: 'text', required: true, placeholder: 'Bio, city, media' },
      ]),
      initialData: () => ({ ...sharedInitialData(), missing_fields: '' }),
      subject: () => 'Reminder: finish your ShowStellar profile',
      build: payload => {
        const data = defaultPayload(payload)
        const missingFields = data.missing_fields
        return {
          title: 'Your profile still needs attention',
          intro: `Hi ${data.artist_name || 'Artist'}, we still need a few details on your profile so it can perform well for bookings.`,
          sections: [
            {
              type: 'paragraph',
              text: 'Profiles with complete information usually get more trust and faster inquiries from clients.',
            },
            ...bulletSection('Still missing', missingFields.length ? missingFields : ['Bio', 'City', 'Categories', 'Media']),
            ...detailSection('Helpful links', [
              { label: 'Dashboard', value: data.dashboard_link },
              { label: 'Profile editor', value: data.profile_link },
            ]),
          ],
          cta: { label: 'Finish profile', href: data.profile_link || data.dashboard_link },
          footer: 'Profile reminder',
          badge: 'Urgent reminder',
          supportEmail: data.support_email,
        }
      },
    },
    profile_submitted_successfully: {
      key: 'profile_submitted_successfully',
      label: 'Profile Submitted Successfully',
      description: 'Confirm that the artist submitted their profile for review.',
      notes: 'Use immediately after the artist submits their profile to the review queue.',
      defaultSubject: 'Your ShowStellar profile was submitted for review',
      fields: baseFields([
        { name: 'dashboard_link', label: 'Dashboard link', type: 'url', required: true, placeholder: siteLink('/artist-dashboard') },
        { name: 'profile_link', label: 'Profile link', type: 'url', required: true, placeholder: siteLink('/artist-dashboard/profile') },
        { name: 'status', label: 'Status', type: 'text', required: false, placeholder: 'submitted_for_review' },
      ]),
      initialData: () => ({ ...sharedInitialData(), status: 'submitted_for_review' }),
      subject: () => 'Your ShowStellar profile was submitted for review',
      build: payload => {
        const data = defaultPayload(payload)
        return {
          title: 'Profile submitted successfully',
          intro: `Hi ${data.artist_name || 'Artist'}, your ShowStellar profile has been submitted for review.`,
          sections: [
            {
              type: 'paragraph',
              text: 'Our team will review the details you shared and get back to you with the next step.',
            },
            ...detailSection('Submission summary', [
              { label: 'Status', value: data.status || 'submitted_for_review' },
              { label: 'Dashboard', value: data.dashboard_link },
              { label: 'Profile', value: data.profile_link },
            ]),
          ],
          cta: { label: 'Open dashboard', href: data.dashboard_link },
          footer: 'Submission confirmation',
          badge: 'Submitted',
          supportEmail: data.support_email,
        }
      },
    },
    profile_under_review: {
      key: 'profile_under_review',
      label: 'Profile Under Review',
      description: 'Let the artist know the review process is underway.',
      notes: 'Use when the profile is in the review queue and the artist should wait for admin feedback.',
      defaultSubject: 'Your ShowStellar profile is under review',
      fields: baseFields([
        { name: 'dashboard_link', label: 'Dashboard link', type: 'url', required: true, placeholder: siteLink('/artist-dashboard') },
        { name: 'status', label: 'Status', type: 'text', required: false, placeholder: 'pending' },
      ]),
      initialData: () => ({ ...sharedInitialData(), status: 'pending' }),
      subject: () => 'Your ShowStellar profile is under review',
      build: payload => {
        const data = defaultPayload(payload)
        return {
          title: 'Your profile is under review',
          intro: `Hi ${data.artist_name || 'Artist'}, our team is currently reviewing your ShowStellar profile.`,
          sections: [
            {
              type: 'paragraph',
              text: 'We review artist details carefully so clients see reliable, complete, and polished profiles.',
            },
            ...detailSection('Current status', [
              { label: 'Status', value: data.status || 'under_review' },
              { label: 'Dashboard', value: data.dashboard_link },
            ]),
          ],
          cta: { label: 'View dashboard', href: data.dashboard_link },
          footer: 'Artist review',
          badge: 'Under Review',
          supportEmail: data.support_email,
        }
      },
    },
    changes_required_before_approval: {
      key: 'changes_required_before_approval',
      label: 'Changes Required Before Approval',
      description: 'Explain what needs to change before the profile can be approved.',
      notes: 'Use when review feedback requires the artist to update specific fields or media.',
      defaultSubject: 'Please update your ShowStellar profile',
      fields: baseFields([
        { name: 'dashboard_link', label: 'Dashboard link', type: 'url', required: true, placeholder: siteLink('/artist-dashboard') },
        { name: 'profile_link', label: 'Profile link', type: 'url', required: true, placeholder: siteLink('/artist-dashboard/profile') },
        { name: 'missing_fields', label: 'Missing fields', type: 'text', required: true, placeholder: 'Bio, photos, categories' },
        { name: 'reason', label: 'Reason', type: 'text', required: false, placeholder: 'Please add at least 3 photos' },
      ]),
      initialData: () => ({ ...sharedInitialData(), missing_fields: '' }),
      subject: () => 'Please update your ShowStellar profile',
      build: payload => {
        const data = defaultPayload(payload)
        return {
          title: 'Changes required before approval',
          intro: `Hi ${data.artist_name || 'Artist'}, we need a few changes before your ShowStellar profile can be approved.`,
          sections: [
            ...(data.reason
              ? [
                  {
                    type: 'paragraph' as const,
                    text: data.reason,
                  },
                ]
              : []),
            ...bulletSection('Please update', data.missing_fields.length ? data.missing_fields : ['Profile photo', 'Bio', 'Categories', 'Location']),
            ...detailSection('Helpful links', [
              { label: 'Dashboard', value: data.dashboard_link },
              { label: 'Profile editor', value: data.profile_link },
            ]),
          ],
          cta: { label: 'Update profile', href: data.profile_link || data.dashboard_link },
          footer: 'Changes requested',
          badge: 'Action needed',
          supportEmail: data.support_email,
        }
      },
    },
    profile_approved: {
      key: 'profile_approved',
      label: 'Profile Approved',
      description: 'Confirm the artist profile approval.',
      notes: 'Use when the profile is approved and the artist can continue working from the dashboard.',
      defaultSubject: 'Your ShowStellar profile has been approved',
      fields: baseFields([
        { name: 'dashboard_link', label: 'Dashboard link', type: 'url', required: true, placeholder: siteLink('/artist-dashboard') },
        { name: 'profile_link', label: 'Profile link', type: 'url', required: true, placeholder: siteLink('/artist-dashboard/profile') },
      ]),
      initialData: () => ({ ...sharedInitialData() }),
      subject: () => 'Your ShowStellar profile has been approved',
      build: payload => {
        const data = defaultPayload(payload)
        return {
          title: 'Your profile has been approved',
          intro: `Hi ${data.artist_name || 'Artist'}, your ShowStellar profile has been reviewed and approved.`,
          sections: [
            {
              type: 'paragraph',
              text: 'You can now keep your profile updated, improve your media, and stay ready for new booking inquiries.',
            },
            ...detailSection('Access links', [
              { label: 'Dashboard', value: data.dashboard_link },
              { label: 'Profile', value: data.profile_link },
              { label: 'Status', value: data.status || 'approved' },
            ]),
          ],
          cta: { label: 'Open dashboard', href: data.dashboard_link },
          footer: 'Approval notice',
          badge: 'Approved',
          supportEmail: data.support_email,
        }
      },
    },
    profile_published: {
      key: 'profile_published',
      label: 'Profile Live / Published',
      description: 'Tell the artist their profile is live on ShowStellar.',
      notes: 'Use when the profile is public and searchable.',
      defaultSubject: 'Your ShowStellar profile is now live',
      fields: baseFields([
        { name: 'dashboard_link', label: 'Dashboard link', type: 'url', required: true, placeholder: siteLink('/artist-dashboard') },
        { name: 'profile_link', label: 'Profile link', type: 'url', required: true, placeholder: siteLink('/artist-dashboard/profile') },
        { name: 'status', label: 'Status', type: 'text', required: false, placeholder: 'published' },
      ]),
      initialData: () => ({ ...sharedInitialData(), status: 'published' }),
      subject: () => 'Your ShowStellar profile is now live',
      build: payload => {
        const data = defaultPayload(payload)
        return {
          title: 'Your profile is live',
          intro: `Hi ${data.artist_name || 'Artist'}, your ShowStellar profile is now live and visible to clients.`,
          sections: [
            {
              type: 'paragraph',
              text: 'A live profile helps clients discover your work, compare your details, and send booking inquiries with confidence.',
            },
            ...detailSection('Live profile links', [
              { label: 'Public profile', value: data.profile_link },
              { label: 'Dashboard', value: data.dashboard_link },
            ]),
          ],
          cta: { label: 'View public profile', href: data.profile_link },
          footer: 'Profile live',
          badge: 'Live',
          supportEmail: data.support_email,
        }
      },
    },
    inactive_artist_followup: {
      key: 'inactive_artist_followup',
      label: 'Inactive Artist Follow-up',
      description: 'Reconnect with artists who have gone quiet.',
      notes: 'Use when an artist has not logged in or completed onboarding after a while.',
      defaultSubject: 'We would love to see you back on ShowStellar',
      fields: baseFields([
        { name: 'dashboard_link', label: 'Dashboard link', type: 'url', required: true, placeholder: siteLink('/artist-dashboard') },
        { name: 'profile_link', label: 'Profile link', type: 'url', required: true, placeholder: siteLink('/artist-dashboard/profile') },
        { name: 'requested_at', label: 'Follow-up date', type: 'text', required: false, placeholder: new Date().toLocaleDateString('en-IN') },
      ]),
      initialData: () => ({ ...sharedInitialData() }),
      subject: () => 'We would love to see you back on ShowStellar',
      build: payload => {
        const data = defaultPayload(payload)
        return {
          title: 'We would love to welcome you back',
          intro: `Hi ${data.artist_name || 'Artist'}, we noticed you have not been active on ShowStellar recently and wanted to check in.`,
          sections: [
            {
              type: 'paragraph',
              text: 'Your profile can keep working for you whenever you are ready to refresh it or respond to inquiries.',
            },
            ...detailSection('Quick access', [
              { label: 'Dashboard', value: data.dashboard_link },
              { label: 'Profile', value: data.profile_link },
              { label: 'Last follow-up', value: data.requested_at || new Date().toLocaleDateString('en-IN') },
            ]),
          ],
          cta: { label: 'Resume profile updates', href: data.dashboard_link },
          footer: 'Inactive follow-up',
          badge: 'Follow-up',
          supportEmail: data.support_email,
        }
      },
    },
    missing_media_reminder: {
      key: 'missing_media_reminder',
      label: 'Missing Media Reminder',
      description: 'Ask the artist to add more profile photos or videos.',
      notes: 'Use when the profile needs stronger media before it can perform well.',
      defaultSubject: 'Add media to improve your ShowStellar profile',
      fields: baseFields([
        { name: 'dashboard_link', label: 'Dashboard link', type: 'url', required: true, placeholder: siteLink('/artist-dashboard') },
        { name: 'profile_link', label: 'Profile link', type: 'url', required: true, placeholder: siteLink('/artist-dashboard/profile') },
        { name: 'missing_fields', label: 'Missing media', type: 'text', required: true, placeholder: 'Profile photo, performance videos' },
      ]),
      initialData: () => ({ ...sharedInitialData(), missing_fields: 'Profile photo, gallery images' }),
      subject: () => 'Add media to improve your ShowStellar profile',
      build: payload => {
        const data = defaultPayload(payload)
        const missingFields = data.missing_fields
        return {
          title: 'Add media to strengthen your profile',
          intro: `Hi ${data.artist_name || 'Artist'}, your profile will feel more complete with a few strong photos or videos.`,
          sections: [
            {
              type: 'paragraph',
              text: 'Media helps clients quickly understand your style and increases the chance of booking inquiries.',
            },
            ...bulletSection('Suggested media', missingFields.length ? missingFields : ['Profile photo', 'Gallery images', 'Performance video']),
            ...detailSection('Helpful links', [
              { label: 'Dashboard', value: data.dashboard_link },
              { label: 'Profile editor', value: data.profile_link },
            ]),
          ],
          cta: { label: 'Add media', href: data.profile_link || data.dashboard_link },
          footer: 'Media reminder',
          badge: 'Media needed',
          supportEmail: data.support_email,
        }
      },
    },
    welcome_to_showstellar: {
      key: 'welcome_to_showstellar',
      label: 'Welcome to ShowStellar',
      description: 'A friendly welcome email for new artists.',
      notes: 'Use this as a warm onboarding message when an artist first joins the platform.',
      defaultSubject: 'Welcome to ShowStellar',
      fields: baseFields([
        { name: 'dashboard_link', label: 'Dashboard link', type: 'url', required: true, placeholder: siteLink('/artist-dashboard') },
        { name: 'profile_link', label: 'Profile link', type: 'url', required: true, placeholder: siteLink('/artist-dashboard/profile') },
        { name: 'verification_link', label: 'Verification link', type: 'url', required: false, placeholder: siteLink('/verify-email') },
      ]),
      initialData: () => ({ ...sharedInitialData() }),
      subject: () => 'Welcome to ShowStellar',
      build: payload => {
        const data = defaultPayload(payload)
        const nextSteps = [
          data.dashboard_link ? `Open your dashboard: ${data.dashboard_link}.` : '',
          data.profile_link ? `Complete or refine your profile: ${data.profile_link}.` : '',
          data.verification_link ? `Verify your email if needed: ${data.verification_link}.` : '',
        ].filter(Boolean) as string[]

        return {
          title: 'Welcome to ShowStellar',
          intro: `Hi ${data.artist_name || 'Artist'}, welcome aboard. We are excited to have you on ShowStellar.`,
          sections: [
            {
              type: 'paragraph',
              text: 'We built ShowStellar to help artists present their work clearly and receive bookings with confidence.',
            },
            ...bulletSection('Your next steps', nextSteps.length ? nextSteps : ['Open your dashboard', 'Complete your profile', 'Keep your media updated']),
          ],
          cta: { label: 'Go to dashboard', href: data.dashboard_link },
          footer: 'Welcome email',
          badge: 'Welcome',
          supportEmail: data.support_email,
        }
      },
    },
  }

  return configs[templateKey]
}

export function getArtistEmailTemplate(templateKey: ArtistEmailTemplateKey, payload: ArtistEmailPayload) {
  const config = getTemplateConfig(templateKey)
  const rendered = buildArtistEmailDocument(config.build(payload))

  return {
    subject: config.subject(payload),
    html: rendered.html,
    text: rendered.text,
  }
}

export function getArtistEmailTemplateDefinition(templateKey: ArtistEmailTemplateKey): EmailTemplateDefinition {
  const config = getTemplateConfig(templateKey)
  return {
    key: config.key,
    label: config.label,
    defaultSubject: config.defaultSubject,
    description: config.description,
    notes: config.notes,
    fields: config.fields,
    getInitialData: config.initialData,
    renderHtml: data =>
      getArtistEmailTemplate(templateKey, {
        artist_name: data.artist_name ?? data.artistName ?? '',
        artist_email: data.artist_email ?? data.artistEmail ?? '',
        join_link: data.join_link ?? data.joinLink ?? '',
        dashboard_link: data.dashboard_link ?? data.dashboardLink ?? '',
        profile_link: data.profile_link ?? data.profileLink ?? '',
        verification_link: data.verification_link ?? data.verificationLink ?? '',
        missing_fields: data.missing_fields ?? data.missingFields ?? '',
        support_email: data.support_email ?? data.supportEmail ?? '',
        login_email: data.login_email ?? data.loginEmail ?? '',
        temporary_password: data.temporary_password ?? data.temporaryPassword ?? '',
        status: data.status ?? '',
        city: data.city ?? '',
        category: data.category ?? '',
        reason: data.reason ?? '',
        note: data.note ?? '',
        requested_at: data.requested_at ?? '',
      }).html,
    renderPreview: data =>
      getArtistEmailTemplate(templateKey, {
        artist_name: data.artist_name ?? data.artistName ?? '',
        artist_email: data.artist_email ?? data.artistEmail ?? '',
        join_link: data.join_link ?? data.joinLink ?? '',
        dashboard_link: data.dashboard_link ?? data.dashboardLink ?? '',
        profile_link: data.profile_link ?? data.profileLink ?? '',
        verification_link: data.verification_link ?? data.verificationLink ?? '',
        missing_fields: data.missing_fields ?? data.missingFields ?? '',
        support_email: data.support_email ?? data.supportEmail ?? '',
        login_email: data.login_email ?? data.loginEmail ?? '',
        temporary_password: data.temporary_password ?? data.temporaryPassword ?? '',
        status: data.status ?? '',
        city: data.city ?? '',
        category: data.category ?? '',
        reason: data.reason ?? '',
        note: data.note ?? '',
        requested_at: data.requested_at ?? '',
      }).html,
    renderText: data =>
      getArtistEmailTemplate(templateKey, {
        artist_name: data.artist_name ?? data.artistName ?? '',
        artist_email: data.artist_email ?? data.artistEmail ?? '',
        join_link: data.join_link ?? data.joinLink ?? '',
        dashboard_link: data.dashboard_link ?? data.dashboardLink ?? '',
        profile_link: data.profile_link ?? data.profileLink ?? '',
        verification_link: data.verification_link ?? data.verificationLink ?? '',
        missing_fields: data.missing_fields ?? data.missingFields ?? '',
        support_email: data.support_email ?? data.supportEmail ?? '',
        login_email: data.login_email ?? data.loginEmail ?? '',
        temporary_password: data.temporary_password ?? data.temporaryPassword ?? '',
        status: data.status ?? '',
        city: data.city ?? '',
        category: data.category ?? '',
        reason: data.reason ?? '',
        note: data.note ?? '',
        requested_at: data.requested_at ?? '',
      }).text,
  }
}

export const artistLifecycleEmailTemplateDefinitions = ARTIST_EMAIL_TEMPLATE_KEYS.map(key =>
  getArtistEmailTemplateDefinition(key)
)

export function buildArtistEmailDefaults(payload: ArtistEmailPayload) {
  return defaultPayload(payload)
}
