import Link from 'next/link'
import ShowStellarMascotState from '@/components/ShowStellarMascotState'

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col items-center justify-center text-center">
        <div className="relative">
          <p
            className="select-none text-[clamp(5rem,18vw,12rem)] font-black leading-none tracking-[-0.08em]"
            style={{ color: 'var(--navy)', opacity: 0.14 }}
          >
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative -mt-2">
              <ShowStellarMascotState
                state="lost"
                layout="card"
                title="This page missed the stage."
                message="The page you’re looking for may have moved or doesn’t exist."
                className="max-w-xl shadow-sm"
              />
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">
            Back to Homepage
          </Link>
          <Link href="/artists" className="rounded-full border px-5 py-3 text-sm font-semibold transition-colors hover:bg-[var(--surface-2)]" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
            Browse Artists
          </Link>
        </div>
      </div>
    </div>
  )
}
