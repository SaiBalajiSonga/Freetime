import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageClient from './page-client'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return <PageClient />
}
