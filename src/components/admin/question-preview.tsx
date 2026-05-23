'use client'

import { Eye } from 'lucide-react'

type Option = { id?: string; text: string; is_correct: boolean }

type QuestionPreviewProps = {
  statement: string
  type: string
  options?: Option[]
  correctAnswer?: string
  difficulty?: string
  hint?: string
  imageUrl?: string
}

const diffBadge: Record<string, string> = {
  easy:   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  hard:   'bg-red-500/10 text-red-400 border border-red-500/20',
}

export function QuestionPreview({
  statement,
  type,
  options = [],
  correctAnswer,
  difficulty,
  hint,
  imageUrl,
}: QuestionPreviewProps) {
  const hasContent = statement.trim().length > 0

  return (
    <div className="flex flex-col h-full rounded-2xl border border-white/[0.08] bg-surface overflow-hidden">
      {/* Preview header */}
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06] bg-surface-2/40">
        <Eye className="h-4 w-4 text-muted-2" />
        <span className="text-xs font-bold text-muted-2 uppercase tracking-wider">Live Preview</span>
        {difficulty && (
          <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${diffBadge[difficulty] ?? ''}`}>
            {difficulty}
          </span>
        )}
        {type && (
          <span className="px-2 py-0.5 rounded-full bg-surface text-muted-2 text-[10px] font-bold uppercase border border-white/[0.08]">
            {type === 'mcq' ? 'MCQ' : 'Numerical'}
          </span>
        )}
      </div>

      {/* Preview body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {!hasContent ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-12 rounded-xl bg-surface-2 border border-white/[0.06] flex items-center justify-center mb-3">
              <Eye className="h-5 w-5 text-muted-2" />
            </div>
            <p className="text-sm text-muted-2 font-medium">Preview will appear here</p>
            <p className="text-xs text-muted-2/60 mt-1">Start typing the question statement</p>
          </div>
        ) : (
          <>
            {/* Statement */}
            <div className="text-foreground text-sm leading-relaxed font-medium">
              {statement}
            </div>

            {/* Image */}
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="Question diagram"
                loading="lazy"
                className="max-h-48 rounded-xl border border-white/10 object-contain w-auto"
              />
            )}

            {/* MCQ options */}
            {type === 'mcq' && options.length > 0 && (
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border ${
                      opt.is_correct
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold'
                        : 'bg-surface-2 border-white/[0.08] text-muted'
                    }`}
                  >
                    <span className="text-[11px] font-mono text-muted-2 shrink-0 w-5">
                      {['A', 'B', 'C', 'D'][i]}.
                    </span>
                    <span className="flex-1 text-xs">{opt.text || <span className="italic text-muted-2">Option {i + 1}…</span>}</span>
                    {opt.is_correct && (
                      <span className="text-[10px] font-bold text-emerald-400 shrink-0">✓</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Numerical answer */}
            {type === 'numerical' && correctAnswer && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-xs text-muted-2 font-bold uppercase tracking-wider">Answer:</span>
                <span className="font-mono text-emerald-400 font-bold">{correctAnswer}</span>
              </div>
            )}

            {/* Hint */}
            {hint && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
                <span className="text-xs text-amber-400/80 font-bold shrink-0">Hint:</span>
                <span className="text-xs text-amber-400/70">{hint}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Watermark */}
      <div className="px-5 py-2.5 border-t border-white/[0.04] text-center">
        <span className="text-[10px] text-muted-2/40 font-medium tracking-wider uppercase">
          Preview — not visible to students
        </span>
      </div>
    </div>
  )
}
