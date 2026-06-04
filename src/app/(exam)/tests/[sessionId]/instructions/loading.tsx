export default function InstructionsLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white loading-fade-in">
      <div className="w-full max-w-2xl px-6 space-y-6">
        {/* ── Header skeleton ── */}
        <div className="text-center space-y-3">
          <div className="skeleton-block skeleton-text-xl w-48 mx-auto" />
          <div className="skeleton-block skeleton-text w-72 mx-auto" />
        </div>

        {/* ── Info bar ── */}
        <div className="flex justify-center gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="skeleton-block skeleton-circle size-5" />
              <div className="skeleton-block skeleton-text w-16" />
            </div>
          ))}
        </div>

        {/* ── Instructions card ── */}
        <div className="rounded-xl bg-white border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 space-y-4">
          <div className="skeleton-block skeleton-text-lg w-28" />
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="skeleton-block skeleton-circle size-5 shrink-0 mt-0.5" />
                <div className="skeleton-block skeleton-text flex-1" style={{ width: `${90 - i * 5}%` }} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Checkbox + button ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="skeleton-block size-5 rounded" />
            <div className="skeleton-block skeleton-text w-64" />
          </div>
          <div className="skeleton-block rounded-full h-12 w-full" />
        </div>
      </div>
    </div>
  )
}
