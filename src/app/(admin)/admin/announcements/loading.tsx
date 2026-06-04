export default function AdminAnnouncementsLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto loading-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton-block-dark skeleton-text-xl w-40" />
          <div className="skeleton-block-dark skeleton-text w-56" />
        </div>
        <div className="skeleton-block-dark rounded-lg h-9 w-36" />
      </div>

      {/* Announcement cards */}
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-[#1e2536] bg-[#0f1629] p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="skeleton-block-dark skeleton-text-lg w-52" />
                <div className="skeleton-block-dark skeleton-text w-24" />
              </div>
              <div className="flex gap-2 shrink-0">
                <div className="skeleton-block-dark size-7 rounded-md" />
                <div className="skeleton-block-dark size-7 rounded-md" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="skeleton-block-dark skeleton-text w-full" />
              <div className="skeleton-block-dark skeleton-text w-4/5" />
              <div className="skeleton-block-dark skeleton-text w-3/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
