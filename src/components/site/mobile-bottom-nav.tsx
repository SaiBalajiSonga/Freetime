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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(0,0,0,0.04)] md:hidden">
      <div className="grid grid-cols-5 gap-1 px-2 py-1.5 max-w-md mx-auto">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition-all min-w-0',
                active
                  ? 'bg-[var(--color-sidebar-active-bg)] text-[var(--color-primary)]'
                  : 'text-muted hover:text-foreground hover:bg-surface-2'
              )}
            >
              <Icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-[var(--color-primary)]' : '')} />
              <span className="truncate w-full text-center">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
