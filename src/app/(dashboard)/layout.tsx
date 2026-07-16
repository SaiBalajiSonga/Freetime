import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Bell, Sparkles } from 'lucide-react'
import { MobileSidebarToggle } from '@/components/site/mobile-sidebar'
import { MobileBottomNav } from '@/components/site/mobile-bottom-nav'
import { NavAuth } from '@/components/site/nav-auth'
import { StudentSidebarClient, StudentSidebarProvider, DesktopSidebarToggle } from '@/components/site/student-sidebar-client'
import { AnnouncementsDropdown } from '@/components/site/announcements-dropdown'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch profile and latest announcement in parallel — no dependency between them
  const [{ data: profile }, { data: latestAnnouncement }] = await Promise.all([
    supabase
      .from('profiles')
      .select('name, last_read_announcement, is_admin, display_id')
      .eq('id', user.id)
      .single(),
    supabase
      .from('announcements')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  let hasUnreadAnnouncements = false
  if (latestAnnouncement) {
    if (!profile?.last_read_announcement) {
      hasUnreadAnnouncements = true
    } else {
      hasUnreadAnnouncements = new Date(latestAnnouncement.created_at) > new Date(profile.last_read_announcement)
    }
  }

  const initial = (user.email?.[0] || 'U').toUpperCase()
  const username = profile?.name || user.email?.split('@')[0] || 'student'

  return (
    <StudentSidebarProvider>
      <div className="flex flex-col min-h-screen bg-background">
        
        {/* ── Top header (Full Width) ── */}
        <header className="sticky top-0 z-[60] h-[64px] flex items-center justify-between px-4 sm:px-6 w-full shrink-0 bg-background">
          {/* Left side: Hamburger + Logo */}
          <div className="flex items-center gap-2 sm:gap-4">
            <DesktopSidebarToggle />
            <div className="md:hidden">
              <MobileSidebarToggle initial={initial} email={user.email || ''} username={username} />
            </div>
            
            <Link href="/dashboard" className="flex items-center gap-3 ml-1 sm:ml-0 hover:opacity-90 transition-opacity">
              <div className="size-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-sm">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="leading-none">
                 <span className="font-extrabold text-[15px] text-foreground tracking-tight block">JEE Practice</span>
                 <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-500 block mt-0.5">Study OS</span>
              </div>
            </Link>
          </div>
          
          {/* Right actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            <AnnouncementsDropdown initialUnread={hasUnreadAnnouncements} userId={user.id} />
            <div className="h-6 w-px bg-[var(--color-border)] hidden sm:block" />
            <NavAuth initialUser={user} initialProfile={profile} />
          </div>
        </header>

        {/* ── Main Layout Area ── */}
        <div className="flex flex-1 items-stretch min-h-0">
          {/* ── Sidebar (desktop) ── */}
          <StudentSidebarClient initial={initial} email={user.email ?? ''} username={username} />

          {/* ── Main column ── */}
          <main className="flex-1 w-full min-w-0">
            <div className="p-5 pb-28 sm:p-6 sm:pb-8 max-w-[1100px] w-full mx-auto">
              {children}
            </div>
          </main>
        </div>

        <MobileBottomNav />
      </div>
    </StudentSidebarProvider>
  )
}
