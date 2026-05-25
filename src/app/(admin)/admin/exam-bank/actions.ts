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

export async function getExamQuestions(
  page: number = 1,
  pageSize: number = 30,
  filters?: {
    search?: string
    difficulty?: string
    type?: string
    subjectId?: string
    chapterId?: string
    visibility?: string
  }
) {
  const supabase = createAdminClient()
  const offset = (page - 1) * pageSize

  let query = supabase
    .from('questions')
    .select(
      'id, statement, type, difficulty, image_url, correct_answer, hint, solution, visibility, chapters!inner(name, subjects!inner(id, name)), options:question_options(id, text, is_correct)',
      { count: 'exact' }
    )

  if (filters?.visibility && filters.visibility !== 'all') {
    query = query.eq('visibility', filters.visibility)
  } else if (!filters?.visibility) {
    query = query.eq('visibility', 'exam')
  }

  if (filters?.search) query = query.ilike('statement', `%${filters.search}%`)
  if (filters?.difficulty) query = query.eq('difficulty', filters.difficulty)
  if (filters?.type) query = query.eq('type', filters.type)
  if (filters?.subjectId) query = query.eq('chapters.subjects.id', filters.subjectId)
  if (filters?.chapterId) query = query.eq('chapter_id', filters.chapterId)

  query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('[Admin] getExamQuestions error:', error.message)
    return { data: [], count: 0 }
  }

  return { data, count: count ?? 0 }
}
export async function getExamStats() {
  const supabase = createAdminClient()
  const [
    { count: total },
    { count: mcq },
    { count: num },
    { count: easy },
    { count: medium },
    { count: hard }
  ] = await Promise.all([
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('visibility', 'exam'),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('visibility', 'exam').eq('type', 'mcq'),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('visibility', 'exam').eq('type', 'numerical'),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('visibility', 'exam').eq('difficulty', 'easy'),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('visibility', 'exam').eq('difficulty', 'medium'),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('visibility', 'exam').eq('difficulty', 'hard'),
  ])

  return { 
    total: total ?? 0, 
    mcq: mcq ?? 0, 
    num: num ?? 0, 
    easy: easy ?? 0, 
    medium: medium ?? 0, 
    hard: hard ?? 0 
  }
}
