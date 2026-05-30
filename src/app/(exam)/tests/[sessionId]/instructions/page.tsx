import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InstructionsClient from './instructions-client'

export default async function InstructionsPage(props: { params: Promise<{ sessionId: string }> }) {
  const params = await props.params;
  const sessionId = params.sessionId;
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: session, error } = await supabase
    .from('test_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (error || !session) return redirect('/tests')
  if (session.status === 'submitted') {
    if (session.weekly_exam_id) {
      return redirect(`/exams/${session.weekly_exam_id}/result`)
    } else {
      return redirect(`/tests/${sessionId}/result`)
    }
  }

  return <InstructionsClient session={session} />
}
