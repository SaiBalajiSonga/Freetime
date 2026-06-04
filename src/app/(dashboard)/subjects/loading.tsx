export default function SubjectsLoading() {
  return (
    <div className="space-y-8 loading-fade-in">
      {/* ── PageHeader skeleton ── */}
      <div className="mb-7">
        <div className="skeleton-block skeleton-text-xl w-32 mb-2" />
        <div className="skeleton-block skeleton-text w-72" />
      </div>

      {/* ── 3 subject cards ── */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg bg-white border border-[var(--color-border)] p-5 shadow-[var(--shadow-card)] space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="skeleton-block size-12 rounded-xl" />
              <div className="skeleton-block skeleton-circle size-8" />
            </div>
            <div className="mt-auto space-y-2">
              <div className="skeleton-block skeleton-text-xl w-28" />
              <div className="skeleton-block skeleton-text w-40" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="skeleton-block h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <div className="skeleton-block skeleton-text w-20" />
                <div className="skeleton-block skeleton-text w-14" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
