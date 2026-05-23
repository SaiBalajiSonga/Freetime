'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Trash2, SquareCheck, Square, MinusSquare,
  LayoutList, LayoutGrid, ChevronUp, ChevronDown,
} from 'lucide-react'
import { DeleteQuestionButton } from './delete-buttons'
import { deleteSelectedQuestions } from '../actions'
import { QuestionCard } from '@/components/admin/question-card'
import { ExpandableRow, ExpandedContent, useExpandableRows } from '@/components/admin/expandable-row'

type Option = { id: string; text: string; is_correct: boolean }

export type Question = {
  id: string
  statement: string
  type: string
  difficulty: string
  image_url?: string | null
  correct_answer?: string | null
  hint?: string | null
  solution?: string | null
  options?: Option[]
  chapters: {
    name: string
    subjects: { id: string; name: string } | null
  } | null
}

const diffColor: Record<string, string> = {
  easy:   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  hard:   'bg-red-500/10 text-red-400 border border-red-500/20',
}

type SortKey = 'statement' | 'difficulty' | 'type' | null
type SortDir = 'asc' | 'desc'

const diffRank = { easy: 0, medium: 1, hard: 2 } as Record<string, number>

function SelectAllIcon({ allSelected, someSelected }: { allSelected: boolean; someSelected: boolean }) {
  if (allSelected) return <SquareCheck className="h-4 w-4" />
  if (someSelected) return <MinusSquare className="h-4 w-4" />
  return <Square className="h-4 w-4" />
}

function SortIndicator({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== col) return <span className="ml-1 opacity-20">↕</span>
  return <span className="ml-1 text-accent-electric">{sortDir === 'asc' ? '▲' : '▼'}</span>
}

const VIEW_STORAGE_KEY = 'admin-questions-view'

