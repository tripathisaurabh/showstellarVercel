export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="mx-auto max-w-[1520px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div
          className="mb-8 rounded-[30px] border bg-white/88 px-6 py-6"
          style={{ borderColor: 'rgba(0, 23, 57, 0.10)' }}
        >
          <div className="h-5 w-44 rounded-full bg-[var(--surface-2)]" />
          <div className="mt-4 h-8 w-56 rounded-full bg-[var(--surface-2)]" />
          <div className="mt-3 h-4 w-80 max-w-full rounded-full bg-[var(--surface-2)]" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
          <div className="space-y-5">
            <div className="rounded-[28px] border bg-white p-6" style={{ borderColor: 'rgba(0, 23, 57, 0.10)' }}>
              <div className="h-4 w-40 rounded-full bg-[var(--surface-2)]" />
              <div className="mt-4 h-12 w-full rounded-2xl bg-[var(--surface-2)]" />
              <div className="mt-4 h-12 w-full rounded-2xl bg-[var(--surface-2)]" />
              <div className="mt-4 h-12 w-full rounded-2xl bg-[var(--surface-2)]" />
            </div>
          </div>
          <div className="min-h-[420px] rounded-[28px] border bg-white p-5" style={{ borderColor: 'rgba(0, 23, 57, 0.10)' }}>
            <div className="h-4 w-32 rounded-full bg-[var(--surface-2)]" />
            <div className="mt-4 h-72 rounded-[24px] bg-[var(--surface-2)]" />
          </div>
        </div>
      </div>
    </div>
  )
}
