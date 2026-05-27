'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { BookOpen, LayoutDashboard, FlaskConical, ClipboardList, Sparkles, Bookmark, Calendar, ChevronLeft, ChevronRight, Settings, Menu } from 'lucide-react'
import { SidebarLink } from '@/components/site/sidebar-link'

const SidebarContext = createContext<{ collapsed: boolean }>({ collapsed: false })
export function useStudentSidebar() { return useContext(SidebarContext) }

export function StudentSidebarClient({
  initial,
  email,
  username,
}: {
  initial: string
  email: string
  username: string
}) {
  const [collapsed, setCollapsed] = useState(false)

  // Rehydrate from localStorage
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
    <SidebarContext.Provider value={{ collapsed }}>
      {/* ── Sidebar ── */}
      <aside
        className="sidebar-light hidden md:flex flex-col fixed top-0 left-0 h-screen z-40 transition-all duration-200"
        style={{ width: collapsed ? 72 : 220 }}
      >
        {/* Logo & Toggle */}
        <div className="flex items-center h-[68px] shrink-0 transition-all duration-200 px-4" style={{
            justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <button
            onClick={toggle}
            className="size-10 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-2)] text-slate-500 hover:text-slate-900 transition-colors shrink-0"
            title="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          {!collapsed && (
            <div className="ml-3 flex items-center gap-3 min-w-0">
              <div className="size-8 rounded-xl flex items-center justify-center shrink-0 bg-gradient-primary shadow-[var(--shadow-blue-glow)]">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-[15px] text-foreground tracking-tight block leading-tight truncate">JEE Practice</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-500 block mt-0.5">Study OS</span>
              </div>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-0.5 px-3 mt-4 flex-1 overflow-x-hidden">
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

      {/* ── Spacer ── */}
      <div
        className="hidden md:block shrink-0 transition-all duration-200"
        style={{ width: collapsed ? 72 : 220 }}
      />
    </SidebarContext.Provider>
  )
}
