import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WeeklyExamForm } from './weekly-exam-form'

export default async function NewWeeklyExamPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/')
  }

  // Must use admin client
  const adminSupabase = createAdminClient()
  const { data: subjectsData } = await adminSupabase
    .from('subjects')
    .select('id, name')
    .order('name')

  return <WeeklyExamForm initialSubjects={(subjectsData as any[]) ?? []} />
}
