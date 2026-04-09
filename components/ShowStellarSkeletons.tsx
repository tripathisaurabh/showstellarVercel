import type { CSSProperties, ReactNode } from 'react'

type Tone = 'light' | 'dark'

type SkeletonProps = {
  className?: string
  style?: CSSProperties
  tone?: Tone
}

export function Skeleton({ className = '', style, tone = 'light' }: SkeletonProps) {
  const toneClass = tone === 'dark' ? 'bg-[rgba(255,255,255,0.16)]' : 'bg-[var(--surface-2)]'

  return <div aria-hidden="true" className={`shimmer ${toneClass} ${className}`} style={style} />
}

function SkeletonLine({
  width = '100%',
  className = '',
  tone = 'light',
}: {
  width?: string | number
  className?: string
  tone?: Tone
}) {
  return <Skeleton tone={tone} className={`h-3 rounded-full ${className}`} style={{ width }} />
}

function SkeletonPill({
  width = 96,
  className = '',
  tone = 'light',
}: {
  width?: number
  className?: string
  tone?: Tone
}) {
  return <Skeleton tone={tone} className={`h-8 rounded-full ${className}`} style={{ width }} />
}

function SkeletonCardShell({
  children,
  className = '',
  style,
  tone = 'light',
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
  tone?: Tone
}) {
  const shellClass =
    tone === 'dark'
      ? 'border-white/10 bg-[linear-gradient(180deg,rgba(0,23,57,0.98)_0%,rgba(10,33,72,0.98)_100%)] shadow-[0_20px_48px_rgba(0,23,57,0.18)]'
      : 'border-[rgba(0,23,57,0.08)] bg-white shadow-[0_20px_48px_rgba(0,23,57,0.08)]'

  return (
    <div className={`rounded-[1.75rem] border ${shellClass} ${className}`} style={style}>
      {children}
    </div>
  )
}

export function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(0,23,57,0.08)] bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-40 rounded-xl" />
        <div className="hidden items-center gap-3 md:flex">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-4 w-20 rounded-full" />
          <SkeletonPill width={110} />
          <SkeletonPill width={132} />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl md:hidden" />
      </div>
    </header>
  )
}

export function AuthPageSkeleton() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-10 sm:px-6 lg:px-8" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-white p-8 shadow-sm lg:p-10" style={{ borderColor: 'var(--border)' }}>
          <div className="mx-auto mb-6 h-14 w-14 rounded-2xl bg-[var(--surface-2)] shimmer" />
          <div className="mb-8 space-y-3 text-center">
            <SkeletonLine width="42%" className="mx-auto h-4" />
            <SkeletonLine width="68%" className="mx-auto h-7" />
            <SkeletonLine width="88%" className="mx-auto h-4" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function CenteredStateSkeleton() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-3xl rounded-[2rem] border bg-white px-6 py-10 text-center shadow-sm sm:px-10 sm:py-12" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-[var(--surface-2)] shimmer sm:h-24 sm:w-24" />
        <SkeletonLine width="34%" className="mx-auto h-4" />
        <SkeletonLine width="60%" className="mx-auto mt-3 h-8" />
        <SkeletonLine width="72%" className="mx-auto mt-3 h-4" />
        <SkeletonLine width="56%" className="mx-auto mt-2 h-4" />
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <SkeletonPill width={156} />
          <SkeletonPill width={126} />
        </div>
      </div>
    </div>
  )
}