export function QuestionsTable({
  questions: rawQuestions,
  page,
  pageSize,
  totalCount,
}: {
  questions: Question[]
  page: number
  pageSize: number
  totalCount?: number
}) {
  // ── View mode (table vs card) ──────────────────────────────────
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  useEffect(() => {
    const stored = localStorage.getItem(VIEW_STORAGE_KEY)
    if (stored === 'card' || stored === 'table') setViewMode(stored)
  }, [])
  const toggleView = (mode: 'table' | 'card') => {
    setViewMode(mode)
    localStorage.setItem(VIEW_STORAGE_KEY, mode)
  }

  // ── Sort ──────────────────────────────────────────────────────
  const [sortKey, setSortKey] = useState<SortKey>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const questions = [...rawQuestions].sort((a, b) => {
    if (!sortKey) return 0
    let av = '', bv = ''
    if (sortKey === 'statement') { av = a.statement; bv = b.statement }
    if (sortKey === 'difficulty') { av = String(diffRank[a.difficulty] ?? 1); bv = String(diffRank[b.difficulty] ?? 1) }
    if (sortKey === 'type') { av = a.type; bv = b.type }
    const cmp = av.localeCompare(bv)
    return sortDir === 'asc' ? cmp : -cmp
  })

  // ── Multi-select ───────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectAllPages, setSelectAllPages] = useState(false)
  const [isPending, startTransition] = useTransition()

  const allIds = questions.map((q) => q.id)
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id))
  const someSelected = allIds.some((id) => selected.has(id)) && !allSelected

  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => { const n = new Set(prev); allIds.forEach((id) => n.delete(id)); return n })
      setSelectAllPages(false)
    } else {
      setSelected((prev) => new Set([...prev, ...allIds]))
    }
  }

  const toggleOne = (id: string) => {
    setSelectAllPages(false)
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const handleBulkDelete = () => {
    if (selected.size === 0) return
    const count = selected.size
    if (!confirm(`Delete ${count} selected question${count > 1 ? 's' : ''}? This cannot be undone.`)) return
    const ids = Array.from(selected)
    startTransition(() => {
      deleteSelectedQuestions(ids).then(() => { setSelected(new Set()); setSelectAllPages(false) })
    })
  }

  // ── Expand rows ────────────────────────────────────────────────
  const { toggleRow, isOpen } = useExpandableRows()

  // TABLE COLUMN COUNT: checkbox + ID + subject/chapter + statement + diff + type + actions + chevron = 8
  const TABLE_COLS = 8

  // ── Empty state ────────────────────────────────────────────────
  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-surface py-20 text-center">
        <div className="size-16 rounded-2xl bg-surface-2 border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📝</span>
        </div>
        <p className="text-foreground font-bold mb-1">No questions found</p>
        <p className="text-sm text-muted-2">Try adjusting your filters or add a new question.</p>
      </div>
    )
  }

  return (
    <>
      {/* ── Bulk toolbar ── */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-1 mb-3 animate-slide-down">
          <span className="text-sm font-semibold text-foreground">{selected.size} selected</span>

          {/* Select all pages prompt */}
          {allSelected && !selectAllPages && totalCount && totalCount > pageSize && (
            <button
              type="button"
              onClick={() => setSelectAllPages(true)}
              className="text-xs text-accent-cyan hover:text-accent-glow underline underline-offset-2 transition-colors"
            >
              Select all {totalCount.toLocaleString()} questions?
            </button>
          )}

          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-bold rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50 transition-colors"
            id="bulk-delete-btn"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isPending ? 'Deleting…' : 'Delete selected'}
          </button>
          <button
            type="button"
            onClick={() => { setSelected(new Set()); setSelectAllPages(false) }}
            disabled={isPending}
            className="text-xs text-muted hover:text-foreground transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* ── View toggle ── */}
      <div className="flex items-center justify-end gap-1 mb-3">
        <button
          type="button"
          onClick={() => toggleView('table')}
          id="view-table-btn"
          className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-accent-electric/15 text-accent-electric' : 'text-muted-2 hover:text-foreground hover:bg-surface-2'}`}
          title="Table view"
        >
          <LayoutList className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => toggleView('card')}
          id="view-card-btn"
          className={`p-1.5 rounded-lg transition-colors ${viewMode === 'card' ? 'bg-accent-electric/15 text-accent-electric' : 'text-muted-2 hover:text-foreground hover:bg-surface-2'}`}
          title="Card view"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
      </div>

      {/* ── CARD VIEW ── */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {questions.map((q, idx) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={(page - 1) * pageSize + idx}
              isSelected={selected.has(q.id)}
              onToggleSelect={toggleOne}
            />
          ))}
        </div>
      )}

      {/* ── TABLE VIEW ── */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-white/[0.08] bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] bg-surface-2/60">
                  {/* Select all */}
                  <th className="py-4 pl-5 pr-2 w-10">
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="text-muted-2 hover:text-foreground transition-colors"
                      title={allSelected ? 'Deselect all' : 'Select all'}
                      id="select-all-questions"
                    >
                      <SelectAllIcon allSelected={allSelected} someSelected={someSelected} />
                    </button>
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-muted-2 text-[11px] uppercase tracking-widest">ID</th>
                  <th className="text-left py-4 px-4 font-bold text-muted-2 text-[11px] uppercase tracking-widest">Subject › Chapter</th>
                  {/* Sortable statement */}
                  <th
                    className="text-left py-4 px-4 font-bold text-muted-2 text-[11px] uppercase tracking-widest cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => toggleSort('statement')}
                  >
                    Statement <SortIndicator col="statement" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  {/* Sortable difficulty */}
                  <th
                    className="text-left py-4 px-4 font-bold text-muted-2 text-[11px] uppercase tracking-widest cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => toggleSort('difficulty')}
                  >
                    Diff <SortIndicator col="difficulty" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  {/* Sortable type */}
                  <th
                    className="text-left py-4 px-4 font-bold text-muted-2 text-[11px] uppercase tracking-widest cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => toggleSort('type')}
                  >
                    Type <SortIndicator col="type" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-muted-2 text-[11px] uppercase tracking-widest">Actions</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {questions.map((q, idx) => {
                  const qId = `Q-${String((page - 1) * pageSize + idx + 1).padStart(3, '0')}`
                  const isSelected = selected.has(q.id)
                  const subject = (q.chapters as any)?.subjects?.name as string | undefined
                  const chapter = (q.chapters as any)?.name as string | undefined
                  const expanded = isOpen(q.id)

                  return [
                    <ExpandableRow key={q.id} id={q.id} isOpen={expanded} onToggle={toggleRow} isSelected={isSelected}>
                      {/* Checkbox */}
                      <td className="py-3.5 pl-5 pr-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toggleOne(q.id)}
                          className={`transition-colors ${isSelected ? 'text-accent-electric' : 'text-muted-2 hover:text-foreground'}`}
                          id={`select-question-${q.id}`}
                        >
                          {isSelected ? <SquareCheck className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                        </button>
                      </td>
                      {/* ID */}
                      <td className="py-3.5 px-4 text-muted-2 font-mono text-xs font-medium">{qId}</td>
                      {/* Subject / Chapter */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-foreground text-xs font-semibold">{subject ?? '—'}</span>
                          <span className="text-muted-2 text-[11px]">{chapter ?? '—'}</span>
                        </div>
                      </td>
                      {/* Statement (truncated) */}
                      <td className="py-3.5 px-4 text-muted max-w-[300px]">
                        <span className="line-clamp-1 text-sm">
                          {q.statement.slice(0, 80)}{q.statement.length > 80 ? '…' : ''}
                        </span>
                      </td>
                      {/* Difficulty */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${diffColor[q.difficulty] ?? 'bg-surface-2 text-muted border border-white/10'}`}>
                          {q.difficulty}
                        </span>
                      </td>
                      {/* Type */}
                      <td className="py-3.5 px-4 text-muted-2 uppercase text-[11px] font-bold">
                        {q.type === 'mcq' ? 'MCQ' : 'Num'}
                      </td>
                      {/* Actions */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                          <Link href={`/questions/${q.id}`} className="text-accent-cyan hover:text-accent-glow text-xs font-bold transition-colors">
                            View
                          </Link>
                          <Link href={`/admin/questions/${q.id}/edit`} className="text-amber-400 hover:text-amber-300 text-xs font-bold transition-colors">
                            Edit
                          </Link>
                          <DeleteQuestionButton questionId={q.id} />
                        </div>
                      </td>
                    </ExpandableRow>,

                    // Expanded detail row
                    expanded && (
                      <ExpandedContent
                        key={`${q.id}-expanded`}
                        colSpan={TABLE_COLS}
                        statement={q.statement}
                        type={q.type}
                        options={q.options}
                        correctAnswer={q.correct_answer ?? undefined}
                        hint={q.hint ?? undefined}
                        solution={q.solution ?? undefined}
                        imageUrl={q.image_url ?? undefined}
                      />
                    ),
                  ]
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
