'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Edit3, Mail, Lock, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { isValidEmailAddress, isValidPhoneNumber, normalizeEmailAddress, normalizePhoneNumber } from '@/lib/contact-info'

type PendingEmailChangeRequest = {
  id: string
  status: string
  requestedEmail: string
  currentEmail: string
  reason: string | null
  createdAt: string | null
}

type Props = {
  artistId: string
  email: string | null
  phoneNumber: string | null
  emailChangeRequestsEnabled?: boolean
  pendingEmailRequest?: PendingEmailChangeRequest | null
}

export default function ArtistContactInformationSection({
  artistId,
  email,
  phoneNumber,
  emailChangeRequestsEnabled = true,
  pendingEmailRequest,
}: Props) {
  const router = useRouter()
  const [phoneEditMode, setPhoneEditMode] = useState(false)
  const [phoneDraft, setPhoneDraft] = useState(phoneNumber ?? '')
  const [phoneSaving, setPhoneSaving] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [phoneSuccess, setPhoneSuccess] = useState('')

  const [requestOpen, setRequestOpen] = useState(false)
  const [requestedEmail, setRequestedEmail] = useState('')
  const [requestReason, setRequestReason] = useState('')
  const [requestSaving, setRequestSaving] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [requestSuccess, setRequestSuccess] = useState('')

  useEffect(() => {
    setPhoneDraft(phoneNumber ?? '')
  }, [phoneNumber])

  useEffect(() => {
    if (!requestOpen) {
      setRequestedEmail('')
      setRequestReason('')
      setRequestError('')
      setRequestSuccess('')
    }
  }, [requestOpen])

  const normalizedEmail = useMemo(() => normalizeEmailAddress(email ?? ''), [email])
  const pendingLabel = pendingEmailRequest ? 'Pending review' : 'Ready'

  async function savePhone() {
    const normalizedPhone = normalizePhoneNumber(phoneDraft)
    if (!normalizedPhone) {
      setPhoneError('Enter your phone number')
      return
    }
    if (!isValidPhoneNumber(normalizedPhone)) {
      setPhoneError('Enter a valid phone number with 10 to 15 digits')
      return
    }

    setPhoneError('')
    setPhoneSuccess('')
    setPhoneSaving(true)
    try {
      const response = await fetch('/api/artist-contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: normalizedPhone }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to update phone number')
      }

      setPhoneDraft(normalizedPhone)
      setPhoneSuccess('Phone number updated successfully')
      setPhoneEditMode(false)
      router.refresh()
      window.setTimeout(() => setPhoneSuccess(''), 3000)
    } catch (error: unknown) {
      setPhoneError(error instanceof Error ? error.message : 'Failed to update phone number')
    } finally {
      setPhoneSaving(false)
    }
  }

  async function submitEmailChangeRequest() {
    const normalizedRequestedEmail = normalizeEmailAddress(requestedEmail)
    const normalizedCurrentEmail = normalizedEmail

    if (!normalizedRequestedEmail) {
      setRequestError('Enter the new email address')
      return
    }

    if (!isValidEmailAddress(normalizedRequestedEmail)) {
      setRequestError('Enter a valid email address')
      return
    }

    if (normalizedRequestedEmail === normalizedCurrentEmail) {
      setRequestError('Use a different email address from your current one')
      return
    }

    setRequestSaving(true)
    setRequestError('')
    setRequestSuccess('')
    try {
      const response = await fetch('/api/artist-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedEmail: normalizedRequestedEmail,
          reason: requestReason.trim() || null,
          artistId,
        }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to submit email change request')
      }

      setRequestSuccess(payload?.message ?? 'Your email change request has been submitted.')
      router.refresh()
      window.setTimeout(() => {
        setRequestOpen(false)
        setRequestSuccess('')
      }, 1800)
    } catch (error: unknown) {
      setRequestError(error instanceof Error ? error.message : 'Failed to submit email change request')
    } finally {
      setRequestSaving(false)
    }
  }

  return (
    <section className="bg-white border rounded-2xl p-5 sm:p-6" style={{ borderColor: 'var(--border)' }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            Contact Information
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Keep your phone updated and request email changes securely.
          </p>
        </div>
        <span
          className="inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium"
          style={{
            background: pendingEmailRequest ? 'rgba(193,117,245,0.12)' : 'var(--surface-2)',
            color: pendingEmailRequest ? '#c175f5' : 'var(--muted)',
          }}
        >
          {pendingLabel}
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                Phone Number
              </p>
              {phoneEditMode ? (
                <div className="mt-3 space-y-3">
                  <input
                    type="tel"
                    value={phoneDraft}
                    onChange={e => setPhoneDraft(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition-colors"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={savePhone}
                      disabled={phoneSaving}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                      style={{ background: 'var(--navy)' }}
                    >
                      {phoneSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Save phone
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneEditMode(false)
                        setPhoneDraft(phoneNumber ?? '')
                        setPhoneError('')
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-base font-medium" style={{ color: phoneNumber ? 'var(--foreground)' : 'var(--muted)' }}>
                  {phoneNumber?.trim() || 'Not added yet'}
                </p>
              )}
            </div>

            {!phoneEditMode && (
              <button
                type="button"
                onClick={() => setPhoneEditMode(true)}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'white' }}
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </button>
            )}
          </div>

          {(phoneError || phoneSuccess) && (
            <div
              className="mt-4 rounded-xl border px-4 py-3 text-sm"
              style={{
                borderColor: phoneError ? 'rgba(220,38,38,0.18)' : 'rgba(34,197,94,0.18)',
                background: phoneError ? 'rgba(220,38,38,0.05)' : 'rgba(34,197,94,0.05)',
                color: phoneError ? '#b91c1c' : '#166534',
              }}
            >
              {phoneError || phoneSuccess}
            </div>
          )}
        </div>

        <div className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                Email Address
              </p>
              <div className="mt-3 flex items-center gap-2">
                <p className="truncate text-base font-medium" style={{ color: normalizedEmail ? 'var(--foreground)' : 'var(--muted)' }}>
                  {email?.trim() || 'Not added yet'}
                </p>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
                >
                  <Lock className="h-3 w-3" />
                  Locked
                </span>
              </div>
              <p className="mt-2 text-sm leading-6" style={{ color: 'var(--muted)' }}>
                For account security, email changes are reviewed manually.
              </p>
              {pendingEmailRequest && (
                <div
                  className="mt-3 rounded-xl border px-4 py-3 text-sm"
                  style={{ borderColor: 'rgba(193,117,245,0.18)', background: 'rgba(193,117,245,0.05)', color: 'var(--foreground)' }}
                >
                  Email change request: <span className="font-semibold">Pending</span>
                  <div className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
                    Requested email: {pendingEmailRequest.requestedEmail}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setRequestOpen(true)}
              disabled={Boolean(pendingEmailRequest) || !emailChangeRequestsEnabled}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'white' }}
            >
              <Mail className="h-4 w-4" />
              Request Email Change
            </button>
          </div>
          {!emailChangeRequestsEnabled && (
            <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>
              Email change requests are being set up. Your phone number can still be updated right now.
            </p>
          )}
        </div>
      </div>

      {requestOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(0,23,57,0.56)] px-4 py-6 backdrop-blur-[6px]"
          onClick={() => !requestSaving && setRequestOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-[0_28px_80px_rgba(0,0,0,0.22)]"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                  Request Email Change
                </p>
                <h4 className="mt-2 text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
                  Update your email address
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setRequestOpen(false)}
                className="rounded-full border p-2.5"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Current Email
                </label>
                <div className="mt-2 rounded-xl border bg-[var(--surface-2)] px-4 py-3 text-sm" style={{ borderColor: 'var(--border)' }}>
                  {email?.trim() || 'Not added yet'}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  New Email
                </label>
                <input
                  type="email"
                  value={requestedEmail}
                  onChange={e => setRequestedEmail(e.target.value)}
                  placeholder="new@example.com"
                  className="mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition-colors"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
              </div>

              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Reason / Message <span style={{ color: 'var(--muted)' }}>(optional)</span>
                </label>
                <textarea
                  value={requestReason}
                  onChange={e => setRequestReason(e.target.value)}
                  placeholder="Tell us why you need the update"
                  rows={4}
                  className="mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition-colors"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
              </div>
            </div>

            {(requestError || requestSuccess) && (
              <div
                className="mt-4 rounded-xl border px-4 py-3 text-sm"
                style={{
                  borderColor: requestError ? 'rgba(220,38,38,0.18)' : 'rgba(34,197,94,0.18)',
                  background: requestError ? 'rgba(220,38,38,0.05)' : 'rgba(34,197,94,0.05)',
                  color: requestError ? '#b91c1c' : '#166534',
                }}
              >
                {requestError || requestSuccess}
              </div>
            )}

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setRequestOpen(false)}
                disabled={requestSaving}
                className="inline-flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold disabled:opacity-50"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitEmailChangeRequest}
                disabled={requestSaving || !emailChangeRequestsEnabled}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: 'var(--navy)' }}
              >
                {requestSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
