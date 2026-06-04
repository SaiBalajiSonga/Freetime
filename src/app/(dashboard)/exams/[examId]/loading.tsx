export default function ExamDetailLoading() {
  return (
    <div className="space-y-6 loading-fade-in max-w-3xl mx-auto">
      {/* ── Back link ── */}
      <div className="skeleton-block skeleton-text w-24 h-4" />

      {/* ── Exam detail card ── */}
      <div className="rounded-lg bg-white border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 space-y-5">
        {/* Status badge */}
        <div className="skeleton-block rounded-full h-6 w-16" />

        {/* Title + description */}
        <div className="skeleton-block skeleton-text-xl w-64" />
        <div className="space-y-2">
          <div className="skeleton-block skeleton-text w-full" />
          <div className="skeleton-block skeleton-text w-4/5" />
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-[var(--color-border)]">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="skeleton-block skeleton-text w-16" />
              <div className="skeleton-block skeleton-text-lg w-20" />
            </div>
          ))}
        </div>

        {/* Action button */}
        <div className="skeleton-block rounded-full h-12 w-40" />
      </div>
    </div>
  )
}
