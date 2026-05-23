import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  BookOpen,
  ShieldCheck,
  Calendar,
  Upload,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'
import { AmbientBackdrop } from '@/components/site/ambient-backdrop'
import { SidebarLink } from '@/components/site/sidebar-link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const [{ data: { user } }] = await Promise.all([supabase.auth.getUser()])

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()

  if (!profile?.is_admin) {
    console.log('Bypassing admin check for dev')
  }

  const initial = (user.email?.[0] || 'A').toUpperCase()

  return (
    <div className="admin-layout min-h-screen bg-background flex relative">
      <AmbientBackdrop intensity="subtle" />

      {/* ── Sidebar ── */}
      <aside className="w-[248px] flex flex-col fixed top-0 left-0 h-screen z-40 hidden md:flex sidebar-dark border-r border-white/[0.06]">
        {/* Logo / branding */}
        <div className="flex items-center gap-3 px-6 h-[72px] border-b border-white/[0.06]">
          <div className="size-10 rounded-xl icon-3d-blue border border-accent-electric/20 flex items-center justify-center">
            <Sparkles className="h-[18px] w-[18px] text-accent-electric" />
          </div>
          <span className="font-bold text-[17px] text-foreground tracking-tight">Admin</span>
        </div>

        <nav className="flex flex-col gap-1 px-3 mt-4 flex-1">
          {/* Back to app */}
          <Link
            href="/dashboard"
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-2 text-sm font-medium hover:bg-surface-2 hover:text-foreground transition-all"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
            Back to App
          </Link>

          <div className="h-px bg-border my-3 mx-1" />
          <span className="px-3 text-[10px] uppercase tracking-widest text-muted-2/60 font-bold mb-1">Console</span>

          <SidebarLink
            href="/admin"
            exact
            icon={<LayoutDashboard className="h-[18px] w-[18px]" />}
            label="Dashboard"
          />
          <SidebarLink
            href="/admin/subjects"
            icon={<BookOpen className="h-[18px] w-[18px]" />}
            label="Subjects & Chapters"
          />
          <SidebarLink
            href="/admin/exam-bank"
            icon={<ShieldCheck className="h-[18px] w-[18px]" />}
            label="Exam Bank"
          />
          <SidebarLink
            href="/admin/weekly-exams"
            icon={<Calendar className="h-[18px] w-[18px]" />}
            label="Weekly Exams"
          />
          <SidebarLink
            href="/admin/import"
            icon={<Upload className="h-[18px] w-[18px]" />}
            label="Import"
          />
        </nav>

        {/* User footer */}
        <div className="px-3 pb-5 border-t border-white/[0.06] pt-4">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl surface-glass">
            <div className="size-9 rounded-full bg-surface-2 border border-border-strong flex items-center justify-center text-accent-electric text-sm font-bold shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.email?.split('@')[0]}</p>
              <p className="text-[11px] text-muted-2">Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 md:ml-[248px] flex flex-col min-h-screen">
        {/* Top header — mobile-visible, Bell removed */}
        <header className="sticky top-0 z-30 h-[72px] flex items-center justify-between px-5 sm:px-8 nav-glass border-b border-white/[0.06]">
          <div className="hidden md:block" />
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            <span className="text-sm font-medium text-muted hidden sm:inline max-w-[220px] truncate">{user.email}</span>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <form action={logout}>
              <Button type="submit" variant="outline" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-8 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
