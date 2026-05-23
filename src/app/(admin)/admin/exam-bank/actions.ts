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
