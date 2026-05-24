'use server'

import { createClient } from '@/lib/supabase/server'
import { generateHash } from '@/lib/import/dedupe'
import { ImportQuestion, ValidationResult, PreviewData } from '@/lib/import/types'
import { validateQuestion } from '@/lib/import/validate'
import { insertQuestions } from '@/lib/import/insert'
import { revalidatePath } from 'next/cache'

export async function processImportData(normalizedQuestions: ImportQuestion[]): Promise<PreviewData> {
  const validQuestions: ValidationResult[] = []
  const invalidQuestions: ValidationResult[] = []
  const duplicateHashes: string[] = []
  
  const supabase = await createClient()

  // 1. First pass: validate and generate hashes
  const validatedWithHashes = await Promise.all(
    normalizedQuestions.map(async (q) => {
      const validation = validateQuestion(q)
      if (validation.valid) {
        validation.question.hash = await generateHash(q)
      }
      return validation
    })
  )

  // 2. Separate valid and invalid
  const validItems = validatedWithHashes.filter(v => v.valid)
  invalidQuestions.push(...validatedWithHashes.filter(v => !v.valid))

  // 3. Batch check existing hashes in chunks of 500
  const allHashes = validItems.map(v => v.question.hash as string)
  const existingHashes = new Set<string>()

  const chunkSize = 500
  for (let i = 0; i < allHashes.length; i += chunkSize) {
    const chunk = allHashes.slice(i, i + chunkSize)
    const { data } = await supabase
      .from('questions')
      .select('hash')
      .in('hash', chunk)
    
    if (data) {
      data.forEach(row => existingHashes.add(row.hash))
    }
  }

  // 4. Categorize as valid or duplicate
  for (const validation of validItems) {
    if (existingHashes.has(validation.question.hash as string)) {
      duplicateHashes.push(validation.question.hash as string)
    } else {
      validQuestions.push(validation)
    }
  }

  return {
    validQuestions,
    invalidQuestions,
    duplicateHashes
  }
}

export async function commitImport(questions: ImportQuestion[]) {
  const result = await insertQuestions(questions)
  revalidatePath('/admin', 'layout')
  revalidatePath('/dashboard')
  revalidatePath('/subjects')
  return result
}
