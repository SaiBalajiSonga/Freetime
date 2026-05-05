'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { LayoutDashboard, BookOpen, ClipboardList, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/subjects', label: 'Learn', icon: BookOpen },
  { href: '/tests', label: 'Tests', icon: ClipboardList },
  { href: '/dashboard?section=analytics', label: 'Analytics', icon: BarChart3 },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const hideOnTests = pathname.startsWith('/tests')
  const analyticsActive = pathname === '/dashboard' && searchParams.get('section') === 'analytics'

  if (hideOnTests) return null

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 w-[min(92vw,400px)] -translate-x-1/2 rounded-2xl bg-white border border-[var(--color-border)] px-3 py-2 shadow-[0_8px_32px_rgba(15,23,42,0.14)] md:hidden">
      <div className="grid grid-cols-4 gap-1">
        {items.map((item) => {
          const isAnalytics = item.href.includes('section=analytics')
          const active = isAnalytics
            ? analyticsActive
            : pathname === item.href || (item.href === '/subjects' && pathname.startsWith('/subjects'))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold transition-all',
                active
                  ? 'bg-[var(--color-sidebar-active-bg)] text-[var(--color-primary)]'
                  : 'text-muted hover:text-foreground hover:bg-surface-2'
              )}
            >
              <Icon className={cn('h-[18px] w-[18px]', active ? 'text-[var(--color-primary)]' : '')} />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
