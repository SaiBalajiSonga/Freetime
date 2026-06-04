export default function SettingsLoading() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-6 loading-fade-in">
      {/* ── Page header ── */}
      <div className="mb-8">
        <div className="skeleton-block skeleton-text-xl w-44 mb-3" />
        <div className="skeleton-block skeleton-text w-72" />
      </div>

      {/* ── Settings form card ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 space-y-6">
        {/* Avatar + name row */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="skeleton-block skeleton-circle size-16" />
          <div className="space-y-2">
            <div className="skeleton-block skeleton-text-lg w-32" />
            <div className="skeleton-block skeleton-text w-48" />
          </div>
        </div>

        {/* Form fields */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="skeleton-block skeleton-text w-20 h-3" />
            <div className="skeleton-block h-10 w-full rounded-lg" />
          </div>
        ))}

        {/* Submit button */}
        <div className="flex justify-end pt-4">
          <div className="skeleton-block rounded-lg h-10 w-32" />
        </div>
      </div>
    </div>
  )
}
