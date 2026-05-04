'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, LayoutDashboard, Bookmark, FlaskConical, ClipboardList, Sparkles, Menu, X } from 'lucide-react'
import { SidebarLink } from './sidebar-link'

interface MobileSidebarProps {
  initial: string
  email: string
}

export function MobileSidebarToggle({ initial, email }: MobileSidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Hamburger button rendered inline in header */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-2/80 transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            />

            {/* Sidebar drawer */}
            <motion.aside
              key="sidebar"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 left-0 h-full w-[280px] z-50 flex flex-col sidebar-dark border-r border-white/[0.06] md:hidden"
            >
              <div className="flex items-center justify-between px-5 h-[72px] border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl icon-3d-blue border border-accent-electric/20 grid place-items-center">
                    <Sparkles className="h-4 w-4 text-accent-electric" />
                  </div>
                  <div>
                    <span className="font-bold text-[15px] text-foreground tracking-tight block leading-tight">JEE Practice</span>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-2">Study OS</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-muted-2 hover:text-foreground hover:bg-surface-2 transition-colors"
                  aria-label="Close navigation"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="flex flex-col gap-1 px-3 mt-4 flex-1" onClick={() => setOpen(false)}>
                <SidebarLink href="/dashboard" exact icon={<LayoutDashboard className="h-[18px] w-[18px]" />} label="Dashboard" />
                <SidebarLink href="/subjects" icon={<BookOpen className="h-[18px] w-[18px]" />} label="Subjects" />
                <SidebarLink href="/subjects" icon={<FlaskConical className="h-[18px] w-[18px]" />} label="Practice" />
                <SidebarLink href="/tests" icon={<ClipboardList className="h-[18px] w-[18px]" />} label="Tests" />
                <SidebarLink href="/subjects" icon={<Bookmark className="h-[18px] w-[18px]" />} label="Bookmarks" disabled />
              </nav>

              <div className="px-3 pb-5 border-t border-white/[0.06] pt-4">
                <div className="flex items-center gap-3 px-3 py-3 rounded-xl surface-glass">
                  <div className="size-9 rounded-full bg-surface-2 border border-border-strong flex items-center justify-center text-accent-electric text-sm font-bold shadow-[0_0_20px_-6px_rgba(59,130,246,0.5)]">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{email.split('@')[0]}</p>
                    <p className="text-[11px] text-muted-2 truncate">{email}</p>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
