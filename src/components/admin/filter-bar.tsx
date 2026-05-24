'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition, useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

type Subject = { id: string; name: string }
type Chapter = { id: string; name: string; subject_id: string }
type Filters = {
  q?: string
  subject?: string
  chapter?: string
  difficulty?: string
  type?: string
}

export function FilterBar({
  subjects = [],
  chapters = [],
  currentFilters,
  basePath = '/admin/questions',
}: {
  subjects: Subject[]
  chapters?: Chapter[]
  currentFilters: Filters
  basePath?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [searchValue, setSearchValue] = useState(currentFilters.q ?? '')
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setSearchValue(currentFilters.q ?? '')
  }, [currentFilters.q])

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      startTransition(() => {
        router.push(`${basePath}?${params.toString()}`)
      })
    },
    [router, searchParams, basePath]
  )

  const clearFilters = useCallback(() => {
    startTransition(() => {
      router.push(basePath)
    })
  }, [router, basePath])

  const hasFilters = !!(
    currentFilters.q ||
    currentFilters.subject ||
    currentFilters.chapter ||
    currentFilters.difficulty ||
    currentFilters.type
  )

  const safeChapters = chapters || []
  const visibleChapters = currentFilters.subject 
    ? safeChapters.filter(c => c.subject_id === currentFilters.subject)
    : safeChapters

  return (
    <div
      className="flex flex-wrap items-center gap-2 p-3 rounded-lg"
      style={{ background: '#161b27', border: '1px solid #2a3142' }}
    >
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm group/search">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: '#64748b' }} />
        <input
          type="text"
          id="filter-search"
          placeholder="Search questions…"
          value={searchValue}
          onChange={(e) => {
            const val = e.target.value
            setSearchValue(val)
            if (debounceRef.current) clearTimeout(debounceRef.current)
            debounceRef.current = setTimeout(() => updateFilter('q', val), 400)
          }}
          className="w-full h-8 pl-8 pr-8 text-sm font-medium rounded-md text-white placeholder:text-[#64748b] focus:outline-none transition-all"
          style={{
            background: '#1c2333',
            border: '1px solid #2a3142',
            opacity: isPending ? 0.7 : 1,
          }}
        />
        {searchValue && (
          <button
            type="button"
            title="Clear search"
            onClick={() => {
              setSearchValue('')
              if (debounceRef.current) clearTimeout(debounceRef.current)
              updateFilter('q', '')
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center rounded-sm hover:bg-[#2a3142] text-[#64748b] hover:text-white transition-all opacity-0 invisible group-hover/search:opacity-100 group-hover/search:visible"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Subject */}
      <select
        id="filter-subject"
        value={currentFilters.subject ?? ''}
        onChange={(e) => {
          updateFilter('subject', e.target.value)
          // Also clear chapter when subject changes to prevent orphaned chapter filters
          if (currentFilters.chapter) {
            updateFilter('chapter', '')
          }
        }}
        className="admin-select h-8 px-3 text-sm font-medium rounded-md text-white focus:outline-none cursor-pointer"
        style={{ background: '#1c2333', border: '1px solid #2a3142', minWidth: 120 }}
      >
        <option value="">All Subjects</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      {/* Chapter */}
      <select
        id="filter-chapter"
        value={currentFilters.chapter ?? ''}
        onChange={(e) => updateFilter('chapter', e.target.value)}
        className="admin-select h-8 px-3 text-sm font-medium rounded-md text-white focus:outline-none cursor-pointer"
        style={{ background: '#1c2333', border: '1px solid #2a3142', minWidth: 120 }}
        disabled={visibleChapters.length === 0}
      >
        <option value="">All Chapters</option>
        {visibleChapters.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {/* Difficulty */}
      <select
        id="filter-difficulty"
        value={currentFilters.difficulty ?? ''}
        onChange={(e) => updateFilter('difficulty', e.target.value)}
        className="admin-select h-8 px-3 text-sm font-medium rounded-md text-white focus:outline-none cursor-pointer"
        style={{ background: '#1c2333', border: '1px solid #2a3142', minWidth: 130 }}
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
        className="admin-select h-8 px-3 text-sm font-medium rounded-md text-white focus:outline-none cursor-pointer"
        style={{ background: '#1c2333', border: '1px solid #2a3142', minWidth: 110 }}
      >
        <option value="">All Types</option>
        <option value="mcq">MCQ</option>
        <option value="numerical">Numerical</option>
      </select>

      {/* Clear */}
      {hasFilters && (
        <div className="flex items-center gap-2 ml-auto pl-2" style={{ borderLeft: '1px solid #2a3142' }}>
          <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
            {[currentFilters.q, currentFilters.subject, currentFilters.chapter, currentFilters.difficulty, currentFilters.type].filter(Boolean).length} active
          </span>
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 h-7 px-3 text-xs font-bold rounded-md hover:text-white transition-colors"
            style={{ color: '#64748b' }}
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
