'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { BookOpen, LayoutDashboard, FlaskConical, ClipboardList, Sparkles, Bookmark, Calendar, ChevronLeft, ChevronRight, Settings, Menu } from 'lucide-react'
import { SidebarLink } from '@/components/site/sidebar-link'

export const SidebarContext = createContext<{ collapsed: boolean, toggle: () => void }>({ collapsed: false, toggle: () => {} })
export function useStudentSidebar() { return useContext(SidebarContext) }

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

  return <SidebarContext.Provider value={{ collapsed, toggle }}>{children}</SidebarContext.Provider>
}

export function DesktopSidebarToggle() {
  const { toggle } = useStudentSidebar()
  return (
    <button
      onClick={toggle}
      className="hidden md:flex size-10 items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors shrink-0 -ml-2"
      title="Toggle sidebar"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}

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

  return (
    <aside
      className="hidden md:flex flex-col sticky top-[64px] z-30 transition-all duration-200 shrink-0 bg-background"
      style={{ width: collapsed ? 72 : 220, height: 'calc(100vh - 64px)' }}
    >
      {/* Nav links */}
      <nav className="flex flex-col gap-0.5 px-3 mt-4 flex-1 overflow-x-hidden overflow-y-auto">
        {!collapsed && <p className="px-3 mb-2 section-label">Main</p>}
        {collapsed && <div className="h-6" />}
        
        <SidebarLink collapsed={collapsed} href="/dashboard" exact icon={<LayoutDashboard className="h-[18px] w-[18px]" />} label="Home" />
        <SidebarLink collapsed={collapsed} href="/learn" icon={<BookOpen className="h-[18px] w-[18px]" />} label="Learn" />
        <SidebarLink collapsed={collapsed} href="/subjects" icon={<FlaskConical className="h-[18px] w-[18px]" />} label="Practice" />
        <SidebarLink collapsed={collapsed} href="/tests" icon={<ClipboardList className="h-[18px] w-[18px]" />} label="Tests" />
        <SidebarLink collapsed={collapsed} href="/exams" icon={<Calendar className="h-[18px] w-[18px]" />} label="Exams" />
        
        <div className="h-px bg-[var(--color-border)] mx-1 my-3" />
        
        {!collapsed && <p className="px-3 mb-2 mt-4 section-label">Library</p>}
        {collapsed && <div className="h-6 mt-4" />}
      </nav>

      {/* Footer block */}
      <div className="px-3 pb-5 border-t border-[var(--color-border)] pt-3 shrink-0 flex flex-col gap-3">
        {/* Settings link */}
        <SidebarLink 
          collapsed={collapsed} 
          href="/settings" 
          icon={<Settings className="h-[18px] w-[18px]" />} 
          label="Settings" 
        />
      </div>
    </aside>
  )
}
