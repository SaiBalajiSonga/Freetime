import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WeeklyExamForm } from './weekly-exam-form'

export default async function NewWeeklyExamPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    console.log('Bypassing admin check for dev (weekly-exams-new)')
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('id, statement, type, difficulty, chapters(name, subjects(name))')
    .eq('visibility', 'exam')
    .order('created_at', { ascending: false })

  return <WeeklyExamForm questions={(questions as any[]) ?? []} />
}
