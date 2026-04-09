export const ARTIST_CATEGORY_OPTIONS = [
  'Singer',
  'Band',
  'DJ',
  'Comedian',
  'Magician',
  'Dancer',
  'Emcee / Host',
  'Photographer',
  'Videographer',
  'Other',
] as const

export const MAX_TOTAL_ARTIST_CATEGORIES = 10
export const MAX_CUSTOM_ARTIST_CATEGORY_LENGTH = 50

export type ArtistCategorySelection = {
  categories: string[]
  customCategories: string[]
}

const trim = (value: string) => value.replace(/\s+/g, ' ').trim()

export function normalizeCategoryKey(value?: string | null) {
  return trim(value ?? '').toLowerCase()
}

export function normalizeCategoryValue(value?: string | null) {
  return trim(value ?? '')
}

export function splitCategoryInput(value?: string | null) {
  if (!value) return []

  return value
    .split(/[\n,|]+/g)
    .map(normalizeCategoryValue)
    .filter(Boolean)
}

export function dedupeCategories(values: string[]) {
  const seen = new Set<string>()
  const output: string[] = []

  for (const value of values) {
    const normalized = normalizeCategoryValue(value)
    if (!normalized) continue

    const key = normalizeCategoryKey(normalized)
    if (seen.has(key)) continue

    seen.add(key)
    output.push(normalized)
  }

  return output
}

export function combineArtistCategories(selection: {
  categories?: Array<string | null | undefined> | null
  custom_categories?: Array<string | null | undefined> | null
  primaryCategory?: string | null
}) {
  const predefined = dedupeCategories([
    ...(selection.categories ?? []).map(normalizeCategoryValue),
    normalizeCategoryValue(selection.primaryCategory),
  ])
  const custom = dedupeCategories((selection.custom_categories ?? []).map(normalizeCategoryValue))
  const combined = dedupeCategories([...predefined, ...custom])

  return {
    categories: predefined,
    customCategories: custom,
    combined,
    primaryCategory: combined[0] ?? '',
    summary: combined.length ? combined.join(' · ') : '',
  }
}

export function partitionArtistCategories(
  values: string[],
  allowedCategories: Iterable<string>
): ArtistCategorySelection {
  const allowed = new Set(Array.from(allowedCategories, normalizeCategoryKey))
  const categories: string[] = []
  const customCategories: string[] = []

  for (const rawValue of values) {
    const value = normalizeCategoryValue(rawValue)
    if (!value) continue

    if (allowed.has(normalizeCategoryKey(value))) {
      categories.push(value)
    } else {
      customCategories.push(value)
    }
  }

  return {
    categories: dedupeCategories(categories),
    customCategories: dedupeCategories(customCategories),
  }
}

export function normalizeArtistCategorySelection({
  categories,
  customCategories,
  allowedCategories,
}: {
  categories?: Array<string | null | undefined> | null
  customCategories?: Array<string | null | undefined> | null
  allowedCategories: Iterable<string>
}): ArtistCategorySelection {
  const allowed = new Set(Array.from(allowedCategories, normalizeCategoryKey))
  const allValues = dedupeCategories([
    ...(categories ?? []).map(normalizeCategoryValue),
    ...(customCategories ?? []).map(normalizeCategoryValue),
  ])
  const predefined = allValues.filter(value => allowed.has(normalizeCategoryKey(value)))
  const custom = allValues.filter(value => !allowed.has(normalizeCategoryKey(value)))

  return {
    categories: predefined,
    customCategories: custom,
  }
}

export function getArtistCategorySummary(categories: string[], customCategories: string[]) {
  return dedupeCategories([...categories, ...customCategories]).join(' · ')
}

export function artistMatchesCategory(
  artistCategories: {
    categories?: Array<string | null | undefined> | null
    custom_categories?: Array<string | null | undefined> | null
    primaryCategory?: string | null
  },
  filterValue?: string | null
) {
  const filter = normalizeCategoryKey(filterValue)
  if (!filter) return true

  const combined = combineArtistCategories(artistCategories).combined
  return combined.some(category => normalizeCategoryKey(category) === filter)
}
