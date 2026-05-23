import React from 'react'

export type StatItem = {
  label: string
  value: number
  color?: string
}

export function StatsBar({ stats }: { stats: StatItem[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1"
        >
          <span className={`text-sm font-bold tabular-nums leading-none ${s.color ?? 'text-foreground'}`}>
            {s.value.toLocaleString()}
          </span>
          <span className="text-[10px] text-muted-2 font-bold uppercase tracking-widest leading-none">
            {s.label}
          </span>
        </div>
      ))}
    </div>
  )
}
