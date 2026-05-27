import type React from 'react'
import { cn } from '@/lib/utils'

type StatCardProps = {
  label: string
  value: string | number
  icon: React.ReactNode
  tone?: 'blue' | 'green' | 'orange' | 'purple' | 'red'
  sub?: string
}

const toneClass: Record<NonNullable<StatCardProps['tone']>, string> = {
  blue:   'stat-card-blue',
  green:  'stat-card-green',
  orange: 'stat-card-orange',
  purple: 'stat-card-purple',
  red:    'stat-card-red',
}

export function StatCard({ label, value, icon, tone = 'blue', sub }: StatCardProps) {
  return (
    <div className={cn(
      'group relative overflow-hidden rounded-2xl p-5 shadow-[var(--shadow-card)] cursor-default transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-[var(--shadow-card-hover)]',
      toneClass[tone]
    )}>
      {/* Sheen */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ background: 'radial-gradient(circle at 15% 15%, rgba(255,255,255,0.22) 0%, transparent 60%)' }}
      />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="size-9 rounded-xl bg-white/20 flex items-center justify-center">
            {icon}
          </div>
        </div>
        <p className="stat-number text-3xl text-white">{value}</p>
        <p className="text-sm font-semibold text-white/80 mt-1">{label}</p>
        {sub && <p className="text-[11px] text-white/60 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
