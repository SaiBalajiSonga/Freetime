import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TestClient from './test-client'

export default async function TestSessionPage({
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

  // Already submitted → go to results
  if (session.status === 'submitted') {
    if (session.weekly_exam_id) {
      redirect(`/exams/${session.weekly_exam_id}/result`)
    } else {
      redirect(`/tests/${sessionId}/result`)
    }
  }

  // Load session questions with question data
  const { data: sessionQuestions, error: sqErr } = await supabase
    .from('test_session_questions')
    .select(`
      *,
      questions (
        id, type, statement, difficulty, image_url,
        chapters (
          id, name,
          subjects (id, name)
        )
      )
    `)
    .eq('session_id', sessionId)
    .order('order_index')

  if (sqErr || !sessionQuestions) redirect('/tests')

  // Batch fetch all options in ONE query
  const questionIds = sessionQuestions.map(sq => (sq.questions as any).id)
  const { data: allOptions } = await supabase
    .from('question_options')
    .select('id, question_id, text')
    .in('question_id', questionIds)
    .order('id')

  // Attach options to each session question
  const enrichedSqs = sessionQuestions.map(sq => ({
    ...sq,
    options: (allOptions ?? []).filter(o => o.question_id === (sq.questions as any).id),
  }))

  // Fetch user profile name and display_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, display_id')
    .eq('id', user.id)
    .single()
    
  const userName = profile?.name || user.email?.split('@')[0] || 'Candidate Name'
  const rollNo = profile?.display_id || user.id
  const avatarUrl = user.user_metadata?.avatar_url || null

  return (
    <TestClient
      session={session}
      sessionQuestions={enrichedSqs}
      userName={userName}
      rollNo={rollNo}
      avatarUrl={avatarUrl}
    />
  )
}
