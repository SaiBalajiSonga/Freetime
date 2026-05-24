'use client'

import { useState, useTransition, useEffect } from 'react'
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
  return (
    sortDir === 'asc'
      ? <ChevronUp className="inline-block ml-1 h-3 w-3 text-blue-400" />
      : <ChevronDown className="inline-block ml-1 h-3 w-3 text-blue-400" />
  )
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
  basePath?: string
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
  const TABLE_COLS = 8

  // ── Empty state ────────────────────────────────────────────────
  if (questions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-20 text-center" style={{ borderColor: '#2a3142', background: '#161b27' }}>
        <div className="size-14 rounded-lg border flex items-center justify-center mx-auto mb-4" style={{ background: '#1c2333', borderColor: '#2a3142' }}>
          <LayoutList className="h-6 w-6" style={{ color: '#64748b' }} />
        </div>
        <p className="text-white font-bold mb-1">No questions found</p>
        <p className="text-sm" style={{ color: '#64748b' }}>Try adjusting your filters or add a new question.</p>
      </div>
    )
  }

  return (
    <>
      {/* ── Bulk toolbar ── */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-1 mb-3 animate-slide-down">
          <span className="text-sm font-semibold text-white">{selected.size} selected</span>
          {allSelected && !selectAllPages && totalCount && totalCount > pageSize && (
            <button
              type="button"
              onClick={() => setSelectAllPages(true)}
              className="text-xs text-blue-400 hover:underline underline-offset-2 transition-colors"
            >
              Select all {totalCount.toLocaleString()} questions?
            </button>
          )}
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 h-7 px-3 text-xs font-bold rounded-md bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
            id="bulk-delete-btn"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isPending ? 'Deleting…' : 'Delete selected'}
          </button>
          <button
            type="button"
            onClick={() => { setSelected(new Set()); setSelectAllPages(false) }}
            disabled={isPending}
            className="text-xs transition-colors hover:text-white"
            style={{ color: '#64748b' }}
          >
            Clear
          </button>
        </div>
      )}

      {/* ── Table container with view toggle in header ── */}
      <div className="rounded-lg overflow-hidden" style={{ background: '#161b27', border: '1px solid #2a3142' }}>

        {/* Table header bar */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ background: '#1c2333', borderBottom: '1px solid #2a3142' }}
        >
          <span className="text-[13px] font-semibold" style={{ color: '#94a3b8' }}>
            {questions.length.toLocaleString()} questions
          </span>
          {/* View toggle — segmented control with labels */}
          <div
            className="flex items-center gap-0.5 p-0.5 rounded-md"
            style={{ background: '#161b27', border: '1px solid #2a3142' }}
          >
            <button
              type="button"
              onClick={() => toggleView('table')}
              id="view-table-btn"
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-[#1c2333] text-white shadow-sm'
                  : 'text-[#64748b] hover:text-white'
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              Table
            </button>
            <button
              type="button"
              onClick={() => toggleView('card')}
              id="view-card-btn"
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
                viewMode === 'card'
                  ? 'bg-[#1c2333] text-white shadow-sm'
                  : 'text-[#64748b] hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Cards
            </button>
          </div>
        </div>

        {/* ── CARD VIEW ── */}
        {viewMode === 'card' && (
          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#1c2333', borderBottom: '1px solid #2a3142' }}>
                  {/* Select all */}
                  <th className="py-3 pl-5 pr-2 w-10">
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="transition-colors hover:text-white"
                      style={{ color: '#64748b' }}
                      title={allSelected ? 'Deselect all' : 'Select all'}
                      id="select-all-questions"
                    >
                      <SelectAllIcon allSelected={allSelected} someSelected={someSelected} />
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-bold text-[11px] uppercase tracking-widest whitespace-nowrap w-24" style={{ color: '#64748b' }}>ID</th>
                  <th className="text-left py-3 px-4 font-bold text-[11px] uppercase tracking-widest whitespace-nowrap w-48" style={{ color: '#64748b' }}>Subject › Chapter</th>
                  <th
                    className="text-left py-3 px-4 font-bold text-[11px] uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors w-full"
                    style={{ color: '#64748b' }}
                    onClick={() => toggleSort('statement')}
                  >
                    Statement <SortIndicator col="statement" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="text-left py-3 px-4 font-bold text-[11px] uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors whitespace-nowrap w-24"
                    style={{ color: '#64748b' }}
                    onClick={() => toggleSort('difficulty')}
                  >
                    Diff <SortIndicator col="difficulty" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="text-left py-3 px-4 font-bold text-[11px] uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors whitespace-nowrap w-20"
                    style={{ color: '#64748b' }}
                    onClick={() => toggleSort('type')}
                  >
                    Type <SortIndicator col="type" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className="text-left py-3 px-4 font-bold text-[11px] uppercase tracking-widest whitespace-nowrap w-32" style={{ color: '#64748b' }}>Actions</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {questions.map((q, idx) => {
                  const qId = `Q-${String((page - 1) * pageSize + idx + 1).padStart(3, '0')}`
                  const isSelected = selected.has(q.id)
                  const subject = (q.chapters as any)?.subjects?.name as string | undefined
                  const chapter = (q.chapters as any)?.name as string | undefined
                  const expanded = isOpen(q.id)
                  const isEven = idx % 2 === 1

                  return [
                    <ExpandableRow
                      key={q.id}
                      id={q.id}
                      isOpen={expanded}
                      onToggle={toggleRow}
                      isSelected={isSelected}
                      style={{
                        background: isEven ? '#161b27' : '#0f1117',
                        borderBottom: '1px solid #1e2536',
                      }}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 pl-5 pr-2 w-10" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toggleOne(q.id)}
                          className={`transition-colors ${isSelected ? 'text-blue-400' : 'hover:text-white'}`}
                          style={isSelected ? {} : { color: '#64748b' }}
                          id={`select-question-${q.id}`}
                        >
                          {isSelected ? <SquareCheck className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                        </button>
                      </td>
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono text-[11px] font-medium w-20 whitespace-nowrap" style={{ color: '#64748b' }}>{qId}</td>
                      {/* Subject / Chapter */}
                      <td className="py-3.5 px-4 w-48 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold text-white">{subject ?? '—'}</span>
                          <span className="text-[10px]" style={{ color: '#64748b' }}>{chapter ?? '—'}</span>
                        </div>
                      </td>
                      {/* Statement */}
                      <td className="py-3.5 px-4 w-full max-w-0" style={{ color: '#94a3b8' }}>
                        <p className="truncate text-sm">
                          {q.statement}
                        </p>
                      </td>
                      {/* Difficulty */}
                      <td className="py-3.5 px-4 w-24 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold capitalize ${diffColor[q.difficulty] ?? 'bg-[#1c2333] text-[#64748b] border border-[#2a3142]'}`}>
                          {q.difficulty}
                        </span>
                      </td>
                      {/* Type */}
                      <td className="py-3.5 px-4 w-20 whitespace-nowrap">
                        <span className="uppercase text-[11px] font-bold" style={{ color: '#64748b' }}>
                          {q.type === 'mcq' ? 'MCQ' : 'Num'}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="py-3.5 px-4 w-32 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <Link href={`/questions/${q.id}`} className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[11px] font-bold transition-colors">
                            View
                          </Link>
                          <Link href={`/admin/questions/${q.id}/edit`} className="px-2 py-1 rounded bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 text-[11px] font-bold transition-colors">
                            Edit
                          </Link>
                          <DeleteQuestionButton questionId={q.id} />
                        </div>
                      </td>
                    </ExpandableRow>,

                    expanded && (
                      <ExpandedContent
                        key={`${q.id}-expanded`}
                        colSpan={TABLE_COLS}
                        statement={q.statement}
                        type={q.type}
                        options={q.options}
                        correctAnswer={q.correct_answer}
                        hint={q.hint}
                        solution={q.solution}
                        imageUrl={q.image_url}
                      />
                    ),
                  ]
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
