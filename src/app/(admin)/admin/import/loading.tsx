export default function AdminImportLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto loading-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <div className="skeleton-block-dark skeleton-text-xl w-36" />
        <div className="skeleton-block-dark skeleton-text w-72" />
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 py-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 flex-1">
            <div className="skeleton-block-dark skeleton-circle size-8 shrink-0" />
            <div className="skeleton-block-dark skeleton-text w-16" />
            {i < 3 && <div className="flex-1 h-px bg-[#1e2536]" />}
          </div>
        ))}
      </div>

      {/* Upload area */}
      <div className="rounded-xl border-2 border-dashed border-[#1e2536] bg-[#0f1629] p-12 flex flex-col items-center gap-4">
        <div className="skeleton-block-dark size-16 rounded-2xl" />
        <div className="skeleton-block-dark skeleton-text-lg w-48" />
        <div className="skeleton-block-dark skeleton-text w-64" />
        <div className="skeleton-block-dark rounded-lg h-10 w-36 mt-2" />
      </div>

      {/* Format help */}
      <div className="rounded-xl border border-[#1e2536] bg-[#0f1629] p-5 space-y-3">
        <div className="skeleton-block-dark skeleton-text-lg w-28" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton-block-dark skeleton-text" style={{ width: `${85 - i * 10}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
