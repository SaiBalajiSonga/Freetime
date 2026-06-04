import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageClient from './page-client'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profile?.is_admin) {
      redirect('/admin/dashboard')
    } else {
      redirect('/dashboard')
    }
  }

  return <PageClient />
}