export function ArtistSignupSkeleton() {
  return (
    <div className="min-h-screen py-6 sm:py-10 lg:py-16" style={{ background: 'var(--background)' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-10 xl:gap-14">
          <div className="space-y-5 lg:sticky lg:top-8">
            <SkeletonCardShell className="overflow-hidden p-0">
              <div className="border-b border-[rgba(0,23,57,0.08)] px-5 py-4 sm:px-6">
                <SkeletonLine width={140} className="h-4" />
                <SkeletonLine width={120} className="mt-2 h-3" />
              </div>
              <div className="relative aspect-[4/3] overflow-hidden">
                <Skeleton className="h-full w-full rounded-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,23,57,0.06),transparent_55%)]" />
              </div>
            </SkeletonCardShell>

            <SkeletonCardShell className="p-6 sm:p-8">
              <SkeletonLine width={104} className="h-3" />
              <SkeletonLine width="56%" className="mt-3 h-8" />
              <SkeletonLine width="90%" className="mt-3 h-4" />
              <SkeletonLine width="72%" className="mt-2 h-4" />
              <div className="mt-5 space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Skeleton className="mt-1 h-5 w-5 rounded-full" />
                    <SkeletonLine width={index === 0 ? '86%' : index === 1 ? '78%' : index === 2 ? '82%' : '74%'} className="h-4" />
                  </div>
                ))}
              </div>
            </SkeletonCardShell>
          </div>

          <SkeletonCardShell className="w-full p-5 sm:p-6 lg:p-10">
            <div className="mb-6 sm:mb-8">
              <SkeletonLine width="48%" className="h-8" />
              <SkeletonLine width="56%" className="mt-3 h-4" />
            </div>

            <div className="space-y-4 sm:space-y-5">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
              <div className="space-y-3">
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-12 rounded-xl" />
              <SkeletonLine width="62%" className="mx-auto h-4" />
            </div>
          </SkeletonCardShell>
        </div>
      </div>
    </div>
  )
}

function HeroTextSkeleton() {
  return (
    <div className="max-w-xl">
      <SkeletonPill width={190} tone="dark" />
      <SkeletonLine width="92%" className="mt-6 h-10" tone="dark" />
      <SkeletonLine width="82%" className="mt-3 h-10" tone="dark" />
      <SkeletonLine width="72%" className="mt-3 h-10" tone="dark" />
      <SkeletonLine width="78%" className="mt-6 h-5" tone="dark" />
      <SkeletonLine width="64%" className="mt-2 h-5" tone="dark" />
      <div className="mt-8 flex flex-wrap gap-4">
        <SkeletonPill width={148} tone="dark" />
        <SkeletonPill width={132} tone="dark" />
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        <SkeletonPill width={116} tone="dark" />
        <SkeletonPill width={104} tone="dark" />
        <SkeletonPill width={124} tone="dark" />
      </div>
    </div>
  )
}

function HeroMediaSkeleton() {
  return (
    <div className="hidden lg:block">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl bg-[rgba(255,255,255,0.16)]" tone="dark" />
          <Skeleton className="h-48 w-full rounded-2xl bg-[rgba(255,255,255,0.12)]" tone="dark" />
        </div>
        <div className="space-y-6 pt-12">
          <Skeleton className="h-48 w-full rounded-2xl bg-[rgba(255,255,255,0.12)]" tone="dark" />
          <Skeleton className="h-64 w-full rounded-2xl bg-[rgba(255,255,255,0.16)]" tone="dark" />
        </div>
      </div>
    </div>
  )
}

function CategoryTileSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[rgba(0,23,57,0.08)] bg-white shadow-[0_14px_34px_rgba(0,23,57,0.08)]">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Skeleton className="h-full w-full rounded-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,23,57,0.78)] via-[rgba(0,23,57,0.16)] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <SkeletonLine width="54%" className="h-5" tone="dark" />
        </div>
      </div>
    </div>
  )
}

function FeaturedSectionShell({ children }: { children: ReactNode }) {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] border border-[rgba(0,23,57,0.08)] bg-[linear-gradient(180deg,#ffffff_0%,#f5f7fb_100%)] px-4 py-8 shadow-[0_24px_64px_rgba(0,23,57,0.08)] sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          {children}
        </div>
      </div>
    </section>
  )
}

function SectionIntroSkeleton({ centered = false }: { centered?: boolean }) {
  return (
    <div className={centered ? 'mx-auto mb-8 max-w-2xl text-center sm:mb-10' : 'mb-8 max-w-2xl'}>
      <SkeletonPill width={128} />
      <SkeletonLine width={centered ? '56%' : '52%'} className="mt-4 h-9" />
      <SkeletonLine width={centered ? '72%' : '84%'} className="mt-4 h-5" />
      <SkeletonLine width={centered ? '58%' : '76%'} className="mt-2 h-5" />
    </div>
  )
}

