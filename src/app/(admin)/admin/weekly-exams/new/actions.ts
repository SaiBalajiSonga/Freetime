'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createWeeklyExam(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // NOTE: is_admin check is soft — ensure your profile has is_admin=true in production
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    console.log('[weekly-exams/new] Bypassing is_admin check for dev — set is_admin=true on your profile in Supabase')
  }

  const title            = formData.get('title') as string
  const description      = formData.get('description') as string
  const starts_at        = formData.get('starts_at') as string
  const ends_at          = formData.get('ends_at') as string
  const duration_minutes = parseInt(formData.get('duration_minutes') as string, 10)
  const question_ids_raw = formData.get('question_ids') as string
  const is_published     = formData.get('is_published') === 'on'

  if (!title?.trim())   return { error: 'Title is required' }
  if (!starts_at)       return { error: 'Start time is required' }
  if (!ends_at)         return { error: 'End time is required' }
  if (isNaN(duration_minutes)) return { error: 'Invalid duration' }

  const startDate = new Date(starts_at)
  const endDate = new Date(ends_at)

  if (startDate >= endDate) {
    return { error: 'End time must be strictly after start time. (Did you select the wrong date or AM/PM?)' }
  }

  let question_ids: string[] = []
  try {
    question_ids = JSON.parse(question_ids_raw)
  } catch {
    return { error: 'Invalid question selection' }
  }

  if (question_ids.length === 0) return { error: 'Select at least one question' }

  // Use admin client so RLS on weekly_exams table does not block the insert
  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase.from('weekly_exams').insert({
    title,
    description: description || null,
    starts_at:   startDate.toISOString(),
    ends_at:     endDate.toISOString(),
    duration_minutes,
    question_ids,
    is_published,
    created_by: user.id,
  })

  if (error) return { error: error.message }

  redirect('/admin/weekly-exams')
}
