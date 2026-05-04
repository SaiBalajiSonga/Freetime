import Link from 'next/link'
import type React from 'react'
import { cn } from '@/lib/utils'

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'colored' | 'dark'
  tone?: 'blue' | 'green' | 'yellow' | 'red'
}

const toneStyles: Record<NonNullable<CardProps['tone']>, string> = {
  blue: 'from-[#3B82F6]/35 via-[#3B82F6]/15 to-[#0B0F14]/60',
  green: 'from-[#84CC16]/30 via-[#84CC16]/15 to-[#0B0F14]/60',
  yellow: 'from-[#FACC15]/30 via-[#FACC15]/15 to-[#0B0F14]/60',
  red: 'from-[#EF4444]/30 via-[#EF4444]/15 to-[#0B0F14]/60',
}

export function Card({ variant = 'dark', tone = 'blue', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'card-stack relative overflow-hidden rounded-3xl border border-white/[0.08] p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl',
        variant === 'colored'
          ? `bg-gradient-to-br ${toneStyles[tone]} text-foreground`
          : 'bg-surface/90 text-foreground',
        className
      )}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 mix-blend-screen bg-[radial-gradient(circle_at_top,_var(--color-card-overlay),_transparent_60%)]"
        style={{ opacity: 0.6 }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

type GridItemProps = {
  href: string
  label: string
  icon: React.ReactNode
  tone?: CardProps['tone']
  description?: string
}

export function GridItem({ href, label, icon, description, tone = 'blue' }: GridItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative rounded-2xl border border-white/[0.08] bg-surface/80 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
        'hover:bg-surface-2/80'
      )}
    >
      <div className={cn('mb-3 flex size-11 items-center justify-center rounded-2xl border border-white/[0.12]', {
        'bg-[#3B82F6]/15 text-[#93C5FD]': tone === 'blue',
        'bg-[#84CC16]/15 text-[#BEF264]': tone === 'green',
        'bg-[#FACC15]/15 text-[#FDE68A]': tone === 'yellow',
        'bg-[#EF4444]/15 text-[#FCA5A5]': tone === 'red',
      })}>
        {icon}
      </div>
      <p className="text-sm font-semibold text-foreground">{label}</p>
      {description && <p className="mt-1 text-xs text-muted">{description}</p>}
      <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </Link>
  )
}

type SectionHeaderProps = {
  label?: string
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function SectionHeader({ label, title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {label && <p className="section-label mb-2">{label}</p>}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-[-0.03em]">{title}</h2>
        {subtitle && <p className="text-sm text-muted mt-2 max-w-xl">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

type DifficultyBadgeProps = {
  level?: string | null
  className?: string
}

export function DifficultyBadge({ level, className }: DifficultyBadgeProps) {
  const key = level?.toLowerCase() ?? ''
  const styles =
    key === 'easy'
      ? 'bg-[#84CC16]/15 text-[#BEF264] border-[#84CC16]/30'
      : key === 'medium'
        ? 'bg-[#FACC15]/15 text-[#FDE68A] border-[#FACC15]/35'
        : key === 'hard'
          ? 'bg-[#EF4444]/15 text-[#FCA5A5] border-[#EF4444]/35'
          : 'bg-surface-2 text-muted border-border'

  return (
    <span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]', styles, className)}>
      {level || 'mixed'}
    </span>
  )
}

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
        'fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[#3B82F6] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_-18px_rgba(59,130,246,0.9)] transition-transform hover:-translate-y-1 hover:shadow-[0_22px_50px_-18px_rgba(59,130,246,1)] md:hidden',
        className
      )}
    >
      {icon}
      {label}
    </Link>
  )
}