function ArtistDashboardShellSkeleton({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header className="sticky top-0 z-40 border-b border-[rgba(0,23,57,0.08)] bg-white">
        <div className="flex h-16 items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-xl lg:hidden" />
            <Skeleton className="h-8 w-36 rounded-lg" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="hidden sm:block">
              <SkeletonLine width={108} className="h-4" />
              <SkeletonLine width={54} className="mt-2 h-3" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden h-[calc(100vh-4rem)] w-64 border-r border-[rgba(0,23,57,0.08)] bg-white lg:block">
          <div className="space-y-3 p-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonCardShell key={index} className="p-4 shadow-none">
                <SkeletonLine width={index === 0 ? 84 : 92} className="h-4" />
              </SkeletonCardShell>
            ))}
            <SkeletonCardShell className="mt-4 p-4 shadow-none">
              <SkeletonLine width={72} className="h-4" />
            </SkeletonCardShell>
          </div>
        </aside>

        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

export function ArtistCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <SkeletonCardShell className="overflow-hidden">
      <div className="relative h-56 overflow-hidden">
        <Skeleton className="h-full w-full rounded-none" />
        {featured ? <div className="absolute left-4 top-4 h-7 w-20 rounded-full bg-[rgba(255,255,255,0.16)] shimmer" /> : null}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[rgba(0,23,57,0.16)] to-transparent" />
      </div>
      <div className="flex flex-1 flex-col border-t border-[rgba(0,23,57,0.06)] bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <SkeletonLine width="68%" className="h-5" />
            <SkeletonLine width="84%" className="mt-3 h-4" />
          </div>
          <div className="shrink-0 text-right">
            <SkeletonLine width={68} className="ml-auto h-3" />
            <SkeletonLine width={92} className="ml-auto mt-2 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <SkeletonPill width={108} />
          <SkeletonPill width={76} />
        </div>
        <SkeletonLine width="92%" className="mt-5 h-4" />
        <SkeletonLine width="74%" className="mt-3 h-4" />
        <div className="mt-auto pt-4">
          <SkeletonLine width={104} className="ml-auto h-4" />
        </div>
      </div>
    </SkeletonCardShell>
  )
}

export function FeaturedArtistSkeleton() {
  return <ArtistCardSkeleton featured />
}

export function SearchResultsSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <section className="sticky top-20 z-40 border-b bg-white py-3 sm:py-5" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[1.5rem] border border-[rgba(0,23,57,0.08)] bg-white px-3 py-3 shadow-[0_14px_34px_rgba(0,23,57,0.05)] sm:px-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,2.1fr)_minmax(220px,1fr)_minmax(180px,0.85fr)_auto_auto] xl:items-center">
              <Skeleton className="h-12 rounded-2xl md:col-span-2 xl:col-span-1" />
              <Skeleton className="h-12 rounded-2xl" />
              <Skeleton className="h-12 rounded-2xl" />
              <Skeleton className="h-12 rounded-2xl" />
              <Skeleton className="hidden h-12 rounded-2xl xl:block" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-4 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-between gap-4 sm:mb-6">
            <SkeletonLine width={160} className="h-4" />
            <SkeletonLine width={92} className="h-4" />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <ArtistCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export function BookingFormSkeleton({ dark = false }: { dark?: boolean }) {
  const labelTone: Tone = dark ? 'dark' : 'light'
  const lineTone: Tone = dark ? 'dark' : 'light'

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: dark
          ? 'linear-gradient(155deg, #001739 0%, #0a2148 100%)'
          : '#ffffff',
        border: dark ? 'none' : '1px solid var(--border)',
        boxShadow: dark ? '0 16px 48px rgba(0,23,57,0.20)' : '0 18px 40px rgba(0,23,57,0.08)',
      }}
    >
      <SkeletonLine width={110} className="mb-2 h-3" tone={labelTone} />
      <SkeletonLine width="82%" className="mb-7 h-9" tone={lineTone} />

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-12 rounded-xl" tone={dark ? 'dark' : 'light'} />
          <Skeleton className="h-12 rounded-xl" tone={dark ? 'dark' : 'light'} />
        </div>
        <Skeleton className="h-12 rounded-xl" tone={dark ? 'dark' : 'light'} />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-12 rounded-xl" tone={dark ? 'dark' : 'light'} />
          <Skeleton className="h-12 rounded-xl" tone={dark ? 'dark' : 'light'} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-12 rounded-xl" tone={dark ? 'dark' : 'light'} />
          <Skeleton className="h-12 rounded-xl" tone={dark ? 'dark' : 'light'} />
          <Skeleton className="h-12 rounded-xl" tone={dark ? 'dark' : 'light'} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-12 rounded-xl" tone={dark ? 'dark' : 'light'} />
          <Skeleton className="h-12 rounded-xl" tone={dark ? 'dark' : 'light'} />
        </div>
        <div className={`rounded-2xl border p-4 ${dark ? 'border-white/10 bg-white/5' : 'border-[rgba(0,23,57,0.08)] bg-[var(--surface-2)]'}`}>
          <SkeletonLine width={94} className="mb-2 h-3" tone={dark ? 'dark' : 'light'} />
          <SkeletonLine width="86%" className="h-5" tone={dark ? 'dark' : 'light'} />
          <SkeletonLine width="64%" className="mt-2 h-4" tone={dark ? 'dark' : 'light'} />
        </div>
        <Skeleton className="h-28 rounded-2xl" tone={dark ? 'dark' : 'light'} />
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-12 flex-1 rounded-xl" tone={dark ? 'dark' : 'light'} />
          <Skeleton className="h-12 flex-1 rounded-xl" tone={dark ? 'dark' : 'light'} />
        </div>
      </div>
    </div>
  )
}

function AboutDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonCardShell className="p-6">
        <SkeletonLine width={72} className="mb-4 h-4" />
        <div className="space-y-3">
          <SkeletonLine width="96%" className="h-4" />
          <SkeletonLine width="92%" className="h-4" />
          <SkeletonLine width="78%" className="h-4" />
        </div>
      </SkeletonCardShell>

      <SkeletonCardShell className="p-6">
        <SkeletonLine width={84} className="mb-5 h-4" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex gap-4">
              <SkeletonLine width={96} className="h-3 shrink-0" />
              <SkeletonLine width={index === 4 ? '40%' : '62%'} className="h-4" />
            </div>
          ))}
        </div>
      </SkeletonCardShell>
    </div>
  )
}

function MediaSkeleton() {
  return (
    <SkeletonCardShell className="p-6">
      <SkeletonLine width={120} className="mb-5 h-4" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="relative overflow-hidden rounded-[0.625rem]">
            <Skeleton className="aspect-[16/9] w-full rounded-none" />
          </div>
        ))}
      </div>
    </SkeletonCardShell>
  )
}

export function ArtistProfileSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="mx-auto max-w-6xl px-4 pb-4 pt-6 sm:px-6 lg:px-8">
        <SkeletonLine width={180} className="h-4" />
      </div>

      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <SkeletonCardShell className="mb-8 p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="h-24 w-24 shrink-0 rounded-[20px] bg-[var(--surface-2)] shimmer" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2">
                <SkeletonPill width={74} />
                <SkeletonPill width={90} />
                <SkeletonPill width={82} />
              </div>
              <SkeletonLine width="42%" className="mt-4 h-10" />
              <SkeletonLine width="26%" className="mt-3 h-5" />
              <SkeletonLine width="76%" className="mt-4 h-5" />
              <SkeletonLine width="68%" className="mt-2 h-5" />
              <div className="mt-4 flex flex-wrap gap-2">
                <SkeletonPill width={120} />
                <SkeletonPill width={96} />
                <SkeletonPill width={112} />
                <SkeletonPill width={108} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <SkeletonPill width={98} />
                <SkeletonPill width={92} />
                <SkeletonPill width={108} />
              </div>
            </div>
          </div>
        </SkeletonCardShell>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <AboutDetailsSkeleton />
            <div className="lg:hidden">
              <BookingFormSkeleton dark />
            </div>
            <MediaSkeleton />
          </div>

          <div className="hidden lg:block">
            <BookingFormSkeleton dark />
          </div>
        </div>
      </main>
    </div>
  )
}

export function ProfileEditorSkeleton() {
  return (
    <ArtistDashboardShellSkeleton>
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <SkeletonLine width={120} className="h-4" />
          <SkeletonLine width="34%" className="mt-3 h-8" />
          <SkeletonLine width="44%" className="mt-3 h-4" />
        </div>

        <SkeletonCardShell className="mb-6 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 shrink-0 rounded-full bg-[var(--surface-2)] shimmer" />
              <div className="min-w-0">
                <SkeletonLine width={92} className="h-3" />
                <SkeletonLine width="40%" className="mt-3 h-6" />
                <SkeletonLine width="52%" className="mt-2 h-4" />
                <SkeletonLine width="56%" className="mt-2 h-4" />
              </div>
            </div>
            <SkeletonPill width={128} />
          </div>
        </SkeletonCardShell>

        <SkeletonCardShell className="p-6">
          <SkeletonLine width={132} className="h-4" />
          <div className="mt-5 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
            <Skeleton className="h-12 rounded-xl" />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
        </SkeletonCardShell>

        <SkeletonCardShell className="mt-6 p-6">
          <SkeletonLine width={118} className="h-4" />
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[16/9] rounded-[0.625rem]" />
            ))}
          </div>
        </SkeletonCardShell>
      </div>
    </ArtistDashboardShellSkeleton>
  )
}

