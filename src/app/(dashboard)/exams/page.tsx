import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ExamsClient from './exams-client'

export const metadata = {
  title: 'Exams — JEE Practice',
  description: 'View all scheduled weekly exams set by your instructor.',
}

export default async function ExamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: exams } = await supabase
    .from('weekly_exams')
    .select('*')
    .eq('is_published', true)
    .order('starts_at', { ascending: true })

  const { data: sessions } = await supabase
    .from('test_sessions')
    .select('id, status, score, max_score, weekly_exam_id')
    .eq('user_id', user.id)
    .not('weekly_exam_id', 'is', null)

  const sessionMap = new Map<string, { id: string; status: string; score: number; max_score: number }>()
  for (const s of sessions ?? []) {
    if (s.weekly_exam_id) sessionMap.set(s.weekly_exam_id, s)
  }

  const now = new Date()
  const examList = (exams ?? []).map(exam => {
    const session = sessionMap.get(exam.id) ?? null
    const start = new Date(exam.starts_at)
    const end = new Date(exam.ends_at)

    let status: 'upcoming' | 'active' | 'attempted' | 'missed'
    if (session?.status === 'submitted') {
      status = 'attempted'
    } else if (now < start) {
      status = 'upcoming'
    } else if (now >= start && now <= end) {
      status = 'active'
    } else {
      status = 'missed'
    }

    return {
      id: exam.id,
      title: exam.title,
      description: exam.description ?? '',
      starts_at: exam.starts_at,
      ends_at: exam.ends_at,
      duration_minutes: exam.duration_minutes,
      question_ids: exam.question_ids as string[],
      status,
      session,
    }
  })

  return <ExamsClient exams={examList} />
}
