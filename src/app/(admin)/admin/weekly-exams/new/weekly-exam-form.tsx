'use client'

import { useState, useTransition, useEffect, useCallback, useRef } from 'react'
import { createWeeklyExam } from './actions'
import { getExamQuestions } from '../../exam-bank/actions'
import {
  Search, X, CheckSquare, Square, BookOpen,
  FlaskConical, Calculator, ChevronDown, ChevronUp,
  LayoutGrid, ListFilter, Trophy, ChevronLeft, ChevronRight, Loader2,
  Calendar, Clock
} from 'lucide-react'

type Question = {
  id: string
  statement: string
  type: string
  difficulty: string
  visibility: string
  chapters: { name: string; subjects: { id: string, name: string } } | null
}

const SUBJECT_ICONS: Record<string, React.ReactNode> = {
  Physics:     <FlaskConical className="h-4 w-4" />,
  Chemistry:   <FlaskConical className="h-4 w-4" />,
  Mathematics: <Calculator className="h-4 w-4" />,
  Maths:       <Calculator className="h-4 w-4" />,
}

const diffColor: Record<string, string> = {
  easy:   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  medium: 'bg-amber-500/10  text-amber-400  border border-amber-500/20',
  hard:   'bg-red-500/10    text-red-400    border border-red-500/20',
}

const inputCls =
  'w-full bg-surface-2 border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-2 focus:border-accent-glow focus:outline-none focus:ring-2 focus:ring-accent-glow/30 transition text-sm'
const textareaCls = `${inputCls} resize-none`

