'use client'

import { useState, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'
import Latex from '@/components/ui/latex'

// ── ExpandableRow ──────────────────────────────────────────────────
// Wrap your main <tr> with this; it injects a chevron expand button
// and passes open/close state to you via render prop.

export function ExpandableRow({
  id,
  isOpen,
  onToggle,
  isSelected,
  children,
}: {
  id: string
  isOpen: boolean
  onToggle: (id: string) => void
  isSelected: boolean
  children: React.ReactNode
}) {
  return (
    <tr
      onClick={() => onToggle(id)}
      className={`cursor-pointer transition-colors ${
        isSelected
          ? 'bg-accent-electric/5 ring-1 ring-inset ring-accent-electric/20'
          : isOpen
          ? 'bg-surface-2/40'
          : 'hover:bg-surface-2/60'
      }`}
    >
      {children}
      {/* Expand chevron cell */}
      <td className="py-3.5 px-3 w-8">
        <button
          type="button"
          className="text-muted-2 hover:text-foreground transition-all duration-200"
          id={`expand-row-${id}`}
          aria-label={isOpen ? 'Collapse' : 'Expand'}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </td>
    </tr>
  )
}

// ── ExpandedContent ────────────────────────────────────────────────
// The detail row that appears below the main row when expanded.

type Option = { id?: string; text: string; is_correct: boolean }

export function ExpandedContent({
  colSpan,
  statement,
  type,
  options,
  correctAnswer,
  hint,
  solution,
  imageUrl,
}: {
  colSpan: number
  statement: string
  type: string
  options?: Option[]
  correctAnswer?: string | null
  hint?: string | null
  solution?: string | null
  imageUrl?: string | null
}) {
  return (
    <tr className="bg-surface-2/30 border-l-4 border-l-accent-cyan">
      <td colSpan={colSpan} className="px-8 py-5">
        <div className="space-y-4 max-w-3xl animate-slide-down">
          {/* Full statement */}
          <div className="text-foreground text-[15px] leading-relaxed"><Latex>{statement}</Latex></div>

          {/* Image */}
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="Question diagram"
              loading="lazy"
              className="max-h-48 rounded-xl border border-white/10 object-contain"
            />
          )}

          {/* MCQ options */}
          {type === 'mcq' && options && (
            <div className="grid grid-cols-2 gap-2">
              {options.map((opt, i) => (
                <div
                  key={opt.id ?? i}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
                    opt.is_correct
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold'
                      : 'bg-surface border-white/[0.08] text-muted'
                  }`}
                >
                  <span className="text-sm font-mono text-muted-2 shrink-0">
                    {['A', 'B', 'C', 'D'][i]}.
                  </span>
                  <span className="flex-1 text-sm"><Latex>{opt.text}</Latex></span>
                  {opt.is_correct && (
                    <span className="ml-auto text-xs font-bold shrink-0">✓ CORRECT</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Numerical answer */}
          {type === 'numerical' && correctAnswer && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-2 font-bold uppercase tracking-wider">Answer:</span>
              <span className="font-mono text-emerald-400 font-bold">{correctAnswer}</span>
            </div>
          )}

          {/* Hint */}
          {hint && (
            <div className="flex items-start gap-2 text-sm text-amber-400/80">
              <span className="font-bold shrink-0">Hint:</span>
              <span><Latex>{hint}</Latex></span>
            </div>
          )}

          {/* Solution */}
          {solution && (
            <details className="text-sm text-muted">
              <summary className="cursor-pointer text-accent-cyan font-bold hover:text-accent-glow transition-colors">
                Show solution
              </summary>
              <div className="mt-2 leading-relaxed"><Latex>{solution}</Latex></div>
            </details>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── useExpandableRows hook ─────────────────────────────────────────
// Tracks which row is open; only one at a time.

export function useExpandableRows() {
  const [openRowId, setOpenRowId] = useState<string | null>(null)

  const toggleRow = useCallback((id: string) => {
    setOpenRowId((prev) => (prev === id ? null : id))
  }, [])

  const isOpen = useCallback((id: string) => openRowId === id, [openRowId])

  const closeAll = useCallback(() => setOpenRowId(null), [])

  return { toggleRow, isOpen, closeAll }
}
