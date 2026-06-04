export default function AdminWeeklyExamsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto loading-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton-block-dark skeleton-text-xl w-36" />
          <div className="skeleton-block-dark skeleton-text w-56" />
        </div>
        <div className="skeleton-block-dark rounded-lg h-9 w-32" />
      </div>

      {/* Exam cards */}
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-[#1e2536] bg-[#0f1629] p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <div className="skeleton-block-dark rounded-full h-5 w-16" />
                </div>
                <div className="skeleton-block-dark skeleton-text-lg w-48" />
                <div className="skeleton-block-dark skeleton-text w-72" />
              </div>
              <div className="flex gap-2 shrink-0">
                <div className="skeleton-block-dark size-8 rounded-md" />
                <div className="skeleton-block-dark size-8 rounded-md" />
              </div>
            </div>
            <div className="flex gap-6 pt-3 border-t border-[#1e2536]">
              <div className="flex items-center gap-2">
                <div className="skeleton-block-dark skeleton-circle size-4" />
                <div className="skeleton-block-dark skeleton-text w-28" />
              </div>
              <div className="flex items-center gap-2">
                <div className="skeleton-block-dark skeleton-circle size-4" />
                <div className="skeleton-block-dark skeleton-text w-20" />
              </div>
              <div className="flex items-center gap-2">
                <div className="skeleton-block-dark skeleton-circle size-4" />
                <div className="skeleton-block-dark skeleton-text w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
