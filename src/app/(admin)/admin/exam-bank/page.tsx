'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { ShieldCheck, UploadCloud, Search, ChevronDown, Trash2, SquareCheck, Square, MinusSquare, ChevronLeft, ChevronRight, Database } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getExamQuestions, getExamStats } from './actions'
import { deleteSelectedQuestions } from '../actions'
import { ExpandableRow, ExpandedContent, useExpandableRows } from '@/components/admin/expandable-row'
import { StatsBar } from '@/components/admin/stats-bar'

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

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])
  
  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filterDiff, filterType, filterSubject, filterChapter])

  // Fetch chapters when subject changes
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

  // ── Client-side filter ─────────────────────────────────────────
  const filtered = questions

  // ── Stats (unfiltered) ─────────────────────────────────────────
  const stats = globalStats ? [
    { label: 'Total', value: globalStats.total, color: 'text-violet-400' },
    { label: 'MCQ', value: globalStats.mcq, color: 'text-accent-cyan' },
    { label: 'Numerical', value: globalStats.num, color: 'text-amber-400' },
    { label: 'Easy', value: globalStats.easy, color: 'text-emerald-400' },
    { label: 'Medium', value: globalStats.medium, color: 'text-amber-400' },
    { label: 'Hard', value: globalStats.hard, color: 'text-red-400' },
  ] : []

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="h-5 w-5 text-violet-400" />
            <h1 className="text-2xl font-extrabold text-foreground tracking-[-0.03em]">Exam Bank</h1>
            <span className="text-sm font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full">
              {globalStats?.total ?? 0} questions
            </span>
          </div>
          <p className="text-[15px] text-muted">Questions here are <span className="font-semibold text-foreground">invisible to students</span> during practice.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/import" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-surface-2 text-foreground font-bold text-[15px] hover:bg-white/[0.08] transition-all">
            <UploadCloud className="h-4 w-4" />Bulk Import
          </Link>
          <Link href="/admin/questions/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-white font-bold text-[15px] shadow-[0_8px_24px_-6px_rgba(37,99,235,0.55)] hover:brightness-110 transition-all">
            + Add Question
          </Link>
        </div>
      </div>

      {/* Stats */}
      {!loading && globalStats && <StatsBar stats={stats} />}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-2 pointer-events-none" />
          <input type="text" placeholder="Search questions…" value={search} onChange={e => setSearch(e.target.value)} className="w-full h-8 pl-8 pr-3 text-sm font-medium rounded-lg border border-white/10 bg-white/[0.04] text-foreground placeholder:text-muted-2 focus:outline-none focus:border-accent-electric/40 transition-all" />
        </div>
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="admin-select h-8 px-3 pr-8 text-sm font-medium rounded-lg border border-white/10 bg-surface-2 text-foreground focus:outline-none cursor-pointer">
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterChapter} onChange={e => setFilterChapter(e.target.value)} className="admin-select h-8 px-3 pr-8 text-sm font-medium rounded-lg border border-white/10 bg-surface-2 text-foreground focus:outline-none cursor-pointer">
          <option value="">All Chapters</option>
          {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)} className="admin-select h-8 px-3 pr-8 text-sm font-medium rounded-lg border border-white/10 bg-surface-2 text-foreground focus:outline-none cursor-pointer">
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="admin-select h-8 px-3 pr-8 text-sm font-medium rounded-lg border border-white/10 bg-surface-2 text-foreground focus:outline-none cursor-pointer">
          <option value="">All Types</option>
          <option value="mcq">MCQ</option>
          <option value="numerical">Numerical</option>
        </select>
      </div>

      {/* ── Bulk toolbar ── */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-1 mt-2 animate-slide-down">
          <span className="text-sm font-semibold text-foreground">{selected.size} selected</span>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-bold rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isPending ? 'Deleting…' : 'Delete selected'}
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            disabled={isPending}
            className="text-xs text-muted hover:text-foreground transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="rounded-2xl border border-white/[0.08] bg-surface overflow-hidden">
          <div className="animate-pulse flex flex-col">
            <div className="h-12 bg-surface-2/60 border-b border-white/[0.08]" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 border-b border-white/[0.05] flex items-center px-5 gap-4">
                <div className="h-4 w-4 bg-white/5 rounded" />
                <div className="h-4 w-8 bg-white/5 rounded" />
                <div className="h-4 w-1/3 bg-white/5 rounded" />
                <div className="h-4 w-1/4 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-surface py-20 text-center">
          <div className="size-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-7 w-7 text-violet-400" />
          </div>
          <p className="font-bold text-foreground mb-1">Exam Bank is empty</p>
          <p className="text-[15px] text-muted mb-5 max-w-sm mx-auto">Import questions with <code className="bg-surface-2 px-1 rounded">visibility: "exam"</code> or add individually.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/admin/import" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.08] bg-surface-2 text-foreground font-bold text-[15px] hover:bg-white/[0.08] transition-all"><UploadCloud className="h-4 w-4" />Bulk Import</Link>
            <Link href="/admin/questions/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-primary text-white font-bold text-[15px] hover:brightness-110 transition-all">+ Add Question</Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] bg-surface-2/60">
                  <th className="py-3 pl-5 pr-2 w-10">
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="text-muted-2 hover:text-foreground transition-colors"
                      title={allSelected ? 'Deselect all' : 'Select all'}
                    >
                      <SelectAllIcon allSelected={allSelected} someSelected={someSelected} />
                    </button>
                  </th>
                  <th className="text-left py-3 px-5 text-xs font-bold uppercase tracking-widest text-muted-2">#</th>
                  <th className="text-left py-3 px-5 text-xs font-bold uppercase tracking-widest text-muted-2">Question</th>
                  <th className="text-left py-3 px-5 text-xs font-bold uppercase tracking-widest text-muted-2">Subject / Chapter</th>
                  <th className="text-center py-3 px-5 text-xs font-bold uppercase tracking-widest text-muted-2">Type</th>
                  <th className="text-center py-3 px-5 text-xs font-bold uppercase tracking-widest text-muted-2">Difficulty</th>
                  <th className="text-left py-3 px-5 text-xs font-bold uppercase tracking-widest text-muted-2">Actions</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filtered.map((q: any, idx: number) => {
                  const expanded = isOpen(q.id)
                  const isSelected = selected.has(q.id)
                  return [
                    <ExpandableRow key={q.id} id={q.id} isOpen={expanded} onToggle={toggleRow} isSelected={isSelected}>
                      <td className="py-3.5 pl-5 pr-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toggleOne(q.id)}
                          className={`transition-colors ${isSelected ? 'text-accent-electric' : 'text-muted-2 hover:text-foreground'}`}
                        >
                          {isSelected ? <SquareCheck className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="py-3 px-5 text-muted-2 text-sm font-mono">{idx + 1}</td>
                      <td className="py-3 px-5 max-w-sm">
                        <p className="text-foreground text-[15px] line-clamp-1 leading-snug">
                          {q.statement.slice(0, 100)}{q.statement.length > 100 ? '…' : ''}
                        </p>
                      </td>
                      <td className="py-3 px-5">
                        <p className="text-sm font-semibold text-foreground">{q.chapters?.subjects?.name ?? '—'}</p>
                        <p className="text-xs text-muted">{q.chapters?.name ?? '—'}</p>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${q.type === 'mcq' ? 'bg-accent-electric/10 text-accent-electric border border-accent-electric/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                          {q.type === 'mcq' ? 'MCQ' : 'Num'}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${diffColor[q.difficulty] ?? ''}`}>{q.difficulty}</span>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <Link href={`/admin/questions/${q.id}/edit`} className="text-amber-400 hover:text-amber-300 text-sm font-bold transition-colors">Edit</Link>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteOne(q.id) }}
                            disabled={isPending}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50 p-1 shrink-0 transition-colors"
                            title="Delete question"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* ── Pagination ── */}
      {!loading && totalCount > 0 && (
        <div className="flex items-center justify-between px-2 pt-2">
          <div className="flex items-center gap-4">
            <span className="text-[14px] text-muted-2 font-medium">
              Showing {totalCount.toLocaleString()} questions
            </span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
              className="admin-select h-8 px-2 pr-8 text-[14px] font-medium rounded-lg border border-white/10 bg-surface-2 text-foreground focus:outline-none cursor-pointer hover:bg-white/[0.04] transition-colors"
            >
              {[15, 30, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            {page > 1 && (
              <button onClick={() => setPage(p => Math.max(1, p - 1))} className="size-8 rounded-xl hover:bg-surface-2 flex items-center justify-center transition-colors text-muted-2 hover:text-foreground">
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
                <button key={p} onClick={() => setPage(p)} className={`size-8 rounded-xl text-[14px] font-bold flex items-center justify-center transition-all ${
                  p === page
                    ? 'bg-gradient-primary text-white shadow-[0_4px_12px_-4px_rgba(37,99,235,0.5)]'
                    : 'text-muted-2 hover:bg-surface-2 hover:text-foreground'
                }`}>
                  {p}
                </button>
              )
            })}
            {page < totalPages && (
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="size-8 rounded-xl hover:bg-surface-2 flex items-center justify-center transition-colors text-muted-2 hover:text-foreground">
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
