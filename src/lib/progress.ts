export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export function getDifficultyFromProgress(value: number): DifficultyLevel {
  if (value >= 70) return 'easy'
  if (value >= 40) return 'medium'
  return 'hard'
}
