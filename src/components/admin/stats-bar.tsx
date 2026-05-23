import React from 'react'

export type StatItem = {
  label: string
  value: number
  color?: string
}

export function StatsBar({ stats }: { stats: StatItem[] }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {stats.map((s, i) => (
        <React.Fragment key={s.label}>
          {i > 0 && <span className="h-3 w-px bg-white/10 hidden sm:block" />}
          <div className="flex items-center gap-1.5">
            <span className={`text-base font-bold tabular-nums ${s.color ?? 'text-foreground'}`}>
              {s.value.toLocaleString()}
            </span>
            <span className="text-xs text-muted-2 font-medium uppercase tracking-wide">{s.label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}
