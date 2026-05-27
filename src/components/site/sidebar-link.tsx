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
  collapsed,
}: {
  href: string
  icon: React.ReactNode
  label: string
  disabled?: boolean
  exact?: boolean
  collapsed?: boolean
}) {
  const pathname = usePathname()
  const active = !disabled && isHrefActive(pathname, href, exact)

  if (disabled) {
    return (
      <div 
        className={cn(
          "flex items-center gap-3 rounded-xl py-2.5 text-muted-2/40 text-[15px] cursor-not-allowed select-none transition-all duration-200",
          collapsed ? "px-0 justify-center" : "px-3"
        )}
        title={collapsed ? label : undefined}
      >
        <span className={cn("opacity-40 transition-all", collapsed && "mx-auto")}>{icon}</span>
        {!collapsed && <span>{label}</span>}
      </div>
    )
  }

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl py-2.5 text-[15px] font-medium transition-all duration-200',
        collapsed ? "px-0 justify-center" : "px-3",
        active
          ? 'bg-blue-100 text-blue-900 font-bold'
          : 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-surface-2)] hover:text-foreground'
      )}
    >
      {/* Active left bar */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[var(--color-primary)]" />
      )}
      <span className={cn(
        'transition-transform duration-200 group-hover:scale-110',
        active ? 'text-[var(--color-primary)]' : 'group-hover:text-[var(--color-primary)]',
        collapsed && "mx-auto"
      )}>
        {icon}
      </span>
      {!collapsed && <span>{label}</span>}
    </Link>
  )
}
