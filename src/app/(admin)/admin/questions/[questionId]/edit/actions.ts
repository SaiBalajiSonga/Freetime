'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateQuestion(questionId: string, formData: FormData) {
  try {
    const supabase = await createClient()

    const chapterId = formData.get('chapterId') as string
    const type = formData.get('type') as string
    const difficulty = formData.get('difficulty') as string
    const statement = formData.get('statement') as string
    const solution = formData.get('solution') as string
    const hint = formData.get('hint') as string
    
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
      const optionsToUpsert = []
      
      for (let i = 0; i < 4; i++) {
        const optText = formData.get(`option_${i}`) as string
        const optId = formData.get(`option_id_${i}`) as string
        
        if (optText) {
          const opt: any = {
            question_id: questionId,
            text: optText,
            is_correct: i === correctIndex
          }
          if (optId) opt.id = optId
          optionsToUpsert.push(opt)
        }
      }

      if (optionsToUpsert.length > 0) {
        // Upsert options to avoid FK constraint violations from delete
        const { error: optError } = await supabase.from('question_options').upsert(optionsToUpsert)
        if (optError) {
          return { error: 'Question updated but failed to save options: ' + optError.message }
        }
        
        // Update correct_answer on question
        const { data: savedOptions } = await supabase.from('question_options').select('id').eq('question_id', questionId).eq('is_correct', true).single()
        if (savedOptions) {
          await supabase.from('questions').update({ correct_answer: savedOptions.id }).eq('id', questionId)
        }
      }
    }

    revalidatePath('/admin')
    revalidatePath(`/questions/${questionId}`)
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' }
  }
}
