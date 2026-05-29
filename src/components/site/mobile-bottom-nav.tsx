'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, FlaskConical, ClipboardList, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/learn', label: 'Learn', icon: BookOpen },
  { href: '/subjects', label: 'Practice', icon: FlaskConical },
  { href: '/tests', label: 'Tests', icon: ClipboardList },
  { href: '/exams', label: 'Exams', icon: Calendar },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const hideOnTests = pathname.startsWith('/tests') || pathname.startsWith('/exams')

  if (hideOnTests) return null

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 w-[min(96vw,420px)] -translate-x-1/2 rounded-2xl bg-white border border-[var(--color-border)] px-2 py-2 shadow-[0_8px_32px_rgba(15,23,42,0.14)] md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition-all',
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
