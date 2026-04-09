'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import ShowStellarFeedbackBanner from '@/components/ShowStellarFeedbackBanner'

const eventTypes = ['Birthday', 'Wedding', 'Corporate Event', 'Private Party', 'College Event', 'Festival', 'Engagement', 'House Party', 'Religious Event', 'Other']
const eventSizes = ['Small (1–20)', 'Medium (20–100)', 'Large (100+)', 'Not sure']
const eventDurations = ['1 hour', '2 hours', '3+ hours', 'Not sure']
const venueTypes = ['Indoor', 'Outdoor', 'Not sure']

export default function BookingModal({
  artistId,
  artistName,
  artistPhone,
  artistEmail,
  artistCategory,
  artistLocation,
  artistPrice,
  artistProfileUrl,
  artistPerformanceStyle,
  artistEventTypes,
  artistLanguages,
  variant = 'dark',
}: {
  artistId: string
  artistName: string
  artistPhone?: string | null
  artistEmail?: string | null
  artistCategory?: string | null
  artistLocation?: string | null
  artistPrice?: string | null
  artistProfileUrl?: string | null
  artistPerformanceStyle?: string | null
  artistEventTypes?: string | null
  artistLanguages?: string | null
  variant?: 'dark' | 'light'
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    event_date: '',
    event_type: '',
    custom_event_type: '',
    event_size: '',
    event_duration: '',
    venue_type: '',
    client_offer: '',
    additional_details: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const isOtherEventType = form.event_type === 'Other'
  const formattedArtistPrice = useMemo(() => artistPrice?.trim() || '', [artistPrice])
  const hasListedArtistPrice = formattedArtistPrice.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        artistId,
        booking: {
          client_name: form.name.trim(),
          client_phone: form.phone.trim(),
          client_email: form.email.trim() || null,
          city: form.city.trim(),
          event_date: form.event_date || null,
          event_type: form.event_type,
          custom_event_type: isOtherEventType ? form.custom_event_type.trim() : null,
          event_size: form.event_size,
          event_duration: form.event_duration,
          venue_type: form.venue_type,
          artist_price: artistPrice ?? null,
          client_offer: form.client_offer.trim() || null,
          additional_details: form.additional_details.trim() || null,
        },
        artist: {
          name: artistName,
          phone: artistPhone,
          email: artistEmail,
          category: artistCategory,
          location: artistLocation,
          price: artistPrice,
          profileUrl: artistProfileUrl,
          performanceStyle: artistPerformanceStyle,
          eventTypes: artistEventTypes,
          languages: artistLanguages,
        },
        client: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
        },
        inquiry: {
          eventType: form.event_type,
          customEventType: isOtherEventType ? form.custom_event_type.trim() : null,
          eventSize: form.event_size,
          eventDuration: form.event_duration,
          venueType: form.venue_type,
          eventDate: form.event_date || null,
          city: form.city.trim() || null,
          artistPrice: artistPrice ?? null,
          clientOffer: form.client_offer.trim() || null,
          additionalDetails: form.additional_details.trim() || null,
        },
      }

      const notifyResponse = await fetch('/api/bookings/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!notifyResponse.ok) {
        const contentType = notifyResponse.headers.get('content-type') ?? ''
        let detail = 'Failed to send booking inquiry'

        if (contentType.includes('application/json')) {
          const payload = await notifyResponse.json().catch(() => null)
          detail = payload?.error ?? detail
        } else {
          detail = await notifyResponse.text()
        }

        throw new Error(detail)
      }

      setOpen(false)
      router.push('/inquiry-success')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full font-bold transition-all active:scale-[0.98]"
      style={variant === 'dark' ? {
        background: '#ffffff',
        color: '#1a1a1a',
        border: 'none',
        borderRadius: '12px',
        padding: '14px 24px',
          fontSize: '0.9375rem',
          letterSpacing: '0.01em',
          boxShadow: '0 2px 12px rgba(0,23,57,0.15)',
        } : {
          background: 'var(--navy)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '12px',
          padding: '14px 24px',
          fontSize: '0.9375rem',
          letterSpacing: '0.01em',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
      >
        Request Booking
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,23,57,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-5 flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Request Booking</h2>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>Send inquiry to {artistName}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <ShowStellarFeedbackBanner
                  state="error"
                  density="compact"
                  title="A problem occurred"
                  message={error}
                />
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Your Name">
                  <Input value={form.name} onChange={v => set('name', v)} placeholder="Full name" required />
                </Field>
                <Field label="Phone">
                  <Input value={form.phone} onChange={v => set('phone', v)} placeholder="+91 9876543210" required />
                </Field>
              </div>

              <Field label="Email">
                <Input type="email" value={form.email} onChange={v => set('email', v)} placeholder="you@example.com" />
              </Field>

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Event Type">
                  <select
                    value={form.event_type}
                    onChange={e => set('event_type', e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent-violet)] bg-white"
                    style={{ border: '1px solid var(--border)', color: form.event_type ? 'var(--foreground)' : 'var(--muted)' }}
                  >
                    <option value="" disabled>Select type</option>
                    {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Event Date">
                  <Input type="date" value={form.event_date} onChange={v => set('event_date', v)} required />
                </Field>
              </div>

              {isOtherEventType && (
                <Field label="Custom Event Type">
                  <Input
                    value={form.custom_event_type}
                    onChange={v => set('custom_event_type', v)}
                    placeholder="Describe your event type"
                    required
                  />
                </Field>
              )}

              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Event Size">
                  <select
                    value={form.event_size}
                    onChange={e => set('event_size', e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent-violet)] bg-white"
                    style={{ border: '1px solid var(--border)', color: form.event_size ? 'var(--foreground)' : 'var(--muted)' }}
                  >
                    <option value="" disabled>Select size</option>
                    {eventSizes.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Event Duration">
                  <select
                    value={form.event_duration}
                    onChange={e => set('event_duration', e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent-violet)] bg-white"
                    style={{ border: '1px solid var(--border)', color: form.event_duration ? 'var(--foreground)' : 'var(--muted)' }}
                  >
                    <option value="" disabled>Select duration</option>
                    {eventDurations.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Venue Type">
                  <select
                    value={form.venue_type}
                    onChange={e => set('venue_type', e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent-violet)] bg-white"
                    style={{ border: '1px solid var(--border)', color: form.venue_type ? 'var(--foreground)' : 'var(--muted)' }}
                  >
                    <option value="" disabled>Select venue</option>
                    {venueTypes.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="City">
                  <Input value={form.city} onChange={v => set('city', v)} placeholder="Event city" required />
                </Field>
                <Field label="Your Offer (Optional)">
                  <Input value={form.client_offer} onChange={v => set('client_offer', v)} placeholder="e.g. ₹20,000" inputMode="decimal" />
                </Field>
              </div>

              <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                <p className="text-xs uppercase tracking-[0.18em] mb-1" style={{ color: 'var(--muted)' }}>
                  Artist Price
                </p>
                {hasListedArtistPrice ? (
                  <p className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                    {formattedArtistPrice}
                  </p>
                ) : (
                  <>
                    <p className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
                      Price not listed for this artist yet
                    </p>
                    <p className="mt-1 text-sm leading-6" style={{ color: 'var(--muted)' }}>
                      You can still send your inquiry. The artist can share pricing after reviewing your request.
                    </p>
                  </>
                )}
              </div>

              <Field label="Additional Details (Optional)">
                <textarea
                  value={form.additional_details}
                  onChange={e => set('additional_details', e.target.value)}
                  placeholder="Tell the artist about your event requirements..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-[var(--accent-violet)] bg-white"
                  style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
                />
              </Field>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-3 rounded-xl font-medium border transition-colors hover:opacity-80"
                  style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'var(--navy)' }}
                >
                  {loading ? 'Sending…' : 'Send Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{label}</label>
      {children}
    </div>
  )
}

function Input({ type = 'text', value, onChange, placeholder, required, inputMode }: {
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      inputMode={inputMode}
      className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent-violet)] bg-white"
      style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
    />
  )
}
