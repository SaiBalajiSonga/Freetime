'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { Archive, UploadCloud, Search, Trash2, SquareCheck, Square, MinusSquare, ChevronLeft, ChevronRight, Hash, CheckSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getExamQuestions, getExamStats } from './actions'
import { deleteSelectedQuestions } from '../actions'
import { ExpandableRow, ExpandedContent, useExpandableRows } from '@/components/admin/expandable-row'

const diffColor: Record<string, string> = {
  easy:   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  hard:   'bg-red-500/10 text-red-400 border border-red-500/20',
}

function SelectAllIcon({ allSelected, someSelected }: { allSelected: boolean; someSelected: boolean }) {
  if (allSelected) return <SquareCheck className="h-4 w-4" />
  if (someSelected) return <MinusSquare className="h-4 w-4" />
  return <Square className="h-4 w-4" />
}

const TABLE_COLS = 8

export default function ExamBankPage() {
  const supabase = createClient()

  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // ── Filters ────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterDiff, setFilterDiff] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [filterChapter, setFilterChapter] = useState('')
  const [subjects, setSubjects] = useState<any[]>([])
  const [chapters, setChapters] = useState<any[]>([])

  // ── Pagination ─────────────────────────────────────────────────
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(30)
  const [totalCount, setTotalCount] = useState(0)
  const [globalStats, setGlobalStats] = useState<any>(null)

  const [isPending, startTransition] = useTransition()
  const { toggleRow, isOpen } = useExpandableRows()

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [debouncedSearch, filterDiff, filterType, filterSubject, filterChapter])

  useEffect(() => {
    setFilterChapter('')
    if (filterSubject) {
      supabase.from('chapters').select('id, name').eq('subject_id', filterSubject).order('name').then(({ data }) => setChapters(data ?? []))
    } else {
      supabase.from('chapters').select('id, name').order('name').then(({ data }) => setChapters(data ?? []))
    }
  }, [filterSubject])

  // ── Multi-select ───────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const allIds = questions.map((q: any) => q.id)
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id))
  const someSelected = allIds.some((id) => selected.has(id)) && !allSelected

  const toggleAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(allIds))
  }

  const toggleOne = (id: string) => {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const handleBulkDelete = () => {
    if (selected.size === 0) return
    const count = selected.size
    if (!confirm(`Delete ${count} selected question${count > 1 ? 's' : ''}? This cannot be undone.`)) return
    const ids = Array.from(selected)
    startTransition(() => {
      deleteSelectedQuestions(ids).then(() => {
        setSelected(new Set())
        setQuestions((prev) => prev.filter((q) => !selected.has(q.id)))
      })
    })
  }

  const handleDeleteOne = (id: string) => {
    if (!confirm('Delete this question?')) return
    startTransition(() => {
      deleteSelectedQuestions([id]).then(() => {
        setQuestions((prev) => prev.filter((q) => q.id !== id))
        setSelected((prev) => { const n = new Set(prev); n.delete(id); return n })
      })
    })
  }

  // ── Fetch ──────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await getExamQuestions(page, pageSize, {
        search: debouncedSearch,
        difficulty: filterDiff,
        type: filterType,
        subjectId: filterSubject,
        chapterId: filterChapter
      })
      setQuestions(res.data)
      setTotalCount(res.count)

      if (!globalStats) {
        const statsData = await getExamStats()
        setGlobalStats(statsData)
      }

      if (subjects.length === 0) {
        const { data: subs } = await supabase.from('subjects').select('id, name').order('name')
        setSubjects(subs ?? [])
      }
      setLoading(false)
    }
    load()
  }, [page, pageSize, debouncedSearch, filterDiff, filterType, filterSubject, filterChapter])

  const totalPages = Math.ceil(totalCount / pageSize)

  const statCards = [
    { label: 'Total Exam Qs', value: globalStats?.total ?? 0, icon: Archive,      accent: '#8b5cf6' },
    { label: 'MCQ',           value: globalStats?.mcq ?? 0,   icon: CheckSquare,  accent: '#a78bfa' },
    { label: 'Numerical',     value: globalStats?.num ?? 0,   icon: Hash,         accent: '#7c3aed' },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="size-9 rounded-md flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
              <Archive className="h-4 w-4 text-violet-400" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Exam Bank</h1>
            {globalStats && (
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}>
                {globalStats.total} questions
              </span>
            )}
          </div>
          <p className="text-[13px]" style={{ color: '#64748b' }}>
            Questions here are <span className="font-semibold text-white">invisible to students</span> during practice.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/import"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all"
            style={{ border: '1px solid #2a3142', background: '#161b27', color: '#94a3b8' }}
          >
            <UploadCloud className="h-4 w-4" />Bulk Import
          </Link>
          <Link href="/admin/questions/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-violet-600 text-white font-bold text-sm hover:bg-violet-500 transition-all shadow-[0_4px_14px_rgba(139,92,246,0.35)]"
          >
            + Add Question
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      {!loading && globalStats && (
        <div className="grid grid-cols-3 gap-4">
          {statCards.map(({ label, value, icon: Icon, accent }) => (
            <div key={label} className="rounded-lg p-4 flex items-center justify-between gap-3"
              style={{ background: '#161b27', border: '1px solid #2a3142' }}
            >
              <div className="size-9 rounded-md flex items-center justify-center shrink-0"
                style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
              >
                <Icon className="h-4 w-4" style={{ color: accent }} />
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-white tabular-nums">{value.toLocaleString()}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: '#64748b' }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg" style={{ background: '#161b27', border: '1px solid #2a3142' }}>
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: '#64748b' }} />
          <input type="text" placeholder="Search questions…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-sm font-medium rounded-md text-white placeholder:text-[#64748b] focus:outline-none transition-all"
            style={{ background: '#1c2333', border: '1px solid #2a3142' }}
          />
        </div>
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
          className="admin-select h-8 px-3 text-sm font-medium rounded-md text-white focus:outline-none cursor-pointer"
          style={{ background: '#1c2333', border: '1px solid #2a3142', minWidth: 120 }}
        >
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterChapter} onChange={e => setFilterChapter(e.target.value)}
          className="admin-select h-8 px-3 text-sm font-medium rounded-md text-white focus:outline-none cursor-pointer"
          style={{ background: '#1c2333', border: '1px solid #2a3142', minWidth: 120 }}
        >
          <option value="">All Chapters</option>
          {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)}
          className="admin-select h-8 px-3 text-sm font-medium rounded-md text-white focus:outline-none cursor-pointer"
          style={{ background: '#1c2333', border: '1px solid #2a3142', minWidth: 130 }}
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="admin-select h-8 px-3 text-sm font-medium rounded-md text-white focus:outline-none cursor-pointer"
          style={{ background: '#1c2333', border: '1px solid #2a3142', minWidth: 110 }}
        >
          <option value="">All Types</option>
          <option value="mcq">MCQ</option>
          <option value="numerical">Numerical</option>
        </select>
      </div>

      {/* Bulk toolbar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-1 animate-slide-down">
          <span className="text-sm font-semibold text-white">{selected.size} selected</span>
          <button type="button" onClick={handleBulkDelete} disabled={isPending}
            className="inline-flex items-center gap-1.5 h-7 px-3 text-xs font-bold rounded-md bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isPending ? 'Deleting…' : 'Delete selected'}
          </button>
          <button type="button" onClick={() => setSelected(new Set())} disabled={isPending}
            className="text-xs hover:text-white transition-colors" style={{ color: '#64748b' }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="rounded-lg overflow-hidden" style={{ background: '#161b27', border: '1px solid #2a3142' }}>
          <div className="animate-pulse flex flex-col">
            <div className="h-11" style={{ background: '#1c2333', borderBottom: '1px solid #2a3142' }} />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 flex items-center px-5 gap-4" style={{ borderBottom: '1px solid #1e2536' }}>
                <div className="h-3 w-3 bg-white/5 rounded" />
                <div className="h-3 w-8 bg-white/5 rounded" />
                <div className="h-3 w-1/3 bg-white/5 rounded" />
                <div className="h-3 w-1/4 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-lg border-dashed py-20 text-center" style={{ border: '2px dashed #2a3142', background: '#161b27' }}>
          <div className="size-14 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <Archive className="h-6 w-6 text-violet-400" />
          </div>
          <p className="font-bold text-white mb-1">Exam Bank is empty</p>
          <p className="text-[13px] mb-5 max-w-sm mx-auto" style={{ color: '#64748b' }}>
            Import questions with <code className="px-1 rounded text-violet-400" style={{ background: '#1c2333' }}>visibility: "exam"</code> or add individually.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/admin/import"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold transition-all"
              style={{ border: '1px solid #2a3142', background: '#1c2333', color: '#94a3b8' }}
            >
              <UploadCloud className="h-4 w-4" />Bulk Import
            </Link>
            <Link href="/admin/questions/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-violet-600 text-white font-bold text-sm hover:bg-violet-500 transition-all"
            >
              + Add Question
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ background: '#161b27', border: '1px solid #2a3142' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#1c2333', borderBottom: '1px solid #2a3142' }}>
                  <th className="py-3 pl-5 pr-2 w-10">
                    <button type="button" onClick={toggleAll}
                      className="transition-colors hover:text-white" style={{ color: '#64748b' }}
                      title={allSelected ? 'Deselect all' : 'Select all'}
                    >
                      <SelectAllIcon allSelected={allSelected} someSelected={someSelected} />
                    </button>
                  </th>
                  <th className="text-left py-3 px-5 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>#</th>
                  <th className="text-left py-3 px-5 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Question</th>
                  <th className="text-left py-3 px-5 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Subject / Chapter</th>
                  <th className="text-center py-3 px-5 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Type</th>
                  <th className="text-center py-3 px-5 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Difficulty</th>
                  <th className="text-left py-3 px-5 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Actions</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {questions.map((q: any, idx: number) => {
                  const expanded = isOpen(q.id)
                  const isSelected = selected.has(q.id)
                  const isEven = idx % 2 === 1
                  return [
                    <ExpandableRow
                      key={q.id}
                      id={q.id}
                      isOpen={expanded}
                      onToggle={toggleRow}
                      isSelected={isSelected}
                      style={{ background: isEven ? '#161b27' : '#0f1117', borderBottom: '1px solid #1e2536' }}
                    >
                      <td className="py-3.5 pl-5 pr-2" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => toggleOne(q.id)}
                          className={`transition-colors ${isSelected ? 'text-violet-400' : 'hover:text-white'}`}
                          style={isSelected ? {} : { color: '#64748b' }}
                        >
                          {isSelected ? <SquareCheck className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="py-3 px-5 font-mono text-sm" style={{ color: '#64748b' }}>{idx + 1}</td>
                      <td className="py-3 px-5 max-w-sm">
                        <p className="text-white text-[13px] line-clamp-1">
                          {q.statement.slice(0, 100)}{q.statement.length > 100 ? '…' : ''}
                        </p>
                      </td>
                      <td className="py-3 px-5">
                        <p className="text-sm font-semibold text-white">{q.chapters?.subjects?.name ?? '—'}</p>
                        <p className="text-[11px]" style={{ color: '#64748b' }}>{q.chapters?.name ?? '—'}</p>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            q.type === 'mcq'
                              ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                              : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          }`}>
                            {q.type === 'mcq' ? 'MCQ' : 'Num'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase">
                            EXAM
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold capitalize border ${diffColor[q.difficulty] ?? ''}`}>
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/questions/${q.id}/edit`}
                            className="px-2 py-1 rounded bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 text-[11px] font-bold transition-colors"
                          >
                            Edit
                          </Link>
                          <button type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteOne(q.id) }}
                            disabled={isPending}
                            className="text-red-500 hover:text-red-400 disabled:opacity-50 p-1 shrink-0 transition-colors"
                            title="Delete question"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </ExpandableRow>,
                    expanded && (
                      <ExpandedContent
                        key={`${q.id}-exp`}
                        colSpan={TABLE_COLS}
                        statement={q.statement}
                        type={q.type}
                        options={q.options}
                        correctAnswer={q.correct_answer}
                        hint={q.hint}
                        solution={q.solution}
                        imageUrl={q.image_url}
                      />
                    )
                  ]
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalCount > 0 && (
        <div className="flex items-center justify-between px-2 pt-2">
          <div className="flex items-center gap-4">
            <span className="text-[13px] font-medium" style={{ color: '#64748b' }}>
              {totalCount.toLocaleString()} questions
            </span>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
              className="admin-select h-8 px-2 text-[13px] font-medium rounded-md text-white focus:outline-none cursor-pointer"
              style={{ background: '#1c2333', border: '1px solid #2a3142' }}
            >
              {[15, 30, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            {page > 1 && (
              <button onClick={() => setPage(p => Math.max(1, p - 1))}
                className="size-8 rounded-md hover:bg-[#1c2333] flex items-center justify-center transition-colors text-[#64748b] hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number
              if (totalPages <= 7) p = i + 1
              else if (page <= 4) p = i + 1
              else if (page >= totalPages - 3) p = totalPages - 6 + i
              else p = page - 3 + i
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`size-8 rounded-md text-[13px] font-bold flex items-center justify-center transition-all ${
                    p === page ? 'bg-violet-600 text-white' : 'text-[#64748b] hover:bg-[#1c2333] hover:text-white'
                  }`}
                >
                  {p}
                </button>
              )
            })}
            {page < totalPages && (
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="size-8 rounded-md hover:bg-[#1c2333] flex items-center justify-center transition-colors text-[#64748b] hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
