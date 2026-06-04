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

export type SubjectAvail = {
  name: string
  mcqCount: number
  numCount: number
  mcqOk: boolean
  numOk: boolean
}

export type SetupData = {
  subjects: { id: string; name: string }[]
  chapters: { id: string; name: string; subject_id: string }[]
  jeeAvail: SubjectAvail[]
}

const SUBJECT_NAMES = ['Physics', 'Chemistry', 'Mathematics'] as const
const MCQ_NEEDED = 20
const NUM_NEEDED = 10

export default async function TestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch sessions, subjects, and chapters concurrently
  const [sessionsRes, subjectsRes, chaptersRes] = await Promise.all([
    supabase
      .from('test_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('subjects').select('id, name').order('name'),
    supabase.from('chapters').select('id, name, subject_id').order('name'),
  ])

  const sessions = sessionsRes.data
  const allSubjects = subjectsRes.data || []
  const allChapters = chaptersRes.data || []

  // Check JEE Mock availabilities concurrently
  const subjectAvail: SubjectAvail[] = await Promise.all(
    SUBJECT_NAMES.map(async (name) => {
      const subject = allSubjects.find((s) => s.name === name)
      if (!subject) return { name, mcqCount: 0, numCount: 0, mcqOk: false, numOk: false }

      const chapterIds = allChapters.filter((c) => c.subject_id === subject.id).map((c) => c.id)

      if (chapterIds.length === 0) {
        return { name, mcqCount: 0, numCount: 0, mcqOk: false, numOk: false }
      }

      const [mcqRes, numRes] = await Promise.all([
        supabase
          .from('questions')
          .select('id', { count: 'exact', head: true })
          .in('chapter_id', chapterIds)
          .eq('type', 'mcq'),
        supabase
          .from('questions')
          .select('id', { count: 'exact', head: true })
          .in('chapter_id', chapterIds)
          .eq('type', 'numerical'),
      ])

      const mcqCount = mcqRes.count || 0
      const numCount = numRes.count || 0

      return {
        name,
        mcqCount,
        numCount,
        mcqOk: mcqCount >= MCQ_NEEDED,
        numOk: numCount >= NUM_NEEDED,
      }
    })
  )

  const now = Date.now()
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

  const sessionItems: TestSessionItem[] = (sessions || []).map((session) => {
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

  const setupData: SetupData = {
    subjects: allSubjects,
    chapters: allChapters,
    jeeAvail: subjectAvail,
  }

  return <TestsClient sessions={sessionItems} setupData={setupData} />
}
