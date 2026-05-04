import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { BookOpen, LayoutDashboard, Bookmark, FlaskConical, Bell, Sparkles, ClipboardList } from 'lucide-react'
import { AmbientBackdrop } from '@/components/site/ambient-backdrop'
import { SidebarLink } from '@/components/site/sidebar-link'
import { MobileSidebarToggle } from '@/components/site/mobile-sidebar'
import { MobileBottomNav } from '@/components/site/mobile-bottom-nav'

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

  return (
    <div className="min-h-screen bg-background flex relative">
      <AmbientBackdrop intensity="subtle" />

      {/* Sidebar */}
      <aside className="w-[248px] flex flex-col fixed top-0 left-0 h-screen z-40 hidden md:flex sidebar-dark border-r border-white/[0.06]">
        <div className="flex items-center gap-3 px-6 h-[72px] border-b border-white/[0.06]">
          <div className="size-10 rounded-xl grid place-items-center shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.25) 0%, rgba(37,99,235,0.15) 100%)', border: '1px solid rgba(96,165,250,0.3)', boxShadow: '0 0 24px -8px rgba(59,130,246,0.45)' }}>
            <Sparkles className="h-[18px] w-[18px] text-accent-electric" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-[17px] text-foreground tracking-tight block leading-tight">JEE Practice</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-2">Study OS</span>
          </div>
        </div>

        <nav className="flex flex-col gap-1 px-3 mt-4 flex-1">
          <p className="px-4 mb-1 section-label">Navigation</p>
          <SidebarLink href="/dashboard" exact icon={<LayoutDashboard className="h-[18px] w-[18px]" />} label="Dashboard" />
          <SidebarLink href="/subjects" icon={<BookOpen className="h-[18px] w-[18px]" />} label="Subjects" />
          <SidebarLink href="/subjects" icon={<FlaskConical className="h-[18px] w-[18px]" />} label="Practice" />
          <SidebarLink href="/tests" icon={<ClipboardList className="h-[18px] w-[18px]" />} label="Tests" />
          <div className="h-px bg-white/[0.06] mx-1 my-2" />
          <p className="px-4 mb-1 section-label">Library</p>
          <SidebarLink href="/subjects" icon={<Bookmark className="h-[18px] w-[18px]" />} label="Bookmarks" disabled />
        </nav>

        <div className="px-3 pb-5 border-t border-white/[0.06] pt-4">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl surface-glass">
            <div className="size-9 rounded-full bg-surface-2 border border-border-strong flex items-center justify-center text-accent-electric text-sm font-bold shadow-[0_0_20px_-6px_rgba(59,130,246,0.5)]">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.email?.split('@')[0]}</p>
              <p className="text-[11px] text-muted-2 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 md:ml-[248px] flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 h-[72px] flex items-center justify-between px-5 sm:px-8 nav-glass border-b border-white/[0.06]">
          <div className="flex items-center gap-3 md:hidden">
            <MobileSidebarToggle initial={initial} email={user.email || ''} />
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl icon-3d-blue border border-accent-electric/20 grid place-items-center">
                <Sparkles className="h-3.5 w-3.5 text-accent-electric" />
              </div>
              <span className="font-bold text-sm text-foreground">JEE Practice</span>
            </div>
          </div>
          <div className="hidden md:block" />

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              className="relative p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-2/80 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-electric rounded-full shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
            </button>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="size-9 rounded-full bg-surface-2 border border-border-strong flex items-center justify-center text-accent-electric text-sm font-bold">
                {initial}
              </div>
              <span className="text-sm font-medium text-muted hidden sm:inline max-w-[200px] truncate">{user.email}</span>
            </div>
            <form action={logout}>
              <Button type="submit" variant="outline" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-5 pb-28 sm:p-8 max-w-[1200px] w-full mx-auto">
          {children}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  )
}
