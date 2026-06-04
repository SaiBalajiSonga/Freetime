import { LayoutDashboard } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto loading-fade-in">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black text-white tracking-tight">
          <LayoutDashboard className="h-5 w-5 text-indigo-400" />
          Dashboard
        </h1>
        <div className="skeleton-block-dark skeleton-text w-64 mt-2" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-[#1e2536] bg-[#0f1629] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="skeleton-block-dark skeleton-circle size-9" />
              <div className="skeleton-block-dark skeleton-text w-12" />
            </div>
            <div className="skeleton-block-dark skeleton-text-xl w-16" />
            <div className="skeleton-block-dark skeleton-text w-24" />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[#1e2536] bg-[#0f1629] p-5 space-y-4">
          <div className="skeleton-block-dark skeleton-text-lg w-32" />
          <div className="skeleton-block-dark h-48 rounded-lg" />
        </div>
        <div className="rounded-xl border border-[#1e2536] bg-[#0f1629] p-5 space-y-4">
          <div className="skeleton-block-dark skeleton-text-lg w-28" />
          <div className="skeleton-block-dark h-48 rounded-lg" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#1e2536] bg-[#0f1629] p-5 space-y-4">
        <div className="skeleton-block-dark skeleton-text-lg w-36" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-[#1e2536] last:border-0">
              <div className="skeleton-block-dark skeleton-circle size-8" />
              <div className="skeleton-block-dark skeleton-text flex-1" />
              <div className="skeleton-block-dark skeleton-text w-16" />
              <div className="skeleton-block-dark skeleton-text w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
