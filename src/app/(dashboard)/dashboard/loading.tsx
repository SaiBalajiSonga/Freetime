export default function DashboardLoading() {
  return (
    <div className="space-y-8 loading-fade-in">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <div className="skeleton-block skeleton-text-xl w-48 mb-2" />
          <div className="skeleton-block skeleton-text w-64" />
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg bg-white border border-[var(--color-border)] p-5 space-y-3" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center justify-between">
              <div className="skeleton-block skeleton-circle size-10" />
              <div className="skeleton-block skeleton-text w-12 h-3" />
            </div>
            <div className="skeleton-block skeleton-text-xl w-16" />
            <div className="skeleton-block skeleton-text w-20" />
          </div>
        ))}
      </div>

      {/* ── Pick A Subject ── */}
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="skeleton-block skeleton-text-lg w-48 mb-1" />
          </div>
          <div className="skeleton-block skeleton-text w-16" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
             <div key={i} className="rounded-lg bg-white border border-[var(--color-border)] p-5 space-y-4">
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

      {/* ── Hero Banner ── */}
      <div className="skeleton-block h-48 w-full rounded-2xl" />

      {/* ── Core Progress & Activity ── */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
           <div className="skeleton-block skeleton-text-lg w-32" />
           <div className="rounded-lg bg-white border border-[var(--color-border)] p-6 h-64 skeleton-block" />
        </div>
        <div className="space-y-4">
           <div className="skeleton-block skeleton-text-lg w-32" />
           <div className="rounded-lg bg-white border border-[var(--color-border)] p-6 h-64 skeleton-block" />
        </div>
      </div>
    </div>
  )
}
