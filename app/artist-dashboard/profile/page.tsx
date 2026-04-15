'use client'

import { useEffect, useRef, useState } from 'react'
import dynamicImport from 'next/dynamic'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ArtistDashboardShell from '@/components/ArtistDashboardShell'
import CategorySelector from '@/components/CategorySelector'
import { ProfileEditorSkeleton } from '@/components/ShowStellarSkeletons'
import { Upload, Trash2, Save } from 'lucide-react'
import {
  getArtistCategories,
  getArtistDisplayName,
  getArtistInitials,
  getArtistLocation,
  getArtistPublicPath,
  type PublicArtistRecord,
} from '@/lib/artist-profile'
import { ARTIST_CATEGORY_OPTIONS } from '@/lib/artist-categories'
import { createCroppedImageBlob, type ImageCropGeometry } from '@/lib/image-crop'
import {
  MAX_ARTIST_MEDIA_ITEMS,
  getArtistMediaLimitError,
} from '@/lib/admin-file-upload'

export const dynamic = 'force-dynamic'

const ProfilePhotoCropModal = dynamicImport(
  () => import('@/components/ProfilePhotoCropModal'),
  { ssr: false }
)

const MAX_PROFILE_IMAGE_SIZE_MB = 5
const MAX_MEDIA_SIZE_MB = 50
const allowedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const allowedGalleryImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const allowedVideoMimeTypes = new Set(['video/mp4', 'video/webm', 'video/quicktime'])
const CATEGORY_OPTIONS = Array.from(ARTIST_CATEGORY_OPTIONS)
const SIGN_REQUEST_TIMEOUT_MS = 15000
const SAVE_REQUEST_TIMEOUT_MS = 15000
const STORAGE_UPLOAD_TIMEOUT_MS = 60000

type TimeoutError = Error & { code?: 'TIMEOUT' }

function toTimeoutError(message: string): TimeoutError {
  const error = new Error(message) as TimeoutError
  error.code = 'TIMEOUT'
  return error
}

function isTimeoutError(error: unknown) {
  return (
    (error instanceof Error && (error as TimeoutError).code === 'TIMEOUT') ||
    (error instanceof DOMException && error.name === 'AbortError')
  )
}

