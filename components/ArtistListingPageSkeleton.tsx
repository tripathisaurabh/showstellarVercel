import { Skeleton, ArtistCardSkeleton } from '@/components/ShowStellarSkeletons'

type Props = {
  cardCount?: number
}

export default function ArtistListingPageSkeleton({ cardCount = 12 }: Props) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <section className="border-b bg-white py-3 sm:py-5 md:sticky md:top-20 md:z-40" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[1.5rem] border border-[rgba(0,23,57,0.08)] bg-white px-3 py-3 shadow-[0_14px_34px_rgba(0,23,57,0.05)] sm:px-4">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-2 xl:grid-cols-[minmax(0,2.1fr)_minmax(220px,1fr)_minmax(180px,0.85fr)_auto] xl:items-center">
              <Skeleton className="h-12 rounded-2xl md:col-span-2 xl:col-span-1" />
              <Skeleton className="h-12 rounded-2xl" />
              <Skeleton className="h-12 rounded-2xl" />
              <Skeleton className="hidden h-12 rounded-2xl xl:block" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-4 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-between sm:mb-6">
            <Skeleton className="h-4 w-44 rounded-full" />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: cardCount }, (_, index) => (
              <ArtistCardSkeleton key={index} />
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-20 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
