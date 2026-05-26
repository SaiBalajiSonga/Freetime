import { LayoutDashboard, Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black text-white tracking-tight">
          <LayoutDashboard className="h-5 w-5 text-indigo-400" />
          Dashboard
        </h1>
        <div className="h-4 w-64 bg-surface-2 rounded mt-2"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-5 h-[110px]" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface p-5 h-[300px]" />
        <div className="rounded-xl border border-border bg-surface p-5 h-[300px]" />
      </div>
      
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    </div>
  )
}
