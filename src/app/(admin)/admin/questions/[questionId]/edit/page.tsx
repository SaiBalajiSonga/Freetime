import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EditQuestionClient from './edit-client'

export default async function EditQuestionPage({
  params
}: {
  params: Promise<{ questionId: string }>
}) {
  const { questionId } = await params
  const supabase = createAdminClient()

  // Fetch question and options
  const { data: question } = await supabase
    .from('questions')
    .select('*, chapters(subject_id)')
    .eq('id', questionId)
    .single()

  if (!question) {
    notFound()
  }

  const { data: options } = await supabase
    .from('question_options')
    .select('*')
    .eq('question_id', questionId)
    .order('id', { ascending: true })

  // Fetch subjects and chapters on the server using admin client to bypass RLS
  const { data: subjects } = await supabase.from('subjects').select('*').order('name')
  let initialChapters: any[] = []
  if (question.chapters?.subject_id) {
    const { data: chapters } = await supabase.from('chapters').select('*').eq('subject_id', question.chapters.subject_id).order('name')
    if (chapters) initialChapters = chapters
  }

  // Transform data for the client component
  const initialData = {
    id: question.id,
    subjectId: question.chapters?.subject_id,
    chapterId: question.chapter_id,
    type: question.type,
    difficulty: question.difficulty,
    statement: question.statement,
    solution: question.solution || '',
    hint: question.hint || '',
    numericalAnswer: question.correct_answer || '',
    options: options || [],
    subjects: subjects || [],
    initialChapters
  }

  return <EditQuestionClient questionId={questionId} initialData={initialData} />
}
