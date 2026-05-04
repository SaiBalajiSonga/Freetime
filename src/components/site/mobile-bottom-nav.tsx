'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { LayoutDashboard, BookOpen, ClipboardList, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/subjects', label: 'Subjects', icon: BookOpen },
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
    <nav className="fixed bottom-4 left-1/2 z-40 w-[min(92vw,420px)] -translate-x-1/2 rounded-3xl border border-white/[0.08] bg-surface/90 px-3 py-2 shadow-2xl backdrop-blur-md md:hidden">
      <div className="grid grid-cols-4 gap-2">
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
                'flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-semibold transition-all',
                active
                  ? 'bg-[#3B82F6]/20 text-white shadow-[0_10px_30px_-18px_rgba(59,130,246,0.8)]'
                  : 'text-muted-2 hover:text-foreground hover:bg-white/[0.04]'
              )}
            >
              <Icon className={cn('h-4 w-4', active ? 'text-[#93C5FD]' : '')} />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
