export default function ExamsLoading() {
  return (
    <div className="space-y-6 loading-fade-in">
      {/* ── Page header skeleton ── */}
      <div className="mb-7">
        <div className="skeleton-block skeleton-text-xl w-28 mb-2" />
        <div className="skeleton-block skeleton-text w-64" />
      </div>

      {/* ── Filter tabs skeleton ── */}
      <div className="flex gap-2 mb-4">
        {['All', 'Active', 'Upcoming', 'Attempted'].map((_, i) => (
          <div key={i} className="skeleton-block rounded-full h-8 w-20" />
        ))}
      </div>

      {/* ── Exam cards ── */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg bg-white border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <div className="skeleton-block rounded-full h-5 w-16" />
                </div>
                <div className="skeleton-block skeleton-text-lg w-48" />
                <div className="skeleton-block skeleton-text w-72" />
              </div>
              <div className="skeleton-block rounded-lg h-10 w-24 shrink-0" />
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="skeleton-block skeleton-circle size-4" />
                <div className="skeleton-block skeleton-text w-24" />
              </div>
              <div className="flex items-center gap-2">
                <div className="skeleton-block skeleton-circle size-4" />
                <div className="skeleton-block skeleton-text w-20" />
              </div>
              <div className="flex items-center gap-2">
                <div className="skeleton-block skeleton-circle size-4" />
                <div className="skeleton-block skeleton-text w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
