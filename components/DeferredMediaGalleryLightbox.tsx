'use client'

import dynamic from 'next/dynamic'

type ArtistMediaItem = {
  id: string
  media_url: string
  type: 'image' | 'video'
}

const MediaGalleryLightbox = dynamic(() => import('@/components/MediaGalleryLightbox'), {
  loading: () => (
    <div
      className="rounded-2xl border p-4 text-sm"
      style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
    >
      Loading gallery...
    </div>
  ),
})

export default function DeferredMediaGalleryLightbox({
  displayName,
  images,
  videos,
}: {
  displayName: string
  images: ArtistMediaItem[]
  videos: ArtistMediaItem[]
}) {
  return (
    <MediaGalleryLightbox
      displayName={displayName}
      images={images}
      videos={videos}
    />
  )
}
