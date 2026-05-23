'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Search, X } from 'lucide-react'

type Subject = { id: string; name: string }
type Filters = {
  q?: string
  subject?: string
  difficulty?: string
  type?: string
}

export function FilterBar({
  subjects,
  currentFilters,
}: {
  subjects: Subject[]
  currentFilters: Filters
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      // Reset to page 1 on filter change
      params.delete('page')
      startTransition(() => {
        router.push(`/admin?${params.toString()}`)
      })
    },
    [router, searchParams]
  )

  const clearFilters = useCallback(() => {
    startTransition(() => {
      router.push('/admin')
    })
  }, [router])

  const hasFilters = !!(
    currentFilters.q ||
    currentFilters.subject ||
    currentFilters.difficulty ||
    currentFilters.type
  )

  return (
    <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-2 pointer-events-none" />
        <input
          type="text"
          id="filter-search"
          placeholder="Search questions…"
          defaultValue={currentFilters.q ?? ''}
          onChange={(e) => {
            // Debounce via a timeout
            const val = e.target.value
            const timer = setTimeout(() => updateFilter('q', val), 400)
            return () => clearTimeout(timer)
          }}
          className="w-full h-8 pl-8 pr-3 text-sm font-medium rounded-lg border border-white/10 bg-white/[0.04] text-foreground placeholder:text-muted-2 focus:outline-none focus:border-accent-electric/40 focus:ring-1 focus:ring-accent-electric/20 transition-all"
          style={{ opacity: isPending ? 0.7 : 1 }}
        />
      </div>

      {/* Subject */}
      <select
        id="filter-subject"
        value={currentFilters.subject ?? ''}
        onChange={(e) => updateFilter('subject', e.target.value)}
        className="admin-select h-8 px-3 pr-8 text-sm font-medium rounded-lg border border-white/10 bg-surface-2 text-foreground focus:outline-none focus:border-accent-electric/40 transition-all cursor-pointer"
      >
        <option value="">All Subjects</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {/* Difficulty */}
      <select
        id="filter-difficulty"
        value={currentFilters.difficulty ?? ''}
        onChange={(e) => updateFilter('difficulty', e.target.value)}
        className="admin-select h-8 px-3 pr-8 text-sm font-medium rounded-lg border border-white/10 bg-surface-2 text-foreground focus:outline-none focus:border-accent-electric/40 transition-all cursor-pointer"
      >
        <option value="">All Difficulties</option>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>

      {/* Type */}
      <select
        id="filter-type"
        value={currentFilters.type ?? ''}
        onChange={(e) => updateFilter('type', e.target.value)}
        className="admin-select h-8 px-3 pr-8 text-sm font-medium rounded-lg border border-white/10 bg-surface-2 text-foreground focus:outline-none focus:border-accent-electric/40 transition-all cursor-pointer"
      >
        <option value="">All Types</option>
        <option value="mcq">MCQ</option>
        <option value="numerical">Numerical</option>
      </select>

      {/* Clear */}
      {hasFilters && (
        <div className="flex items-center gap-2 ml-auto pl-2 border-l border-white/10">
          <span className="text-[11px] font-bold text-accent-electric bg-accent-electric/10 border border-accent-electric/20 px-2 py-0.5 rounded-full">
            {[currentFilters.q, currentFilters.subject, currentFilters.difficulty, currentFilters.type].filter(Boolean).length} active
          </span>
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 h-8 px-3 text-xs font-bold text-muted hover:text-foreground transition-colors"
            id="clear-filters"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
