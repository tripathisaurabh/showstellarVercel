import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-access'
import { getEmailTemplateByKey } from '@/lib/email-center/template-registry'
import {
  generatePlainTextFromHtml,
  isValidEmail,
  logEmailCenterSend,
  validateEmailCenterPayload,
} from '@/lib/email-center/utils'
import type { EmailCenterPayload } from '@/lib/email-center/types'
import { getEmailFromAddress, getResendClient } from '@/lib/resend'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const { user, userRecord, isAdmin } = await getAdminSession()

  if (!user || !isAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let payload: EmailCenterPayload

  try {
    const rawPayload = (await request.json()) as Partial<EmailCenterPayload> | null
    payload = {
      to: typeof rawPayload?.to === 'string' ? rawPayload.to : '',
      subject: typeof rawPayload?.subject === 'string' ? rawPayload.subject : '',
      templateKey: typeof rawPayload?.templateKey === 'string' ? rawPayload.templateKey : '',
      templateData:
        rawPayload?.templateData && typeof rawPayload.templateData === 'object'
          ? Object.fromEntries(
              Object.entries(rawPayload.templateData).map(([key, value]) => [
                key,
                typeof value === 'string' ? value : '',
              ])
            )
          : {},
      sendTest: Boolean(rawPayload?.sendTest),
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 })
  }

  const template = getEmailTemplateByKey(payload.templateKey)
  if (!template) {
    return NextResponse.json({ success: false, error: 'Unknown email template' }, { status: 400 })
  }

  const validation = validateEmailCenterPayload(payload, template)
  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: validation.errors[0] ?? 'Invalid email payload' },
      { status: 400 }
    )
  }

  const resend = getResendClient()
  if (!resend) {
    return NextResponse.json(
      { success: false, error: 'RESEND_API_KEY is not configured on the server.' },
      { status: 500 }
    )
  }

  const adminEmail = (userRecord?.email ?? user.email ?? '').trim().toLowerCase()
  const resolvedRecipient = payload.sendTest ? adminEmail : validation.sanitizedTo

  if (!resolvedRecipient || !isValidEmail(resolvedRecipient)) {
    return NextResponse.json(
      { success: false, error: 'Admin email is missing, so test sends are unavailable.' },
      { status: 400 }
    )
  }

  const html = template.renderHtml(validation.sanitizedTemplateData)
  const text = template.renderText?.(validation.sanitizedTemplateData) ?? generatePlainTextFromHtml(html)

  logEmailCenterSend({
    action: 'attempt',
    templateKey: template.key,
    subject: validation.sanitizedSubject,
    to: resolvedRecipient,
    requestedBy: user.email ?? null,
    sendTest: Boolean(payload.sendTest),
  })

  try {
    const response = await resend.emails.send({
      from: getEmailFromAddress(),
      to: resolvedRecipient,
      subject: validation.sanitizedSubject,
      html,
      text,
    })

    if (response.error) {
      logEmailCenterSend({
        action: 'failure',
        templateKey: template.key,
        subject: validation.sanitizedSubject,
        to: resolvedRecipient,
        requestedBy: user.email ?? null,
        sendTest: Boolean(payload.sendTest),
        error: response.error.message,
      })

      return NextResponse.json(
        { success: false, error: response.error.message || 'Resend could not send the email.' },
        { status: 502 }
      )
    }

    logEmailCenterSend({
      action: 'success',
      templateKey: template.key,
      subject: validation.sanitizedSubject,
      to: resolvedRecipient,
      requestedBy: user.email ?? null,
      sendTest: Boolean(payload.sendTest),
      messageId: response.data?.id,
    })

    return NextResponse.json({
      success: true,
      messageId: response.data?.id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected email send failure'

    logEmailCenterSend({
      action: 'failure',
      templateKey: template.key,
      subject: validation.sanitizedSubject,
      to: resolvedRecipient,
      requestedBy: user.email ?? null,
      sendTest: Boolean(payload.sendTest),
      error: message,
    })

    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
