import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { AdminSidebarClient } from '@/components/admin/admin-sidebar-client'
import { MobileAdminNav } from '@/components/admin/mobile-admin-nav'
import { AmbientBackdrop } from '@/components/site/ambient-backdrop'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const [{ data: { user } }] = await Promise.all([supabase.auth.getUser()])

  if (!user) redirect('/login')

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient.from('profiles').select('is_admin').eq('id', user.id).single()

  if (!profile?.is_admin) {
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
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            <span className="text-[13px] font-medium text-[#64748b] hidden sm:inline max-w-[220px] truncate">
              {user.email}
            </span>
            <div className="h-6 w-px bg-[#2a3142] hidden sm:block" />
            <form action={logout}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="h-7 text-xs border-[#2a3142] bg-transparent text-[#94a3b8] hover:bg-[#1c2333] hover:text-white"
              >
                Log out
              </Button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-7 w-full">{children}</main>
      </div>
    </div>
  )
}
