'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { ShieldCheck, UploadCloud, Search, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { moveQuestionVisibility } from './actions'
import { ExpandableRow, ExpandedContent, useExpandableRows } from '@/components/admin/expandable-row'
import { StatsBar } from '@/components/admin/stats-bar'

export const metadata = {
  title: 'Exam Bank — Admin',
}

const diffColor: Record<string, string> = {
  easy:   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  hard:   'bg-red-500/10 text-red-400 border border-red-500/20',
}

const TABLE_COLS = 7

export default function ExamBankPage() {
  const supabase = createClient()

  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // ── Filters ────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [filterDiff, setFilterDiff] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [subjects, setSubjects] = useState<any[]>([])

  const [isPending, startTransition] = useTransition()
  const { toggleRow, isOpen } = useExpandableRows()

  // ── Fetch ──────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('questions')
        .select('id, statement, type, difficulty, image_url, correct_answer, hint, solution, chapters(name, subjects(id, name)), options:question_options(id, text, is_correct)')
        .eq('visibility', 'exam')
        .order('created_at', { ascending: false })
      setQuestions((data as any[]) ?? [])

      const { data: subs } = await supabase.from('subjects').select('id, name').order('name')
      setSubjects(subs ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // ── Client-side filter ─────────────────────────────────────────
  const filtered = questions.filter((q: any) => {
    if (search && !q.statement.toLowerCase().includes(search.toLowerCase())) return false
    if (filterDiff && q.difficulty !== filterDiff) return false
    if (filterType && q.type !== filterType) return false
    if (filterSubject && q.chapters?.subjects?.id !== filterSubject) return false
    return true
  })

  // ── Stats (unfiltered) ─────────────────────────────────────────
  const stats = [
    { label: 'Total', value: questions.length, color: 'text-violet-400' },
    { label: 'MCQ', value: questions.filter(q => q.type === 'mcq').length, color: 'text-accent-cyan' },
    { label: 'Numerical', value: questions.filter(q => q.type === 'numerical').length, color: 'text-amber-400' },
    { label: 'Easy', value: questions.filter(q => q.difficulty === 'easy').length, color: 'text-emerald-400' },
    { label: 'Medium', value: questions.filter(q => q.difficulty === 'medium').length, color: 'text-amber-400' },
    { label: 'Hard', value: questions.filter(q => q.difficulty === 'hard').length, color: 'text-red-400' },
  ]

  function handleMove(id: string) {
    if (!confirm('Move this question to the Practice Pool? Students will be able to see it.')) return
    startTransition(async () => {
      await moveQuestionVisibility(id, 'public')
      setQuestions((prev) => prev.filter((q) => q.id !== id))
    })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-5 w-5 text-violet-400" />
            <h1 className="text-2xl font-extrabold text-foreground tracking-[-0.03em]">Exam Bank</h1>
            <span className="text-xs font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full">
              {questions.length} questions
            </span>
          </div>
          <p className="text-sm text-muted">Questions here are <span className="font-semibold text-foreground">invisible to students</span> during practice.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/import" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-surface-2 text-foreground font-bold text-sm hover:bg-white/[0.08] transition-all">
            <UploadCloud className="h-4 w-4" />Bulk Import
          </Link>
          <Link href="/admin/questions/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-white font-bold text-sm shadow-[0_8px_24px_-6px_rgba(37,99,235,0.55)] hover:brightness-110 transition-all">
            + Add Question
          </Link>
        </div>
      </div>

      {/* Stats */}
      {!loading && questions.length > 0 && <StatsBar stats={stats} />}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-2 pointer-events-none" />
          <input type="text" placeholder="Search questions…" value={search} onChange={e => setSearch(e.target.value)} className="w-full h-8 pl-8 pr-3 text-xs font-medium rounded-lg border border-white/10 bg-white/[0.04] text-foreground placeholder:text-muted-2 focus:outline-none focus:border-accent-electric/40 transition-all" />
        </div>
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="h-8 px-3 text-xs font-medium rounded-lg border border-white/10 bg-surface-2 text-foreground focus:outline-none cursor-pointer">
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)} className="h-8 px-3 text-xs font-medium rounded-lg border border-white/10 bg-surface-2 text-foreground focus:outline-none cursor-pointer">
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="h-8 px-3 text-xs font-medium rounded-lg border border-white/10 bg-surface-2 text-foreground focus:outline-none cursor-pointer">
          <option value="">All Types</option>
          <option value="mcq">MCQ</option>
          <option value="numerical">Numerical</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center text-muted-2 text-sm">Loading exam bank…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-surface py-20 text-center">
          <div className="size-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-7 w-7 text-violet-400" />
          </div>
          <p className="font-bold text-foreground mb-1">Exam Bank is empty</p>
          <p className="text-sm text-muted mb-5 max-w-sm mx-auto">Import questions with <code className="bg-surface-2 px-1 rounded">visibility: "exam"</code> or add individually.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/admin/import" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.08] bg-surface-2 text-foreground font-bold text-sm hover:bg-white/[0.08] transition-all"><UploadCloud className="h-4 w-4" />Bulk Import</Link>
            <Link href="/admin/questions/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-primary text-white font-bold text-sm hover:brightness-110 transition-all">+ Add Question</Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] bg-surface-2/60">
                  <th className="text-left py-3 px-5 text-[11px] font-bold uppercase tracking-widest text-muted-2">#</th>
                  <th className="text-left py-3 px-5 text-[11px] font-bold uppercase tracking-widest text-muted-2">Question</th>
                  <th className="text-left py-3 px-5 text-[11px] font-bold uppercase tracking-widest text-muted-2">Subject / Chapter</th>
                  <th className="text-center py-3 px-5 text-[11px] font-bold uppercase tracking-widest text-muted-2">Type</th>
                  <th className="text-center py-3 px-5 text-[11px] font-bold uppercase tracking-widest text-muted-2">Difficulty</th>
                  <th className="text-left py-3 px-5 text-[11px] font-bold uppercase tracking-widest text-muted-2">Actions</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filtered.map((q: any, idx: number) => {
                  const expanded = isOpen(q.id)
                  return [
                    <ExpandableRow key={q.id} id={q.id} isOpen={expanded} onToggle={toggleRow} isSelected={false}>
                      <td className="py-3 px-5 text-muted-2 text-xs font-mono">{idx + 1}</td>
                      <td className="py-3 px-5 max-w-sm">
                        <p className="text-foreground text-sm line-clamp-1 leading-snug">
                          {q.statement.slice(0, 100)}{q.statement.length > 100 ? '…' : ''}
                        </p>
                      </td>
                      <td className="py-3 px-5">
                        <p className="text-xs font-semibold text-foreground">{q.chapters?.subjects?.name ?? '—'}</p>
                        <p className="text-[11px] text-muted">{q.chapters?.name ?? '—'}</p>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${q.type === 'mcq' ? 'bg-accent-electric/10 text-accent-electric border border-accent-electric/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                          {q.type === 'mcq' ? 'MCQ' : 'Num'}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${diffColor[q.difficulty] ?? ''}`}>{q.difficulty}</span>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <Link href={`/admin/questions/${q.id}/edit`} className="text-amber-400 hover:text-amber-300 text-xs font-bold transition-colors">Edit</Link>
                          <button
                            type="button"
                            onClick={() => handleMove(q.id)}
                            disabled={isPending}
                            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
                          >
                            → Practice Pool
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
    </div>
  )
}
