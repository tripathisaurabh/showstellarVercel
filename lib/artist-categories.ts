export const ARTIST_CATEGORY_OPTIONS = [
  'Singer',
  'Bollywood Singer',
  'Wedding Singer',
  'Devotional Singer',
  'Live Musician',
  'Band',
  'Live Band',
  'Acoustic Duo',
  'DJ',
  'Dancer',
  'Bharatanatyam Dancer',
  'Bhangra Dancer',
  'Hip Hop Dancer',
  'Contemporary Dancer',
  'Belly Dancer',
  'Choreographer',
  'Emcee / Host',
  'Anchor',
  'Comedian',
  'Magician',
  'Mentalist',
  'Photographer',
  'Drone Photographer',
  'Videographer',
  'Makeup Artist',
  'Beauty Parlour / Salon',
  'Hair Stylist',
  'Nail Artist',
  'Mehendi Artist',
  'Bridal Mehendi Artist',
  'Tattoo Artist',
  'Event Decorator',
  'Event Planner',
  'Guitarist',
  'Keyboardist',
  'Drummer',
  'Percussionist',
  'Saxophonist',
  'Violinist',
  'Flutist',
  'Tabla Player',
  'Qawwali Singer',
  'Folk Singer',
  'Classical Singer',
  'Kids Entertainer',
  'Storyteller',
  'Caricature Artist',
  'Face Painter',
  'Balloon Artist',
  'Celebrity Appearance',
  'Puppet Show Artist',
  'Other',
] as const

export const ARTIST_CATEGORY_SEED_NAMES = Array.from(ARTIST_CATEGORY_OPTIONS)

export const MAX_TOTAL_ARTIST_CATEGORIES = 10
export const MAX_CUSTOM_ARTIST_CATEGORY_LENGTH = 50

export type ArtistCategorySelection = {
  categories: string[]
  customCategories: string[]
}

const trim = (value: string) => value.replace(/\s+/g, ' ').trim()

const ARTIST_CATEGORY_ALIASES: Record<string, string> = {
  'live musician': 'Live Musician',
  musician: 'Live Musician',
  instrumentalist: 'Live Musician',
  'live music': 'Live Musician',
  'bollywood singer': 'Bollywood Singer',
  'wedding singer': 'Wedding Singer',
  'devotional singer': 'Devotional Singer',
  vocalist: 'Singer',
  'solo singer': 'Singer',
  'live singer': 'Singer',
  'disc jockey': 'DJ',
  'dj artist': 'DJ',
  emcee: 'Emcee / Host',
  host: 'Emcee / Host',
  'event host': 'Emcee / Host',
  anchor: 'Anchor',
  comedian: 'Comedian',
  'standup comedian': 'Comedian',
  'stand up comedian': 'Comedian',
  magician: 'Magician',
  mentalist: 'Mentalist',
  photography: 'Photographer',
  videography: 'Videographer',
  'make up artist': 'Makeup Artist',
  'beauty parlour': 'Beauty Parlour / Salon',
  'beauty parlor': 'Beauty Parlour / Salon',
  'beauty salon': 'Beauty Parlour / Salon',
  salon: 'Beauty Parlour / Salon',
  beautician: 'Beauty Parlour / Salon',
  parlour: 'Beauty Parlour / Salon',
  'beauty parlour artist': 'Beauty Parlour / Salon',
  'hairdresser': 'Hair Stylist',
  'hair stylist': 'Hair Stylist',
  'nail technician': 'Nail Artist',
  'nail artist': 'Nail Artist',
  'mehndi artist': 'Mehendi Artist',
  mehendi: 'Mehendi Artist',
  henna: 'Mehendi Artist',
  'henna artist': 'Mehendi Artist',
  'bridal mehendi artist': 'Bridal Mehendi Artist',
  tattoo: 'Tattoo Artist',
  decorator: 'Event Decorator',
  'event decorator': 'Event Decorator',
  'event planner': 'Event Planner',
  guitarist: 'Guitarist',
  keyboardist: 'Keyboardist',
  drummer: 'Drummer',
  percussionist: 'Percussionist',
  saxophonist: 'Saxophonist',
  violinist: 'Violinist',
  flutist: 'Flutist',
  'tabla player': 'Tabla Player',
  qawwali: 'Qawwali Singer',
  'folk singer': 'Folk Singer',
  'classical singer': 'Classical Singer',
  'sufi singer': 'Qawwali Singer',
  'acoustic duo': 'Acoustic Duo',
  'live band': 'Live Band',
  'belly dancer': 'Belly Dancer',
  'bharatanatyam dancer': 'Bharatanatyam Dancer',
  'bharatnatyam dancer': 'Bharatanatyam Dancer',
  'bhangra dancer': 'Bhangra Dancer',
  'hip hop dancer': 'Hip Hop Dancer',
  'hiphop dancer': 'Hip Hop Dancer',
  'contemporary dancer': 'Contemporary Dancer',
  'kids entertainer': 'Kids Entertainer',
  'children entertainer': 'Kids Entertainer',
  storyteller: 'Storyteller',
  'caricature artist': 'Caricature Artist',
  'face painter': 'Face Painter',
  'balloon artist': 'Balloon Artist',
  'celebrity appearance': 'Celebrity Appearance',
  'appearance artist': 'Celebrity Appearance',
  'puppet show artist': 'Puppet Show Artist',
  puppeteer: 'Puppet Show Artist',
}

export function normalizeCategoryKey(value?: string | null) {
  return trim(value ?? '').toLowerCase()
}

export function normalizeCategoryValue(value?: string | null) {
  return trim(value ?? '')
}

export function normalizeArtistCategoryLabel(value?: string | null) {
  const normalized = normalizeCategoryValue(value)
  if (!normalized) return ''

  const canonical = ARTIST_CATEGORY_OPTIONS.find(
    option => normalizeCategoryKey(option) === normalizeCategoryKey(normalized)
  )
  if (canonical) return canonical

  return ARTIST_CATEGORY_ALIASES[normalizeCategoryKey(normalized)] ?? normalized
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
    const normalized = normalizeArtistCategoryLabel(value)
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
    const value = normalizeArtistCategoryLabel(rawValue)
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
    ...(categories ?? []).map(normalizeArtistCategoryLabel),
    ...(customCategories ?? []).map(normalizeArtistCategoryLabel),
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

type CategorySeedClient = {
  from: (table: string) => {
    select: (columns: string) => {
      order: (column: string) => Promise<{ data: Array<{ id: string; name: string | null }> | null; error: unknown }>
    }
    insert: (rows: Array<{ name: string }>) => Promise<{ error: unknown | null }>
  }
}

export async function ensureArtistCategorySeeded(supabase: unknown) {
  const client = supabase as CategorySeedClient
  const { data, error } = await client.from('categories').select('id, name').order('name')
  if (error) {
    return { ok: false as const, error }
  }

  const existing = new Set((data ?? []).map((row: { name: string | null }) => normalizeCategoryKey(row.name)))
  const missing = ARTIST_CATEGORY_SEED_NAMES.filter(name => !existing.has(normalizeCategoryKey(name)))

  if (missing.length === 0) {
    return { ok: true as const, seeded: 0 }
  }

  const insertResult = await client.from('categories').insert(missing.map(name => ({ name })))
  if (insertResult.error) {
    return { ok: false as const, error: insertResult.error }
  }

  return { ok: true as const, seeded: missing.length }
}
