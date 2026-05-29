import Link from 'next/link'
import type React from 'react'
import { cn } from '@/lib/utils'

/* ── Card ───────────────────────────────────────────────── */
type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'white' | 'colored' | 'blue'
  tone?: 'blue' | 'green' | 'yellow' | 'red' | 'orange' | 'purple'
}

const toneGradients: Record<NonNullable<CardProps['tone']>, string> = {
  blue:   'from-[#2563eb] to-[#1d4ed8]',
  green:  'from-[#10b981] to-[#059669]',
  yellow: 'from-[#f59e0b] to-[#d97706]',
  red:    'from-[#ef4444] to-[#dc2626]',
  orange: 'from-[#f97316] to-[#ea580c]',
  purple: 'from-[#8b5cf6] to-[#7c3aed]',
}

export function Card({ variant = 'white', tone = 'blue', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg transition-all duration-250 p-5',
        variant === 'colored'
          ? `bg-gradient-to-br ${toneGradients[tone]} text-white shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5`
          : variant === 'blue'
          ? 'bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white shadow-[var(--shadow-blue-glow)]'
          : 'bg-white border border-[var(--color-border)] text-foreground shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
      {/* Subtle sheen overlay on colored variants */}
      {(variant === 'colored' || variant === 'blue') && (
        <div
          className="pointer-events-none absolute inset-0 rounded-lg"
          style={{ background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18) 0%, transparent 60%)' }}
        />
      )}
    </div>
  )
}

/* ── GridItem (Quick actions) ───────────────────────────── */
type GridItemProps = {
  href: string
  label: string
  icon: React.ReactNode
  tone?: 'blue' | 'green' | 'yellow' | 'red' | 'orange' | 'purple'
  description?: string
}

const gridToneStyles: Record<NonNullable<GridItemProps['tone']>, { box: string; ring: string }> = {
  blue:   { box: 'icon-box-blue',   ring: 'hover:border-blue-200' },
  green:  { box: 'icon-box-green',  ring: 'hover:border-green-200' },
  yellow: { box: 'icon-box-yellow', ring: 'hover:border-yellow-200' },
  red:    { box: 'icon-box-red',    ring: 'hover:border-red-200' },
  orange: { box: 'icon-box-orange', ring: 'hover:border-orange-200' },
  purple: { box: 'icon-box-purple', ring: 'hover:border-purple-200' },
}

export function GridItem({ href, label, icon, description, tone = 'blue' }: GridItemProps) {
  const styles = gridToneStyles[tone]
  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col gap-3 rounded-lg bg-white border border-[var(--color-border)] p-4 shadow-[var(--shadow-card)] transition-all duration-250 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]',
        styles.ring
      )}
    >
      <div className={cn('icon-box size-11', styles.box)}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
    </Link>
  )
}

/* ── SectionHeader ──────────────────────────────────────── */
type SectionHeaderProps = {
  label?: string
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function SectionHeader({ label, title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {label && <p className="section-label mb-1">{label}</p>}
        <h2 className="text-lg font-bold text-foreground tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted mt-1 max-w-xl">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/* ── PageHeader ─────────────────────────────────────────── */
type PageHeaderProps = {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-7">
      <div>
        <h1 className="page-header-title">{title}</h1>
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/* ── DifficultyBadge ────────────────────────────────────── */
type DifficultyBadgeProps = {
  level?: string | null
  className?: string
}

export function DifficultyBadge({ level, className }: DifficultyBadgeProps) {
  const key = level?.toLowerCase() ?? ''
  const ariaLabel = level ? `${level} difficulty` : 'Mixed difficulty'
  const badgeClass =
    key === 'easy'   ? 'badge-easy'   :
    key === 'medium' ? 'badge-medium' :
    key === 'hard'   ? 'badge-hard'   :
                       'badge-mixed'

  return (
    <span
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em]',
        badgeClass,
        className
      )}
    >
      {level || 'mixed'}
    </span>
  )
}

/* ── FloatingButton ─────────────────────────────────────── */
type FloatingButtonProps = {
  href: string
  label: string
  icon?: React.ReactNode
  className?: string
}

export function FloatingButton({ href, label, icon, className }: FloatingButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        'fixed bottom-28 right-5 z-40 flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-blue-glow)] transition-transform hover:-translate-y-1 md:hidden',
        className
      )}
    >
      {icon}
      {label}
    </Link>
  )
}
