export default function ChapterLoading() {
  return (
    <div className="space-y-6 loading-fade-in">
      {/* ── Breadcrumbs skeleton ── */}
      <div className="flex items-center gap-2">
        <div className="skeleton-block skeleton-text w-16" />
        <div className="skeleton-block skeleton-text w-2" />
        <div className="skeleton-block skeleton-text w-20" />
        <div className="skeleton-block skeleton-text w-2" />
        <div className="skeleton-block skeleton-text w-28" />
      </div>

      {/* ── Section header skeleton ── */}
      <div className="space-y-1.5">
        <div className="skeleton-block skeleton-text w-20 h-2.5" />
        <div className="skeleton-block skeleton-text-xl w-44" />
        <div className="skeleton-block skeleton-text w-40" />
      </div>

      {/* ── Question list table skeleton ── */}
      <div className="rounded-lg bg-white border border-[var(--color-border)] shadow-[var(--shadow-card)] overflow-hidden">
        {/* Table header */}
        <div className="px-6 py-4 border-b border-[var(--color-border)]">
          <div className="skeleton-block skeleton-text-lg w-36" />
          <div className="skeleton-block skeleton-text w-48 mt-1.5" />
        </div>

        {/* Question rows */}
        <div className="divide-y divide-[var(--color-border)]">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="skeleton-block skeleton-circle size-4 shrink-0" />
                <div className="skeleton-block skeleton-text w-7 shrink-0" />
                <div className="skeleton-block skeleton-text flex-1 max-w-md" />
              </div>
              <div className="flex items-center gap-3 ml-4">
                <div className="skeleton-block rounded-full h-5 w-14" />
                <div className="skeleton-block size-4 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
