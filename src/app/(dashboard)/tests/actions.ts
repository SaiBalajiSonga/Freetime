'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type CustomTestConfig = {
  subject_ids: string[]
  chapter_ids: string[]
  difficulty: 'all' | 'easy' | 'medium' | 'hard'
  question_count: number
  time_limit_minutes: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: shuffle array in place (Fisher-Yates)
// ─────────────────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. createCustomSession
// ─────────────────────────────────────────────────────────────────────────────
export async function createCustomSession(config: CustomTestConfig) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Build question query
  let query = supabase
    .from('questions')
    .select('id, type')
    .in('chapter_id', config.chapter_ids)

  if (config.difficulty !== 'all') {
    query = query.eq('difficulty', config.difficulty)
  }

  const { data: questions, error: qErr } = await query
  if (qErr) return { error: qErr.message }
  if (!questions || questions.length === 0) {
    return { error: 'No questions found for the selected filters. Try different chapters or difficulty.' }
  }

  // Shuffle and pick
  const picked = shuffle(questions).slice(0, config.question_count)

  // Insert session
  const { data: session, error: sErr } = await supabase
    .from('test_sessions')
    .insert({
      user_id: user.id,
      mode: 'custom',
      config,
      status: 'in_progress',
      total_questions: picked.length,
      time_limit_minutes: config.time_limit_minutes,
      max_score: picked.length * 4,
    })
    .select('id')
    .single()

  if (sErr || !session) return { error: sErr?.message ?? 'Failed to create session' }

  // Insert session questions
  const rows = picked.map((q, i) => ({
    session_id: session.id,
    question_id: q.id,
    order_index: i,
  }))

  const { error: sqErr } = await supabase
    .from('test_session_questions')
    .insert(rows)

  if (sqErr) return { error: sqErr.message }

  redirect(`/tests/${session.id}/instructions`)
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. createJeeSession
// ─────────────────────────────────────────────────────────────────────────────
export async function createJeeSession() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const subjectNames = ['Physics', 'Chemistry', 'Mathematics']
  const MCQ_COUNT = 20
  const NUM_COUNT = 10

  // Fetch all three subjects
  const { data: subjects, error: subErr } = await supabase
    .from('subjects')
    .select('id, name')
    .in('name', subjectNames)

  if (subErr || !subjects || subjects.length < 3) {
    return { error: 'Could not load subjects. Make sure Physics, Chemistry, and Mathematics exist.' }
  }

  // Fetch chapters for all subjects
  const { data: chapters, error: chapErr } = await supabase
    .from('chapters')
    .select('id, subject_id')
    .in('subject_id', subjects.map(s => s.id))

  if (chapErr || !chapters) return { error: 'Could not load chapters.' }

  const pickedAll: { question_id: string; subjectName: string }[] = []

  for (const subject of subjects) {
    const subjectChapterIds = chapters
      .filter(c => c.subject_id === subject.id)
      .map(c => c.id)

    if (subjectChapterIds.length === 0) {
      return { error: `No chapters found for ${subject.name}.` }
    }

    // Fetch MCQ questions
    const { data: mcqs } = await supabase
      .from('questions')
      .select('id')
      .in('chapter_id', subjectChapterIds)
      .eq('type', 'mcq')

    // Fetch numerical questions
    const { data: nums } = await supabase
      .from('questions')
      .select('id')
      .in('chapter_id', subjectChapterIds)
      .eq('type', 'numerical')

    if (!mcqs || mcqs.length < MCQ_COUNT) {
      return { error: `Not enough MCQ questions for ${subject.name}. Need ${MCQ_COUNT}, have ${mcqs?.length ?? 0}.` }
    }
    if (!nums || nums.length < NUM_COUNT) {
      return { error: `Not enough Numerical questions for ${subject.name}. Need ${NUM_COUNT}, have ${nums?.length ?? 0}.` }
    }

    const pickedMcq = shuffle(mcqs).slice(0, MCQ_COUNT)
    const pickedNum = shuffle(nums).slice(0, NUM_COUNT)

    ;[...pickedMcq, ...pickedNum].forEach(q => {
      pickedAll.push({ question_id: q.id, subjectName: subject.name })
    })
  }

  // Insert session
  const { data: session, error: sErr } = await supabase
    .from('test_sessions')
    .insert({
      user_id: user.id,
      mode: 'jee_mains',
      config: { subject_names: subjectNames, mcq_per_subject: MCQ_COUNT, num_per_subject: NUM_COUNT },
      status: 'in_progress',
      total_questions: 90,
      time_limit_minutes: 180,
      max_score: 360,
    })
    .select('id')
    .single()

  if (sErr || !session) return { error: sErr?.message ?? 'Failed to create session' }

  const rows = pickedAll.map((q, i) => ({
    session_id: session.id,
    question_id: q.question_id,
    order_index: i,
  }))

  const { error: sqErr } = await supabase
    .from('test_session_questions')
    .insert(rows)

  if (sqErr) return { error: sqErr.message }

  redirect(`/tests/${session.id}/instructions`)
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. saveAnswer
// ─────────────────────────────────────────────────────────────────────────────
export async function saveAnswer({
  sessionQuestionId,
  answer,
  isMarked,
  timeTaken,
}: {
  sessionQuestionId: string
  answer: string | null
  isMarked: boolean
  timeTaken: number
}) {
  const supabase = await createClient()

  const hasAnswer = answer !== null && answer.trim() !== ''

  let visitStatus: string
  if (hasAnswer && isMarked) visitStatus = 'answered_marked'
  else if (hasAnswer) visitStatus = 'answered'
  else if (isMarked) visitStatus = 'marked'
  else visitStatus = 'not_answered'

  const { error } = await supabase
    .from('test_session_questions')
    .update({
      answer_given: hasAnswer ? answer : null,
      is_marked_for_review: isMarked,
      visit_status: visitStatus,
      time_taken: timeTaken,
    })
    .eq('id', sessionQuestionId)

  if (error) return { error: error.message }
  return { success: true, visitStatus }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. toggleMarkForReview
// ─────────────────────────────────────────────────────────────────────────────
export async function toggleMarkForReview(sessionQuestionId: string, isMarked: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('test_session_questions')
    .update({ is_marked_for_review: isMarked })
    .eq('id', sessionQuestionId)

  if (error) return { error: error.message }
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. submitTest
// ─────────────────────────────────────────────────────────────────────────────
export async function submitTest(sessionId: string, totalTimeTaken: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Load session
  const { data: session, error: sErr } = await supabase
    .from('test_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (sErr || !session) return { error: 'Session not found' }
  if (session.status === 'submitted') return { error: 'Already submitted' }

  // Load all session questions
  const { data: sessionQuestions, error: sqErr } = await supabase
    .from('test_session_questions')
    .select('*, questions(id, type, correct_answer, chapters(subjects(name)))')
    .eq('session_id', sessionId)
    .order('order_index')

  if (sqErr || !sessionQuestions) return { error: 'Could not load session questions' }

  // Gather all MCQ question IDs to batch-fetch options
  const mcqIds = sessionQuestions
    .filter(sq => (sq.questions as any)?.type === 'mcq')
    .map(sq => (sq.questions as any).id)

  let optionsMap: Record<string, { id: string; is_correct: boolean }[]> = {}
  if (mcqIds.length > 0) {
    const { data: allOptions } = await supabase
      .from('question_options')
      .select('id, question_id, is_correct')
      .in('question_id', mcqIds)

    if (allOptions) {
      for (const opt of allOptions) {
        if (!optionsMap[opt.question_id]) optionsMap[opt.question_id] = []
        optionsMap[opt.question_id].push({ id: opt.id, is_correct: opt.is_correct })
      }
    }
  }

  let totalScore = 0
  let correct = 0
  let incorrect = 0
  let unattempted = 0

  const subjectStats: Record<string, { score: number; correct: number; incorrect: number; unattempted: number }> = {}

  // Grade and update each question sequentially
  for (const sq of sessionQuestions) {
    const q = sq.questions as any
    const givenAnswer = sq.answer_given

    let isCorrect = false
    let marksAwarded = 0

    if (!givenAnswer) {
      unattempted++
      marksAwarded = 0
    } else if (q.type === 'mcq') {
      const opts = optionsMap[q.id] ?? []
      const chosen = opts.find((o: { id: string; is_correct: boolean }) => o.id === givenAnswer)
      isCorrect = chosen?.is_correct === true

      if (isCorrect) {
        marksAwarded = 4
        correct++
      } else {
        marksAwarded = -1
        incorrect++
      }
    } else {
      isCorrect = (q.correct_answer ?? '').trim() === (givenAnswer ?? '').trim()
      if (isCorrect) {
        marksAwarded = 4
        correct++
      } else {
        marksAwarded = 0
        incorrect++
      }
    }

    const subjectName = q.chapters?.subjects?.name || 'Unknown'
    if (!subjectStats[subjectName]) {
      subjectStats[subjectName] = { score: 0, correct: 0, incorrect: 0, unattempted: 0 }
    }

    if (!givenAnswer) subjectStats[subjectName].unattempted++
    else if (isCorrect) subjectStats[subjectName].correct++
    else subjectStats[subjectName].incorrect++
    
    subjectStats[subjectName].score += marksAwarded

    totalScore += marksAwarded

    await supabase
      .from('test_session_questions')
      .update({ is_correct: isCorrect, marks_awarded: marksAwarded })
      .eq('id', sq.id)
  }

  // Update session
  const { error: updateErr } = await supabase
    .from('test_sessions')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      score: totalScore,
      correct,
      incorrect,
      unattempted,
      time_taken: totalTimeTaken,
      config: { ...(session.config as any || {}), subject_scores: subjectStats },
    })
    .eq('id', sessionId)

  if (updateErr) return { error: updateErr.message }

  revalidatePath('/tests')
  revalidatePath('/dashboard')

  return { success: true, score: totalScore }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. createWeeklyExamSession
// ─────────────────────────────────────────────────────────────────────────────
export async function createWeeklyExamSession(weeklyExamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: exam } = await supabase
    .from('weekly_exams')
    .select('*')
    .eq('id', weeklyExamId)
    .eq('is_published', true)
    .single()

  if (!exam) return { error: 'Exam not found or not published' }

  const now = new Date()
  if (now < new Date(exam.starts_at)) return { error: 'This exam has not started yet' }
  if (now > new Date(exam.ends_at)) return { error: 'The exam window has closed' }

  const { data: existing } = await supabase
    .from('test_sessions')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('weekly_exam_id', weeklyExamId)
    .maybeSingle()

  if (existing) {
    if (existing.status === 'in_progress') redirect(`/tests/${existing.id}/instructions`)
    return { error: 'You have already attempted this exam' }
  }

  const { data: session, error: sErr } = await supabase
    .from('test_sessions')
    .insert({
      user_id: user.id,
      mode: 'weekly_exam',
      weekly_exam_id: weeklyExamId,
      config: { exam_title: exam.title },
      status: 'in_progress',
      total_questions: exam.question_ids.length,
      time_limit_minutes: exam.duration_minutes,
      max_score: exam.question_ids.length * 4,
    })
    .select('id')
    .single()

  if (sErr || !session) return { error: sErr?.message ?? 'Failed to create session' }

  const rows = (exam.question_ids as string[]).map((qid, i) => ({
    session_id: session.id,
    question_id: qid,
    order_index: i,
  }))

  const { error: sqErr } = await supabase
    .from('test_session_questions')
    .insert(rows)

  if (sqErr) return { error: sqErr.message }

  redirect(`/tests/${session.id}/instructions`)
}
