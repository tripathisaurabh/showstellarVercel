'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'

export type GalleryMediaItem = {
  id: string
  media_url: string
  type: 'image' | 'video'
}

type Props = {
  displayName: string
  images: GalleryMediaItem[]
  videos?: GalleryMediaItem[]
}

export default function MediaGalleryLightbox({ displayName, images, videos = [] }: Props) {
  const items = useMemo(() => [...images, ...videos], [images, videos])
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const activeItem = activeIndex != null ? items[activeIndex] ?? null : null

  const close = () => setActiveIndex(null)
  const open = (index: number) => setActiveIndex(index)

  useEffect(() => {
    if (activeIndex == null) return

    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowRight') {
        setActiveIndex(current => (current == null ? current : (current + 1) % items.length))
      }
      if (event.key === 'ArrowLeft') {
        setActiveIndex(current => (current == null ? current : (current - 1 + items.length) % items.length))
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [activeIndex, items.length])

  if (items.length === 0) return null

  return (
    <>
      {images.length > 0 && (
        <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          {images.map((img, index) => (
            <button
              key={img.id}
              type="button"
              onClick={() => open(index)}
              className="group relative block h-full w-full cursor-zoom-in overflow-hidden rounded-[10px] bg-[linear-gradient(180deg,#ffffff_0%,#eef2f7_100%)] p-0 text-left"
              style={{ aspectRatio: '16 / 9' }}
              aria-label={`Open ${displayName} photo ${index + 1}`}
            >
              <Image
                src={img.media_url}
                alt={`${displayName} — photo ${index + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                className="pointer-events-none object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,23,57,0.18)] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[var(--foreground)] shadow-[0_10px_24px_rgba(0,23,57,0.12)] backdrop-blur">
                <Maximize2 className="h-4 w-4" />
              </div>
            </button>
          ))}
        </div>
      )}

      {videos.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {videos.map((video, index) => {
            const mediaIndex = images.length + index
            return (
              <button
                key={video.id}
                type="button"
                onClick={() => open(mediaIndex)}
                className="group relative block h-full w-full cursor-zoom-in overflow-hidden rounded-[10px] bg-black p-0 text-left"
                style={{ aspectRatio: '16 / 9' }}
                aria-label={`Open ${displayName} video ${index + 1}`}
              >
                <video
                  src={video.media_url}
                  className="pointer-events-none h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.3)] to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--foreground)] shadow-[0_10px_24px_rgba(0,23,57,0.12)]">
                    Tap to open
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {activeItem ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-[rgba(0,23,57,0.92)] px-4 py-6 backdrop-blur-[6px]"
          onClick={event => {
            if (event.target === event.currentTarget) close()
          }}
          onWheel={() => close()}
          onTouchMove={() => close()}
        >
          <div className="relative flex w-full max-w-[96vw] items-center justify-center lg:max-w-[88vw]">
            <button
              type="button"
              onClick={close}
              className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close media preview"
            >
              <X className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveIndex(current => (current == null ? current : (current - 1 + items.length) % items.length))}
              className="absolute left-0 top-1/2 z-10 -translate-x-4 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
              aria-label="Previous media"
              disabled={items.length < 2}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveIndex(current => (current == null ? current : (current + 1) % items.length))}
              className="absolute right-0 top-1/2 z-10 translate-x-4 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
              aria-label="Next media"
              disabled={items.length < 2}
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {activeItem.type === 'video' ? (
              <button
                type="button"
                onClick={close}
                className="relative w-full overflow-hidden rounded-[28px] bg-black text-left shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
                style={{ width: 'min(96vw, 1100px)', aspectRatio: '16 / 9', maxHeight: '84svh' }}
                aria-label="Close media preview"
              >
                <video
                  src={activeItem.media_url}
                  className="h-full w-full object-contain bg-black"
                  controls
                  autoPlay
                  playsInline
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={close}
                className="relative overflow-hidden rounded-[28px] bg-black text-left shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
                style={{ width: 'min(92vw, 640px, calc(84svh * 0.8))', aspectRatio: '4 / 5', maxHeight: '84svh' }}
                aria-label="Close media preview"
              >
                <Image
                  src={activeItem.media_url}
                  alt={`${displayName} media preview`}
                  fill
                  sizes="(max-width: 768px) 92vw, (max-width: 1280px) 60vw, 640px"
                  className="object-contain"
                  priority
                />
              </button>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
