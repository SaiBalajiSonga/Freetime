'use client'

import Link from 'next/link'
import { Square, SquareCheck, Pencil, Trash2 } from 'lucide-react'
import { DeleteQuestionButton } from '@/app/(admin)/admin/questions/delete-buttons'

type Option = { id: string; text: string; is_correct: boolean }
type Question = {
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

const diffBorderColor: Record<string, string> = {
  easy:   'border-l-emerald-500',
  medium: 'border-l-amber-500',
  hard:   'border-l-red-500',
}

const diffBadgeColor: Record<string, string> = {
  easy:   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  hard:   'bg-red-500/10 text-red-400 border border-red-500/20',
}

export function QuestionCard({
  question: q,
  index,
  isSelected,
  onToggleSelect,
}: {
  question: Question
  index: number
  isSelected: boolean
  onToggleSelect: (id: string) => void
}) {
  const subject = (q.chapters as any)?.subjects?.name as string | undefined
  const chapter = (q.chapters as any)?.name as string | undefined
  const qId = `Q-${String(index + 1).padStart(3, '0')}`

  return (
    <div
      className={`relative flex flex-col rounded-md border-l-4 border border-white/[0.08] bg-surface p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
        diffBorderColor[q.difficulty] ?? 'border-l-white/20'
      } ${isSelected ? 'ring-1 ring-inset ring-accent-electric/30 bg-accent-electric/5' : 'hover:bg-surface-2/60'}`}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onToggleSelect(q.id)}
        className={`absolute top-3 right-3 transition-colors ${
          isSelected ? 'text-accent-electric' : 'text-muted-2 hover:text-foreground'
        }`}
        id={`card-select-${q.id}`}
      >
        {isSelected ? <SquareCheck className="h-4 w-4" /> : <Square className="h-4 w-4" />}
      </button>

      {/* Top chips */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3 pr-6">
        {subject && (
          <span className="px-2 py-0.5 rounded-md bg-accent-electric/10 text-accent-electric text-[10px] font-bold">
            {subject}
          </span>
        )}
        {chapter && (
          <span className="px-2 py-0.5 rounded-md bg-white/5 text-muted-2 text-[10px] font-medium">
            {chapter}
          </span>
        )}
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${diffBadgeColor[q.difficulty] ?? ''}`}>
          {q.difficulty}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-surface-2 text-muted-2 text-[10px] font-bold uppercase border border-white/[0.08]">
          {q.type === 'mcq' ? 'MCQ' : 'Num'}
        </span>
      </div>

      {/* Statement */}
      <p className="text-[15px] text-foreground leading-snug line-clamp-3 flex-1">
        {q.statement}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06]">
        <span className="font-mono text-[10px] text-muted-2">{qId}</span>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/questions/${q.id}`}
            className="px-2 py-1 rounded-md bg-accent-cyan/10 text-accent-cyan hover:bg-accent-cyan/20 text-[11px] font-bold transition-colors"
          >
            View
          </Link>
          <Link
            href={`/admin/questions/${q.id}/edit`}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 text-[11px] font-bold transition-colors"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </Link>
          <DeleteQuestionButton questionId={q.id} />
        </div>
      </div>
    </div>
  )
}
