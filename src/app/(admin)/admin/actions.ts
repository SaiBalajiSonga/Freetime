'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteQuestion(questionId: string) {
  const supabase = createAdminClient()

  await supabase.from('question_options').delete().eq('question_id', questionId)
  await supabase.from('attempts').delete().eq('question_id', questionId)
  const { error } = await supabase.from('questions').delete().eq('id', questionId)

  if (error) {
    console.error('[Admin] Delete question error:', error.message)
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/subjects')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteByChapter(chapterId: string) {
  const supabase = createAdminClient()

  // Get all question IDs in this chapter
  const { data: questions } = await supabase.from('questions').select('id').eq('chapter_id', chapterId)
  const questionIds = questions?.map(q => q.id) || []

  if (questionIds.length > 0) {
    await supabase.from('question_options').delete().in('question_id', questionIds)
    await supabase.from('attempts').delete().in('question_id', questionIds)
    await supabase.from('questions').delete().in('id', questionIds)
  }

  revalidatePath('/admin')
  revalidatePath('/subjects')
  revalidatePath('/dashboard')
  return { success: true, deleted: questionIds.length }
}

export async function deleteBySubject(subjectId: string) {
  const supabase = createAdminClient()

  // Get all chapters in this subject
  const { data: chapters } = await supabase.from('chapters').select('id').eq('subject_id', subjectId)
  const chapterIds = chapters?.map(c => c.id) || []

  if (chapterIds.length > 0) {
    const { data: questions } = await supabase.from('questions').select('id').in('chapter_id', chapterIds)
    const questionIds = questions?.map(q => q.id) || []

    if (questionIds.length > 0) {
      await supabase.from('question_options').delete().in('question_id', questionIds)
      await supabase.from('attempts').delete().in('question_id', questionIds)
      await supabase.from('questions').delete().in('id', questionIds)
    }
  }

  revalidatePath('/admin')
  revalidatePath('/subjects')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteSelectedQuestions(questionIds: string[]) {
  if (!questionIds.length) return { error: 'No questions selected' }
  const supabase = createAdminClient()

  await supabase.from('question_options').delete().in('question_id', questionIds)
  await supabase.from('attempts').delete().in('question_id', questionIds)
  const { error } = await supabase.from('questions').delete().in('id', questionIds)

  if (error) {
    console.error('[Admin] Delete selected questions error:', error.message)
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/subjects')
  revalidatePath('/dashboard')
  return { success: true, deleted: questionIds.length }
}

export async function deleteAllQuestions() {
  const supabase = createAdminClient()

  await supabase.from('question_options').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('attempts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  const { error } = await supabase.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) {
    console.error('[Admin] Delete all questions error:', error.message)
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/subjects')
  revalidatePath('/dashboard')
  return { success: true }
}

