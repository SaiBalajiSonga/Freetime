import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminAnnouncementsClient from './admin-announcements-client'

export const metadata = {
  title: 'Manage Announcements — Admin',
}

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check admin status
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/dashboard')
  }

  // Fetch existing announcements
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return <AdminAnnouncementsClient initialAnnouncements={announcements || []} />
}
