import React, { cloneElement, isValidElement } from 'react'
import { cn } from '@/lib/utils'

type StatCardProps = {
  label: string
  value: string | number
  icon: React.ReactNode
  tone?: 'blue' | 'green' | 'orange' | 'purple' | 'red'
  sub?: string
  progress?: number
}

const toneMap = {
  blue: {
    topBar: 'bg-blue-500',
    iconBg: 'bg-blue-50 text-blue-600',
    watermark: 'text-blue-600',
  },
  green: {
    topBar: 'bg-emerald-500',
    iconBg: 'bg-emerald-50 text-emerald-600',
    watermark: 'text-emerald-600',
  },
  orange: {
    topBar: 'bg-orange-500',
    iconBg: 'bg-orange-50 text-orange-600',
    watermark: 'text-orange-600',
  },
  purple: {
    topBar: 'bg-indigo-500',
    iconBg: 'bg-indigo-50 text-indigo-600',
    watermark: 'text-indigo-600',
  },
  red: {
    topBar: 'bg-rose-500',
    iconBg: 'bg-rose-50 text-rose-600',
    watermark: 'text-rose-600',
  },
}

export function StatCard({ label, value, icon, tone = 'blue', sub, progress }: StatCardProps) {
  const config = toneMap[tone]
  const iconElement = isValidElement(icon) ? icon : null

  return (
    <div className="group relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-slate-300">
      
      {/* Decorative Watermark */}
      {iconElement && (
        <div className={cn("absolute right-4 bottom-4 opacity-[0.05] transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-rotate-12 pointer-events-none", config.watermark)}>
          {cloneElement(iconElement as React.ReactElement<any>, { className: 'size-24' })}
        </div>
      )}

      {/* Sleek Top Accent Bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-1.5 transition-all duration-300 opacity-90 group-hover:opacity-100", config.topBar)} />

      <div className="relative z-10 flex flex-col gap-5 mt-1">
        {/* Header: Icon and Label Grouped */}
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex size-12 items-center justify-center rounded-[16px] transition-transform duration-300 group-hover:scale-110",
            config.iconBg
          )}>
            {iconElement && cloneElement(iconElement as React.ReactElement<any>, { className: 'size-6' })}
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
            {label}
          </p>
        </div>

        {/* Content: Value and Subtitle */}
        <div>
          <h3 className="text-[40px] font-extrabold text-slate-800 tracking-tight leading-none mb-2">
            {value}
          </h3>
          {sub && (
            <p className="text-[13px] font-semibold text-slate-400">
              {sub}
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar (if exists) */}
      {progress !== undefined && (
        <div className="absolute z-10 bottom-0 left-0 right-0 h-1.5 bg-slate-100">
          <div 
            className={cn("h-full transition-all duration-700 ease-out", config.topBar)}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} 
          />
        </div>
      )}
    </div>
  )
}