export function DashboardSkeleton() {
  return (
    <ArtistDashboardShellSkeleton>
      <div className="mx-auto max-w-4xl">
        <SkeletonLine width="28%" className="h-4" />
        <SkeletonLine width="40%" className="mt-3 h-8" />
        <SkeletonLine width="48%" className="mt-3 h-4" />

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <SkeletonCardShell key={index} className="p-6">
              <SkeletonLine width={132} className="h-4" />
              <SkeletonLine width="76%" className="mt-3 h-3" />
              <SkeletonLine width="66%" className="mt-2 h-3" />
              <SkeletonLine width="100%" className="mt-4 h-2.5" />
              <SkeletonLine width="52%" className="mt-3 h-3" />
              <Skeleton className="mt-5 h-11 rounded-xl" />
            </SkeletonCardShell>
          ))}
        </div>

        <SkeletonCardShell className="mt-6 p-6">
          <SkeletonLine width={124} className="h-4" />
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonCardShell key={index} className="p-4 shadow-none">
                <SkeletonLine width={84} className="h-3" />
                <SkeletonLine width="64%" className="mt-3 h-7" />
              </SkeletonCardShell>
            ))}
          </div>
        </SkeletonCardShell>

        <SkeletonCardShell className="mt-6 p-6">
          <SkeletonLine width={138} className="h-4" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-[rgba(0,23,57,0.08)] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <SkeletonLine width="32%" className="h-4" />
                    <SkeletonLine width="86%" className="mt-3 h-3" />
                  </div>
                  <SkeletonPill width={68} />
                </div>
              </div>
            ))}
          </div>
        </SkeletonCardShell>
      </div>
    </ArtistDashboardShellSkeleton>
  )
}

export function AdminDashboardSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="sticky top-0 z-40 border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6 lg:px-8">
          <Skeleton className="h-8 w-36 rounded-lg" />
          <Skeleton className="hidden h-4 w-40 rounded-full md:block" />
          <div className="flex items-center gap-3">
            <Skeleton className="hidden h-9 w-32 rounded-xl sm:block" />
            <Skeleton className="h-9 w-20 rounded-xl" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
        <SkeletonLine width={148} className="h-4" />
        <SkeletonLine width={260} className="mt-3 h-8" />
        <SkeletonLine width={340} className="mt-3 h-4" />

        <div className="mt-8 flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonPill key={index} width={index === 0 ? 92 : 128} />
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonCardShell key={index} className="p-5">
              <SkeletonLine width={88} className="h-3" />
              <SkeletonLine width="48%" className="mt-3 h-8" />
            </SkeletonCardShell>
          ))}
        </div>

        <div className="mt-10 space-y-8">
          {Array.from({ length: 3 }).map((_, sectionIndex) => (
            <SkeletonCardShell key={sectionIndex} className="p-6">
              <div className="flex items-center justify-between gap-4">
                <SkeletonLine width={132} className="h-5" />
                <SkeletonLine width={72} className="h-4" />
              </div>
              <div className="mt-5 space-y-3">
                {Array.from({ length: 4 }).map((__, rowIndex) => (
                  <div key={rowIndex} className="rounded-2xl border border-[rgba(0,23,57,0.08)] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <SkeletonLine width="38%" className="h-4" />
                        <SkeletonLine width="78%" className="mt-3 h-3" />
                      </div>
                      <SkeletonPill width={70} />
                    </div>
                  </div>
                ))}
              </div>
            </SkeletonCardShell>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AdminArtistDetailSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="sticky top-0 z-40 border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6 lg:px-8">
          <Skeleton className="h-8 w-36 rounded-lg" />
          <Skeleton className="h-4 w-32 rounded-full" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <SkeletonLine width={132} className="h-4" />
            <SkeletonLine width="46%" className="mt-3 h-9" />
            <SkeletonLine width="58%" className="mt-3 h-4" />
          </div>
          <div className="flex gap-3">
            <SkeletonPill width={110} />
            <SkeletonPill width={130} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <SkeletonCardShell className="p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="h-28 w-28 shrink-0 rounded-2xl bg-[var(--surface-2)] shimmer" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <SkeletonPill width={82} />
                  <SkeletonPill width={94} />
                  <SkeletonPill width={78} />
                </div>
                <SkeletonLine width="68%" className="mt-4 h-5" />
                <SkeletonLine width="88%" className="mt-3 h-4" />
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonCardShell key={index} className="p-4 shadow-none">
                  <SkeletonLine width={72} className="h-3" />
                  <SkeletonLine width="62%" className="mt-3 h-5" />
                </SkeletonCardShell>
              ))}
            </div>
          </SkeletonCardShell>

          <SkeletonCardShell className="p-6">
            <SkeletonLine width={110} className="h-5" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between gap-4">
                  <SkeletonLine width={92} className="h-3 shrink-0" />
                  <SkeletonLine width={index % 2 === 0 ? '52%' : '36%'} className="h-4" />
                </div>
              ))}
            </div>
          </SkeletonCardShell>
        </div>

        <SkeletonCardShell className="p-6">
          <SkeletonLine width={132} className="h-5" />
          <SkeletonLine width="78%" className="mt-4 h-4" />
          <SkeletonLine width="62%" className="mt-3 h-4" />
        </SkeletonCardShell>

        <SkeletonCardShell className="p-6">
          <SkeletonLine width={124} className="h-5" />
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton className="aspect-[4/3] rounded-[1rem]" key={index} />
            ))}
          </div>
        </SkeletonCardShell>

        <SkeletonCardShell className="p-6">
          <div className="flex items-center justify-between gap-4">
            <SkeletonLine width={172} className="h-5" />
            <SkeletonLine width={72} className="h-4" />
          </div>
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-[rgba(0,23,57,0.08)] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <SkeletonLine width="34%" className="h-4" />
                    <SkeletonLine width="78%" className="mt-3 h-3" />
                  </div>
                  <SkeletonPill width={92} />
                </div>
              </div>
            ))}
          </div>
        </SkeletonCardShell>
      </div>
    </div>
  )
}

