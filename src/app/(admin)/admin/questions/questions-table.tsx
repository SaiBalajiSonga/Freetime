'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Trash2, SquareCheck, Square, MinusSquare } from 'lucide-react'
import { DeleteQuestionButton } from './delete-buttons'
import { deleteSelectedQuestions } from '../actions'

type Question = {
  id: string
  statement: string
  type: string
  difficulty: string
  chapters: {
    name: string
    subjects: { name: string } | null
  } | null
}

const diffColor: Record<string, string> = {
  easy: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  hard: 'bg-red-500/10 text-red-400 border border-red-500/20',
}

function SelectAllIcon({
  allSelected,
  someSelected,
}: {
  allSelected: boolean
  someSelected: boolean
}) {
  if (allSelected) return <SquareCheck className="h-4 w-4" />
  if (someSelected) return <MinusSquare className="h-4 w-4" />
  return <Square className="h-4 w-4" />
}

export function QuestionsTable({
  questions,
  page,
  pageSize,
}: {
  questions: Question[]
  page: number
  pageSize: number
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  const allIds = questions.map((q) => q.id)
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id))
  const someSelected = allIds.some((id) => selected.has(id)) && !allSelected

  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        allIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelected((prev) => new Set([...prev, ...allIds]))
    }
  }

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleBulkDelete = () => {
    if (selected.size === 0) return
    const count = selected.size
    if (!confirm(`Delete ${count} selected question${count > 1 ? 's' : ''}? This cannot be undone.`)) return

    const ids = Array.from(selected)
    startTransition(() => {
      deleteSelectedQuestions(ids).then(() => {
        setSelected(new Set())
      })
    })
  }

  return (
    <>
      {/* Bulk action toolbar — slides in when anything is selected */}
      <div
        className={`flex items-center gap-3 px-1 transition-all duration-300 ${
          selected.size > 0
            ? 'opacity-100 max-h-12 mb-3 pointer-events-auto'
            : 'opacity-0 max-h-0 overflow-hidden pointer-events-none'
        }`}
      >
        <span className="text-sm font-semibold text-foreground">
          {selected.size} selected
        </span>
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

      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                {/* Select-all checkbox */}
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
                <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-wider">ID</th>
                <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-wider">Subject</th>
                <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-wider">Chapter</th>
                <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-wider max-w-[280px]">Statement</th>
                <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-wider">Difficulty</th>
                <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-wider">Type</th>
                <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {questions.map((q, idx) => {
                const qId = `Q-${String((page - 1) * pageSize + idx + 1).padStart(3, '0')}`
                const isSelected = selected.has(q.id)
                const subject = (q.chapters as any)?.subjects?.name as string | undefined
                const chapter = (q.chapters as any)?.name as string | undefined

                return (
                  <tr
                    key={q.id}
                    className={`hover:bg-surface-2/60 transition-colors cursor-pointer ${
                      isSelected ? 'bg-accent-electric/5 ring-1 ring-inset ring-accent-electric/20' : ''
                    }`}
                    onClick={() => toggleOne(q.id)}
                  >
                    {/* Row checkbox */}
                    <td
                      className="py-3.5 pl-5 pr-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => toggleOne(q.id)}
                        className={`transition-colors ${
                          isSelected ? 'text-accent-electric' : 'text-muted-2 hover:text-foreground'
                        }`}
                        id={`select-question-${q.id}`}
                      >
                        {isSelected ? (
                          <SquareCheck className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-5 text-muted-2 font-mono text-xs font-medium">{qId}</td>
                    <td className="py-3.5 px-5 text-foreground font-medium">{subject ?? '—'}</td>
                    <td className="py-3.5 px-5 text-muted">{chapter ?? '—'}</td>
                    <td className="py-3.5 px-5 text-muted max-w-[280px] truncate">{q.statement}</td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                          diffColor[q.difficulty] ?? 'bg-surface-2 text-muted border border-border'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-muted-2 uppercase text-xs font-bold">{q.type}</td>
                    <td
                      className="py-3.5 px-5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/questions/${q.id}`}
                          className="text-accent-cyan hover:text-accent-glow text-xs font-bold transition-colors"
                        >
                          View
                        </Link>
                        <Link
                          href={`/admin/questions/${q.id}/edit`}
                          className="text-amber-400 hover:text-amber-300 text-xs font-bold transition-colors"
                        >
                          Edit
                        </Link>
                        <DeleteQuestionButton questionId={q.id} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {questions.length === 0 && (
          <div className="py-16 text-center">
            <div className="size-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-muted font-medium">No questions yet.</p>
          </div>
        )}
      </div>
    </>
  )
}
