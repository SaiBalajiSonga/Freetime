'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

function isHrefActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SidebarLink({
  href,
  icon,
  label,
  disabled,
  exact,
}: {
  href: string
  icon: React.ReactNode
  label: string
  disabled?: boolean
  exact?: boolean
}) {
  const pathname = usePathname()
  const active = !disabled && isHrefActive(pathname, href, exact)

  if (disabled) {
    return (
      <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-2/40 text-sm cursor-not-allowed select-none">
        <span className="opacity-40">{icon}</span>
        <span>{label}</span>
      </div>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
        active
          ? 'bg-[var(--color-sidebar-active-bg)] text-[var(--color-sidebar-active-text)]'
          : 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-surface-2)] hover:text-foreground'
      )}
    >
      {/* Active left bar */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[var(--color-primary)]" />
      )}
      <span className={cn(
        'transition-transform duration-200 group-hover:scale-110',
        active ? 'text-[var(--color-primary)]' : 'group-hover:text-[var(--color-primary)]'
      )}>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  )
}
