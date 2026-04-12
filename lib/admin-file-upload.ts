export const ADMIN_PROFILE_IMAGE_MAX_SIZE_MB = 5
export const ADMIN_MEDIA_MAX_SIZE_MB = 50
export const MAX_ARTIST_MEDIA_ITEMS = 12
export const MAX_MEDIA_FILES_PER_BATCH = 6

export const ADMIN_ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
export const ADMIN_ALLOWED_MEDIA_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

type FileLike = {
  name: string
  type: string
  size: number
}

export function getSafeFileExtension(file: FileLike) {
  const rawExt = file.name.split('.').pop()?.trim().toLowerCase()
  if (rawExt && rawExt.length <= 5) return rawExt

  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'video/mp4') return 'mp4'
  if (file.type === 'video/webm') return 'webm'
  if (file.type === 'video/quicktime') return 'mov'

  return 'bin'
}

export function createSafeUploadId() {
  return typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function buildAdminStoragePath(prefix: string, artistId: string, file: FileLike, options?: { extension?: string }) {
  const ext = options?.extension ?? getSafeFileExtension(file)
  return `${prefix}/${artistId}/${Date.now()}-${createSafeUploadId()}.${ext}`
}

export function getAdminFileTypeError(file: FileLike, kind: 'image' | 'media') {
  if (kind === 'image' && !ADMIN_ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    return 'Please upload a JPG, PNG, or WebP image.'
  }

  if (kind === 'media' && !ADMIN_ALLOWED_MEDIA_MIME_TYPES.has(file.type)) {
    return 'Please upload a JPG, PNG, WebP, MP4, WebM, or MOV file.'
  }

  const maxSize = kind === 'image' ? ADMIN_PROFILE_IMAGE_MAX_SIZE_MB : ADMIN_MEDIA_MAX_SIZE_MB
  if (file.size > maxSize * 1024 * 1024) {
    return `File must be ${maxSize}MB or smaller.`
  }

  return null
}

export function getArtistMediaLimitError(existingCount: number, incomingCount: number) {
  if (incomingCount <= 0) return null

  if (incomingCount > MAX_MEDIA_FILES_PER_BATCH) {
    return `Upload up to ${MAX_MEDIA_FILES_PER_BATCH} files at once.`
  }

  if (existingCount >= MAX_ARTIST_MEDIA_ITEMS) {
    return `This artist profile already has the maximum of ${MAX_ARTIST_MEDIA_ITEMS} media items.`
  }

  if (existingCount + incomingCount > MAX_ARTIST_MEDIA_ITEMS) {
    return `You can upload up to ${MAX_ARTIST_MEDIA_ITEMS} media items in total.`
  }

  return null
}
