import React, { cloneElement, isValidElement } from 'react'
import { cn } from '@/lib/utils'
import { Space_Grotesk } from 'next/font/google'
import { TrendingUp, TrendingDown, Info, Minus } from 'lucide-react'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['700'] })

export type StatCardProps = {
  label: string
  value: string | number
  icon?: React.ReactNode
  tone?: 'blue' | 'green' | 'orange' | 'purple' | 'red'
  sub?: string
  trend?: 'positive' | 'negative' | 'neutral' | 'warning'
  progress?: number
}

const toneMap = {
  blue: {
    topBar: 'bg-blue-500',
    iconBg: 'bg-blue-50 text-blue-600',
    watermark: 'text-blue-500',
  },
  green: {
    topBar: 'bg-emerald-500',
    iconBg: 'bg-emerald-50 text-emerald-600',
    watermark: 'text-emerald-500',
  },
  orange: {
    topBar: 'bg-orange-500',
    iconBg: 'bg-orange-50 text-orange-600',
    watermark: 'text-orange-500',
  },
  purple: {
    topBar: 'bg-indigo-500',
    iconBg: 'bg-indigo-50 text-indigo-600',
    watermark: 'text-indigo-500',
  },
  red: {
    topBar: 'bg-rose-500',
    iconBg: 'bg-rose-50 text-rose-600',
    watermark: 'text-rose-500',
  },
}

export function StatCard({ label, value, icon, tone = 'blue', sub, trend = 'neutral', progress }: StatCardProps) {
  const config = toneMap[tone]
  const iconElement = isValidElement(icon) ? icon : null

  const renderValue = (val: string | number) => {
    if (typeof val === 'number') return val
    
    // Split by digits to separate numbers and text/symbols
    const parts = String(val).split(/(\d+)/).filter(Boolean)
    return parts.map((part, i) => {
      if (/\d+/.test(part)) {
        return <React.Fragment key={i}>{part}</React.Fragment>
      }
      
      // Less space for symbols like %, slightly more for words like 'days'
      const isSymbol = part.trim() === '%'
      const spacingClass = isSymbol ? 'ml-0.5' : 'ml-1.5'
      
      return (
        <span key={i} className={cn("text-lg text-slate-800 font-bold tracking-normal font-sans", spacingClass)}>
          {part}
        </span>
      )
    })
  }

  const renderSubtext = (text: string) => {
    if (trend === 'positive') {
      return (
        <div className="inline-flex items-center self-start px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[12px] font-semibold mt-2 leading-snug">
          {text}
        </div>
      )
    }
    
    if (trend === 'negative') {
      return (
        <div className="inline-flex items-center self-start px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 text-[12px] font-semibold mt-2 leading-snug">
          {text}
        </div>
      )
    }

    if (trend === 'warning') {
      return (
        <div className="inline-flex items-center self-start px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-[12px] font-semibold mt-2 leading-snug">
          {text}
        </div>
      )
    }
    
    // Default neutral pill
    return (
      <div className="inline-flex items-center self-start px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100 text-slate-600 text-[12px] font-semibold mt-2 leading-snug">
        {text}
      </div>
    )
  }

  return (
    <div className="group relative overflow-hidden rounded-xl bg-white border border-slate-100 px-6 pt-6 pb-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1 hover:border-slate-200">
      
      {/* Decorative Watermark */}
      {iconElement && (
        <div className={cn("absolute right-4 bottom-4 opacity-[0.04] transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-rotate-12 pointer-events-none", config.watermark)}>
          {cloneElement(iconElement as React.ReactElement<any>, { className: 'size-24' })}
        </div>
      )}

      {/* Sleek Top Accent Bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-1.5 transition-all duration-300 opacity-90 group-hover:opacity-100", config.topBar)} />

      <div className="relative z-10 flex flex-col gap-5 mt-1">
        {/* Header: Label */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {iconElement && cloneElement(iconElement as React.ReactElement<any>, { className: 'size-[18px] text-slate-400' })}
            <p className="text-[15px] font-semibold text-slate-500">
              {label}
            </p>
          </div>
        </div>

        {/* Value & Subtext */}
        <div className="flex flex-col">
          <h3 className={cn("text-[40px] font-extrabold text-slate-800 tracking-tight leading-none flex items-baseline", spaceGrotesk.className)}>
            {renderValue(value)}
          </h3>
          {sub && renderSubtext(sub)}
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
