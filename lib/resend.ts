import { Resend } from 'resend'

let resendClient: Resend | null = null

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    return null
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey)
  }

  return resendClient
}

export function getEmailFromAddress() {
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'support@showstellar.com'
  const fromName = process.env.EMAIL_FROM_NAME || 'ShowStellar'

  return `${fromName} <${fromAddress}>`
}
