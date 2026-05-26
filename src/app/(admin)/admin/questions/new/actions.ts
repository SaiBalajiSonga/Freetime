'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createQuestion(formData: FormData) {
  const supabase = createAdminClient()

  const chapterId = formData.get('chapterId') as string
  const type = formData.get('type') as string
  const difficulty = formData.get('difficulty') as string
  const statement = formData.get('statement') as string
  const solution = formData.get('solution') as string
  const hint = formData.get('hint') as string
  const image_url = formData.get('image_url') as string | null
  const visibility = (formData.get('visibility') as string) || 'public'

  // Create question
  const questionData: any = {
    chapter_id: chapterId,
    type,
    difficulty,
    statement,
    solution: solution || null,
    hint: hint || null,
    image_url: image_url || null,
    visibility,
  }

  if (type === 'numerical') {
    questionData.correct_answer = formData.get('correct_answer') as string
  } else {
    // For MCQ, we'll extract options and their correctness later, but for simplicity
    // we can assume correct_answer holds the correct option ID (or just rely on the options table)
    questionData.correct_answer = null // Options table will handle this
  }

  const { data: question, error: qError } = await supabase
    .from('questions')
    .insert(questionData)
    .select('id')
    .single()

  if (qError || !question) {
    throw new Error('Failed to create question: ' + qError?.message)
  }

  if (type === 'mcq') {
    const options = []
    const correctIndex = parseInt(formData.get('correctOptionIndex') as string)
    
    for (let i = 0; i < 4; i++) {
      const optText = formData.get(`option_${i}`) as string
      if (optText) {
        options.push({
          question_id: question.id,
          text: optText,
          is_correct: i === correctIndex
        })
      }
    }

    if (options.length > 0) {
      const { error: optError } = await supabase.from('question_options').insert(options)
      if (optError) {
        throw new Error('Question created but failed to save options: ' + optError.message)
      }
      
      // Update correct_answer on question for easier matching
      const { data: savedOptions } = await supabase.from('question_options').select('id').eq('question_id', question.id).eq('is_correct', true).single()
      if (savedOptions) {
        await supabase.from('questions').update({ correct_answer: savedOptions.id }).eq('id', question.id)
      }
    }
  }

  revalidatePath('/admin/questions')
  revalidatePath('/dashboard')
  redirect('/admin')
}
