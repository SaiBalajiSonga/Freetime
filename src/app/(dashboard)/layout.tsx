import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Bell, Sparkles } from 'lucide-react'
import { MobileSidebarToggle } from '@/components/site/mobile-sidebar'
import { MobileBottomNav } from '@/components/site/mobile-bottom-nav'
import { NavAuth } from '@/components/site/nav-auth'
import { StudentSidebarClient } from '@/components/site/student-sidebar-client'
import { AnnouncementsDropdown } from '@/components/site/announcements-dropdown'

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

  // Fetch profile to get real name and last_read_announcement
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, last_read_announcement')
    .eq('id', user.id)
    .single()

  const { data: latestAnnouncement } = await supabase
    .from('announcements')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

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
    <div className="flex min-h-screen bg-background">
      {/* ── Sidebar (desktop) ── */}
      <StudentSidebarClient initial={initial} email={user.email ?? ''} username={username} />

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
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
            <AnnouncementsDropdown initialUnread={hasUnreadAnnouncements} userId={user.id} />
            <div className="h-6 w-px bg-[var(--color-border)] hidden sm:block" />
            
            {/* Profile Dropdown */}
            <NavAuth initialUser={user} initialProfile={profile} />
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 p-5 pb-28 sm:p-6 sm:pb-8 max-w-[1100px] w-full mx-auto">
          {children}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  )
}
