import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebarClient } from '@/components/admin/admin-sidebar-client'
import { MobileAdminNav } from '@/components/admin/mobile-admin-nav'
import { AmbientBackdrop } from '@/components/site/ambient-backdrop'
import { NavAuth } from '@/components/site/nav-auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // getSession() reads from the cookie — no outbound network call
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/')

  // Verify JWT + fetch profile in parallel instead of sequentially
  const [{ data: { user } }, { data: profile }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('profiles')
      .select('name, is_admin, display_id')
      .eq('id', session.user.id)
      .single(),
  ])

  if (!user || !profile?.is_admin) {
    redirect('/')
  }

  const initial = (user.email?.[0] || 'A').toUpperCase()

  return (
    <div className="admin-layout min-h-screen flex relative" style={{ background: '#0f1117' }}>
      <AmbientBackdrop intensity="subtle" />

      {/* ── Collapsible sidebar (client component) ── */}
      <AdminSidebarClient initial={initial} email={user.email ?? ''} />

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top header */}
        <header
          className="sticky top-0 z-30 h-[56px] flex items-center justify-between px-4 sm:px-6 shrink-0"
          style={{
            background: 'rgba(13,17,23,0.92)',
            borderBottom: '1px solid #1e2536',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center gap-3">
            <MobileAdminNav />
            <span className="hidden md:block font-semibold text-xs text-[#64748b] uppercase tracking-widest">Admin Console</span>
            <span className="md:hidden font-semibold text-sm text-white tracking-tight">Admin Console</span>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            {/* Profile Dropdown */}
            <div className="scale-90 origin-right">
              <NavAuth initialUser={user} initialProfile={profile} theme="dark" />
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-7 w-full">{children}</main>
      </div>
    </div>
  )
}
