export default function QuestionLoading() {
  return (
    <div className="space-y-4 loading-fade-in">
      {/* ── Back link skeleton ── */}
      <div className="skeleton-block skeleton-text w-36 h-4" />

      {/* ── Question card skeleton ── */}
      <div className="rounded-lg bg-white border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 space-y-6">
        {/* Difficulty + type badges */}
        <div className="flex items-center gap-3">
          <div className="skeleton-block rounded-full h-5 w-14" />
          <div className="skeleton-block rounded-full h-5 w-20" />
        </div>

        {/* Question statement */}
        <div className="space-y-3">
          <div className="skeleton-block skeleton-text w-full" />
          <div className="skeleton-block skeleton-text w-11/12" />
          <div className="skeleton-block skeleton-text w-4/5" />
          <div className="skeleton-block skeleton-text w-3/5" />
        </div>

        {/* Options */}
        <div className="space-y-3 pt-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-slate-50/50"
            >
              <div className="skeleton-block skeleton-circle size-5 shrink-0" />
              <div className="skeleton-block skeleton-text flex-1" style={{ width: `${70 - i * 10}%` }} />
            </div>
          ))}
        </div>

        {/* Submit button */}
        <div className="flex justify-end pt-2">
          <div className="skeleton-block rounded-full h-10 w-32" />
        </div>
      </div>
    </div>
  )
}