export function AdminInquiryDetailSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="sticky top-0 z-40 border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6 lg:px-8">
          <Skeleton className="h-8 w-36 rounded-lg" />
          <Skeleton className="h-4 w-32 rounded-full" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-8 lg:px-8 lg:py-10">
        <div>
          <SkeletonLine width={128} className="h-4" />
          <SkeletonLine width="38%" className="mt-3 h-9" />
          <SkeletonLine width="24%" className="mt-3 h-4" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <SkeletonCardShell className="p-6">
            <div className="flex flex-wrap gap-2">
              <SkeletonPill width={68} />
              <SkeletonPill width={104} />
              <SkeletonPill width={84} />
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 10 }).map((_, index) => (
                <SkeletonCardShell key={index} className="p-4 shadow-none">
                  <SkeletonLine width={88} className="h-3" />
                  <SkeletonLine width="64%" className="mt-3 h-5" />
                </SkeletonCardShell>
              ))}
            </div>
            <SkeletonLine width={162} className="mt-6 h-5" />
            <SkeletonLine width="92%" className="mt-4 h-4" />
            <SkeletonLine width="78%" className="mt-3 h-4" />
          </SkeletonCardShell>

          <SkeletonCardShell className="p-6">
            <SkeletonLine width={118} className="h-5" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between gap-4">
                  <SkeletonLine width={96} className="h-3 shrink-0" />
                  <SkeletonLine width={index % 2 === 0 ? '58%' : '42%'} className="h-4" />
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <SkeletonPill width={84} />
              <SkeletonPill width={96} />
              <SkeletonPill width={78} />
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <Skeleton className="h-11 rounded-xl" />
              <Skeleton className="h-11 rounded-xl" />
            </div>
          </SkeletonCardShell>
        </div>
      </div>
    </div>
  )
}

