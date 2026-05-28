'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import {
  BookOpen,
  LayoutDashboard,
  FlaskConical,
  ClipboardList,
  Calendar,
  Settings,
  Menu,
} from 'lucide-react'
import { SidebarLink } from '@/components/site/sidebar-link'
import { cn } from '@/lib/utils'

export const SidebarContext = createContext<{ collapsed: boolean; toggle: () => void }>({
  collapsed: false,
  toggle: () => {},
})
export function useStudentSidebar() {
  return useContext(SidebarContext)
}

export function StudentSidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('student-sidebar-collapsed')
    if (stored === 'true') setCollapsed(true)
  }, [])

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('student-sidebar-collapsed', String(next))
      return next
    })
  }

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function DesktopSidebarToggle() {
  const { toggle } = useStudentSidebar()
  return (
    <button
      onClick={toggle}
      className="hidden md:flex size-10 items-center justify-center rounded-full hover:bg-[#f2f2f2] transition-colors shrink-0 -ml-3"
      style={{ color: '#606060' }}
      title="Toggle sidebar"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}

const MAIN_LINKS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home',     exact: true  },
  { href: '/learn',     icon: BookOpen,        label: 'Learn',    exact: false },
  { href: '/subjects',  icon: FlaskConical,    label: 'Practice', exact: false },
  { href: '/tests',     icon: ClipboardList,   label: 'Tests',    exact: false },
  { href: '/exams',     icon: Calendar,        label: 'Exams',    exact: false },
]

export function StudentSidebarClient({
  initial,
  email,
  username,
}: {
  initial: string
  email: string
  username: string
}) {
  const { collapsed } = useStudentSidebar()

  // YouTube uses ~24px icons in collapsed, ~20px in expanded
  const iconCls = collapsed ? 'h-6 w-6' : 'h-5 w-5'
  const strokeW = collapsed ? 1.5 : 1.75

  return (
    <aside
      // No right border — YouTube doesn't have one
      className="hidden md:flex flex-col sticky top-[64px] z-30 shrink-0 bg-background"
      style={{
        width: collapsed ? 64 : 216,
        height: 'calc(100vh - 64px)',
        transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* ── Main nav ── */}
      <nav
        className={cn(
          'flex flex-col flex-1 overflow-x-hidden overflow-y-auto',
          collapsed ? 'items-center pt-2 gap-1' : 'px-2 pt-3 gap-0.5',
        )}
      >
        {/* Section label — expanded only */}
        {!collapsed && (
          <p className="px-2 mb-2 text-[10.5px] font-bold tracking-[0.14em] uppercase text-slate-400 select-none">
            Main
          </p>
        )}

        {MAIN_LINKS.map(({ href, icon: Icon, label, exact }) => (
          <SidebarLink
            key={href}
            collapsed={collapsed}
            href={href}
            exact={exact}
            icon={<Icon className={iconCls} strokeWidth={strokeW} />}
            label={label}
          />
        ))}
      </nav>

      {/* ── Footer / Settings ── */}
      <div
        className={cn(
          'shrink-0 flex flex-col',
          collapsed ? 'items-center pb-4 pt-2' : 'py-3 px-2',
        )}
      >
        <SidebarLink
          collapsed={collapsed}
          href="/settings"
          icon={<Settings className={iconCls} strokeWidth={strokeW} />}
          label="Settings"
        />
      </div>
    </aside>
  )
}
