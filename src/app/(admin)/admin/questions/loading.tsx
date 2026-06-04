export default function AdminQuestionsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto loading-fade-in">
      {/* Header + action */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton-block-dark skeleton-text-xl w-32" />
          <div className="skeleton-block-dark skeleton-text w-64" />
        </div>
        <div className="skeleton-block-dark rounded-lg h-9 w-32" />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="skeleton-block-dark rounded-lg h-9 w-40" />
        <div className="skeleton-block-dark rounded-lg h-9 w-36" />
        <div className="skeleton-block-dark rounded-lg h-9 w-28" />
        <div className="skeleton-block-dark rounded-lg h-9 w-52 ml-auto" />
      </div>

      {/* Questions table */}
      <div className="rounded-xl border border-[#1e2536] bg-[#0f1629] overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-[#1e2536] bg-[#0d1117]">
          <div className="skeleton-block-dark size-4 rounded shrink-0" />
          <div className="skeleton-block-dark skeleton-text w-12" />
          <div className="skeleton-block-dark skeleton-text flex-1" />
          <div className="skeleton-block-dark skeleton-text w-16" />
          <div className="skeleton-block-dark skeleton-text w-16" />
          <div className="skeleton-block-dark skeleton-text w-12" />
        </div>
        {/* Rows */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-[#1e2536] last:border-0">
            <div className="skeleton-block-dark size-4 rounded shrink-0" />
            <div className="skeleton-block-dark skeleton-text w-16" />
            <div className="skeleton-block-dark skeleton-text flex-1 max-w-sm" />
            <div className="skeleton-block-dark rounded-full h-5 w-14" />
            <div className="skeleton-block-dark skeleton-text w-16" />
            <div className="skeleton-block-dark size-6 rounded-md shrink-0" />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="skeleton-block-dark skeleton-text w-32" />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-block-dark size-8 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  )
}
