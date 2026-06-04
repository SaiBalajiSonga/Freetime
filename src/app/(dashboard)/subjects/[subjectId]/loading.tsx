export default function SubjectDetailLoading() {
  return (
    <div className="space-y-8 loading-fade-in">
      {/* ── Breadcrumbs skeleton ── */}
      <div className="flex items-center gap-2">
        <div className="skeleton-block skeleton-text w-16" />
        <div className="skeleton-block skeleton-text w-2" />
        <div className="skeleton-block skeleton-text w-20" />
      </div>

      {/* ── PageHeader skeleton ── */}
      <div className="mb-7">
        <div className="skeleton-block skeleton-text-xl w-52 mb-2" />
        <div className="skeleton-block skeleton-text w-80" />
      </div>

      {/* ── Chapter cards grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg bg-white border border-[var(--color-border)] p-5 shadow-[var(--shadow-card)] space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="skeleton-block size-11 rounded-xl" />
              <div className="skeleton-block rounded-full h-5 w-14" />
            </div>
            <div className="space-y-1.5">
              <div className="skeleton-block skeleton-text-lg w-36" />
              <div className="skeleton-block skeleton-text w-20" />
            </div>
            <div className="pt-4 border-t border-[var(--color-border)] space-y-2">
              <div className="skeleton-block h-1.5 w-full rounded-full" />
              <div className="flex justify-between">
                <div className="skeleton-block skeleton-text w-16" />
                <div className="skeleton-block skeleton-text w-8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
