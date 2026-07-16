'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function publishRanks(examId: string, examTitle: string) {
  const supabase = createAdminClient()

  // First, we can add a flag to the exam to say ranks are published (optional, assuming we just notify)
  // For now, we will just create the announcement
  const { error } = await supabase.from('announcements').insert({
    title: 'Ranks Released!',
    message: `The ranks for "${examTitle}" have been published. Check your results on the leaderboard!`,
    type: 'Rank',
    priority: 'High'
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/weekly-exams/${examId}/results`)
  return { success: true }
}