async function withOperationTimeout<T>(operation: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(toTimeoutError(timeoutMessage)), timeoutMs)
  })

  try {
    return await Promise.race([operation, timeoutPromise]) as T
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

async function fetchJsonWithTimeout<T>(input: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(input, { ...init, signal: controller.signal })
    const data = (await response.json().catch(() => null)) as T | null
    return { response, data }
  } catch (error: unknown) {
    if (isTimeoutError(error)) {
      throw toTimeoutError('Request timed out')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

function getFileBaseName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '').slice(0, 80) || 'media'
}

async function maybeCompressGalleryImage(file: File) {
  const shouldSkip =
    !file.type.startsWith('image/') ||
    file.type === 'image/gif' ||
    file.size <= 4 * 1024 * 1024

  if (shouldSkip) {
    return {
      file,
      optimized: false,
    }
  }

  const objectUrl = URL.createObjectURL(file)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Unable to read selected image'))
      img.src = objectUrl
    })

    const maxDimension = 2560
    const largestSide = Math.max(image.naturalWidth, image.naturalHeight)
    const scale = largestSide > maxDimension ? maxDimension / largestSide : 1
    const targetWidth = Math.max(1, Math.round(image.naturalWidth * scale))
    const targetHeight = Math.max(1, Math.round(image.naturalHeight * scale))

    if (scale >= 0.999 && file.size <= 7 * 1024 * 1024) {
      return {
        file,
        optimized: false,
      }
    }

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight

    const context = canvas.getContext('2d')
    if (!context) {
      return {
        file,
        optimized: false,
      }
    }

    context.drawImage(image, 0, 0, targetWidth, targetHeight)

    const optimizedBlob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(resolve, 'image/webp', 0.86)
    })

    if (!optimizedBlob || optimizedBlob.size >= file.size * 0.93) {
      return {
        file,
        optimized: false,
      }
    }

    return {
      file: new File([optimizedBlob], `${getFileBaseName(file.name)}.webp`, {
        type: 'image/webp',
      }),
      optimized: true,
    }
  } catch {
    return {
      file,
      optimized: false,
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export default function ProfileEditorPage() {
  const router = useRouter()
  const mediaFileRef = useRef<HTMLInputElement>(null)
  const dpFileRef = useRef<HTMLInputElement>(null)

  type PhotoBusyState = {
    phase: 'preparing' | 'optimizing' | 'uploading' | 'saving'
    message: string
    progress: number
  } | null

  type MediaBusyState = {
    phase: 'preparing' | 'optimizing' | 'uploading' | 'saving'
    message: string
    progress: number
  } | null

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [mediaBusyState, setMediaBusyState] = useState<MediaBusyState>(null)
  const [formError, setFormError] = useState('')
  const [mediaError, setMediaError] = useState('')
  const [mediaSuccess, setMediaSuccess] = useState('')
  const [success, setSuccess] = useState(false)
  const [photoToast, setPhotoToast] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [photoBusyState, setPhotoBusyState] = useState<PhotoBusyState>(null)
  const [photoCropOpen, setPhotoCropOpen] = useState(false)
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null)
  const [profileId, setProfileId] = useState('')
  const [artistName, setArtistName] = useState('')
  const [publicPath, setPublicPath] = useState('')
  const [media, setMedia] = useState<{ id: string; media_url: string; type: string }[]>([])
  const [pendingMediaPreviewUrl, setPendingMediaPreviewUrl] = useState<string | null>(null)
  const [pendingMediaPreviewType, setPendingMediaPreviewType] = useState<'image' | 'video' | null>(null)
  const [categorySelection, setCategorySelection] = useState<{ categories: string[]; customCategories: string[] }>({
    categories: [],
    customCategories: [],
  })

  const [rating, setRating] = useState<number | null>(null)
  const mediaLimitReached = media.length >= MAX_ARTIST_MEDIA_ITEMS

  const getSupabase = () => createClient()

  useEffect(() => {
    return () => {
      if (pendingMediaPreviewUrl) {
        URL.revokeObjectURL(pendingMediaPreviewUrl)
      }
    }
  }, [pendingMediaPreviewUrl])

  const [form, setForm] = useState({
    stage_name: '',
    bio: '',
    pricing_start: '',
    locality: '',
    city: '',
    state: '',
    preferred_working_locations: '',
    performance_style: '',
    event_types: '',
    languages_spoken: '',
    profile_image: '',
    profile_image_cropped: '',
    profile_image_original: '',
    experience_years: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  function createUploadId() {
    return typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  }

  function getFileTypeError(file: File, kind: 'image' | 'media') {
    const fileLabel = file.name?.trim() || 'This file'

    if (kind === 'image' && !allowedImageMimeTypes.has(file.type)) {
      return `${fileLabel} is not a supported image format. Please upload JPG/JPEG, PNG, or WebP.`
    }

    if (kind === 'media' && !allowedGalleryImageMimeTypes.has(file.type) && !allowedVideoMimeTypes.has(file.type)) {
      return `${fileLabel} is not a supported media format. Please upload JPG/JPEG, PNG, WebP, GIF, MP4, WebM, or MOV.`
    }

    const maxSize = kind === 'image' ? MAX_PROFILE_IMAGE_SIZE_MB : MAX_MEDIA_SIZE_MB
    if (file.size > maxSize * 1024 * 1024) {
      return `${fileLabel} is too large. Maximum allowed size is ${maxSize}MB.`
    }

    return null
  }

  function getReadableUploadError(
    error: unknown,
    fileName?: string,
    context: 'media' | 'photo' = 'media'
  ) {
    const fallbackLabel = fileName?.trim() || 'This file'
    const message = error instanceof Error ? error.message : 'Failed to upload media'
    const normalized = message.toLowerCase()

    if (isTimeoutError(error) || normalized.includes('timed out')) {
      return 'Upload took too long. Please check your network and try again.'
    }

    if (normalized.includes('413') || normalized.includes('payload too large')) {
      const maxSize = context === 'photo' ? MAX_PROFILE_IMAGE_SIZE_MB : MAX_MEDIA_SIZE_MB
      return `${fallbackLabel} is too large for upload. Please keep files under ${maxSize}MB.`
    }

    if (normalized.includes('network') || normalized.includes('failed to fetch')) {
      return 'Network issue while uploading. Please check your internet connection and try again.'
    }

    if (normalized.includes('partial upload')) {
      return `${fallbackLabel} uploaded, but it could not be linked to your profile. Please retry once.`
    }

    return message
  }

  useEffect(() => {
    async function load() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/artist-login'); return }

      const [userRecordResult, profileResult] = await Promise.all([
        supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('artist_profiles')
          .select('id, slug, stage_name, bio, pricing_start, locality, city, state, preferred_working_locations, performance_style, event_types, languages_spoken, profile_image, profile_image_cropped, profile_image_original, experience_years, rating, categories, custom_categories, primary_category:categories(name), artist_media(id, media_url, type), users(full_name)')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]) as [
        { data: { role?: string | null } | null },
        { data: PublicArtistRecord | null }
      ]

      const userRecord = userRecordResult.data

      const profile = profileResult.data

      if (userRecord?.role !== 'artist' && !profile) {
        router.push('/artist-login?reason=not-artist')
        return
      }

      if (profile) {
        setProfileId(profile.id)
        setArtistName(getArtistDisplayName(profile))
        setPublicPath(getArtistPublicPath(profile))
        setRating(profile.rating != null ? Number(profile.rating) : null)
        setForm({
          stage_name: profile.stage_name ?? '',
          bio: profile.bio ?? '',
          pricing_start: profile.pricing_start?.toString() ?? '',
          locality: profile.locality ?? '',
          city: profile.city ?? '',
          state: profile.state ?? '',
          preferred_working_locations: profile.preferred_working_locations ?? '',
          performance_style: profile.performance_style ?? '',
          event_types: profile.event_types ?? '',
          languages_spoken: profile.languages_spoken ?? '',
          profile_image: profile.profile_image_cropped ?? profile.profile_image ?? '',
          profile_image_cropped: profile.profile_image_cropped ?? profile.profile_image ?? '',
          profile_image_original: profile.profile_image_original ?? '',
          experience_years: profile.experience_years?.toString() ?? '',
        })
        const profileCategories = getArtistCategories(profile)
        setCategorySelection({
          categories: profileCategories.predefined,
          customCategories: profileCategories.custom,
        })
        setMedia(profile.artist_media ?? [])
      } else {
        router.push('/artist-signup?reason=missing-profile')
        return
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      const { response, data: payload } = await fetchJsonWithTimeout<{ error?: string; publicPath?: string }>(
        '/api/artist-profile',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...form,
            categories: categorySelection.categories,
            custom_categories: categorySelection.customCategories,
            profile_image: form.profile_image,
            profile_image_cropped: form.profile_image_cropped,
            profile_image_original: form.profile_image_original,
          }),
        },
        SAVE_REQUEST_TIMEOUT_MS
      )

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to save profile')
      }

      if (payload?.publicPath) setPublicPath(payload.publicPath)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      if (isTimeoutError(err)) {
        setFormError('Save is taking too long. Please check your connection and try again.')
      } else {
        setFormError(err instanceof Error ? err.message : 'Failed to save profile')
      }
    } finally {
      setSaving(false)
    }
  }

  function handleDpSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const validationError = getFileTypeError(file, 'image')
    if (validationError) {
      setPhotoError(validationError)
      if (dpFileRef.current) dpFileRef.current.value = ''
      return
    }
    setFormError('')
    setPhotoError('')
    setPendingPhotoFile(file)
    setPhotoCropOpen(true)
    if (dpFileRef.current) dpFileRef.current.value = ''
  }

  async function handleCropConfirm(geometry: ImageCropGeometry) {
    if (!pendingPhotoFile) {
      setPhotoError('No profile photo was selected.')
      return
    }

    const previousProfileImage = form.profile_image
    const previousCroppedImage = form.profile_image_cropped
    const previousOriginalImage = form.profile_image_original
    const timestamp = Date.now()

    try {
      setPhotoError('')
      setPhotoBusyState({ phase: 'preparing', message: 'Preparing photo...', progress: 16 })
      await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()))
      setPhotoBusyState({ phase: 'optimizing', message: 'Optimizing image...', progress: 28 })
      const { blob: croppedBlob } = await createCroppedImageBlob(pendingPhotoFile, geometry)
      const supabase = getSupabase()
      const croppedFile = new File([croppedBlob], `${timestamp}-${createUploadId()}.jpg`, { type: 'image/jpeg' })

      setPhotoBusyState({ phase: 'uploading', message: 'Uploading profile photo...', progress: 72 })
      const { response: signResponse, data: signPayload } = await fetchJsonWithTimeout<{
        ok?: boolean
        error?: string
        existingOriginalUrl?: string
        cropped?: { path: string; token: string; publicUrl: string }
        original?: { path: string; token: string; publicUrl: string }
      }>(
        '/api/artist-profile/photo/sign',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            croppedFileName: croppedFile.name,
            croppedFileType: croppedFile.type,
            croppedFileSize: croppedFile.size,
            originalFileName: pendingPhotoFile.name,
            originalFileType: pendingPhotoFile.type,
            originalFileSize: pendingPhotoFile.size,
          }),
        },
        SIGN_REQUEST_TIMEOUT_MS
      )

      if (!signResponse.ok) {
        throw new Error(signPayload?.error ?? 'Failed to prepare profile photo upload')
      }
      if (!signPayload?.cropped) {
        throw new Error('Failed to prepare profile photo upload')
      }

      const croppedUpload = await withOperationTimeout(
        supabase.storage
          .from('artist-media')
          .uploadToSignedUrl(signPayload.cropped.path, signPayload.cropped.token, croppedFile, {
            contentType: croppedFile.type,
          }),
        STORAGE_UPLOAD_TIMEOUT_MS,
        'Profile photo upload timed out'
      )

      if (croppedUpload.error) {
        throw croppedUpload.error
      }

      let originalPublicUrl = signPayload?.existingOriginalUrl ?? previousOriginalImage
      if (signPayload?.original) {
        const originalUpload = await withOperationTimeout(
          supabase.storage
            .from('artist-media')
            .uploadToSignedUrl(signPayload.original.path, signPayload.original.token, pendingPhotoFile, {
              contentType: pendingPhotoFile.type,
            }),
          STORAGE_UPLOAD_TIMEOUT_MS,
          'Original photo upload timed out'
        )

        if (originalUpload.error) {
          throw originalUpload.error
        }

        originalPublicUrl = signPayload.original.publicUrl
      }

      setPhotoBusyState({ phase: 'saving', message: 'Saving changes...', progress: 92 })
      const croppedPublicUrl = signPayload.cropped.publicUrl
      const { response, data: payload } = await fetchJsonWithTimeout<{ error?: string; publicPath?: string }>(
        '/api/artist-profile',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profile_image: croppedPublicUrl,
            profile_image_cropped: croppedPublicUrl,
            profile_image_original: originalPublicUrl,
            categories: categorySelection.categories,
            custom_categories: categorySelection.customCategories,
          }),
        },
        SAVE_REQUEST_TIMEOUT_MS
      )

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to save profile photo')
      }

      setForm(current => ({
        ...current,
        profile_image: croppedPublicUrl,
        profile_image_cropped: croppedPublicUrl,
        profile_image_original: originalPublicUrl ?? previousOriginalImage,
      }))
      setPhotoCropOpen(false)
      setPendingPhotoFile(null)
      setPhotoBusyState(null)
      setPhotoError('')
      setPhotoToast('Profile photo updated successfully')
      window.setTimeout(() => setPhotoToast(''), 3000)
      router.refresh()
    } catch (err: unknown) {
      setForm(current => ({
        ...current,
        profile_image: previousProfileImage,
        profile_image_cropped: previousCroppedImage,
        profile_image_original: previousOriginalImage,
      }))
      setPhotoBusyState(null)
      setPhotoError(getReadableUploadError(err, pendingPhotoFile.name, 'photo'))
      throw err
    }
  }

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    let previewUrlForCleanup: string | null = null
    setMediaBusyState(null)
    setMediaSuccess('')
    setMediaError('')
    setPendingMediaPreviewType(null)
    const validationError = getFileTypeError(file, 'media')
    if (validationError) {
      setMediaError(validationError)
      if (mediaFileRef.current) mediaFileRef.current.value = ''
      return
    }
    const limitError = getArtistMediaLimitError(media.length, 1)
    if (limitError) {
      setMediaError(limitError)
      if (mediaFileRef.current) mediaFileRef.current.value = ''
      return
    }
    setUploadingMedia(true)
    setMediaBusyState({
      phase: 'preparing',
      message: `Preparing ${file.name || 'media file'}...`,
      progress: 12,
    })
    try {
      const supabase = getSupabase()
      let uploadFile = file

      if (file.type.startsWith('image/') && file.type !== 'image/gif') {
        setMediaBusyState({
          phase: 'optimizing',
          message: 'Optimizing image for faster upload...',
          progress: 22,
        })

        const optimized = await maybeCompressGalleryImage(file)
        uploadFile = optimized.file
        if (optimized.optimized) {
          setMediaBusyState({
            phase: 'optimizing',
            message: 'Image optimized. Preparing secure upload...',
            progress: 30,
          })
        }
      }

      if (pendingMediaPreviewUrl) {
        URL.revokeObjectURL(pendingMediaPreviewUrl)
      }
      previewUrlForCleanup = URL.createObjectURL(uploadFile)
      setPendingMediaPreviewUrl(previewUrlForCleanup)
      setPendingMediaPreviewType(uploadFile.type.startsWith('video') ? 'video' : 'image')

      setMediaBusyState({
        phase: 'uploading',
        message: 'Generating secure upload link...',
        progress: 36,
      })
      const { response: signResponse, data: signPayload } = await fetchJsonWithTimeout<{
        ok?: boolean
        error?: string
        path: string
        token: string
        publicUrl: string
        type: 'image' | 'video'
      }>(
        '/api/artist-profile/media/sign',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: uploadFile.name,
            fileType: uploadFile.type,
            fileSize: uploadFile.size,
          }),
        },
        SIGN_REQUEST_TIMEOUT_MS
      )

      if (!signResponse.ok) {
        throw new Error(signPayload?.error ?? 'Failed to prepare media upload')
      }
      if (!signPayload) {
        throw new Error('Failed to prepare media upload')
      }

      setMediaBusyState({
        phase: 'uploading',
        message: 'Uploading media file...',
        progress: 70,
      })
      const uploadResult = await withOperationTimeout(
        supabase.storage
          .from('artist-media')
          .uploadToSignedUrl(signPayload.path, signPayload.token, uploadFile, {
            contentType: uploadFile.type,
          }),
        STORAGE_UPLOAD_TIMEOUT_MS,
        'Upload timed out'
      )

      if (uploadResult.error) {
        throw uploadResult.error
      }

      setMediaBusyState({
        phase: 'saving',
        message: 'Saving media to your profile...',
        progress: 90,
      })
      const { response, data: payload } = await fetchJsonWithTimeout<{
        ok?: boolean
        error?: string
        media?: { id: string; media_url: string; type: string }
      }>(
        '/api/artist-profile/media',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            media_url: signPayload.publicUrl,
            type: signPayload.type,
          }),
        },
        SAVE_REQUEST_TIMEOUT_MS
      )

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Partial upload: media reached storage but profile save failed')
      }

      const savedMedia = payload?.media
      if (savedMedia?.id && savedMedia.media_url && savedMedia.type) {
        setMedia(current => [...current, savedMedia])
      }
      setMediaSuccess('Media uploaded successfully')
      window.setTimeout(() => setMediaSuccess(''), 2600)
      setMediaBusyState({
        phase: 'saving',
        message: 'Upload complete',
        progress: 100,
      })
    } catch (err: unknown) {
      setMediaError(getReadableUploadError(err, file.name))
    } finally {
      if (previewUrlForCleanup) {
        URL.revokeObjectURL(previewUrlForCleanup)
      }
      setPendingMediaPreviewUrl(null)
      setPendingMediaPreviewType(null)
      window.setTimeout(() => setMediaBusyState(null), 500)
      setUploadingMedia(false)
      if (mediaFileRef.current) mediaFileRef.current.value = ''
    }
  }

  async function deleteMedia(id: string) {
    try {
      setMediaError('')
      setMediaSuccess('')
      const response = await fetch(`/api/artist-profile/media/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? 'Failed to delete media')
      }

      setMedia(m => m.filter(x => x.id !== id))
    } catch (err: unknown) {
      setMediaError(err instanceof Error ? err.message : 'Failed to delete media')
    }
  }

  const avatarInitials = getArtistInitials({
    id: profileId || 'artist',
    stage_name: form.stage_name,
    users: { full_name: artistName },
  } as PublicArtistRecord)
  const previewDisplayName = form.stage_name.trim() || artistName || 'ShowStellar Artist'
  const previewLocation = getArtistLocation({
    locality: form.locality,
    city: form.city,
    state: form.state,
  } as PublicArtistRecord)

  if (loading) return <ProfileEditorSkeleton />

  return (
    <ArtistDashboardShell artistName={artistName}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>Edit Profile</h1>
          <p style={{ color: 'var(--muted)' }}>Update your artist profile information</p>
        </div>

        <div className="bg-white border rounded-2xl p-6 mb-6" style={{ border: '1px solid var(--border)' }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-xl font-semibold"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', boxShadow: '0 10px 24px rgba(0,23,57,0.08)' }}
              >
                {form.profile_image ? (
                  <Image src={form.profile_image} alt="Profile" width={80} height={80} className="h-full w-full object-cover" />
                ) : (
                  avatarInitials
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--muted)' }}>Public profile</p>
                <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>{previewDisplayName}</h2>
                {previewLocation && (
                  <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{previewLocation}</p>
                )}
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                  {publicPath || 'Your public URL will appear after save'}
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                  {getArtistCategories({
                    ...form,
                    categories: categorySelection.categories,
                    custom_categories: categorySelection.customCategories,
                  } as unknown as PublicArtistRecord).summary || 'No categories selected yet'}
                </p>
              </div>
            </div>
            <div className="text-sm rounded-xl px-4 py-3" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
              Public URL slug is generated automatically from your name and kept stable.
            </div>
          </div>
        </div>

        {formError && (
          <div className="p-4 rounded-xl text-sm text-red-600 mb-6" style={{ background: 'var(--surface-2)', border: '1px solid rgba(193,117,245,0.18)' }}>
            {formError}
          </div>
        )}
        {success && (
          <div className="p-4 rounded-xl text-sm text-green-600 mb-6" style={{ background: 'var(--surface-2)', border: '1px solid rgba(193,117,245,0.18)' }}>
            Profile saved successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile Picture */}
          <div className="bg-white border rounded-2xl p-6" style={{ border: '1px solid var(--border)' }}>
            <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--foreground)' }}>Profile Picture</h2>
            <div className="flex items-center gap-6">
              <div
                className="w-24 h-24 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-3xl"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', boxShadow: '0 10px 24px rgba(0,23,57,0.08)' }}
              >
                {form.profile_image ? (
                  <Image src={form.profile_image} alt="Profile" width={96} height={96} className="h-full w-full object-cover" />
                ) : (
                  avatarInitials
                )}
              </div>
              <div>
                <input
                  ref={dpFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleDpSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => dpFileRef.current?.click()}
                  disabled={saving || Boolean(photoBusyState)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:opacity-80 disabled:opacity-50"
                  style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
                >
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </button>
                <p className="text-xs mt-2 leading-6" style={{ color: 'var(--muted)' }}>
                  JPG/JPEG, PNG, or WebP up to {MAX_PROFILE_IMAGE_SIZE_MB}MB. A 4:5 crop will be prepared before upload.
                </p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-white border rounded-2xl p-6" style={{ border: '1px solid var(--border)' }}>
            <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--foreground)' }}>Basic Information</h2>
            <div className="space-y-4">
              <Field label="Stage Name">
                <Input value={form.stage_name} onChange={v => set('stage_name', v)} placeholder="Public artist name" />
              </Field>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Locality">
                  <Input value={form.locality} onChange={v => set('locality', v)} placeholder="e.g. Kurla West" />
                </Field>
              </div>
              <Field label="Categories">
                <CategorySelector
                  options={CATEGORY_OPTIONS}
                  value={categorySelection}
                  onChange={setCategorySelection}
                />
              </Field>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="City">
                  <Input value={form.city} onChange={v => set('city', v)} placeholder="e.g. Mumbai" />
                </Field>
                <Field label="State">
                  <Input value={form.state} onChange={v => set('state', v)} placeholder="e.g. Maharashtra" />
                </Field>
              </div>
              <Field label="Preferred Working Locations">
                <textarea
                  value={form.preferred_working_locations}
                  onChange={e => set('preferred_working_locations', e.target.value)}
                  placeholder="e.g. Mumbai, Navi Mumbai, Thane"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-[var(--accent-violet)] bg-white"
                  style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
                />
                <p className="text-xs leading-6" style={{ color: 'var(--muted)' }}>
                  Add the cities or areas where you prefer to work. Separate with commas or new lines.
                </p>
              </Field>
            </div>
          </div>

          {/* Public Profile Details */}
          <div className="bg-white border rounded-2xl p-6" style={{ border: '1px solid var(--border)' }}>
            <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--foreground)' }}>Public Profile Details</h2>
            <div className="grid gap-4">
              <Field label="Performance Style / Expertise">
                <Input
                  value={form.performance_style}
                  onChange={v => set('performance_style', v)}
                  placeholder="e.g. Bollywood sets, live acoustic, corporate stage shows"
                />
              </Field>
              <Field label="Event Types Covered">
                <textarea
                  value={form.event_types}
                  onChange={e => set('event_types', e.target.value)}
                  placeholder="Wedding receptions, corporate events, private parties"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-[var(--accent-violet)] bg-white"
                  style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
                />
              </Field>
              <Field label="Languages Spoken">
                <Input
                  value={form.languages_spoken}
                  onChange={v => set('languages_spoken', v)}
                  placeholder="e.g. Hindi, English, Marathi"
                />
              </Field>
              <Field label="Years of Experience">
                <Input
                  type="number"
                  value={form.experience_years}
                  onChange={v => set('experience_years', v)}
                  placeholder="e.g. 5"
                  min={0}
                  max={80}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  How many years you have been performing professionally
                </p>
              </Field>
              {rating !== null && (
                <div className="rounded-xl px-4 py-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Rating (set by admin)</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>★ {rating.toFixed(1)} / 5.0</p>
                </div>
              )}
              <Field label="Bio">
                <textarea
                  value={form.bio}
                  onChange={e => set('bio', e.target.value)}
                  placeholder="Tell clients about your experience and expertise..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-[var(--accent-violet)] bg-white"
                  style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
                />
              </Field>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white border rounded-2xl p-6" style={{ border: '1px solid var(--border)' }}>
            <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--foreground)' }}>Pricing</h2>
            <Field label="Starting Price (₹)">
              <Input type="number" value={form.pricing_start} onChange={v => set('pricing_start', v)} placeholder="e.g. 15000" />
            </Field>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--navy)' }}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Media Gallery */}
        <div className="bg-white border rounded-2xl p-6 mt-6" style={{ border: '1px solid var(--border)' }}>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Media & Gallery</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Photos and videos shown on your public profile</p>

          {media.length > 0 ? (
            <div className="grid md:grid-cols-[2fr_1fr] gap-4 mb-6">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] group">
                {media[0].type === 'video'
                  ? <video src={media[0].media_url} className="w-full h-full object-cover" controls />
                  : (
                    <a
                      href={media[0].media_url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Open gallery image in a new tab"
                      className="relative block h-full w-full"
                    >
                      <Image src={media[0].media_url} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                    </a>
                  )
                }
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,23,57,0.20)] to-transparent pointer-events-none" />
                <button
                  type="button"
                  onClick={() => void deleteMedia(media[0].id)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'var(--foreground)' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {media.slice(1, 5).map(m => (
                  <div key={m.id} className="relative rounded-xl overflow-hidden aspect-square group">
                    {m.type === 'video'
                      ? <video src={m.media_url} className="w-full h-full object-cover" />
                      : (
                        <a
                          href={m.media_url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Open gallery image in a new tab"
                          className="relative block h-full w-full"
                        >
                          <Image src={m.media_url} alt="" fill className="object-cover" sizes="96px" />
                        </a>
                      )
                    }
                    <button
                      type="button"
                      onClick={() => void deleteMedia(m.id)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'var(--foreground)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="rounded-2xl p-8 mb-6 text-center"
              style={{ background: 'var(--surface-2)', border: '1px dashed var(--border)', color: 'var(--muted)' }}
            >
              Artist media will be added soon
            </div>
          )}

          {uploadingMedia && pendingMediaPreviewUrl && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="relative rounded-xl overflow-hidden aspect-square border" style={{ borderColor: 'var(--border)' }}>
                {pendingMediaPreviewType === 'video' ? (
                  <video src={pendingMediaPreviewUrl} className="h-full w-full object-cover" muted />
                ) : (
                  <Image
                    src={pendingMediaPreviewUrl}
                    alt="Uploading media preview"
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                )}
                <div className="absolute inset-0 bg-[rgba(0,23,57,0.5)] flex items-center justify-center">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[var(--foreground)]">
                    Uploading...
                  </span>
                </div>
              </div>
            </div>
          )}

          {media.length > 5 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {media.slice(5).map(m => (
                <div key={m.id} className="relative rounded-xl overflow-hidden aspect-square group">
                  {m.type === 'video'
                    ? <video src={m.media_url} className="w-full h-full object-cover" />
                    : (
                      <a
                        href={m.media_url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Open gallery image in a new tab"
                        className="relative block h-full w-full"
                      >
                        <Image src={m.media_url} alt="" fill className="object-cover" sizes="64px" />
                      </a>
                    )
                  }
                  <button
                    type="button"
                    onClick={() => void deleteMedia(m.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'var(--foreground)' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={mediaFileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
            onChange={handleMediaUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => mediaFileRef.current?.click()}
            disabled={uploadingMedia || mediaLimitReached}
            aria-busy={uploadingMedia}
            className="w-full py-8 rounded-xl text-sm font-medium border-2 border-dashed transition-colors disabled:opacity-50 flex flex-col items-center gap-2"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            <Upload className="w-6 h-6" />
            {uploadingMedia ? 'Uploading…' : mediaLimitReached ? 'Media limit reached' : 'Upload Photos / Videos'}
          </button>
          {mediaBusyState && (
            <div className="mt-3 rounded-xl border px-3 py-3 text-xs" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--muted)' }}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span>{mediaBusyState.message}</span>
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>{mediaBusyState.progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full" style={{ background: 'rgba(0,23,57,0.12)' }}>
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${mediaBusyState.progress}%`,
                    background: 'linear-gradient(90deg, #001739, #16386c)',
                  }}
                />
              </div>
            </div>
          )}

          {mediaError && (
            <div className="mb-4 rounded-xl border px-3 py-3 text-sm text-red-600" style={{ borderColor: 'rgba(193,117,245,0.22)', background: 'var(--surface-2)' }}>
              {mediaError}
            </div>
          )}
          {mediaSuccess && (
            <div className="mb-4 rounded-xl border px-3 py-3 text-sm text-green-700" style={{ borderColor: 'rgba(0,23,57,0.16)', background: 'var(--surface-2)' }}>
              {mediaSuccess}
            </div>
          )}
          <p className="mt-3 text-xs leading-6" style={{ color: 'var(--muted)' }}>
            Gallery uploads support JPG/JPEG, PNG, WebP, GIF, MP4, WebM, and MOV files up to {MAX_MEDIA_SIZE_MB}MB. Up to {MAX_ARTIST_MEDIA_ITEMS} media items total.
          </p>
        </div>

        {(photoCropOpen || Boolean(pendingPhotoFile)) ? (
          <ProfilePhotoCropModal
            open={photoCropOpen}
            file={pendingPhotoFile}
            busyState={photoBusyState}
            error={photoError || null}
            onCancel={() => {
              setPhotoCropOpen(false)
              setPendingPhotoFile(null)
              setPhotoBusyState(null)
              setPhotoError('')
              if (dpFileRef.current) dpFileRef.current.value = ''
            }}
            onConfirm={handleCropConfirm}
          />
        ) : null}

        {photoToast ? (
          <div className="pointer-events-none fixed bottom-5 right-5 z-50 max-w-sm">
            <div
              className="rounded-2xl border px-4 py-3 text-sm font-medium text-white shadow-[0_18px_60px_rgba(0,23,57,0.28)]"
              style={{
                borderColor: 'rgba(255,255,255,0.16)',
                background: 'linear-gradient(135deg, #001739 0%, #16386c 100%)',
              }}
            >
              {photoToast}
            </div>
          </div>
        ) : null}
      </div>
    </ArtistDashboardShell>
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

function Input({ type = 'text', value, onChange, placeholder, min, max }: {
  type?: string; value: string; onChange: (v: string) => void; placeholder?: string; min?: number; max?: number
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent-violet)] bg-white"
      style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
    />
  )
}
