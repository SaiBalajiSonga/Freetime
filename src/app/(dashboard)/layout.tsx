import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { BookOpen, LayoutDashboard, FlaskConical, ClipboardList, Bell, Sparkles, Bookmark, Calendar } from 'lucide-react'
import { SidebarLink } from '@/components/site/sidebar-link'
import { MobileSidebarToggle } from '@/components/site/mobile-sidebar'
import { MobileBottomNav } from '@/components/site/mobile-bottom-nav'
import { NavAuth } from '@/components/site/nav-auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const initial = (user.email?.[0] || 'U').toUpperCase()
  const username = user.email?.split('@')[0] || 'student'

  return (
    <div className="app-shell">
      {/* ── Inner app container: white/light bg rounded box ── */}
      <div className="app-container flex flex-1">

        {/* ── Sidebar (desktop) ── */}
        <aside className="sidebar-light hidden md:flex flex-col fixed top-0 left-0 h-screen z-40 w-[220px]" style={{ top: '16px', left: '16px', height: 'calc(100vh - 32px)', borderRadius: '20px 0 0 20px' }}>
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 h-[68px] border-b border-[var(--color-border)] shrink-0">
            <div className="size-9 rounded-xl flex items-center justify-center shrink-0 bg-gradient-primary shadow-[var(--shadow-blue-glow)]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-[15px] text-foreground tracking-tight block leading-tight">JEE Practice</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-2">Study OS</span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-0.5 px-3 mt-4 flex-1">
            <p className="px-3 mb-2 section-label">Main</p>
            <SidebarLink href="/dashboard" exact icon={<LayoutDashboard className="h-[18px] w-[18px]" />} label="Home" />
            <SidebarLink href="/subjects" icon={<BookOpen className="h-[18px] w-[18px]" />} label="Learn" />
            <SidebarLink href="/subjects" icon={<FlaskConical className="h-[18px] w-[18px]" />} label="Practice" />
            <SidebarLink href="/tests" icon={<ClipboardList className="h-[18px] w-[18px]" />} label="Tests" />
            <SidebarLink href="/exams" icon={<Calendar className="h-[18px] w-[18px]" />} label="Exams" />
            <div className="h-px bg-[var(--color-border)] mx-1 my-3" />
            <p className="px-3 mb-2 section-label">Library</p>
            <SidebarLink href="/subjects" icon={<Bookmark className="h-[18px] w-[18px]" />} label="Bookmarks" disabled />
          </nav>

          {/* User card */}
          <div className="px-3 pb-5 border-t border-[var(--color-border)] pt-4 shrink-0">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--color-surface-2)]">
              <div className="size-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate capitalize">{username}</p>
                <p className="text-[10px] text-muted-2 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main column ── */}
        <div className="flex-1 flex flex-col min-h-screen md:ml-[220px]">

          {/* ── Top header ── */}
          <header className="nav-light sticky top-0 z-30 h-[64px] flex items-center justify-between px-5 sm:px-6">
            {/* Mobile: hamburger + logo */}
            <div className="flex items-center gap-3 md:hidden">
              <MobileSidebarToggle initial={initial} email={user.email || ''} />
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-bold text-sm text-foreground">JEE Practice</span>
              </div>
            </div>

            {/* Desktop: spacer so right side is flush */}
            <div className="hidden md:block" />

            {/* Right actions */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="relative p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-primary)] rounded-full" />
              </button>
              <div className="h-6 w-px bg-[var(--color-border)] hidden sm:block" />
              
              {/* Profile Dropdown */}
              <NavAuth />
            </div>
          </header>

          {/* ── Page content ── */}
          <main className="flex-1 p-5 pb-28 sm:p-6 sm:pb-8 max-w-[1100px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  )
}
