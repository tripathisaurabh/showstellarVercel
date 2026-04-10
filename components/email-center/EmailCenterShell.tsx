'use client'

import Link from 'next/link'
import { startTransition, useDeferredValue, useEffect, useRef, useState, useTransition } from 'react'
import { ArrowLeft, Sparkles } from 'lucide-react'
import EmailForm from '@/components/email-center/EmailForm'
import EmailPreview from '@/components/email-center/EmailPreview'
import { emailTemplates, getEmailTemplateByKey } from '@/lib/email-center/template-registry'
import {
  getInitialTemplateData,
  getSampleTemplateData,
  mergeTemplateDataForTemplateChange,
} from '@/lib/email-center/utils'
import type { EmailTemplateData } from '@/lib/email-center/types'

type EmailCenterShellProps = {
  adminEmail: string
}

const DEFAULT_TEMPLATE = emailTemplates[0]

export default function EmailCenterShell({ adminEmail }: EmailCenterShellProps) {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(DEFAULT_TEMPLATE.key)
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState(DEFAULT_TEMPLATE.defaultSubject)
  const [templateData, setTemplateData] = useState<EmailTemplateData>(() => getInitialTemplateData(DEFAULT_TEMPLATE))
  const [userEditedSubject, setUserEditedSubject] = useState(false)
  const [statusTone, setStatusTone] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState<string | null>('Ready to compose a manual ShowStellar email.')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isPending, startSending] = useTransition()
  const toastTimer = useRef<number | null>(null)

  const selectedTemplate = getEmailTemplateByKey(selectedTemplateKey) ?? DEFAULT_TEMPLATE
  const deferredTemplateData = useDeferredValue(templateData)
  const deferredTo = useDeferredValue(to)
  const deferredSubject = useDeferredValue(subject)
  const fromAddress = 'ShowStellar <support@showstellar.com>'

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current)
      }
    }
  }, [])

  function showToast(message: string) {
    setToastMessage(message)

    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current)
    }

    toastTimer.current = window.setTimeout(() => {
      setToastMessage(null)
      toastTimer.current = null
    }, 4200)
  }

  function clearStatus() {
    setStatusTone('idle')
    setStatusMessage(null)
  }

  function handleTemplateChange(nextTemplateKey: string) {
    const nextTemplate = getEmailTemplateByKey(nextTemplateKey)
    if (!nextTemplate) {
      return
    }

    const shouldResetSubject =
      !userEditedSubject || !subject.trim() || subject.trim() === selectedTemplate.defaultSubject

    startTransition(() => {
      setSelectedTemplateKey(nextTemplateKey)
      setTemplateData(previousData => mergeTemplateDataForTemplateChange(previousData, nextTemplate))

      if (shouldResetSubject) {
        setSubject(nextTemplate.defaultSubject)
        setUserEditedSubject(false)
      }

      clearStatus()
    })
  }

  function handleLoadSampleData() {
    startTransition(() => {
      setTo('rahul@example.com')
      setTemplateData(getSampleTemplateData(selectedTemplate))
      setStatusTone('idle')
      setStatusMessage('Loaded sample content for quick preview testing.')

      if (!userEditedSubject || !subject.trim()) {
        setSubject(selectedTemplate.defaultSubject)
        setUserEditedSubject(false)
      }
    })
  }

  async function sendEmail(sendTest: boolean) {
    setStatusTone('sending')
    setStatusMessage(sendTest ? 'Sending a test email to your admin inbox…' : 'Sending email via Resend…')

    const response = await fetch('/api/admin/email-center/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject,
        templateKey: selectedTemplate.key,
        templateData,
        sendTest,
      }),
    })

    const result = (await response.json()) as { success: boolean; error?: string; messageId?: string }

    if (!response.ok || !result.success) {
      setStatusTone('error')
      setStatusMessage(result.error ?? 'Unable to send the email.')
      return
    }

    const successMessage = sendTest
      ? `Test email sent to ${adminEmail}${result.messageId ? ` · ${result.messageId}` : ''}`
      : `Email sent successfully${result.messageId ? ` · ${result.messageId}` : ''}`

    setStatusTone('success')
    setStatusMessage(successMessage)
    showToast(successMessage)
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'radial-gradient(circle at top right, rgba(193,117,245,0.10), transparent 26%), linear-gradient(180deg, #f8f9fc 0%, #eef3fa 100%)',
      }}
    >
      <div className="mx-auto max-w-[1520px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-8 rounded-[30px] border bg-white/88 px-6 py-6 shadow-[0_24px_80px_rgba(0,23,57,0.08)] backdrop-blur" style={{ borderColor: 'rgba(0, 23, 57, 0.10)' }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition hover:-translate-y-0.5"
                style={{
                  borderColor: 'rgba(0, 23, 57, 0.10)',
                  color: 'var(--navy)',
                  background: 'rgba(0, 23, 57, 0.03)',
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to admin
              </Link>
              <h1 className="mt-4 text-3xl font-bold sm:text-4xl" style={{ color: 'var(--foreground)' }}>
                Email Center
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 sm:text-base" style={{ color: 'var(--muted)' }}>
                Manually send branded ShowStellar emails to artists.
              </p>
            </div>

            <div
              className="min-w-[260px] rounded-[26px] border px-5 py-4"
              style={{
                borderColor: 'rgba(0, 23, 57, 0.10)',
                background: 'linear-gradient(135deg, rgba(0,23,57,0.05), rgba(255,255,255,0.98))',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: 'rgba(0, 23, 57, 0.08)', color: 'var(--navy)' }}>
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                    Internal admin utility
                  </div>
                  <div className="text-xs leading-5" style={{ color: 'var(--muted)' }}>
                    Server-side send only. Resend key stays private.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
          <EmailForm
            templates={emailTemplates}
            selectedTemplateKey={selectedTemplateKey}
            to={to}
            subject={subject}
            artistName={templateData.artistName ?? ''}
            templateData={templateData}
            disabled={isPending}
            adminEmail={adminEmail}
            statusTone={statusTone}
            statusMessage={statusMessage}
            onTemplateChange={handleTemplateChange}
            onToChange={value => {
              setTo(value)
              clearStatus()
            }}
            onSubjectChange={value => {
              setSubject(value)
              setUserEditedSubject(true)
              clearStatus()
            }}
            onArtistNameChange={value => {
              setTemplateData(previous => ({ ...previous, artistName: value }))
              clearStatus()
            }}
            onTemplateFieldChange={(fieldName, value) => {
              setTemplateData(previous => ({ ...previous, [fieldName]: value }))
              clearStatus()
            }}
            onLoadSampleData={handleLoadSampleData}
            onSendTest={() => startSending(() => void sendEmail(true))}
            onSendEmail={() => startSending(() => void sendEmail(false))}
          />

          <div className="xl:sticky xl:top-6 xl:self-start">
            <EmailPreview
              template={selectedTemplate}
              to={deferredTo}
              subject={deferredSubject}
              from={fromAddress}
              templateData={deferredTemplateData}
            />
          </div>
        </div>
      </div>

      {toastMessage ? (
        <div className="pointer-events-none fixed bottom-5 right-5 z-50 max-w-sm">
          <div
            className="rounded-2xl border px-4 py-3 text-sm font-medium text-white shadow-[0_18px_60px_rgba(0,23,57,0.28)]"
            style={{
              borderColor: 'rgba(255,255,255,0.16)',
              background: 'linear-gradient(135deg, #001739 0%, #16386c 100%)',
            }}
          >
            {toastMessage}
          </div>
        </div>
      ) : null}
    </div>
  )
}
