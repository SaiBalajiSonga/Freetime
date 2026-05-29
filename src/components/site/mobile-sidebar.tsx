'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, LayoutDashboard, Bookmark, FlaskConical, ClipboardList, Sparkles, Menu, X, Calendar } from 'lucide-react'
import { SidebarLink } from './sidebar-link'

interface MobileSidebarProps {
  initial: string
  email: string
}

export function MobileSidebarToggle({ initial, email }: MobileSidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
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
              className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm md:hidden"
            />

            {/* Drawer */}
            <motion.aside
              key="sidebar"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 left-0 h-full w-[280px] z-[60] flex flex-col sidebar-light border-r border-[var(--color-border)] md:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 h-[64px] border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-gradient-primary flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-[15px] text-foreground tracking-tight block leading-tight">JEE Practice</span>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-2">Study OS</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
                  aria-label="Close navigation"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex flex-col gap-0.5 px-3 mt-4 flex-1" onClick={() => setOpen(false)}>
                <p className="px-3 mb-2 section-label">Main</p>
                <SidebarLink href="/dashboard" exact icon={<LayoutDashboard className="h-[18px] w-[18px]" />} label="Home" />
                <SidebarLink href="/learn" icon={<BookOpen className="h-[18px] w-[18px]" />} label="Learn" />
                <SidebarLink href="/subjects" icon={<FlaskConical className="h-[18px] w-[18px]" />} label="Practice" />
                <SidebarLink href="/tests" icon={<ClipboardList className="h-[18px] w-[18px]" />} label="Tests" />
                <SidebarLink href="/exams" icon={<Calendar className="h-[18px] w-[18px]" />} label="Exams" />
                <div className="h-px bg-[var(--color-border)] mx-1 my-3" />
                <p className="px-3 mb-2 section-label">Library</p>
                <SidebarLink href="/subjects" icon={<Bookmark className="h-[18px] w-[18px]" />} label="Bookmarks" disabled />
              </nav>

              {/* User */}
              <div className="px-3 pb-5 border-t border-[var(--color-border)] pt-4">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-2">
                  <div className="size-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate capitalize">{email.split('@')[0]}</p>
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
