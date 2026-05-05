import Link from 'next/link'
import type React from 'react'
import { cn } from '@/lib/utils'

type SubjectTileProps = {
  href: string
  name: string
  icon: React.ReactNode
  count?: number
  color: 'blue' | 'orange' | 'green' | 'purple' | 'pink' | 'cyan'
}

const colorMap: Record<SubjectTileProps['color'], { tile: string; icon: string; text: string }> = {
  blue:   { tile: 'subject-tile-blue',   icon: 'icon-box-blue',   text: 'text-[#1d4ed8]' },
  orange: { tile: 'subject-tile-orange', icon: 'icon-box-orange', text: 'text-[#c2410c]' },
  green:  { tile: 'subject-tile-green',  icon: 'icon-box-green',  text: 'text-[#065f46]' },
  purple: { tile: 'subject-tile-purple', icon: 'icon-box-purple', text: 'text-[#6d28d9]' },
  pink:   { tile: 'subject-tile-pink',   icon: 'icon-box-pink',   text: 'text-[#9d174d]' },
  cyan:   { tile: 'subject-tile-cyan',   icon: 'icon-box-cyan',   text: 'text-[#155e75]' },
}

export function SubjectTile({ href, name, icon, count, color }: SubjectTileProps) {
  const styles = colorMap[color]

  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col items-center gap-3 rounded-2xl p-4 transition-all duration-250',
        'hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]',
        styles.tile
      )}
    >
      <div className={cn('icon-box size-12 rounded-2xl bg-white/60 group-hover:bg-white/80 transition-colors', styles.text)}>
        {icon}
      </div>
      <div className="text-center">
        <p className={cn('text-sm font-bold leading-tight', styles.text)}>{name}</p>
        {count !== undefined && (
          <p className={cn('text-[11px] font-medium mt-0.5 opacity-70', styles.text)}>{count} Qs</p>
        )}
      </div>
    </Link>
  )
}

/* ── Subject tile row wrapper ── */
export function SubjectTileRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
      {children}
    </div>
  )
}
