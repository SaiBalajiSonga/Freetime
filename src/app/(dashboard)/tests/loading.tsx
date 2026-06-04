export default function TestsLoading() {
  return (
    <div className="space-y-8 loading-fade-in">
      {/* ── Page header skeleton ── */}
      <div className="mb-7">
        <div className="skeleton-block skeleton-text-xl w-24 mb-2" />
        <div className="skeleton-block skeleton-text w-72" />
      </div>

      {/* ── Test creation cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg bg-white border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 space-y-4"
          >
            <div className="skeleton-block size-12 rounded-xl" />
            <div className="skeleton-block skeleton-text-lg w-36" />
            <div className="space-y-1.5">
              <div className="skeleton-block skeleton-text w-full" />
              <div className="skeleton-block skeleton-text w-4/5" />
            </div>
            <div className="skeleton-block rounded-full h-10 w-32 mt-2" />
          </div>
        ))}
      </div>

      {/* ── Section: Past tests ── */}
      <div className="space-y-4">
        <div className="skeleton-block skeleton-text-lg w-28" />
        
        {/* ── Filter tabs ── */}
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-block rounded-full h-8 w-20" />
          ))}
        </div>

        {/* ── Session list ── */}
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-lg bg-white border border-[var(--color-border)] shadow-[var(--shadow-card)] p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="skeleton-block size-10 rounded-xl" />
                <div className="space-y-1.5">
                  <div className="skeleton-block skeleton-text-lg w-36" />
                  <div className="skeleton-block skeleton-text w-24" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="skeleton-block rounded-full h-5 w-16" />
                <div className="skeleton-block skeleton-text w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
