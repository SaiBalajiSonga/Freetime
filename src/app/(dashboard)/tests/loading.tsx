export default function TestsLoading() {
  return (
    <div className="space-y-0 animate-in-up loading-fade-in">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <div className="skeleton-block skeleton-text-xl w-40 mb-2" />
          <div className="skeleton-block skeleton-text w-72" />
        </div>
        
        {/* Create Test Buttons */}
        <div className="flex items-center gap-3">
           <div className="skeleton-block w-36 h-14 rounded-xl" />
           <div className="skeleton-block w-36 h-14 rounded-xl" />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-[var(--color-border)] mb-6 flex gap-2">
         {[...Array(3)].map((_, i) => (
           <div key={i} className="skeleton-block h-10 w-24 rounded-t-lg" />
         ))}
      </div>

      {/* ── Content ── */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-[var(--color-border)] bg-white overflow-hidden flex flex-col">
            <div className="p-4 flex items-start gap-4">
              <div className="skeleton-block size-14 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1 pt-1">
                <div className="skeleton-block skeleton-text-lg w-48" />
                <div className="skeleton-block skeleton-text w-32" />
              </div>
            </div>
            <div className="border-t border-[var(--color-border)] bg-slate-50/30 px-4 py-3">
               <div className="skeleton-block skeleton-text w-full" />
            </div>
            <div className="border-t border-[var(--color-border)] px-4 py-3 flex justify-between bg-slate-50/60">
               <div className="skeleton-block skeleton-text w-24" />
               <div className="skeleton-block size-4 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
