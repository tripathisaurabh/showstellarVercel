'use client'

import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import {
  dedupeCategories,
  MAX_CUSTOM_ARTIST_CATEGORY_LENGTH,
  MAX_TOTAL_ARTIST_CATEGORIES,
  normalizeCategoryKey,
  normalizeCategoryValue,
  splitCategoryInput,
} from '@/lib/artist-categories'

export type CategorySelection = {
  categories: string[]
  customCategories: string[]
}

type Props = {
  label?: string
  description?: string
  options: string[]
  value: CategorySelection
  onChange: (next: CategorySelection) => void
}

export default function CategorySelector({
  label = 'Categories',
  description = 'Select one or more categories. Add custom categories if needed.',
  options,
  value,
  onChange,
}: Props) {
  const [customInput, setCustomInput] = useState('')
  const [message, setMessage] = useState('')

  const totalSelected = value.categories.length + value.customCategories.length
  const selectedKeySet = useMemo(() => {
    return new Set([...value.categories, ...value.customCategories].map(normalizeCategoryKey))
  }, [value.categories, value.customCategories])

  function update(nextCategories: string[], nextCustom: string[]) {
    const categories = dedupeCategories(nextCategories)
    const customCategories = dedupeCategories(nextCustom)
    onChange({ categories, customCategories })
  }

  function toggleCategory(category: string) {
    setMessage('')
    const normalized = normalizeCategoryValue(category)
    if (!normalized) return

    const nextCategories = [...value.categories]
    const nextCustom = [...value.customCategories]
    const key = normalizeCategoryKey(normalized)
    const existsInCategories = nextCategories.some(item => normalizeCategoryKey(item) === key)
    const existsInCustom = nextCustom.some(item => normalizeCategoryKey(item) === key)

    if (existsInCategories) {
      update(nextCategories.filter(item => normalizeCategoryKey(item) !== key), nextCustom)
      return
    }

    if (existsInCustom) {
      update(nextCategories, nextCustom.filter(item => normalizeCategoryKey(item) !== key))
      return
    }

    if (totalSelected >= MAX_TOTAL_ARTIST_CATEGORIES) {
      setMessage(`You can select up to ${MAX_TOTAL_ARTIST_CATEGORIES} categories.`)
      return
    }

    update([...nextCategories, normalized], nextCustom)
  }

  function addCustomCategories() {
    setMessage('')
    const tokens = splitCategoryInput(customInput)

    if (tokens.length === 0) {
      setMessage('Enter a custom category first.')
      return
    }

    const nextCategories = [...value.categories]
    const nextCustom = [...value.customCategories]
    const seen = new Set([...nextCategories, ...nextCustom].map(normalizeCategoryKey))

    for (const token of tokens) {
      const normalized = normalizeCategoryValue(token)
      if (!normalized) continue
      if (normalized.length > MAX_CUSTOM_ARTIST_CATEGORY_LENGTH) {
        setMessage(`Custom categories must be ${MAX_CUSTOM_ARTIST_CATEGORY_LENGTH} characters or fewer.`)
        continue
      }
      const matchingOption = options.find(option => normalizeCategoryKey(option) === normalizeCategoryKey(normalized))
      if (matchingOption) {
        if (!seen.has(normalizeCategoryKey(matchingOption))) {
          if (nextCategories.length + nextCustom.length >= MAX_TOTAL_ARTIST_CATEGORIES) {
            setMessage(`You can select up to ${MAX_TOTAL_ARTIST_CATEGORIES} categories.`)
            break
          }
          nextCategories.push(matchingOption)
          seen.add(normalizeCategoryKey(matchingOption))
        }
        continue
      }
      if (seen.has(normalizeCategoryKey(normalized))) continue
      if (nextCategories.length + nextCustom.length >= MAX_TOTAL_ARTIST_CATEGORIES) {
        setMessage(`You can select up to ${MAX_TOTAL_ARTIST_CATEGORIES} categories.`)
        break
      }
      seen.add(normalizeCategoryKey(normalized))
      nextCustom.push(normalized)
    }

    update(nextCategories, nextCustom)
    setCustomInput('')
  }

  function removeSelected(category: string) {
    const key = normalizeCategoryKey(category)
    update(
      value.categories.filter(item => normalizeCategoryKey(item) !== key),
      value.customCategories.filter(item => normalizeCategoryKey(item) !== key)
    )
  }

  return (
    <div className="space-y-3 rounded-2xl border bg-white p-4 sm:p-5" style={{ border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{label}</p>
          <p className="mt-1 text-xs leading-5" style={{ color: 'var(--muted)' }}>{description}</p>
        </div>
        <span className="text-xs font-medium rounded-full px-2.5 py-1" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
          {totalSelected}/{MAX_TOTAL_ARTIST_CATEGORIES}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map(option => {
          const active = selectedKeySet.has(normalizeCategoryKey(option))
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggleCategory(option)}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors"
              style={{
                background: active ? 'var(--navy)' : 'white',
                color: active ? 'white' : 'var(--foreground)',
                borderColor: active ? 'var(--navy)' : 'var(--border)',
              }}
            >
              {option}
            </button>
          )
        })}
      </div>

      <div className="rounded-xl border border-dashed p-3 sm:p-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustomCategories()
              }
            }}
            placeholder="Add your own category"
            className="min-w-0 flex-1 rounded-xl bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-violet)]"
            style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
          />
          <button
            type="button"
            onClick={addCustomCategories}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--navy)' }}
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
        <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
          Press Enter or Add. Separate multiple custom categories with commas or line breaks.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {dedupeCategories([...value.categories, ...value.customCategories]).map(category => {
          const isCustom = value.customCategories.some(item => normalizeCategoryKey(item) === normalizeCategoryKey(category))

          return (
            <span
              key={category}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm"
              style={{
                background: isCustom ? 'var(--surface-2)' : 'var(--surface-2)',
                color: 'var(--foreground)',
                borderColor: isCustom ? 'var(--border)' : 'rgba(193,117,245,0.22)',
              }}
            >
              <span>{category}</span>
              <button
                type="button"
                onClick={() => removeSelected(category)}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-[rgba(0,23,57,0.05)]"
                aria-label={`Remove ${category}`}
                style={{ color: 'var(--muted)' }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )
        })}
      </div>

      {message && (
        <p className="text-xs" style={{ color: 'var(--accent-violet)' }}>
          {message}
        </p>
      )}
    </div>
  )
}
