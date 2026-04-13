'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Save, Trash2, Upload } from 'lucide-react'
import CategorySelector from '@/components/CategorySelector'
import ProfilePhotoCropModal from '@/components/ProfilePhotoCropModal'
import { createCroppedImageBlob, type ImageCropGeometry } from '@/lib/image-crop'
import {
  getArtistCategories,
  getArtistInitials,
  getArtistLocation,
  getArtistPublicPath,
  type PublicArtistRecord,
} from '@/lib/artist-profile'
import {
  ADMIN_MEDIA_MAX_SIZE_MB,
  ADMIN_PROFILE_IMAGE_MAX_SIZE_MB,
  MAX_ARTIST_MEDIA_ITEMS,
  getArtistMediaLimitError,
  getAdminFileTypeError,
} from '@/lib/admin-file-upload'
import { ARTIST_CATEGORY_OPTIONS } from '@/lib/artist-categories'
import type { AdminArtistCard } from '@/lib/admin-dashboard'

type AdminArtistMediaItem = {
  id: string
  media_url: string
  type: 'image' | 'video'
}

type BusyState = {
  phase: 'preparing' | 'optimizing' | 'uploading' | 'saving'
  message: string
  progress: number
} | null

type ArtistEditorForm = {
  full_name: string
  phone_number: string
  stage_name: string
  bio: string
  pricing_start: string
  locality: string
  city: string
  state: string
  preferred_working_locations: string
  performance_style: string
  event_types: string
  languages_spoken: string
  approval_status: 'draft' | 'pending' | 'approved' | 'rejected'
  is_featured: boolean
  rating: string
  experience_years: string
  profile_image: string
  profile_image_cropped: string
  profile_image_original: string
}

function buildInitialForm(artist: AdminArtistCard): ArtistEditorForm {
  return {
    full_name: artist.fullName ?? '',
    phone_number: artist.phoneNumber ?? '',
    stage_name: artist.stageName ?? '',
    bio: artist.bio ?? '',
    pricing_start: artist.pricingStart != null ? String(artist.pricingStart) : '',
    locality: artist.locality ?? '',
    city: artist.city ?? '',
    state: artist.state ?? '',
    preferred_working_locations: artist.preferredWorkingLocations ?? '',
    performance_style: artist.performanceStyle ?? '',
    event_types: artist.eventTypes ?? '',
    languages_spoken: artist.languagesSpoken ?? '',
    approval_status: artist.approvalStatus,
    is_featured: artist.isFeatured,
    rating: artist.rating != null ? String(artist.rating) : '',
    experience_years: artist.experienceYears != null ? String(artist.experienceYears) : '',
    profile_image: artist.profileImage ?? '',
    profile_image_cropped: artist.profileImage ?? '',
    profile_image_original: '',
  }
}

