'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition, useState, useEffect, useRef } from 'react'
import { Search, X, BookOpen, Bookmark, Target, LayoutList, ListFilter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

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

  // Label Computations
  const subjectLabel = subjects.find(s => s.id === currentFilters.subject)?.name
  const chapterLabel = chapters?.find(c => c.id === currentFilters.chapter)?.name
  const diffLabel = currentFilters.difficulty === 'easy' ? 'Easy' : currentFilters.difficulty === 'medium' ? 'Medium' : currentFilters.difficulty === 'hard' ? 'Hard' : null
  const typeLabel = currentFilters.type === 'mcq' ? 'MCQ' : currentFilters.type === 'numerical' ? 'Numerical' : null

  // Color Computations
  const diffColor = currentFilters.difficulty === 'easy' ? 'text-emerald-400' : currentFilters.difficulty === 'medium' ? 'text-amber-400' : currentFilters.difficulty === 'hard' ? 'text-red-400' : 'text-[#64748b]'
  const typeColor = currentFilters.type === 'mcq' ? 'text-cyan-400' : currentFilters.type === 'numerical' ? 'text-purple-400' : 'text-[#64748b]'

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl shadow-md" style={{ background: '#0f1117', border: '1px solid #2a3142' }}>
      
      {/* ── Top Row: Search and Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[280px] group/search">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors" style={{ color: searchValue ? '#3b82f6' : '#64748b' }} />
          <input
            type="text"
            placeholder="Search questions by statement..."
            value={searchValue}
            onChange={(e) => {
              const val = e.target.value
              setSearchValue(val)
              if (debounceRef.current) clearTimeout(debounceRef.current)
              debounceRef.current = setTimeout(() => updateFilter('q', val), 400)
            }}
            className="w-full h-10 pl-10 pr-10 text-sm font-medium rounded-lg text-white focus:outline-none transition-all shadow-sm"
            style={{
              background: '#161b27',
              border: `1px solid ${searchValue ? '#3b82f6' : '#2a3142'}`,
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-md hover:bg-[#2a3142] text-[#94a3b8] hover:text-white transition-all opacity-0 invisible group-hover/search:opacity-100 group-hover/search:visible"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns Container */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          
          {/* Subject */}
          <Select
            value={currentFilters.subject || 'all'}
            onValueChange={(val) => {
              const safeVal = val || ''
              updateFilter('subject', safeVal === 'all' ? '' : safeVal)
              if (currentFilters.chapter) updateFilter('chapter', '')
            }}
          >
            <SelectTrigger className={`w-[160px] h-10 bg-[#161b27] border-${currentFilters.subject ? '[#3b82f6]' : '[#2a3142]'} text-white hover:bg-[#1c2333] transition-all shadow-sm rounded-lg flex items-center gap-2 px-3`}>
              <BookOpen className={`w-4 h-4 shrink-0 ${currentFilters.subject ? 'text-blue-400' : 'text-[#64748b]'}`} />
              <span className="flex-1 text-left truncate text-[13px] font-medium">
                {subjectLabel ? <span className="text-white">{subjectLabel}</span> : <span className="text-[#94a3b8]">Subject</span>}
              </span>
            </SelectTrigger>
            <SelectContent className="bg-[#1c2333] border-[#2a3142] text-white shadow-2xl rounded-lg">
              <SelectItem value="all" className="focus:bg-[#2a3142] focus:text-white cursor-pointer py-2">All Subjects</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id} className="focus:bg-[#2a3142] focus:text-white cursor-pointer py-2">{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Chapter */}
          <Select
            value={currentFilters.chapter || 'all'}
            onValueChange={(val) => {
              const safeVal = val || ''
              updateFilter('chapter', safeVal === 'all' ? '' : safeVal)
            }}
            disabled={visibleChapters.length === 0}
          >
            <SelectTrigger className={`w-[160px] h-10 bg-[#161b27] border-${currentFilters.chapter ? '[#3b82f6]' : '[#2a3142]'} text-white hover:bg-[#1c2333] transition-all shadow-sm rounded-lg flex items-center gap-2 px-3`}>
              <Bookmark className={`w-4 h-4 shrink-0 ${currentFilters.chapter ? 'text-blue-400' : 'text-[#64748b]'}`} />
              <span className="flex-1 text-left truncate text-[13px] font-medium">
                {chapterLabel ? <span className="text-white">{chapterLabel}</span> : <span className="text-[#94a3b8]">Chapter</span>}
              </span>
            </SelectTrigger>
            <SelectContent className="bg-[#1c2333] border-[#2a3142] text-white shadow-2xl rounded-lg">
              <SelectItem value="all" className="focus:bg-[#2a3142] focus:text-white cursor-pointer py-2">All Chapters</SelectItem>
              {visibleChapters.map((c) => (
                <SelectItem key={c.id} value={c.id} className="focus:bg-[#2a3142] focus:text-white cursor-pointer py-2">{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Difficulty */}
          <Select
            value={currentFilters.difficulty || 'all'}
            onValueChange={(val) => {
              const safeVal = val || ''
              updateFilter('difficulty', safeVal === 'all' ? '' : safeVal)
            }}
          >
            <SelectTrigger className={`w-[140px] h-10 bg-[#161b27] border-${currentFilters.difficulty ? '[#3b82f6]' : '[#2a3142]'} text-white hover:bg-[#1c2333] transition-all shadow-sm rounded-lg flex items-center gap-2 px-3`}>
              <Target className={`w-4 h-4 shrink-0 ${diffColor}`} />
              <span className="flex-1 text-left truncate text-[13px] font-medium">
                {diffLabel ? <span className="text-white">{diffLabel}</span> : <span className="text-[#94a3b8]">Difficulty</span>}
              </span>
            </SelectTrigger>
            <SelectContent className="bg-[#1c2333] border-[#2a3142] text-white shadow-2xl rounded-lg">
              <SelectItem value="all" className="focus:bg-[#2a3142] focus:text-white cursor-pointer py-2">All Difficulties</SelectItem>
              <SelectItem value="easy" className="focus:bg-[#2a3142] focus:text-white cursor-pointer text-emerald-400 py-2">Easy</SelectItem>
              <SelectItem value="medium" className="focus:bg-[#2a3142] focus:text-white cursor-pointer text-amber-400 py-2">Medium</SelectItem>
              <SelectItem value="hard" className="focus:bg-[#2a3142] focus:text-white cursor-pointer text-red-400 py-2">Hard</SelectItem>
            </SelectContent>
          </Select>

          {/* Type */}
          <Select
            value={currentFilters.type || 'all'}
            onValueChange={(val) => {
              const safeVal = val || ''
              updateFilter('type', safeVal === 'all' ? '' : safeVal)
            }}
          >
            <SelectTrigger className={`w-[130px] h-10 bg-[#161b27] border-${currentFilters.type ? '[#3b82f6]' : '[#2a3142]'} text-white hover:bg-[#1c2333] transition-all shadow-sm rounded-lg flex items-center gap-2 px-3`}>
              <LayoutList className={`w-4 h-4 shrink-0 ${typeColor}`} />
              <span className="flex-1 text-left truncate text-[13px] font-medium">
                {typeLabel ? <span className="text-white">{typeLabel}</span> : <span className="text-[#94a3b8]">Type</span>}
              </span>
            </SelectTrigger>
            <SelectContent className="bg-[#1c2333] border-[#2a3142] text-white shadow-2xl rounded-lg">
              <SelectItem value="all" className="focus:bg-[#2a3142] focus:text-white cursor-pointer py-2">All Types</SelectItem>
              <SelectItem value="mcq" className="focus:bg-[#2a3142] focus:text-white cursor-pointer text-cyan-400 py-2">MCQ</SelectItem>
              <SelectItem value="numerical" className="focus:bg-[#2a3142] focus:text-white cursor-pointer text-purple-400 py-2">Numerical</SelectItem>
            </SelectContent>
          </Select>

        </div>
      </div>

      {/* ── Bottom Row: Active Filters Summary ── */}
      {hasFilters && (
        <div className="flex items-center justify-between pt-3 border-t border-[#2a3142]/60">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md">
              <ListFilter className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wide">
                {[currentFilters.q, currentFilters.subject, currentFilters.chapter, currentFilters.difficulty, currentFilters.type].filter(Boolean).length} Active Filters
              </span>
            </div>
            {/* We could render individual chips here, but the active state on the dropdowns serves this purpose beautifully */}
          </div>
          
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1.5 h-7 px-3 text-xs font-bold rounded-md bg-[#1c2333] hover:bg-[#2a3142] border border-[#2a3142] text-[#94a3b8] hover:text-white transition-all shadow-sm"
          >
            <X className="h-3 w-3" />
            Clear All
          </button>
        </div>
      )}
    </div>
  )
}
