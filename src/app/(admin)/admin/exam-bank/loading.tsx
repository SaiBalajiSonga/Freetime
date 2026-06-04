export default function AdminExamBankLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto loading-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton-block-dark skeleton-text-xl w-32" />
          <div className="skeleton-block-dark skeleton-text w-64" />
        </div>
        <div className="skeleton-block-dark rounded-lg h-9 w-28" />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <div className="skeleton-block-dark rounded-lg h-9 w-44" />
        <div className="skeleton-block-dark rounded-lg h-9 w-32" />
      </div>

      {/* Exam bank grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border border-[#1e2536] bg-[#0f1629] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="skeleton-block-dark rounded-full h-5 w-16" />
              <div className="skeleton-block-dark size-6 rounded-md" />
            </div>
            <div className="skeleton-block-dark skeleton-text-lg w-40" />
            <div className="space-y-1">
              <div className="skeleton-block-dark skeleton-text w-full" />
              <div className="skeleton-block-dark skeleton-text w-3/4" />
            </div>
            <div className="flex gap-4 pt-2 border-t border-[#1e2536]">
              <div className="skeleton-block-dark skeleton-text w-20" />
              <div className="skeleton-block-dark skeleton-text w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
