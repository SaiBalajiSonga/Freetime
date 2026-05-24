'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleExamPublished(examId: string, published: boolean) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('weekly_exams')
    .update({ is_published: published })
    .eq('id', examId)

  if (error) {
    console.error('[Admin] toggleExamPublished error:', error.message)
    return { error: error.message }
  }

  revalidatePath('/admin/weekly-exams')
  return { success: true }
}

export async function deleteWeeklyExam(examId: string) {
  const supabase = createAdminClient()
  
  // Clean up test sessions that reference this weekly exam first to satisfy FK constraints
  const { error: tsError } = await supabase.from('test_sessions').delete().eq('weekly_exam_id', examId)
  if (tsError) {
    console.error('[Admin] deleteWeeklyExam (test_sessions cleanup) error:', tsError.message)
    return { error: tsError.message }
  }

  const { error } = await supabase.from('weekly_exams').delete().eq('id', examId)

  if (error) {
    console.error('[Admin] deleteWeeklyExam error:', error.message)
    return { error: error.message }
  }

  revalidatePath('/admin/weekly-exams')
  return { success: true }
}
