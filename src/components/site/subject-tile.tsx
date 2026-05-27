import Link from 'next/link'
import type React from 'react'
import { cn } from '@/lib/utils'

type SubjectTileProps = {
  href: string
  name: string
  icon: React.ReactNode
  count?: number
  pct?: number
  color: 'blue' | 'orange' | 'green' | 'purple' | 'pink' | 'cyan'
}

const colorMap: Record<SubjectTileProps['color'], { tile: string; icon: string; text: string, bg: string }> = {
  blue:   { tile: 'subject-tile-blue',   icon: 'icon-box-blue',   text: 'text-[#1d4ed8]', bg: 'bg-[#1d4ed8]' },
  orange: { tile: 'subject-tile-orange', icon: 'icon-box-orange', text: 'text-[#c2410c]', bg: 'bg-[#c2410c]' },
  green:  { tile: 'subject-tile-green',  icon: 'icon-box-green',  text: 'text-[#065f46]', bg: 'bg-[#065f46]' },
  purple: { tile: 'subject-tile-purple', icon: 'icon-box-purple', text: 'text-[#6d28d9]', bg: 'bg-[#6d28d9]' },
  pink:   { tile: 'subject-tile-pink',   icon: 'icon-box-pink',   text: 'text-[#9d174d]', bg: 'bg-[#9d174d]' },
  cyan:   { tile: 'subject-tile-cyan',   icon: 'icon-box-cyan',   text: 'text-[#155e75]', bg: 'bg-[#155e75]' },
}

export function SubjectTile({ href, name, icon, count, color, pct = 0 }: SubjectTileProps) {
  const styles = colorMap[color]

  return (
    <Link
      href={href}
      className={cn(
        'group relative flex items-center gap-4 rounded-2xl p-5 transition-all duration-250 overflow-hidden',
        'hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]',
        styles.tile
      )}
    >
      <div className={cn('icon-box size-12 rounded-2xl bg-white/60 group-hover:bg-white/80 transition-colors shrink-0', styles.text)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-lg font-bold leading-tight', styles.text)}>{name}</p>
        <p className={cn('text-[11px] font-medium mt-1 opacity-70', styles.text)}>
          {count !== undefined ? `${count} Qs` : ''} {count !== undefined && '·'} {pct}% complete
        </p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5">
        <div 
          className={cn("h-full transition-all duration-500", styles.bg)} 
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} 
        />
      </div>
    </Link>
  )
}

/* ── Subject tile row wrapper ── */
export function SubjectTileRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {children}
    </div>
  )
}
