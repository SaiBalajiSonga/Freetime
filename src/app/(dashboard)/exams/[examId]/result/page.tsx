import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ResultClient from '../../../tests/[sessionId]/result/result-client'

export default async function ExamResultPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  const { examId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load session from examId
  const { data: session, error: sErr } = await supabase
    .from('test_sessions')
    .select('*')
    .eq('weekly_exam_id', examId)
    .eq('user_id', user.id)
    .single()

  if (sErr || !session) redirect(`/exams/${examId}`)

  // Not submitted yet → go back to exam detail page
  if (session.status !== 'submitted') {
    redirect(`/exams/${examId}`)
  }

  const sessionId = session.id

  // Load session questions with questions
  const { data: sessionQuestions } = await supabase
    .from('test_session_questions')
    .select(`
      *,
      questions (
        id, type, statement, difficulty, correct_answer, solution,
        chapters (
          id, name,
          subjects (id, name)
        )
      )
    `)
    .eq('session_id', sessionId)
    .order('order_index')

  // Batch fetch all options
  const questionIds = (sessionQuestions ?? []).map(sq => (sq.questions as any).id)
  const { data: allOptions } = await supabase
    .from('question_options')
    .select('id, question_id, text, is_correct')
    .in('question_id', questionIds)
    .order('id')

  const enriched = (sessionQuestions ?? []).map(sq => ({
    ...sq,
    options: (allOptions ?? []).filter(o => o.question_id === (sq.questions as any).id),
  }))

  // ── Leaderboard (weekly exams only) ──────────────────────────────────────
  let leaderboard: any[] | null = null

  const { data: exam } = await supabase
    .from('weekly_exams')
    .select('ends_at')
    .eq('id', examId)
    .single()

  if (exam && new Date() > new Date(exam.ends_at)) {
    const { data: lb } = await supabase
      .from('test_sessions')
      .select('id, user_id, score, correct, incorrect, time_taken, profiles(name)')
      .eq('weekly_exam_id', examId)
      .eq('status', 'submitted')
      .order('score', { ascending: false })
      .order('time_taken', { ascending: true })
      .limit(20)

    leaderboard = lb ?? null
  }

  return (
    <ResultClient
      session={session}
      sessionQuestions={enriched}
      leaderboard={leaderboard}
      currentUserId={user.id}
    />
  )
}
