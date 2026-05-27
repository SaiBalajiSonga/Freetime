'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FileQuestion,
  Archive,
  CalendarClock,
  FolderInput,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Zap,
  Megaphone,
} from 'lucide-react'

// ── Sidebar collapse context ───────────────────────────────────────
const SidebarContext = createContext<{ collapsed: boolean }>({ collapsed: false })
export function useSidebar() { return useContext(SidebarContext) }

// ── Nav items config ───────────────────────────────────────────────
const NAV_ITEMS = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    activeColor: 'text-blue-400',
    exact: true,
  },
  {
    href: '/admin/announcements',
    label: 'Announcements',
    icon: Megaphone,
    activeColor: 'text-rose-400',
    exact: false,
  },
  {
    href: '/admin/questions',
    label: 'PYQ Questions',
    icon: FileQuestion,
    activeColor: 'text-blue-400',
    exact: false,
  },
  {
    href: '/admin/exam-bank',
    label: 'Exam Bank',
    icon: Archive,
    activeColor: 'text-violet-400',
    exact: false,
  },
  {
    href: '/admin/weekly-exams',
    label: 'Weekly Exams',
    icon: CalendarClock,
    activeColor: 'text-amber-400',
    exact: false,
  },
  {
    href: '/admin/import',
    label: 'Import',
    icon: FolderInput,
    activeColor: 'text-sky-400',
    exact: false,
  },
] as const

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

// ── Main sidebar component ─────────────────────────────────────────
export function AdminSidebarClient({
  initial,
  email,
}: {
  initial: string
  email: string
}) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  // Rehydrate from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('admin-sidebar-collapsed')
    if (stored === 'true') setCollapsed(true)
  }, [])

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('admin-sidebar-collapsed', String(next))
      return next
    })
  }

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      {/* ── Sidebar ── */}
      <aside
        className="fixed top-0 left-0 h-screen z-40 hidden md:flex flex-col transition-all duration-200"
        style={{
          width: collapsed ? 56 : 220,
          background: '#0d1117',
          borderRight: '1px solid #1e2536',
        }}
      >
        {/* Brand */}
        <div
          className="flex items-center h-[64px] border-b shrink-0 overflow-hidden"
          style={{
            borderColor: '#1e2536',
            paddingLeft: collapsed ? 0 : 16,
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-[0_0_16px_rgba(59,130,246,0.4)] shrink-0">
            <Zap className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="ml-3 overflow-hidden">
              <span className="font-bold text-[15px] text-white tracking-tight block leading-none whitespace-nowrap">Freetime</span>
              <span className="text-[10px] text-[#64748b] font-medium whitespace-nowrap">Admin Console</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 px-1.5 mt-3 flex-1 overflow-hidden">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href, item.exact)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className="group flex items-center rounded-md transition-colors duration-150"
                style={{
                  height: 36,
                  paddingLeft: collapsed ? 0 : 10,
                  paddingRight: collapsed ? 0 : 10,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: active ? '#1a2035' : 'transparent',
                  borderLeft: active ? '2px solid #3b82f6' : '2px solid transparent',
                  color: active ? '#fff' : '#64748b',
                }}
              >
                {/* icon */}
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    active
                      ? item.activeColor
                      : 'text-[#64748b] group-hover:text-white'
                  } ${collapsed ? 'mx-auto' : ''}`}
                />
                {/* label */}
                {!collapsed && (
                  <span
                    className={`ml-2.5 text-[13px] whitespace-nowrap transition-colors ${
                      active ? 'font-semibold text-white' : 'font-medium group-hover:text-white'
                    }`}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="px-1.5 mb-2">
          <button
            type="button"
            onClick={toggle}
            title={collapsed ? 'Expand sidebar' : undefined}
            className="w-full flex items-center gap-2 rounded-md text-[#64748b] hover:bg-[#1a2035] hover:text-white text-xs font-medium transition-colors"
            style={{
              height: 32,
              paddingLeft: collapsed ? 0 : 10,
              paddingRight: collapsed ? 0 : 10,
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
        </div>

        {/* User footer */}
        <div
          className="px-2 pb-3 border-t"
          style={{ borderColor: '#2a3142' }}
        >
          <div
            className="flex items-center rounded-md overflow-hidden mt-3"
            style={{
              background: '#161b27',
              border: '1px solid #2a3142',
              padding: collapsed ? '8px 0' : '8px 10px',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <div className="size-7 rounded-full bg-[#1c2333] border border-[#2a3142] flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
              {initial}
            </div>
            {!collapsed && (
              <div className="ml-2.5 min-w-0">
                <p className="text-[13px] font-medium text-white truncate leading-tight">
                  {email.split('@')[0]}
                </p>
                <p className="text-[10px] text-[#64748b]">Admin</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Spacer so main content doesn't go under sidebar ── */}
      <div
        className="hidden md:block shrink-0 transition-all duration-200"
        style={{ width: collapsed ? 56 : 220 }}
      />
    </SidebarContext.Provider>
  )
}
