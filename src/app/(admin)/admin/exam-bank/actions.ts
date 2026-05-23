'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function moveQuestionVisibility(questionId: string, visibility: 'public' | 'exam') {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('questions')
    .update({ visibility })
    .eq('id', questionId)

  if (error) {
    console.error('[Admin] moveQuestionVisibility error:', error.message)
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/exam-bank')
  return { success: true }
}

export async function getExamQuestions() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('questions')
    .select('id, statement, type, difficulty, image_url, correct_answer, hint, solution, chapters(name, subjects(id, name)), options:question_options(id, text, is_correct)')
    .eq('visibility', 'exam')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Admin] getExamQuestions error:', error.message)
    return []
  }

  return data
}
