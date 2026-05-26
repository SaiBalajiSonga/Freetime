'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateQuestion(questionId: string, formData: FormData) {
  try {
    const supabase = createAdminClient()

    const chapterId = formData.get('chapterId') as string
    const type = formData.get('type') as string
    const difficulty = formData.get('difficulty') as string
    const statement = formData.get('statement') as string
    const solution = formData.get('solution') as string
    const hint = formData.get('hint') as string
    const image_url = formData.get('image_url') as string | null
    
    if (!chapterId) {
      return { error: 'Chapter is required.' }
    }

    // Update question
    const questionData: any = {
      chapter_id: chapterId,
      type,
      difficulty,
      statement,
      solution: solution || null,
      hint: hint || null,
      image_url: image_url || null,
    }

    if (type === 'numerical') {
      questionData.correct_answer = formData.get('correct_answer') as string
    } else {
      questionData.correct_answer = null 
    }

    const { error: qError } = await supabase
      .from('questions')
      .update(questionData)
      .eq('id', questionId)

    if (qError) {
      return { error: 'Failed to update question: ' + qError.message }
    }

    if (type === 'mcq') {
      const correctIndex = parseInt(formData.get('correctOptionIndex') as string)
      
      // Fetch existing options to get their stable IDs
      const { data: existingOptions } = await supabase
        .from('question_options')
        .select('id')
        .eq('question_id', questionId)
        .order('id', { ascending: true })

      const newOptions = []
      for (let i = 0; i < 4; i++) {
        const optText = formData.get(`option_${i}`) as string
        if (optText) {
          newOptions.push({
            text: optText,
            is_correct: i === correctIndex
          })
        }
      }

      if (newOptions.length > 0) {
        if (existingOptions && existingOptions.length > 0) {
          // Update each existing option in-place (preserves UUIDs — critical for attempts history)
          let correctOptionId: string | null = null
          for (let i = 0; i < newOptions.length; i++) {
            const existingId = existingOptions[i]?.id
            if (existingId) {
              await supabase.from('question_options').update({
                text: newOptions[i].text,
                is_correct: newOptions[i].is_correct
              }).eq('id', existingId)
              if (newOptions[i].is_correct) correctOptionId = existingId
            }
          }
          if (correctOptionId) {
            await supabase.from('questions').update({ correct_answer: correctOptionId }).eq('id', questionId)
          }
        } else {
          // No existing options — insert fresh
          const toInsert = newOptions.map(o => ({ ...o, question_id: questionId }))
          const { data: inserted, error: optError } = await supabase.from('question_options').insert(toInsert).select('id, is_correct')
          if (optError) return { error: 'Failed to save options: ' + optError.message }
          const correctOpt = inserted?.find(o => o.is_correct)
          if (correctOpt) {
            await supabase.from('questions').update({ correct_answer: correctOpt.id }).eq('id', questionId)
          }
        }
      }
    }

    revalidatePath('/admin/questions', 'layout')
    revalidatePath(`/questions/${questionId}`, 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' }
  }
}
