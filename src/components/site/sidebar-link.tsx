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
          "flex cursor-not-allowed select-none transition-colors duration-200 rounded-xl opacity-50",
          collapsed 
            ? "flex-col items-center justify-center gap-1.5 py-3.5 px-1 mx-1" 
            : "flex-row items-center gap-4 py-3 px-4 mx-2 text-[15px]"
        )}
        title={collapsed ? label : undefined}
      >
        <span className="flex items-center justify-center text-slate-400">{icon}</span>
        {collapsed ? (
          <span className="text-[10.5px] leading-none tracking-tight font-medium text-center truncate w-full px-0.5 text-slate-400">{label}</span>
        ) : (
          <span className="leading-none text-slate-400">{label}</span>
        )}
      </div>
    )
  }

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        'group relative flex transition-colors duration-200 rounded-xl w-full',
        collapsed 
          ? "flex-col items-center justify-center gap-1.5 py-3" 
          : "flex-row items-center gap-3.5 py-3 px-4",
        active
          ? 'bg-blue-100 text-blue-700 font-bold'
          : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-900 font-medium'
      )}
    >
      <span className={cn(
        'transition-transform duration-200 group-hover:scale-110 flex items-center justify-center',
        active ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-900'
      )}>
        {icon}
      </span>

      {collapsed ? (
        <span className="text-[10px] leading-none tracking-tight font-semibold text-center w-full px-0.5">{label}</span>
      ) : (
        <span className="text-[14px] leading-none">{label}</span>
      )}
    </Link>
  )
}