export default function AdminArtistProfileEditor({
  artist,
}: {
  artist: AdminArtistCard & { media: AdminArtistMediaItem[] }
}) {
  const photoInputRef = useRef<HTMLInputElement>(null)
  const mediaInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<ArtistEditorForm>(() => buildInitialForm(artist))
  const [categorySelection, setCategorySelection] = useState<{
    categories: string[]
    customCategories: string[]
  }>(() => ({
    categories: artist.categoryNames.filter(category => !artist.customCategories.includes(category)),
    customCategories: [...artist.customCategories],
  }))
  const [media, setMedia] = useState<AdminArtistMediaItem[]>(artist.media ?? [])
  const [saving, setSaving] = useState(false)
  const [photoBusyState, setPhotoBusyState] = useState<BusyState>(null)
  const [photoError, setPhotoError] = useState('')
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null)
  const [photoCropOpen, setPhotoCropOpen] = useState(false)
  const [mediaUploading, setMediaUploading] = useState(false)
  const [mediaProgress, setMediaProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const currentImage = form.profile_image_cropped || form.profile_image || ''
  const displayName = form.stage_name.trim() || form.full_name.trim() || artist.displayName || 'Artist profile'
  const previewLocation = getArtistLocation({
    locality: form.locality,
    city: form.city,
    state: form.state,
  } as PublicArtistRecord)
  const profileCategories = getArtistCategories({
    categories: categorySelection.categories,
    custom_categories: categorySelection.customCategories,
    primary_category: null,
  } as PublicArtistRecord)
  const mediaLimitReached = media.length >= MAX_ARTIST_MEDIA_ITEMS

  function updateField<K extends keyof ArtistEditorForm>(key: K, value: ArtistEditorForm[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  function getFileError(file: File, kind: 'image' | 'media') {
    return getAdminFileTypeError(file, kind)
  }

  function handlePhotoSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const validationError = getFileError(file, 'image')
    if (validationError) {
      setError(validationError)
      if (photoInputRef.current) photoInputRef.current.value = ''
      return
    }

    setError('')
    setPhotoError('')
    setPendingPhotoFile(file)
    setPhotoCropOpen(true)

    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  async function handleCropConfirm(geometry: ImageCropGeometry) {
    if (!pendingPhotoFile) {
      setPhotoError('No profile photo was selected.')
      return
    }

    const previousImage = form.profile_image
    const previousCropped = form.profile_image_cropped
    const previousOriginal = form.profile_image_original

    try {
      setPhotoError('')
      setPhotoBusyState({ phase: 'preparing', message: 'Preparing photo...', progress: 16 })
      await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()))

      setPhotoBusyState({ phase: 'optimizing', message: 'Optimizing image...', progress: 32 })
      const { blob: croppedBlob } = await createCroppedImageBlob(pendingPhotoFile, geometry)

      setPhotoBusyState({ phase: 'uploading', message: 'Uploading profile photo...', progress: 72 })
      const originalFile = pendingPhotoFile
      const formData = new FormData()
      formData.append(
        'profile_image_file',
        new File([croppedBlob], `admin-profile-${Date.now()}.jpg`, { type: 'image/jpeg' })
      )
      formData.append('profile_image_original_file', originalFile)

      setPhotoBusyState({ phase: 'saving', message: 'Saving changes...', progress: 92 })
      const response = await fetch(`/api/admin/artists/${artist.id}/photo`, {
        method: 'POST',
        body: formData,
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to update profile photo')
      }

      setForm(current => ({
        ...current,
        profile_image: payload?.profileImage ?? previousImage,
        profile_image_cropped: payload?.profileImageCropped ?? payload?.profileImage ?? previousCropped,
        profile_image_original: payload?.profileImageOriginal ?? previousOriginal,
      }))
      setPhotoCropOpen(false)
      setPendingPhotoFile(null)
      setPhotoBusyState(null)
      setSuccess('Profile photo updated successfully')
      window.setTimeout(() => setSuccess(''), 3000)
    } catch (err: unknown) {
      setForm(current => ({
        ...current,
        profile_image: previousImage,
        profile_image_cropped: previousCropped,
        profile_image_original: previousOriginal,
      }))
      setPhotoBusyState(null)
      setPhotoError(err instanceof Error ? err.message : 'Failed to upload profile image')
      throw err
    }
  }

  async function handleMediaUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    setError('')
    setSuccess('')

    const limitError = getArtistMediaLimitError(media.length, files.length)
    if (limitError) {
      setError(limitError)
      if (mediaInputRef.current) mediaInputRef.current.value = ''
      return
    }

    setMediaUploading(true)
    setMediaProgress(0)

    try {
      const nextItems: AdminArtistMediaItem[] = []

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index]
        const validationError = getFileError(file, 'media')
        if (validationError) {
          throw new Error(validationError)
        }

        setMediaProgress(Math.round((index / files.length) * 100))
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)

        const response = await fetch(`/api/admin/artists/${artist.id}/media`, {
          method: 'POST',
          body: uploadFormData,
        })

        const payload = await response.json().catch(() => null)
        if (!response.ok) {
          throw new Error(payload?.error ?? 'Failed to upload media')
        }

        if (payload?.media) {
          nextItems.push({
            id: payload.media.id,
            media_url: payload.media.media_url,
            type: payload.media.type,
          })
        }
      }

      setMedia(current => [...current, ...nextItems])
      setSuccess('Gallery updated successfully')
      window.setTimeout(() => setSuccess(''), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload media')
    } finally {
      setMediaUploading(false)
      setMediaProgress(0)
      if (mediaInputRef.current) mediaInputRef.current.value = ''
    }
  }

  async function handleDeleteMedia(mediaId: string) {
    if (!window.confirm('Delete this media item?')) return

    setError('')
    try {
      const response = await fetch(`/api/admin/artists/${artist.id}/media/${mediaId}`, {
        method: 'DELETE',
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to delete media')
      }

      setMedia(current => current.filter(item => item.id !== mediaId))
      setSuccess('Media item removed')
      window.setTimeout(() => setSuccess(''), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete media')
    }
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const response = await fetch(`/api/admin/artists/${artist.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: form.full_name,
          phoneNumber: form.phone_number,
          stage_name: form.stage_name,
          bio: form.bio,
          pricing_start: form.pricing_start,
          locality: form.locality,
          city: form.city,
          state: form.state,
          preferred_working_locations: form.preferred_working_locations,
          performance_style: form.performance_style,
          event_types: form.event_types,
          languages_spoken: form.languages_spoken,
          approvalStatus: form.approval_status,
          isFeatured: form.is_featured,
          rating: form.rating.trim() === '' ? null : Number(form.rating),
          experienceYears: form.experience_years.trim() === '' ? null : Number(form.experience_years),
          categories: categorySelection.categories,
          custom_categories: categorySelection.customCategories,
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to save artist profile')
      }

      setSuccess('Artist profile updated successfully')
      window.setTimeout(() => setSuccess(''), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save artist profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href={`/admin/artists/${artist.id}`} className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
            <ArrowLeft className="h-4 w-4" />
            Back to artist
          </Link>
          <div className="text-sm font-semibold text-[var(--navy)]">Edit Artist Profile</div>
          <Link href="/admin" className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]">
            Admin
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Admin edit</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
            {displayName}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Update profile data, approval state, and media without relying on the artist-side flow.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-[0_20px_48px_rgba(0,23,57,0.05)] sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] text-2xl font-semibold text-[var(--foreground)]">
                  {currentImage ? (
                    <Image src={currentImage} alt={displayName} width={96} height={96} className="h-full w-full object-cover" />
                  ) : (
                    getArtistInitials({
                      ...artist,
                      stage_name: form.stage_name,
                      users: { full_name: form.full_name },
                    } as PublicArtistRecord)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Public profile</p>
                  <h2 className="mt-1 text-xl font-semibold text-[var(--foreground)]">{displayName}</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">{previewLocation || 'Updating soon'}</p>
                  <Link href={getArtistPublicPath(artist)} className="mt-1 inline-flex text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:underline">
                    {getArtistPublicPath(artist)}
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusChip label={formatStatusLabel(form.approval_status)} />
                <StatusChip label={artist.emailVerified ? 'Verified' : 'Unverified'} subtle />
                {form.is_featured && <StatusChip label="Featured" accent />}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <InfoTile label="Artist type" value={profileCategories.summary || 'Updating soon'} />
              <InfoTile label="Email" value={artist.email || 'Updating soon'} />
              <InfoTile label="Phone" value={form.phone_number || 'Updating soon'} />
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-[0_20px_48px_rgba(0,23,57,0.05)] sm:p-6">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Guidance</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Keep it concise and complete</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
              <li>• Update only the fields you need. Everything else stays intact.</li>
              <li>• Profile photos are cropped to 4:5 before upload.</li>
              <li>• Gallery uploads support JPG, PNG, WebP, MP4, WebM, and MOV.</li>
              <li>• Category changes use the same canonical list as the artist flow.</li>
            </ul>
          </section>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-6">
          <section className="rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-[0_20px_48px_rgba(0,23,57,0.05)] sm:p-6">
            <SectionTitle title="Identity" description="Full name, stage name, and contact details." />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Full name">
                <TextInput
                  value={form.full_name}
                  onChange={value => updateField('full_name', value)}
                  placeholder="Artist's full name"
                />
              </Field>
              <Field label="Stage name">
                <TextInput
                  value={form.stage_name}
                  onChange={value => updateField('stage_name', value)}
                  placeholder="Public artist name"
                />
              </Field>
              <Field label="Phone number">
                <TextInput
                  value={form.phone_number}
                  onChange={value => updateField('phone_number', value)}
                  placeholder="Phone number"
                />
              </Field>
              <Field label="Email">
                <TextInput value={artist.email || ''} onChange={() => undefined} placeholder="Email" disabled />
              </Field>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-[0_20px_48px_rgba(0,23,57,0.05)] sm:p-6">
            <SectionTitle title="Profile details" description="Categories, bio, location, and performance details." />
            <div className="mt-5 space-y-4">
              <Field label="Categories">
                <CategorySelector
                  options={Array.from(ARTIST_CATEGORY_OPTIONS)}
                  value={categorySelection}
                  onChange={setCategorySelection}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="City">
                  <TextInput
                    value={form.city}
                    onChange={value => updateField('city', value)}
                    placeholder="City"
                  />
                </Field>
                <Field label="Locality">
                  <TextInput
                    value={form.locality}
                    onChange={value => updateField('locality', value)}
                    placeholder="Locality / area"
                  />
                </Field>
              </div>
              <Field label="State">
                <TextInput value={form.state} onChange={value => updateField('state', value)} placeholder="State" />
              </Field>
              <Field label="Preferred working locations">
                <TextArea
                  value={form.preferred_working_locations}
                  onChange={value => updateField('preferred_working_locations', value)}
                  placeholder="Mumbai, Thane, Navi Mumbai"
                />
              </Field>
              <Field label="Bio / About">
                <TextArea
                  value={form.bio}
                  onChange={value => updateField('bio', value)}
                  placeholder="Tell clients about the artist..."
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Performance style">
                  <TextInput
                    value={form.performance_style}
                    onChange={value => updateField('performance_style', value)}
                    placeholder="Performance style"
                  />
                </Field>
                <Field label="Languages">
                  <TextInput
                    value={form.languages_spoken}
                    onChange={value => updateField('languages_spoken', value)}
                    placeholder="Hindi, English, Marathi"
                  />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Event types">
                  <TextArea
                    value={form.event_types}
                    onChange={value => updateField('event_types', value)}
                    placeholder="Wedding, corporate, private party"
                  />
                </Field>
                <Field label="Years of experience">
                  <TextInput
                    value={form.experience_years}
                    onChange={value => updateField('experience_years', value)}
                    placeholder="Years of experience"
                    inputMode="numeric"
                  />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Starting price">
                  <TextInput
                    value={form.pricing_start}
                    onChange={value => updateField('pricing_start', value)}
                    placeholder="Starting price"
                    inputMode="numeric"
                  />
                </Field>
                <Field label="Rating">
                  <TextInput
                    value={form.rating}
                    onChange={value => updateField('rating', value)}
                    placeholder="Admin rating"
                    inputMode="decimal"
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-[0_20px_48px_rgba(0,23,57,0.05)] sm:p-6">
            <SectionTitle title="Status & visibility" description="Keep moderation controls alongside profile edits." />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Approval status">
                <SelectInput
                  value={form.approval_status}
                  onChange={value => updateField('approval_status', value as ArtistEditorForm['approval_status'])}
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </SelectInput>
              </Field>
              <Field label="Featured">
                <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={event => updateField('is_featured', event.target.checked)}
                    className="h-4 w-4 rounded border-[var(--border)]"
                  />
                  <span className="text-sm text-[var(--foreground)]">Show this artist in featured placements</span>
                </label>
              </Field>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-[0_20px_48px_rgba(0,23,57,0.05)] sm:p-6">
            <SectionTitle title="Profile photo" description="Upload a portrait and crop it before saving." />
            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] text-2xl font-semibold text-[var(--foreground)]">
                {currentImage ? (
                  <Image src={currentImage} alt={displayName} width={96} height={96} className="h-full w-full object-cover" />
                ) : (
                  getArtistInitials({
                    ...artist,
                    stage_name: form.stage_name,
                    users: { full_name: form.full_name },
                  } as PublicArtistRecord)
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={saving || Boolean(photoBusyState)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </button>
                <p className="text-xs leading-6 text-[var(--muted)]">
                  JPG, PNG, or WebP up to {ADMIN_PROFILE_IMAGE_MAX_SIZE_MB}MB. A 4:5 crop will be prepared before upload.
                </p>
                {photoError && <p className="text-sm text-red-600">{photoError}</p>}
                {photoBusyState && (
                  <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-[var(--foreground)]">{photoBusyState.message}</span>
                      <span className="text-xs text-[var(--muted)]">{photoBusyState.progress}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-[var(--navy)] transition-all"
                        style={{ width: `${photoBusyState.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-[0_20px_48px_rgba(0,23,57,0.05)] sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <SectionTitle
                title="Media / Gallery"
                description="Add or remove portfolio items shown on the public profile."
              />
              <div>
                <input
                  ref={mediaInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                  onChange={handleMediaUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => mediaInputRef.current?.click()}
                  disabled={mediaUploading || Boolean(photoBusyState) || mediaLimitReached}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--navy)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {mediaUploading ? 'Uploading…' : mediaLimitReached ? 'Limit reached' : 'Upload media'}
                </button>
              </div>
            </div>

            <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
              Gallery uploads support JPG, PNG, WebP, MP4, WebM, and MOV files up to {ADMIN_MEDIA_MAX_SIZE_MB}MB. Up to {MAX_ARTIST_MEDIA_ITEMS} media items total.
            </p>

            {mediaUploading && (
              <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-[var(--foreground)]">Uploading gallery media…</span>
                  <span className="text-xs text-[var(--muted)]">{mediaProgress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-[var(--navy)] transition-all"
                    style={{ width: `${mediaProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {media.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] px-4 py-8 text-sm text-[var(--muted)] sm:col-span-2 xl:col-span-3">
                  No gallery media uploaded yet.
                </div>
              ) : (
                media.map(item => (
                  <div key={item.id} className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]">
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      {item.type === 'video' ? (
                        <video src={item.media_url} className="h-full w-full object-cover bg-black" controls />
                      ) : (
                        <a
                          href={item.media_url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Open media item for ${displayName}`}
                          className="relative block h-full w-full"
                        >
                          <Image src={item.media_url} alt={displayName} fill className="object-cover object-top" sizes="(max-width: 768px) 100vw, 33vw" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <span className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
                        {item.type}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteMedia(item.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-white"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <div className="sticky bottom-4 z-10">
            <div className="rounded-[2rem] border border-[var(--border)] bg-white p-4 shadow-[0_20px_48px_rgba(0,23,57,0.12)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--muted)]">
                  Save all text, category, status, and visibility updates here.
                </p>
                <button
                  type="submit"
                  disabled={saving || mediaUploading || Boolean(photoBusyState)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <ProfilePhotoCropModal
        open={photoCropOpen}
        file={pendingPhotoFile}
        busyState={photoBusyState}
        error={photoError}
        onCancel={() => {
          setPhotoCropOpen(false)
          setPendingPhotoFile(null)
          setPhotoBusyState(null)
          setPhotoError('')
        }}
        onConfirm={handleCropConfirm}
      />
    </div>
  )
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">{label}</span>
      {children}
    </label>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
  inputMode,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  disabled?: boolean
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}) {
  return (
    <input
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      inputMode={inputMode}
      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent-violet)] disabled:bg-[var(--surface-2)]"
    />
  )
}

function TextArea({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <textarea
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder={placeholder}
      rows={4}
      className="w-full resize-none rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent-violet)]"
    />
  )
}

function SelectInput({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={event => onChange(event.target.value)}
      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent-violet)]"
    >
      {children}
    </select>
  )
}

function StatusChip({
  label,
  accent = false,
  subtle = false,
}: {
  label: string
  accent?: boolean
  subtle?: boolean
}) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
      style={{
        background: accent ? 'rgba(193,117,245,0.14)' : subtle ? 'var(--surface-2)' : 'rgba(0,23,57,0.08)',
        color: accent ? '#c175f5' : subtle ? 'var(--muted)' : 'var(--navy)',
      }}
    >
      {label}
    </span>
  )
}

function formatStatusLabel(value: ArtistEditorForm['approval_status']) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  )
}
