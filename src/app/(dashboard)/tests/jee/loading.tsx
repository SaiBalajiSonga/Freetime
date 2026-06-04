export default function JeeTestLoading() {
  return (
    <div className="space-y-6 loading-fade-in max-w-3xl mx-auto">
      {/* ── Back link ── */}
      <div className="skeleton-block skeleton-text w-24 h-4" />

      {/* ── JEE Mains header card ── */}
      <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="skeleton-block size-12 rounded-xl" style={{ background: '#c7d2fe' }} />
          <div className="space-y-2">
            <div className="skeleton-block skeleton-text-xl w-44" style={{ background: '#c7d2fe' }} />
            <div className="skeleton-block skeleton-text w-56" style={{ background: '#ddd6fe' }} />
          </div>
        </div>
      </div>

      {/* ── Info grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg bg-white border border-[var(--color-border)] p-4 space-y-2">
            <div className="skeleton-block skeleton-circle size-8" />
            <div className="skeleton-block skeleton-text-lg w-12" />
            <div className="skeleton-block skeleton-text w-20" />
          </div>
        ))}
      </div>

      {/* ── Subject breakdown ── */}
      <div className="rounded-lg bg-white border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5 space-y-4">
        <div className="skeleton-block skeleton-text-lg w-32" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <div className="skeleton-block size-8 rounded-lg" />
                <div className="skeleton-block skeleton-text w-20" />
              </div>
              <div className="skeleton-block skeleton-text w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Start button ── */}
      <div className="skeleton-block rounded-full h-12 w-full" />
    </div>
  )
}
