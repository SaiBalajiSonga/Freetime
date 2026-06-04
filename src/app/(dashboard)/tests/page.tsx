import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TestsClient from './tests-client'

export const metadata = {
  title: 'Tests — JEE Practice',
  description: 'Start a custom test or a full JEE Mains mock exam.',
}

export type TestSessionItem = {
  id: string
  mode: string
  status: 'active' | 'attempted' | 'missed'
  created_at: string
  expires_at: string | null
  score: number | null
  max_score: number | null
  time_taken: number | null
  correct: number | null
  incorrect: number | null
  unattempted: number | null
  config: any
}

export default async function TestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch all sessions (you might want to paginate or limit this in a real app, but for now we fetch all recent)
  const { data: sessions } = await supabase
    .from('test_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const now = Date.now()
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

  const sessionItems: TestSessionItem[] = (sessions || []).map(session => {
    const createdAtMs = new Date(session.created_at).getTime()
    const expiresAtMs = createdAtMs + SEVEN_DAYS_MS
    let derivedStatus: 'active' | 'attempted' | 'missed'

    if (session.status === 'submitted') {
      derivedStatus = 'attempted'
    } else {
      // It is in_progress
      if (now > expiresAtMs) {
        derivedStatus = 'missed'
      } else {
        derivedStatus = 'active'
      }
    }

    return {
      id: session.id,
      mode: session.mode,
      status: derivedStatus,
      created_at: session.created_at,
      expires_at: derivedStatus === 'active' ? new Date(expiresAtMs).toISOString() : null,
      score: session.score,
      max_score: session.max_score,
      time_taken: session.time_taken,
      correct: session.correct,
      incorrect: session.incorrect,
      unattempted: session.unattempted,
      config: session.config,
    }
  })

  return <TestsClient sessions={sessionItems} />
}
