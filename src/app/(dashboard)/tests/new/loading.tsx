export default function NewTestLoading() {
  return (
    <div className="space-y-6 loading-fade-in max-w-2xl mx-auto">
      {/* ── Back link ── */}
      <div className="skeleton-block skeleton-text w-24 h-4" />

      {/* ── Page header ── */}
      <div className="mb-4">
        <div className="skeleton-block skeleton-text-xl w-44 mb-2" />
        <div className="skeleton-block skeleton-text w-64" />
      </div>

      {/* ── Form skeleton ── */}
      <div className="rounded-lg bg-white border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 space-y-6">
        {/* Subject selector */}
        <div className="space-y-2">
          <div className="skeleton-block skeleton-text w-16 h-3" />
          <div className="skeleton-block h-10 w-full rounded-lg" />
        </div>

        {/* Chapter checkboxes */}
        <div className="space-y-2">
          <div className="skeleton-block skeleton-text w-20 h-3" />
          <div className="grid grid-cols-2 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-lg border border-[var(--color-border)]">
                <div className="skeleton-block size-4 rounded" />
                <div className="skeleton-block skeleton-text flex-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Difficulty + count */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="skeleton-block skeleton-text w-16 h-3" />
            <div className="skeleton-block h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="skeleton-block skeleton-text w-24 h-3" />
            <div className="skeleton-block h-10 w-full rounded-lg" />
          </div>
        </div>

        {/* Submit button */}
        <div className="skeleton-block rounded-full h-12 w-full" />
      </div>
    </div>
  )
}
