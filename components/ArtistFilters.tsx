'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, Search } from 'lucide-react'

type ArtistFiltersProps = {
  categoryOptions: string[]
  initialCategory: string
  initialCity: string
  initialQuery: string
}

export default function ArtistFilters({
  categoryOptions,
  initialCategory,
  initialCity,
  initialQuery,
}: ArtistFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState(initialCategory)
  const [city, setCity] = useState(initialCity)

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    setCategory(initialCategory)
  }, [initialCategory])

  useEffect(() => {
    setCity(initialCity)
  }, [initialCity])

  const hasFilters = useMemo(
    () => Boolean(query.trim() || category.trim() || city.trim()),
    [query, category, city]
  )

  function replaceParams(next: { q?: string; category?: string; city?: string; page?: string }) {
    const params = new URLSearchParams(searchParams.toString())

    const q = next.q ?? query
    const nextCategory = next.category ?? category
    const nextCity = next.city ?? city
    const nextPage = next.page ?? '1'

    if (q.trim()) params.set('q', q.trim())
    else params.delete('q')

    if (nextCategory.trim()) params.set('category', nextCategory.trim())
    else params.delete('category')

    if (nextCity.trim()) params.set('city', nextCity.trim())
    else params.delete('city')

    if (nextPage.trim() && nextPage !== '1') params.set('page', nextPage.trim())
    else params.delete('page')

    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const currentQ = searchParams.get('q') ?? ''
      if (query !== currentQ) {
        replaceParams({ q: query, page: '1' })
      }
    }, 400)

    return () => window.clearTimeout(handle)
    // Intentionally omit replaceParams to avoid re-scheduling on every render.
    // The inputs are driven by URL state and local state, so this effect only
    // needs to react to the current query value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, pathname, searchParams])

  function handleCategoryChange(nextCategory: string) {
    setCategory(nextCategory)
    replaceParams({ category: nextCategory, page: '1' })
  }

  function handleCityChange(nextCity: string) {
    setCity(nextCity)
    replaceParams({ city: nextCity, page: '1' })
  }

  function handleClear() {
    setQuery('')
    setCategory('')
    setCity('')
    router.replace(pathname, { scroll: false })
  }

  return (
    <div className="rounded-[1.5rem] border border-[rgba(0,23,57,0.08)] bg-white px-3 py-3 shadow-[0_14px_34px_rgba(0,23,57,0.05)] sm:px-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-2 xl:grid-cols-[minmax(0,2.1fr)_minmax(220px,1fr)_minmax(180px,0.85fr)_auto] xl:items-center">
        <div className="relative min-w-0 col-span-2 xl:col-span-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input
            name="q"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, category, city..."
            className="h-12 w-full rounded-2xl border bg-white py-3 pl-11 pr-4 text-sm outline-none transition-shadow focus:border-transparent focus:ring-2 focus:ring-[var(--accent-violet)]"
            style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
            aria-label="Search artists"
          />
        </div>

        <div className="relative min-w-0">
          <select
            name="category"
            value={category}
            onChange={e => handleCategoryChange(e.target.value)}
            className="h-12 w-full appearance-none rounded-2xl border bg-white px-4 pr-11 text-sm outline-none transition-shadow focus:border-transparent focus:ring-2 focus:ring-[var(--accent-violet)]"
            style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {categoryOptions.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
        </div>

        <div className="min-w-0">
          <input
            name="city"
            value={city}
            onChange={e => handleCityChange(e.target.value)}
            placeholder="City"
            className="h-12 w-full rounded-2xl border bg-white px-4 text-sm outline-none transition-shadow focus:border-transparent focus:ring-2 focus:ring-[var(--accent-violet)]"
            style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
            aria-label="Filter by city"
          />
        </div>

        <div className="hidden h-12 items-center justify-end xl:inline-flex">
          {hasFilters ? (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex h-12 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition-colors hover:opacity-80"
              style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {hasFilters && (
        <div className="mt-3 flex items-center justify-between gap-3 px-1 xl:hidden">
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Results update automatically
          </p>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-medium hover:underline"
            style={{ color: 'var(--foreground)' }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
