'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu, X, Zap,
  LayoutDashboard, FileQuestion, Archive, CalendarClock, FolderInput, BookOpen
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/questions', label: 'PYQ Questions', icon: FileQuestion },
  { href: '/admin/exam-bank', label: 'Exam Bank', icon: Archive },
  { href: '/admin/weekly-exams', label: 'Weekly Exams', icon: CalendarClock },
  { href: '/admin/materials', label: 'Study Materials', icon: BookOpen },
  { href: '/admin/import', label: 'Import', icon: FolderInput },
]

export function MobileAdminNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="md:hidden p-2 -ml-2 text-[#64748b] hover:text-white transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 left-0 bottom-0 w-[240px] bg-[#0d1117] border-r border-[#1e2536] z-50 transform transition-transform duration-300 md:hidden flex flex-col ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-[56px] px-4 border-b border-[#1e2536]">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-blue-600 flex items-center justify-center">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">Freetime Admin</span>
          </div>
          <button onClick={() => setOpen(false)} className="p-1 text-[#64748b] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3 py-4 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const active = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  active 
                    ? 'bg-[#1a2035] text-white border-l-2 border-blue-500' 
                    : 'text-[#64748b] hover:bg-[#1a2035] hover:text-white border-l-2 border-transparent'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-blue-400' : ''}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
