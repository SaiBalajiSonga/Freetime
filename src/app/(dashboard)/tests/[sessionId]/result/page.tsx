import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ResultClient from './result-client'

export default async function ResultPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load session
  const { data: session, error: sErr } = await supabase
    .from('test_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (sErr || !session) redirect('/tests')

  // Weekly exam sessions are always handled by /exams/[examId]/result
  if (session.weekly_exam_id) {
    redirect(`/exams/${session.weekly_exam_id}/result`)
  }

  // Not submitted yet → go back to test
  if (session.status !== 'submitted') {
    redirect(`/tests/${sessionId}`)
  }

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

  return (
    <ResultClient
      session={session}
      sessionQuestions={enriched}
      currentUserId={user.id}
    />
  )
}
