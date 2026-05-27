'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { BookOpen, LayoutDashboard, FlaskConical, ClipboardList, Sparkles, Bookmark, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
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
        {/* Logo */}
        <div className="flex items-center gap-3 h-[68px] border-b border-[var(--color-border)] shrink-0 transition-all duration-200" style={{
            paddingLeft: collapsed ? 0 : 20,
            paddingRight: collapsed ? 0 : 20,
            justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <div className="size-9 rounded-xl flex items-center justify-center shrink-0 bg-gradient-primary shadow-[var(--shadow-blue-glow)]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-bold text-[15px] text-foreground tracking-tight block leading-tight">JEE Practice</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-2">Study OS</span>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-0.5 px-3 mt-4 flex-1 overflow-x-hidden">
          {!collapsed && <p className="px-3 mb-2 section-label">Main</p>}
          {collapsed && <div className="h-6" />}
          
          <SidebarLink collapsed={collapsed} href="/dashboard" exact icon={<LayoutDashboard className="h-[18px] w-[18px]" />} label="Home" />
          <SidebarLink collapsed={collapsed} href="/subjects" icon={<BookOpen className="h-[18px] w-[18px]" />} label="Learn" />
          <SidebarLink collapsed={collapsed} href="/subjects" icon={<FlaskConical className="h-[18px] w-[18px]" />} label="Practice" />
          <SidebarLink collapsed={collapsed} href="/tests" icon={<ClipboardList className="h-[18px] w-[18px]" />} label="Tests" />
          <SidebarLink collapsed={collapsed} href="/exams" icon={<Calendar className="h-[18px] w-[18px]" />} label="Exams" />
          
          <div className="h-px bg-[var(--color-border)] mx-1 my-3" />
          
          {!collapsed && <p className="px-3 mb-2 section-label">Library</p>}
          {collapsed && <div className="h-6" />}
          
          <SidebarLink collapsed={collapsed} href="/subjects" icon={<Bookmark className="h-[18px] w-[18px]" />} label="Bookmarks" disabled />
        </nav>

        {/* Footer block (Collapse + User) */}
        <div className="px-3 pb-5 border-t border-[var(--color-border)] pt-3 shrink-0 flex flex-col gap-3">
          {/* Toggle Collapse Button */}
          <button
            type="button"
            onClick={toggle}
            title={collapsed ? 'Expand sidebar' : undefined}
            className="w-full flex items-center gap-2 rounded-xl text-muted-2 hover:bg-[var(--color-surface-2)] hover:text-foreground text-[13px] font-medium transition-colors"
            style={{
              height: 36,
              paddingLeft: collapsed ? 0 : 12,
              paddingRight: collapsed ? 0 : 12,
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 mx-auto" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>

          {/* User card */}
          <div className="flex items-center rounded-xl bg-[var(--color-surface-2)] transition-all duration-200" style={{
            padding: collapsed ? '8px 0' : '10px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}>
            <div className="size-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
              {initial}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 ml-3">
                <p className="text-sm font-semibold text-foreground truncate capitalize">{username}</p>
                <p className="text-[10px] text-muted-2 truncate">{email}</p>
              </div>
            )}
          </div>
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
