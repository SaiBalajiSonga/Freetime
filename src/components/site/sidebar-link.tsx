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
      <div className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-muted-2/40 text-sm cursor-not-allowed">
        {icon}
        <span>{label}</span>
      </div>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
        active
          ? 'bg-surface-2 text-foreground shadow-[inset_0_0_0_1px_rgba(96,165,250,0.28),0_0_24px_-12px_rgba(59,130,246,0.2)]'
          : 'text-muted-2 hover:bg-surface-2 hover:text-foreground'
      )}
    >
      <span
        className={cn(
          'transition-transform duration-300 group-hover:scale-110',
          active && 'text-accent-electric'
        )}
      >
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  )
}
