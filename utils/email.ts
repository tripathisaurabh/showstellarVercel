import type { CreateEmailResponseSuccess } from 'resend'

type SendEmailArgs = {
  to: string | string[]
  subject: string
  html: string
}

type SendEmailSkipped = {
  skipped: true
  reason: string
}

type SendEmailSuccess = {
  skipped: false
  response: CreateEmailResponseSuccess
}

type SendEmailFailure = {
  skipped: false
  error: string
}

export type SendEmailResult = SendEmailSkipped | SendEmailSuccess | SendEmailFailure

export async function sendEmailIfConfigured({ to, subject, html }: SendEmailArgs): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.NOTIFICATION_FROM_EMAIL

  if (!apiKey || !from) {
    const reason = !apiKey && !from
      ? 'Missing RESEND_API_KEY and NOTIFICATION_FROM_EMAIL'
      : !apiKey
        ? 'Missing RESEND_API_KEY'
        : 'Missing NOTIFICATION_FROM_EMAIL'

    console.log(`[email] skipped: ${reason}`)
    console.log('Fallback: handle via WhatsApp/manual notification')
    return { skipped: true, reason }
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    const response = await resend.emails.send({
      from,
      to,
      subject,
      html,
    })

    if (response.error) {
      const reason = 'Resend returned an error'
      console.error('[email] failed:', response.error)
      console.log('Fallback: handle via WhatsApp/manual notification')
      return { skipped: false, error: reason }
    }

    console.log(`[email] sent: ${subject}`)
    return { skipped: false, response: response.data }
  } catch (error) {
    console.error('[email] failed:', error)
    console.log('Fallback: handle via WhatsApp/manual notification')
    return {
      skipped: false,
      error: error instanceof Error ? error.message : 'Unknown email error',
    }
  }
}

