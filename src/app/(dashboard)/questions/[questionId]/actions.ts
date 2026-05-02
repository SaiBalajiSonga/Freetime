'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitAttempt(questionId: string, answer: string, timeTaken: number) {
  const supabase = await createClient()

  const [
    { data: authUser },
    { data: question, error: qError }
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('questions').select('correct_answer, type').eq('id', questionId).single()
  ])

  if (!authUser.user) return { error: 'Not authenticated' }
  if (qError || !question) return { error: 'Question not found' }

  let isCorrect = false

  if (question.type === 'mcq') {
    const { data: allOptions } = await supabase
      .from('question_options')
      .select('id, text, is_correct')
      .eq('question_id', questionId)
    
    // DEBUG: log everything so we can see the mismatch
    console.log(`[Submit] questionId=${questionId}`)
    console.log(`[Submit] question.correct_answer=${question.correct_answer}`)
    console.log(`[Submit] User submitted answer (option UUID)="${answer}"`)
    console.log(`[Submit] All options in DB:`, JSON.stringify(allOptions?.map(o => ({
      id: o.id,
      text: o.text?.substring(0, 20),
      is_correct: o.is_correct
    }))))
    
    const selectedOption = allOptions?.find(o => o.id === answer)
    console.log(`[Submit] Matched option:`, selectedOption ? { id: selectedOption.id, is_correct: selectedOption.is_correct } : 'NOT FOUND')
    isCorrect = selectedOption?.is_correct === true
  } else {
    // For numerical: compare the text values
    isCorrect = (question.correct_answer || '').trim() === answer.trim()
  }

  const { error: insertError } = await supabase
    .from('attempts')
    .insert({
      user_id: authUser.user.id,
      question_id: questionId,
      answer,
      is_correct: isCorrect,
      time_taken: timeTaken
    })

  if (insertError) {
    console.error(`[Submit] DB Insert Error: ${insertError.message} (Code: ${insertError.code})`)
    // Still return success and isCorrect so the UI shows the right feedback, 
    // even if the database blocks saving the attempt history (e.g. 409 Conflict)
    return { error: 'Failed to record attempt in history: ' + insertError.message, isCorrect, success: true }
  }

  revalidatePath(`/questions/${questionId}`)
  revalidatePath(`/chapters/[chapterId]`, 'page')
  revalidatePath(`/dashboard`)

  return { success: true, isCorrect }
}

