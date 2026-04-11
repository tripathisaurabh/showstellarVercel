'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { LoaderCircle, Minus, Move, Plus, Sparkles, X } from 'lucide-react'
import { type ImageCropGeometry } from '@/lib/image-crop'

type BusyState = {
  phase: 'preparing' | 'optimizing' | 'uploading' | 'saving'
  message: string
  progress: number
} | null

type Props = {
  open: boolean
  file: File | null
  busyState?: BusyState
  error?: string | null
  onCancel: () => void
  onConfirm: (geometry: ImageCropGeometry) => Promise<void> | void
}

const MIN_PROFILE_IMAGE_WIDTH = 600
const MIN_PROFILE_IMAGE_HEIGHT = 750
const ZOOM_MIN = 1
const ZOOM_MAX = 2.5

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export default function ProfilePhotoCropModal({ open, file, busyState, error, onCancel, onConfirm }: Props) {
  const frameRef = useRef<HTMLDivElement>(null)
  const dragStateRef = useRef<{
    pointerId: number
    startPoint: { x: number; y: number }
    startOffset: { x: number; y: number }
  } | null>(null)

  const [previewUrl, setPreviewUrl] = useState('')
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null)
  const [frameSize, setFrameSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [localError, setLocalError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !file) {
      setPreviewUrl('')
      setNaturalSize(null)
      setFrameSize({ width: 0, height: 0 })
      setOffset({ x: 0, y: 0 })
      setZoom(1)
      setLocalError('')
      setIsSubmitting(false)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setNaturalSize(null)
    setOffset({ x: 0, y: 0 })
    setZoom(1)
    setLocalError('')
    setIsSubmitting(false)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file, open])

  useEffect(() => {
    if (!open) return

    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open || !frameRef.current) return

    const element = frameRef.current
    const sync = () => {
      const rect = element.getBoundingClientRect()
      setFrameSize({
        width: rect.width,
        height: rect.height,
      })
    }

    sync()

    const observer = new ResizeObserver(() => sync())
    observer.observe(element)

    return () => observer.disconnect()
  }, [open, previewUrl])

  const baseScale = useMemo(() => {
    if (!naturalSize || !frameSize.width || !frameSize.height) return 0
    return Math.max(frameSize.width / naturalSize.width, frameSize.height / naturalSize.height)
  }, [frameSize.height, frameSize.width, naturalSize])

  const displayWidth = useMemo(() => {
    if (!naturalSize || !baseScale) return 0
    return naturalSize.width * baseScale * zoom
  }, [baseScale, naturalSize, zoom])

  const displayHeight = useMemo(() => {
    if (!naturalSize || !baseScale) return 0
    return naturalSize.height * baseScale * zoom
  }, [baseScale, naturalSize, zoom])

  const maxOffset = useMemo(() => {
    if (!frameSize.width || !frameSize.height || !displayWidth || !displayHeight) {
      return { x: 0, y: 0 }
    }

    return {
      x: Math.max((displayWidth - frameSize.width) / 2, 0),
      y: Math.max((displayHeight - frameSize.height) / 2, 0),
    }
  }, [displayHeight, displayWidth, frameSize.height, frameSize.width])

  useEffect(() => {
    setOffset(current => ({
      x: clamp(current.x, -maxOffset.x, maxOffset.x),
      y: clamp(current.y, -maxOffset.y, maxOffset.y),
    }))
  }, [maxOffset.x, maxOffset.y])

  const minDimensionsError = useMemo(() => {
    if (!naturalSize) return ''
    if (naturalSize.width < MIN_PROFILE_IMAGE_WIDTH || naturalSize.height < MIN_PROFILE_IMAGE_HEIGHT) {
      return `Please use an image at least ${MIN_PROFILE_IMAGE_WIDTH}×${MIN_PROFILE_IMAGE_HEIGHT}px for a crisp profile photo.`
    }
    return ''
  }, [naturalSize])

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragStateRef.current
      if (!drag || !frameRef.current) return
      event.preventDefault()

      const dx = event.clientX - drag.startPoint.x
      const dy = event.clientY - drag.startPoint.y

      setOffset({
        x: clamp(drag.startOffset.x + dx, -maxOffset.x, maxOffset.x),
        y: clamp(drag.startOffset.y + dy, -maxOffset.y, maxOffset.y),
      })
    }

    const handlePointerUp = () => {
      dragStateRef.current = null
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: false })
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [maxOffset.x, maxOffset.y])

  async function handleSubmit() {
    if (!file) return
    if (busyState || isSubmitting) return

    if (!naturalSize || !frameSize.width || !frameSize.height) {
      setLocalError('The photo is still loading. Please try again in a moment.')
      return
    }

    if (minDimensionsError) {
      setLocalError(minDimensionsError)
      return
    }

    setLocalError('')
    setIsSubmitting(true)

    try {
      await onConfirm({
        frameWidth: frameSize.width,
        frameHeight: frameSize.height,
        naturalWidth: naturalSize.width,
        naturalHeight: naturalSize.height,
        offsetX: offset.x,
        offsetY: offset.y,
        zoom,
      } satisfies ImageCropGeometry)
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Unable to process the selected photo')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open || !file || !previewUrl) return null

  const busy = Boolean(busyState)
  const actionDisabled = busy || isSubmitting

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-[rgba(0,23,57,0.52)] px-4 py-4 backdrop-blur-[6px] sm:px-6 sm:py-6 lg:items-start lg:px-8 lg:py-8 lg:pt-24"
      onClick={e => {
        if (!busy && e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-photo-crop-title"
        className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_28px_90px_rgba(0,23,57,0.28)]"
        style={{ maxHeight: 'calc(100svh - 2rem)' }}
      >
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6 sm:py-6" style={{ borderColor: 'var(--border)' }}>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
              Profile photo crop
            </p>
            <h2 id="profile-photo-crop-title" className="mt-2 text-[1.75rem] font-semibold tracking-tight sm:text-3xl" style={{ color: 'var(--foreground)' }}>
              Adjust your profile photo
            </h2>
            <p className="mt-2 hidden max-w-2xl text-sm leading-6 sm:block sm:text-[15px]" style={{ color: 'var(--muted)' }}>
              Use a clear solo portrait with your face visible. Avoid group photos, blurry images, or screenshots.
            </p>
          </div>
          <button
            type="button"
            onClick={() => !busy && onCancel()}
            disabled={busy}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <div className="rounded-[28px] border bg-[linear-gradient(180deg,#ffffff_0%,#f6f8fc_100%)] p-3 shadow-[0_16px_42px_rgba(0,23,57,0.08)] sm:p-4" style={{ borderColor: 'var(--border)' }}>
                <div
                  ref={frameRef}
                  className="relative aspect-[4/5] w-full overflow-hidden rounded-[22px] bg-[linear-gradient(180deg,#ffffff_0%,#eef2f7_100%)] touch-none select-none"
                  onPointerDown={event => {
                    if (actionDisabled) return
                    if (!naturalSize) return
                    dragStateRef.current = {
                      pointerId: event.pointerId,
                      startPoint: { x: event.clientX, y: event.clientY },
                      startOffset: { x: offset.x, y: offset.y },
                    }
                    ;(event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId)
                  }}
                  onPointerUp={() => {
                    dragStateRef.current = null
                  }}
                  onPointerCancel={() => {
                    dragStateRef.current = null
                  }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,23,57,0.08),transparent_48%)]" />
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="Crop preview"
                      draggable={false}
                      className="absolute left-1/2 top-1/2 max-w-none max-h-none select-none object-cover object-top"
                      style={{
                        width: `${displayWidth}px`,
                        height: `${displayHeight}px`,
                        transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                        cursor: actionDisabled ? 'default' : 'grab',
                      }}
                      onLoad={event => {
                        const target = event.currentTarget
                        setNaturalSize({
                          width: target.naturalWidth,
                          height: target.naturalHeight,
                        })
                      }}
                    />
                  ) : null}

                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-y-0 left-1/3 w-px bg-white/55" />
                    <div className="absolute inset-y-0 left-2/3 w-px bg-white/55" />
                    <div className="absolute inset-x-0 top-1/4 h-px bg-white/55" />
                    <div className="absolute inset-x-0 top-2/4 h-px bg-white/55" />
                    <div className="absolute inset-x-0 top-3/4 h-px bg-white/55" />
                    <div className="absolute inset-3 rounded-[18px] border border-white/60" />
                  </div>

                  <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-[rgba(0,23,57,0.72)] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(0,23,57,0.14)] backdrop-blur">
                      <Move className="h-3.5 w-3.5" />
                      Drag to reposition
                    </div>
                    <div className="rounded-full border border-white/20 bg-[rgba(255,255,255,0.88)] px-3 py-1.5 text-xs font-semibold tracking-[0.18em] text-[var(--foreground)] shadow-[0_10px_24px_rgba(0,23,57,0.08)]">
                      4:5 Portrait
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden gap-3 sm:grid sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 shadow-[0_12px_28px_rgba(0,23,57,0.05)]" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--surface-2)', color: 'var(--navy)' }}>
                    <Move className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Drag to adjust</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Center the face and upper body</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 shadow-[0_12px_28px_rgba(0,23,57,0.05)]" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--surface-2)', color: 'var(--navy)' }}>
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Web optimized</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Prepared for profile cards and public pages</p>
                  </div>
                </div>
              </div>

              <div className="hidden rounded-2xl border bg-white px-4 py-4 shadow-[0_12px_28px_rgba(0,23,57,0.05)] sm:block" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setZoom(current => clamp(Number((current - 0.1).toFixed(2)), ZOOM_MIN, ZOOM_MAX))}
                      disabled={actionDisabled}
                      className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ background: 'var(--surface-2)', color: 'var(--foreground)' }}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="min-w-[72px] text-center text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                      Zoom
                    </div>
                    <button
                      type="button"
                      onClick={() => setZoom(current => clamp(Number((current + 0.1).toFixed(2)), ZOOM_MIN, ZOOM_MAX))}
                      disabled={actionDisabled}
                      className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ background: 'var(--surface-2)', color: 'var(--foreground)' }}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
                    Fit
                  </span>
                  <input
                    type="range"
                    min={ZOOM_MIN}
                    max={ZOOM_MAX}
                    step="0.01"
                    value={zoom}
                    disabled={actionDisabled}
                    onChange={e => setZoom(clamp(Number(e.target.value), ZOOM_MIN, ZOOM_MAX))}
                    className="h-1.5 w-full cursor-pointer rounded-full accent-[var(--navy)]"
                  />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
                    Fill
                  </span>
                </div>
              </div>

              {naturalSize ? (
                <p className="hidden text-xs leading-6 sm:block" style={{ color: 'var(--muted)' }}>
                  Current image size: {naturalSize.width}×{naturalSize.height}px. The exported photo will be optimized as a web-ready JPG.
                </p>
              ) : null}

              {(localError || error || minDimensionsError) ? (
                <div className="rounded-2xl border px-4 py-4 text-sm text-red-700 shadow-[0_12px_28px_rgba(193,117,245,0.07)] lg:hidden" style={{ borderColor: 'rgba(193,117,245,0.22)', background: 'rgba(255,255,255,0.96)' }}>
                  {localError || error || minDimensionsError}
                </div>
              ) : null}
            </div>

            <div className="hidden space-y-4 lg:block">
              <div className="rounded-[26px] border bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fc_100%)] p-5 shadow-[0_14px_40px_rgba(0,23,57,0.06)]" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                  Photo guide
                </p>
                <h3 className="mt-3 text-xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
                  Best results for ShowStellar
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-6" style={{ color: 'var(--muted)' }}>
                  <li>• Use a solo portrait with your face clearly visible.</li>
                  <li>• Keep the crop close enough to show expression and presence.</li>
                  <li>• Avoid screenshots, group photos, or low-resolution uploads.</li>
                  <li>• The exported image is saved in a clean 4:5 format for cards and profiles.</li>
                </ul>
              </div>

              <div className="rounded-[26px] border bg-white p-5 shadow-[0_14px_40px_rgba(0,23,57,0.06)]" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                  File details
                </p>
                <div className="mt-3 space-y-2 text-sm leading-6">
                  <div className="flex items-center justify-between gap-4">
                    <span style={{ color: 'var(--muted)' }}>Allowed formats</span>
                    <span className="font-medium" style={{ color: 'var(--foreground)' }}>JPG, PNG, WEBP</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span style={{ color: 'var(--muted)' }}>Max file size</span>
                    <span className="font-medium" style={{ color: 'var(--foreground)' }}>5 MB</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span style={{ color: 'var(--muted)' }}>Crop ratio</span>
                    <span className="font-medium" style={{ color: 'var(--foreground)' }}>4:5 portrait</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-20 flex flex-col-reverse gap-3 border-t bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-end sm:px-6 sm:py-5" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy || isSubmitting}
            className="hidden items-center justify-center rounded-xl border px-5 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:inline-flex"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={busy || isSubmitting || Boolean(minDimensionsError)}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: 'var(--navy)' }}
          >
            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            Use Photo
          </button>
        </div>

        {busyState ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[rgba(255,255,255,0.78)] px-6 backdrop-blur-[4px]">
            <div className="w-full max-w-md rounded-[24px] border bg-white p-5 shadow-[0_20px_60px_rgba(0,23,57,0.18)]" style={{ borderColor: 'rgba(0,23,57,0.10)' }}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'var(--surface-2)', color: 'var(--navy)' }}>
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                    {busyState.phase}
                  </p>
                  <p className="mt-1 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    {busyState.message}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(5, Math.min(100, busyState.progress))}%`,
                    background: 'linear-gradient(90deg, #001739 0%, #3a5fa8 100%)',
                  }}
                />
              </div>
              <p className="mt-3 text-xs leading-6" style={{ color: 'var(--muted)' }}>
                Please keep this window open while the profile photo is being optimized and saved.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