export function HomepageSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)] via-[#0a2148] to-[#001739]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <HeroTextSkeleton />
            <HeroMediaSkeleton />
          </div>
        </div>
      </section>

      <section className="bg-white py-12 pb-14 sm:py-14 sm:pb-16 lg:py-16">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-6 max-w-2xl text-center sm:mb-8">
            <SkeletonLine width={112} className="mx-auto h-4" />
            <SkeletonLine width="42%" className="mx-auto mt-4 h-8" />
            <SkeletonLine width="68%" className="mx-auto mt-3 h-5" />
            <SkeletonLine width="54%" className="mx-auto mt-2 h-5" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <CategoryTileSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>

      <FeaturedSectionShell>
        <SectionIntroSkeleton />
        <div className="relative">
          <div className="flex items-stretch gap-5 overflow-hidden">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="w-[82%] flex-shrink-0 sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]">
                <FeaturedArtistSkeleton />
              </div>
            ))}
          </div>
        </div>
      </FeaturedSectionShell>

      <section className="border-y border-[color:var(--border)] bg-[var(--surface-2)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SkeletonCardShell className="px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
            <div className="mx-auto max-w-3xl text-center">
              <SkeletonLine width={120} className="mx-auto h-4" />
              <SkeletonLine width="52%" className="mx-auto mt-3 h-8" />
              <SkeletonLine width="74%" className="mx-auto mt-4 h-5" />
              <SkeletonLine width="58%" className="mx-auto mt-2 h-5" />
            </div>
            <div className="mt-10 hidden gap-5 md:grid md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonCardShell key={index} className="overflow-hidden p-0 shadow-[0_12px_28px_rgba(0,23,57,0.05)]">
                  <Skeleton className="aspect-[4/3] rounded-none" />
                  <div className="p-5">
                    <SkeletonLine width="18%" className="h-3" />
                    <SkeletonLine width="46%" className="mt-3 h-5" />
                    <SkeletonLine width="82%" className="mt-3 h-4" />
                    <SkeletonLine width="72%" className="mt-2 h-4" />
                  </div>
                </SkeletonCardShell>
              ))}
            </div>
            <div className="mt-10 md:hidden">
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <SkeletonCardShell key={index} className="overflow-hidden p-0">
                    <Skeleton className="aspect-[4/3] rounded-none" />
                    <div className="p-5">
                      <SkeletonLine width="18%" className="h-3" />
                      <SkeletonLine width="46%" className="mt-3 h-5" />
                      <SkeletonLine width="82%" className="mt-3 h-4" />
                    </div>
                  </SkeletonCardShell>
                ))}
              </div>
            </div>
          </SkeletonCardShell>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionIntroSkeleton />
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="space-y-6">
              <SkeletonCardShell tone="dark" className="p-8 text-white shadow-[0_22px_54px_rgba(0,23,57,0.2)]">
                <SkeletonLine width={132} className="h-4" tone="dark" />
                <SkeletonLine width="80%" className="mt-4 h-8" tone="dark" />
                <SkeletonLine width="70%" className="mt-3 h-8" tone="dark" />
                <SkeletonLine width="92%" className="mt-4 h-4" tone="dark" />
                <SkeletonLine width="82%" className="mt-2 h-4" tone="dark" />
              </SkeletonCardShell>
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <SkeletonCardShell key={index} className="p-4 sm:p-5">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <SkeletonLine width="42%" className="mt-4 h-5" />
                    <SkeletonLine width="86%" className="mt-3 h-4" />
                    <SkeletonLine width="78%" className="mt-2 h-4" />
                  </SkeletonCardShell>
                ))}
              </div>
            </div>
            <SkeletonCardShell className="overflow-hidden p-0 lg:pt-10">
              <Skeleton className="aspect-[4/3] rounded-none" />
            </SkeletonCardShell>
          </div>
        </div>
      </section>

      <section className="bg-[var(--navy)] py-4 pb-20 sm:pb-24 lg:pb-24 lg:pt-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SkeletonCardShell tone="dark" className="px-6 py-10 text-white shadow-[0_24px_60px_rgba(0,23,57,0.22)] sm:px-8 sm:py-12 lg:px-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <SkeletonLine width={92} className="h-4" tone="dark" />
                <SkeletonLine width="60%" className="mt-3 h-8" tone="dark" />
                <SkeletonLine width="72%" className="mt-4 h-4" tone="dark" />
                <SkeletonLine width="58%" className="mt-2 h-4" tone="dark" />
              </div>
              <div className="flex flex-wrap gap-3">
                <SkeletonPill width={132} tone="dark" />
                <SkeletonPill width={112} tone="dark" />
              </div>
            </div>
          </SkeletonCardShell>
        </div>
      </section>
    </div>
  )
}
