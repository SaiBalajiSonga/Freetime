import { z } from 'zod'
import { ImportQuestion, ValidationResult } from './types'

const OptionSchema = z.object({
  text: z.string().min(1, 'Option text is required'),
  is_correct: z.boolean()
})

const QuestionSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  chapter: z.string().min(1, 'Chapter is required'),
  type: z.enum(['mcq', 'numerical']),
  statement: z.string().min(5, 'Statement must be at least 5 characters'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  options: z.array(OptionSchema).optional(),
  correct_answer: z.string().optional(),
  hint: z.string().optional(),
  solution: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional()
}).refine(data => {
  if (data.type === 'mcq') {
    if (!data.options || data.options.length !== 4) return false
    const correctCount = data.options.filter(o => o.is_correct).length
    if (correctCount !== 1) return false
  }
  if (data.type === 'numerical') {
    if (!data.correct_answer || data.correct_answer.trim() === '') return false
  }
  return true
}, {
  message: 'MCQ must have exactly 4 options with 1 correct option. Numerical must have a correct_answer.',
  path: ['options'] // approximate path for error
})

export function validateQuestion(q: ImportQuestion): ValidationResult {
  const result = QuestionSchema.safeParse(q)
  
  if (result.success) {
    return { valid: true, errors: [], question: q }
  } else {
    const zodIssues = result.error?.issues || []
    const errors = zodIssues.map((e: any) => `${e.path?.join('.')}: ${e.message}`)
    return { valid: false, errors, question: q }
  }
}
