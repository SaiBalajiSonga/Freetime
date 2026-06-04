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

      {/* ── Zone 1: Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg bg-[#161b27] border border-[#2a3142] p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="skeleton-block-dark skeleton-circle size-9" />
              <div className="skeleton-block-dark skeleton-text w-12" />
            </div>
            <div className="skeleton-block-dark skeleton-text-xl w-16" />
            <div className="skeleton-block-dark skeleton-text w-24" />
          </div>
        ))}
      </div>

      {/* ── Zone 2: 5-col grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        
        {/* Left: 3/5 */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="rounded-lg border border-[#2a3142] bg-[#161b27] p-5 h-64 skeleton-block-dark" />
          <div className="rounded-lg border border-[#2a3142] bg-[#161b27] p-5 h-64 skeleton-block-dark" />
        </div>

        {/* Right: 2/5 */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="rounded-lg border border-[#2a3142] bg-[#161b27] p-5 h-48 skeleton-block-dark" />
          <div className="rounded-lg border border-[#2a3142] bg-[#161b27] p-5 h-64 skeleton-block-dark" />
        </div>

      </div>
    </div>
  )
}
