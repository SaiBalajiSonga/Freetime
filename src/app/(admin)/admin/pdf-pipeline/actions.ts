'use server'

import { createClient } from '@/lib/supabase/server'
import { generateHash } from '@/lib/import/dedupe'
import { ImportQuestion, PreviewData, ValidationResult } from '@/lib/import/types'
import { validateQuestion } from '@/lib/import/validate'
import { insertQuestions } from '@/lib/import/insert'
import { revalidatePath } from 'next/cache'
import type { PipelineQuestion } from '@/components/admin/pipeline-preview'

/**
 * Convert pipeline JSON output into ImportQuestion[] format
 * that the existing import system understands.
 */
export async function convertPipelineToImport(
  pipelineQuestions: PipelineQuestion[],
  subject: string
): Promise<ImportQuestion[]> {
  return pipelineQuestions
    .filter((q) => q.merge_status !== 'KEY_NOT_FOUND')
    .map((q) => {
      const qType = (q.type || q.question_type || 'mcq') as 'mcq' | 'numerical'
      const base: ImportQuestion = {
        subject: q.subject || subject,
        chapter: q.chapter || q.chapter_name || 'General',
        type: qType,
        statement: q.statement || q.question_text || '',
        difficulty: (q.difficulty || q.ai_difficulty || 'medium') as 'easy' | 'medium' | 'hard',
        source: q.source || undefined,
        visibility: (q.visibility || 'public') as 'public' | 'exam',
      }

      if (qType === 'mcq' && q.options) {
        if (typeof q.options[0] === 'string') {
          const cIdx = q.correct_option ?? 0
          base.options = (q.options as string[]).map((text, idx) => ({
            text: String(text),
            is_correct: idx === cIdx,
          }))
        } else {
          base.options = (q.options as any[]).map((opt) => ({
            text: opt.text,
            is_correct: opt.is_correct,
          }))
        }
      }

      if (qType === 'numerical' && q.correct_answer) {
        base.correct_answer = q.correct_answer
      }

      return base
    })
}

/**
 * Process pipeline questions through the existing import validation pipeline.
 * Checks for duplicates against the database.
 */
export async function processPipelineImport(
  pipelineQuestions: PipelineQuestion[],
  subject: string
): Promise<PreviewData> {
  const importQuestions = await convertPipelineToImport(pipelineQuestions, subject)

  const validQuestions: ValidationResult[] = []
  const invalidQuestions: ValidationResult[] = []
  const duplicateHashes: string[] = []

  const supabase = await createClient()

  // 1. Validate and hash
  const validatedWithHashes = await Promise.all(
    importQuestions.map(async (q) => {
      const validation = validateQuestion(q)
      if (validation.valid) {
        validation.question.hash = await generateHash(q)
      }
      return validation
    })
  )

  // 2. Separate valid and invalid
  const validItems = validatedWithHashes.filter((v) => v.valid)
  invalidQuestions.push(...validatedWithHashes.filter((v) => !v.valid))

  // 3. Batch check existing hashes
  const allHashes = validItems.map((v) => v.question.hash as string)
  const existingHashes = new Set<string>()

  const chunkSize = 500
  for (let i = 0; i < allHashes.length; i += chunkSize) {
    const chunk = allHashes.slice(i, i + chunkSize)
    const { data } = await supabase
      .from('questions')
      .select('hash')
      .in('hash', chunk)

    if (data) {
      data.forEach((row: { hash: string }) => existingHashes.add(row.hash))
    }
  }

  // 4. Categorize
  for (const validation of validItems) {
    if (existingHashes.has(validation.question.hash as string)) {
      duplicateHashes.push(validation.question.hash as string)
    } else {
      validQuestions.push(validation)
    }
  }

  return { validQuestions, invalidQuestions, duplicateHashes }
}

/**
 * Commit validated questions to Supabase.
 */
export async function commitPipelineImport(questions: ImportQuestion[]) {
  const result = await insertQuestions(questions)
  revalidatePath('/admin/questions', 'layout')
  revalidatePath('/admin/pdf-pipeline')
  revalidatePath('/dashboard')
  revalidatePath('/subjects')
  return result
}
