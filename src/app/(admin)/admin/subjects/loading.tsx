export default function AdminSubjectsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto loading-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton-block-dark skeleton-text-xl w-32" />
          <div className="skeleton-block-dark skeleton-text w-56" />
        </div>
        <div className="skeleton-block-dark rounded-lg h-9 w-28" />
      </div>

      {/* Subject management table */}
      <div className="rounded-xl border border-[#1e2536] bg-[#0f1629] overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-[#1e2536]">
          <div className="skeleton-block-dark skeleton-text w-20" />
          <div className="skeleton-block-dark skeleton-text w-16 ml-auto" />
          <div className="skeleton-block-dark skeleton-text w-20" />
          <div className="skeleton-block-dark skeleton-text w-16" />
        </div>
        {/* Rows */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-[#1e2536] last:border-0">
            <div className="skeleton-block-dark size-8 rounded-lg shrink-0" />
            <div className="skeleton-block-dark skeleton-text-lg w-28" />
            <div className="skeleton-block-dark skeleton-text w-20 ml-auto" />
            <div className="skeleton-block-dark skeleton-text w-16" />
            <div className="skeleton-block-dark size-7 rounded-md shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
