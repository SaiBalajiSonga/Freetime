import { createAdminClient } from '@/lib/supabase/server'
import { ImportQuestion } from './types'
import { generateHash } from './dedupe'

export async function insertQuestions(questions: ImportQuestion[]) {
  const supabase = createAdminClient()

  let insertedCount = 0
  let skippedCount = 0
  let errorCount = 0
  const errors: string[] = []

  // Pre-resolve all subjects and chapters to minimize queries
  const subjectMap = new Map<string, string>()
  const chapterMap = new Map<string, string>() // "Subject|Chapter" -> id

  const uniqueSubjects = new Set<string>()
  const uniqueChapters = new Set<string>() // "Subject|Chapter"

  for (const q of questions) {
    uniqueSubjects.add(q.subject.trim())
    uniqueChapters.add(`${q.subject.trim()}|${q.chapter.trim()}`)
  }

  // Fetch all existing subjects
  const { data: existingSubjects } = await supabase.from('subjects').select('id, name')
  if (existingSubjects) {
    for (const sub of existingSubjects) {
      subjectMap.set(sub.name.toLowerCase(), sub.id)
    }
  }

  // Create missing subjects
  for (const subName of uniqueSubjects) {
    const key = subName.toLowerCase()
    if (!subjectMap.has(key)) {
      const { data, error } = await supabase.from('subjects').insert({ name: subName }).select('id').single()
      if (error || !data) {
        console.error(`Failed to create subject "${subName}":`, error?.message)
      } else {
        subjectMap.set(key, data.id)
      }
    }
  }

  // Fetch all existing chapters for the known subjects
  const subjectIds = Array.from(subjectMap.values())
  const chunkSize = 500
  for (let i = 0; i < subjectIds.length; i += chunkSize) {
    const chunk = subjectIds.slice(i, i + chunkSize)
    const { data: existingChapters } = await supabase.from('chapters').select('id, name, subjects(name)').in('subject_id', chunk)
    if (existingChapters) {
      for (const ch of existingChapters) {
        const subName = (ch.subjects as any)?.name
        if (subName) {
          chapterMap.set(`${subName.toLowerCase()}|${ch.name.toLowerCase()}`, ch.id)
        }
      }
    }
  }

  // Create missing chapters
  for (const chKey of uniqueChapters) {
    const [subName, chName] = chKey.split('|')
    const key = `${subName.toLowerCase()}|${chName.toLowerCase()}`
    if (!chapterMap.has(key)) {
      const subId = subjectMap.get(subName.toLowerCase())
      if (subId) {
        const { data, error } = await supabase.from('chapters').insert({ subject_id: subId, name: chName }).select('id').single()
        if (error || !data) {
          console.error(`Failed to create chapter "${chName}":`, error?.message)
        } else {
          chapterMap.set(key, data.id)
        }
      }
    }
  }

  // Batch insert questions
  const BATCH_SIZE = 200
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE)
    const questionsToInsert = []
    
    // Prepare question rows
    for (const q of batch) {
      // Regenerate hash if missing
      if (!q.hash) q.hash = await generateHash(q)
      
      const subId = subjectMap.get(q.subject.trim().toLowerCase())
      const chId = chapterMap.get(`${q.subject.trim().toLowerCase()}|${q.chapter.trim().toLowerCase()}`)
      
      if (!subId || !chId) {
        errors.push(`Row: Could not resolve subject "${q.subject}" or chapter "${q.chapter}"`)
        errorCount++
        continue
      }

      questionsToInsert.push({
        chapter_id: chId,
        type: q.type,
        statement: q.statement,
        difficulty: q.difficulty,
        hint: q.hint || null,
        solution: q.solution || null,
        image_url: q.image_url || null,
        tags: q.tags || [],
        source: q.source || null,
        hash: q.hash,
        visibility: q.visibility || 'public'
        // correct_answer is omitted initially for MCQ until options are inserted
      })
    }

    if (questionsToInsert.length === 0) continue

    // Filter duplicates one last time just in case
    const batchHashes = questionsToInsert.map(q => q.hash)
    const { data: dupData } = await supabase.from('questions').select('hash').in('hash', batchHashes)
    const dupSet = new Set(dupData?.map(d => d.hash) || [])
    
    const validQuestionsToInsert = questionsToInsert.filter(q => !dupSet.has(q.hash))
    skippedCount += (questionsToInsert.length - validQuestionsToInsert.length)

    if (validQuestionsToInsert.length === 0) continue

    // Insert questions
    const { data: insertedQuestions, error: insertError } = await supabase
      .from('questions')
      .insert(validQuestionsToInsert)
      .select('id, hash')
    
    if (insertError || !insertedQuestions) {
      const msg = insertError?.message || 'Unknown error during batch insert'
      console.error(`[Insert] Batch error:`, msg)
      errors.push(`Batch error: ${msg}`)
      errorCount += validQuestionsToInsert.length
      continue
    }

    // Map hashes back to original question structure to get options
    const insertedMap = new Map(insertedQuestions.map(q => [q.hash, q.id]))
    
    const optionsToInsert = []
    const correctAnswersToUpdate = [] // Array of { qId, optIndex } to update later

    for (const q of batch) {
      const qId = insertedMap.get(q.hash)
      if (qId && q.type === 'mcq' && q.options && q.options.length > 0) {
        for (let j = 0; j < q.options.length; j++) {
          const opt = q.options[j]
          // generate a deterministic ID or insert normally, but we need the inserted option ID to update correct_answer
          // To simplify, we insert options and then select them to update the question, 
          // but we can generate UUIDs for options beforehand if we want to insert and link in one go.
          // For simplicity, we just use standard insert and then fetch them, or do it iteratively for the options.
          
          optionsToInsert.push({
            question_id: qId,
            text: opt.text,
            is_correct: opt.is_correct
          })
        }
      } else if (qId && q.type === 'numerical' && q.correct_answer) {
        correctAnswersToUpdate.push({ id: qId, correct_answer: q.correct_answer })
      }
    }

    if (optionsToInsert.length > 0) {
      const { error: optError } = await supabase.from('question_options').insert(optionsToInsert)
      if (optError) {
        console.error(`[Insert] Options batch error:`, optError.message)
        errors.push(`Options batch error: ${optError.message}`)
      } else {
        // Need to update the correct_answer field for MCQ questions
        // Fetch the newly inserted correct options
        const insertedQIds = Array.from(insertedMap.values())
        const { data: correctOpts } = await supabase
          .from('question_options')
          .select('id, question_id')
          .in('question_id', insertedQIds)
          .eq('is_correct', true)
        
        if (correctOpts) {
          // Unfortunately supabase doesn't support bulk update with different values easily.
          // We can do it sequentially here because it's only for the batch.
          for (const opt of correctOpts) {
            await supabase.from('questions').update({ correct_answer: opt.id }).eq('id', opt.question_id)
          }
        }
      }
    }

    if (correctAnswersToUpdate.length > 0) {
      for (const update of correctAnswersToUpdate) {
        await supabase.from('questions').update({ correct_answer: update.correct_answer }).eq('id', update.id)
      }
    }

    insertedCount += validQuestionsToInsert.length
    console.log(`[Insert] Progress: ${i + batch.length}/${questions.length} processed (${insertedCount} inserted, ${errorCount} errors)`)
  }

  console.log(`[Insert] Complete: ${insertedCount} inserted, ${skippedCount} skipped, ${errorCount} errors`)
  if (errors.length > 0) {
    console.log(`[Insert] First 5 errors:`, errors.slice(0, 5))
  }

  return { insertedCount, skippedCount, errorCount, errors: errors.slice(0, 10) }
}

