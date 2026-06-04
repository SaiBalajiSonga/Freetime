import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ResultClient from '@/app/(exam)/tests/[sessionId]/result/result-client'

export default async function ExamResultPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  const { examId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

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

  // ── Fetch exam window ─────────────────────────────────────────────────────
  // Like Allen / Narayana / nlearn: ranks are released only AFTER the exam
  // window (ends_at) closes. Students who start late get less time but ranks
  // are calculated once the absolute window is shut for ALL students.
  const { data: exam } = await supabase
    .from('weekly_exams')
    .select('ends_at, title')
    .eq('id', examId)
    .single()

  const examEnded = exam ? new Date() > new Date(exam.ends_at) : false
  const examEndsAt = exam?.ends_at ?? null

  // ── Rank data: only compute after exam window closes ──────────────────────
  let rankData: { rank: number; percentile: string; totalParticipants: number } | null = null

  if (examEnded) {
    const { data: lb } = await supabase
      .rpc('get_jee_leaderboard', { p_weekly_exam_id: examId })

    if (lb && lb.length > 0) {
      const myEntry = (lb as any[]).find(e => e.user_id === user.id)
      const myRank = myEntry?.rank as number | undefined
      const total = lb.length
      const percentile =
        myRank != null && total > 1
          ? (((total - myRank + 1) / total) * 100).toFixed(2)
          : '100.00'

      if (myEntry) {
        rankData = { rank: myRank!, percentile, totalParticipants: total }
      }
    }
  }

  return (
    <ResultClient
      session={session}
      sessionQuestions={enriched}
      currentUserId={user.id}
      examEnded={examEnded}
      examEndsAt={examEndsAt}
      rankData={rankData}
    />
  )
}