function CustomDateTimePicker({ name, required, label }: { name: string, required?: boolean, label: string }) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleOpenPicker = () => {
    if (inputRef.current) {
      try {
        inputRef.current.showPicker()
      } catch (err) {
        inputRef.current.focus()
      }
    }
  }

  return (
    <div className="space-y-2 relative group" onClick={handleOpenPicker}>
      <label className="text-sm font-medium text-foreground">{label} {required && <span className="text-red-400">*</span>}</label>
      <div className="relative">
        <input 
          ref={inputRef}
          type="datetime-local" 
          name={name} 
          required={required}
          value={value}
          onChange={e => setValue(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className={`w-full bg-surface-2 border ${value ? 'border-accent-glow/50 ring-1 ring-accent-glow/20 shadow-[0_0_15px_-3px_rgba(37,99,235,0.15)]' : 'border-border group-hover:border-border-strong'} rounded-xl px-4 py-3.5 flex items-center justify-between text-sm transition-all duration-300`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${value ? 'bg-accent-electric/15 text-accent-electric' : 'bg-surface border border-border text-muted group-hover:text-foreground'}`}>
              <Calendar className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className={value ? 'text-foreground font-semibold' : 'text-muted-2 font-medium'}>
                {value ? new Date(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Select Date & Time'}
              </span>
              {value && (
                <span className="text-[11px] text-accent-cyan font-medium flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3" />
                  {new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </span>
              )}
            </div>
          </div>
          <div className="text-muted group-hover:text-accent-glow transition-colors">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function WeeklyExamForm({ initialSubjects }: { initialSubjects: { id: string; name: string }[] }) {
  const [selectedQuestions, setSelectedQuestions] = useState<Map<string, Question>>(new Map())
  const [questions, setQuestions] = useState<Question[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [search, setSearch]             = useState('')
  const [activeSubjectId, setActiveSubjectId] = useState<string>('all')
  const [typeFilter, setTypeFilter]     = useState<'all' | 'mcq' | 'numerical'>('all')
  const [diffFilter, setDiffFilter]     = useState<'all' | 'easy' | 'medium' | 'hard'>('all')
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'exam' | 'public' | 'hidden'>('exam')
  const [collapsedChapters, setCollapsedChapters] = useState<Set<string>>(new Set())
  const [error, setError]               = useState<string | null>(null)
  const [isPending, startTransition]    = useTransition()

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    const result = await getExamQuestions(page, pageSize, {
      search: search.trim() || undefined,
      difficulty: diffFilter !== 'all' ? diffFilter : undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      subjectId: activeSubjectId !== 'all' ? activeSubjectId : undefined,
      visibility: visibilityFilter !== 'all' ? visibilityFilter : 'all',
    })
    setQuestions((result.data as any[]) || [])
    setTotalCount(result.count || 0)
    setLoading(false)
  }, [page, search, diffFilter, typeFilter, activeSubjectId, visibilityFilter])

  useEffect(() => {
    // Reset to page 1 when filters change
    setPage(1)
  }, [search, diffFilter, typeFilter, activeSubjectId, visibilityFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuestions()
    }, 300) // Debounce fetch
    return () => clearTimeout(timer)
  }, [fetchQuestions])

  const subjects = [{ id: 'all', name: 'All' }, ...initialSubjects]

  // Group fetched questions by chapter
  const grouped: Record<string, Question[]> = {}
  questions.forEach(q => {
    const ch = q.chapters?.name ?? 'Uncategorised'
    if (!grouped[ch]) grouped[ch] = []
    grouped[ch].push(q)
  })

  // Stats
  const selectedList = Array.from(selectedQuestions.values())
  const mcqSelected = selectedList.filter(q => q.type === 'mcq').length
  const numSelected = selectedList.filter(q => q.type === 'numerical').length
  const maxMarks    = mcqSelected * 4 + numSelected * 4

  function toggle(q: Question) {
    setSelectedQuestions(prev => {
      const next = new Map(prev)
      if (next.has(q.id)) next.delete(q.id)
      else next.set(q.id, q)
      return next
    })
  }

  function toggleChapter(chapter: string) {
    setCollapsedChapters(prev => { const n = new Set(prev); n.has(chapter) ? n.delete(chapter) : n.add(chapter); return n })
  }

  function selectAllVisible() {
    setSelectedQuestions(prev => {
      const next = new Map(prev)
      questions.forEach(q => next.set(q.id, q))
      return next
    })
  }

  function deselectAllVisible() {
    setSelectedQuestions(prev => {
      const next = new Map(prev)
      questions.forEach(q => next.delete(q.id))
      return next
    })
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    formData.set('question_ids', JSON.stringify(Array.from(selectedQuestions.keys())))
    startTransition(async () => {
      const result = await createWeeklyExam(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-[-0.03em]">Create Exam Paper</h1>
        <p className="text-sm text-muted mt-1">Set exam details, then pick questions from the Exam Bank.</p>
      </div>

      <form action={handleSubmit} className="space-y-6">

        {/* ── Exam Details ── */}
        <div className="rounded-lg border border-border bg-surface overflow-hidden">
          <div className="border-b border-border px-6 py-4 bg-surface-2/40">
            <h2 className="font-bold text-foreground">Exam Details</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Title <span className="text-red-400">*</span></label>
              <input name="title" required placeholder="e.g. JEE Mock Test — Week 12" className={inputCls} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description <span className="text-muted-2 font-normal">(optional)</span></label>
              <textarea name="description" rows={2} placeholder="Brief description for students…" className={textareaCls} />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <CustomDateTimePicker name="starts_at" label="Starts At" required />
              <CustomDateTimePicker name="ends_at" label="Ends At" required />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Duration (minutes) <span className="text-red-400">*</span></label>
                <input name="duration_minutes" type="number" defaultValue={180} min={5} required className={inputCls} />
              </div>
              <div className="flex items-center gap-3 pt-7">
                <input name="is_published" id="is_published" type="checkbox"
                  className="size-4 rounded border-border accent-violet-500 cursor-pointer" />
                <label htmlFor="is_published" className="text-sm font-medium text-foreground cursor-pointer">
                  Publish immediately (visible to students)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ── Question Paper Builder ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">

          {/* Left: Question picker */}
          <div className="rounded-lg border border-border bg-surface overflow-hidden flex flex-col">
            {/* Header */}
            <div className="border-b border-border px-5 py-4 bg-surface-2/40 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-muted" />
                  <span className="font-bold text-foreground">Question Bank</span>
                  <span className="text-xs text-muted px-2 py-0.5 bg-surface-2 border border-border rounded-full">
                    {totalCount} total
                  </span>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={selectAllVisible}
                    className="text-xs font-bold text-accent-cyan hover:text-accent-glow transition-colors px-2 py-1 rounded-md hover:bg-surface-2">
                    Select visible
                  </button>
                  <button type="button" onClick={deselectAllVisible}
                    className="text-xs font-bold text-muted hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-surface-2">
                    Deselect visible
                  </button>
                </div>
              </div>

              {/* Subject tabs */}
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                {subjects.map(sub => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setActiveSubjectId(sub.id)}
                    className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeSubjectId === sub.id
                        ? 'bg-gradient-primary text-white shadow-sm'
                        : 'bg-surface-2 text-muted border border-border hover:border-border-strong hover:text-foreground'
                    }`}
                  >
                    {sub.id !== 'all' && (SUBJECT_ICONS[sub.name] ?? <BookOpen className="h-3.5 w-3.5" />)}
                    {sub.name}
                  </button>
                ))}
              </div>

              {/* Filters row */}
              <div className="flex gap-2 flex-wrap">
                {/* Source filter */}
                <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-lg border border-border">
                  {(['exam', 'public', 'hidden', 'all'] as const).map(v => (
                    <button key={v} type="button" onClick={() => setVisibilityFilter(v)}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold capitalize transition-all ${
                        visibilityFilter === v
                          ? 'bg-gradient-primary text-white shadow-sm'
                          : 'text-muted hover:text-foreground'
                      }`}>
                      {v === 'exam' ? 'Exam Bank' : v === 'public' ? 'PYQs' : v}
                    </button>
                  ))}
                </div>
                {/* Search */}
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
                  <input type="text" placeholder="Search questions…" value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-lg pl-8 pr-8 py-1.5 text-xs text-foreground placeholder:text-muted-2 focus:outline-none focus:border-accent-glow/60 transition" />
                  {search && (
                    <button type="button" onClick={() => setSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {/* Type filter */}
                <div className="flex items-center gap-1">
                  <ListFilter className="h-3.5 w-3.5 text-muted" />
                  {(['all', 'mcq', 'numerical'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setTypeFilter(t)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        typeFilter === t
                          ? 'bg-accent-electric/10 text-accent-electric border border-accent-electric/30'
                          : 'text-muted border border-border hover:border-border-strong'
                      }`}>
                      {t === 'all' ? 'All' : t === 'mcq' ? 'MCQ' : 'Num'}
                    </button>
                  ))}
                </div>
                {/* Diff filter */}
                <div className="flex items-center gap-1">
                  {(['all', 'easy', 'medium', 'hard'] as const).map(d => (
                    <button key={d} type="button" onClick={() => setDiffFilter(d)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all ${
                        diffFilter === d
                          ? (d === 'all' ? 'bg-surface-2 border border-border-strong text-foreground'
                              : diffColor[d] + ' !border-opacity-60')
                          : 'text-muted border border-border hover:border-border-strong'
                      }`}>
                      {d === 'all' ? 'Any Diff' : d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Question list */}
            <div className="overflow-y-auto max-h-[520px] p-3 space-y-2 relative">
              {loading && (
                <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-accent-cyan" />
                  <span className="text-xs text-muted mt-2 font-medium">Loading questions...</span>
                </div>
              )}

              {Object.keys(grouped).length === 0 && !loading ? (
                <div className="py-16 text-center">
                  <BookOpen className="h-8 w-8 text-muted-2 mx-auto mb-3" />
                  <p className="text-sm font-bold text-foreground mb-1">No questions match</p>
                  <p className="text-xs text-muted">Try clearing the filters or search.</p>
                </div>
              ) : (
                Object.entries(grouped).map(([chapter, qs]) => {
                  const isCollapsed = collapsedChapters.has(chapter)
                  const selectedInChapter = qs.filter(q => selectedQuestions.has(q.id)).length
                  return (
                    <div key={chapter} className="rounded-md border border-border overflow-hidden">
                      {/* Chapter header */}
                      <button type="button" onClick={() => toggleChapter(chapter)}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-surface-2/60 hover:bg-surface-2 transition-colors text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">{chapter}</span>
                          <span className="text-[10px] text-muted bg-surface border border-border px-1.5 py-0.5 rounded-full">
                            {qs.length}
                          </span>
                          {selectedInChapter > 0 && (
                            <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded-full">
                              {selectedInChapter} selected
                            </span>
                          )}
                        </div>
                        {isCollapsed
                          ? <ChevronDown className="h-3.5 w-3.5 text-muted" />
                          : <ChevronUp className="h-3.5 w-3.5 text-muted" />}
                      </button>

                      {/* Questions */}
                      {!isCollapsed && (
                        <div className="divide-y divide-border/50">
                          {qs.map(q => {
                            const sel = selectedQuestions.has(q.id)
                            return (
                              <button key={q.id} type="button" onClick={() => toggle(q)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                                  sel ? 'bg-violet-500/6 hover:bg-violet-500/10' : 'hover:bg-surface-2/50'
                                }`}>
                                <span className={`flex-shrink-0 ${sel ? 'text-violet-400' : 'text-muted-2'}`}>
                                  {sel ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                </span>
                                <span className="flex-1 text-xs text-foreground line-clamp-2 text-left leading-relaxed">
                                  {q.statement}
                                </span>
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                  <div className="flex gap-1">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                      q.visibility === 'public'
                                        ? 'bg-blue-500/10 text-blue-400'
                                        : q.visibility === 'hidden'
                                        ? 'bg-gray-500/10 text-gray-400'
                                        : 'bg-indigo-500/10 text-indigo-400'
                                    }`}>
                                      {q.visibility === 'public' ? 'PYQ' : q.visibility === 'hidden' ? 'Hidden' : 'Bank'}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                      q.type === 'mcq'
                                        ? 'bg-accent-electric/10 text-accent-electric'
                                        : 'bg-purple-500/10 text-purple-400'
                                    }`}>
                                      {q.type === 'mcq' ? 'MCQ' : 'Num'}
                                    </span>
                                  </div>
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold capitalize ${diffColor[q.difficulty]}`}>
                                    {q.difficulty}
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Pagination Controls */}
            {totalCount > pageSize && (
              <div className="border-t border-border px-5 py-3 bg-surface-2/40 flex items-center justify-between">
                <span className="text-xs text-muted font-medium">
                  Showing {Math.min((page - 1) * pageSize + 1, totalCount)} – {Math.min(page * pageSize, totalCount)} of {totalCount}
                </span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-1 rounded text-muted hover:text-foreground hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= totalCount}
                    className="p-1 rounded text-muted hover:text-foreground hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Paper summary panel */}
          <div className="space-y-4">
            {/* Summary card */}
            <div className="rounded-lg border border-border bg-surface overflow-hidden">
              <div className="border-b border-border px-5 py-4 bg-surface-2/40">
                <h3 className="font-bold text-foreground text-sm">Paper Summary</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Qs', value: selectedQuestions.size, icon: <BookOpen className="h-3.5 w-3.5" />, color: 'text-violet-400' },
                    { label: 'Max Marks', value: maxMarks, icon: <Trophy className="h-3.5 w-3.5" />, color: 'text-amber-400' },
                    { label: 'MCQ', value: mcqSelected, icon: null, color: 'text-cyan-400' },
                    { label: 'Numerical', value: numSelected, icon: null, color: 'text-purple-400' },
                  ].map(s => (
                    <div key={s.label} className="rounded-md border border-border bg-surface-2 p-3 text-center">
                      <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
                      <div className="text-[10px] text-muted font-medium mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Subject breakdown */}
                {selectedQuestions.size > 0 && (() => {
                  const bySub: Record<string, number> = {}
                  selectedList.forEach(q => {
                    const s = q.chapters?.subjects?.name ?? 'Other'
                    bySub[s] = (bySub[s] ?? 0) + 1
                  })
                  return (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-2">By Subject</p>
                      {Object.entries(bySub).map(([sub, count]) => (
                        <div key={sub} className="flex items-center justify-between">
                          <span className="text-xs text-muted">{sub}</span>
                          <span className="text-xs font-bold text-foreground">{count}Q</span>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Selected question list (compact) */}
            {selectedQuestions.size > 0 && (
              <div className="rounded-lg border border-border bg-surface overflow-hidden">
                <div className="border-b border-border px-5 py-3 bg-surface-2/40 flex items-center justify-between">
                  <h3 className="font-bold text-foreground text-sm">Selected</h3>
                  <button type="button" onClick={() => setSelectedQuestions(new Map())}
                    className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors">
                    Clear all
                  </button>
                </div>
                <div className="max-h-[280px] overflow-y-auto divide-y divide-border/50">
                  {selectedList.map((q, i) => (
                    <div key={q.id} className="flex items-start gap-2 px-4 py-2.5">
                      <span className="text-[10px] font-bold text-muted-2 mt-0.5 w-5 flex-shrink-0">{i + 1}.</span>
                      <p className="text-[11px] text-foreground line-clamp-2 flex-1 leading-relaxed">{q.statement}</p>
                      <button type="button" onClick={() => toggle(q)}
                        className="text-muted hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <input type="hidden" name="question_ids" value={JSON.stringify(Array.from(selectedQuestions.keys()))} readOnly />

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        <div className="flex items-center gap-4">
          <button type="submit"
            disabled={isPending || selectedQuestions.size === 0}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-gradient-primary text-white font-bold text-sm shadow-[0_8px_24px_-6px_rgba(37,99,235,0.55)] hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {isPending ? 'Creating…' : `Publish Exam (${selectedQuestions.size} questions · ${maxMarks} marks)`}
          </button>
          <a href="/admin/weekly-exams" className="text-sm text-muted hover:text-foreground transition-colors">
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}
