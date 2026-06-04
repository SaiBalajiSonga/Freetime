export default function DashboardLoading() {
  return (
    <div className="space-y-7 loading-fade-in">
      {/* ── Greeting skeleton ── */}
      <div className="flex items-center gap-4">
        <div className="skeleton-block skeleton-circle size-12 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="skeleton-block skeleton-text-xl w-48" />
          <div className="skeleton-block skeleton-text w-64" />
        </div>
      </div>

      {/* ── 4 stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg bg-white border border-[var(--color-border)] p-5 space-y-3"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="skeleton-block skeleton-circle size-10" />
              <div className="skeleton-block skeleton-text w-12 h-3" />
            </div>
            <div className="skeleton-block skeleton-text-xl w-16" />
            <div className="skeleton-block skeleton-text w-20" />
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bar chart skeleton */}
        <div className="rounded-lg bg-white border border-[var(--color-border)] p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="skeleton-block skeleton-text-lg w-32" />
            <div className="skeleton-block skeleton-text w-16" />
          </div>
          <div className="flex items-end gap-3 h-32">
            {[40, 70, 25, 90, 55, 80, 35].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="skeleton-block w-full rounded-md" style={{ height: `${h}%` }} />
                <div className="skeleton-block skeleton-text w-4 h-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap skeleton */}
        <div className="rounded-lg bg-white border border-[var(--color-border)] p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="skeleton-block skeleton-text-lg w-28" />
            <div className="skeleton-block skeleton-text w-20" />
          </div>
          <div className="grid grid-cols-12 gap-1">
            {[...Array(84)].map((_, i) => (
              <div key={i} className="skeleton-block aspect-square rounded-sm" />
            ))}
          </div>
        </div>
      </div>

      {/* ── Subject progress cards ── */}
      <div>
        <div className="skeleton-block skeleton-text-lg w-40 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-lg bg-white border border-[var(--color-border)] p-5 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="skeleton-block size-10 rounded-xl" />
                <div className="skeleton-block skeleton-text-lg w-24" />
              </div>
              <div className="skeleton-block h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <div className="skeleton-block skeleton-text w-14" />
                <div className="skeleton-block skeleton-text w-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
