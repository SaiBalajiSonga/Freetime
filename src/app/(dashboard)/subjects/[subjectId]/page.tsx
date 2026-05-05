import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpenCheck, ChevronRight } from 'lucide-react'
import { Card, DifficultyBadge, PageHeader } from '@/components/site/dashboard-ui'
import { getDifficultyFromProgress } from '@/lib/progress'

export default async function ChaptersPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = await params
  const supabase = await createClient()

  const [
    { data: subject, error: subjectError },
    { data: chapters, error: chaptersError },
  ] = await Promise.all([
    supabase.from('subjects').select('*').eq('id', subjectId).single(),
    supabase.from('chapters').select('*').eq('subject_id', subjectId).order('name'),
  ])

  if (subjectError || chaptersError) {
    return <div className="text-red-500">Error loading data.</div>
  }

  const chapterIds = chapters?.map(c => c.id) || []
  const { data: questions } = await supabase
    .from('questions')
    .select('id, chapter_id')
    .in('chapter_id', chapterIds.length > 0 ? chapterIds : ['none'])

  const { data: userAttempts } = await supabase.from('attempts').select('question_id, is_correct')

  const solvedQuestionIds = new Set(userAttempts?.filter(a => a.is_correct).map(a => a.question_id) || [])

  const chapterStats: Record<string, { total: number; solved: number }> = {}
  chapterIds.forEach(id => {
    chapterStats[id] = { total: 0, solved: 0 }
  })

  questions?.forEach(q => {
    if (chapterStats[q.chapter_id]) {
      chapterStats[q.chapter_id].total += 1
      if (solvedQuestionIds.has(q.id)) {
        chapterStats[q.chapter_id].solved += 1
      }
    }
  })

  return (
    <div className="space-y-8 animate-in-up">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/subjects" className="text-muted hover:text-[var(--color-primary)] font-semibold transition-colors">
          Subjects
        </Link>
        <ChevronRight className="h-4 w-4 text-muted-2" />
        <span className="font-bold text-foreground">{subject?.name}</span>
      </div>

      <PageHeader
        title={`${subject?.name} Chapters`}
        subtitle="Each card shows how far you have pushed through the questions."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {chapters?.map(chapter => {
          const stats = chapterStats[chapter.id] || { total: 0, solved: 0 }
          const pct = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0

          return (
            <Link key={chapter.id} href={`/chapters/${chapter.id}`} className="block group">
              <Card variant="white" className="h-full flex flex-col group-hover:border-[var(--color-primary)]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                      <BookOpenCheck className="h-5 w-5" />
                    </div>
                  </div>
                  <DifficultyBadge level={getDifficultyFromProgress(pct)} />
                </div>
                
                <div className="mt-4">
                  <h3 className="font-bold text-base text-foreground leading-tight group-hover:text-[var(--color-primary)] transition-colors">{chapter.name}</h3>
                  <p className="text-xs text-muted mt-1 font-medium">{stats.total} questions</p>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
                  <div className="progress-track h-1.5">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold text-muted">
                    <span>{stats.solved} solved</span>
                    <span className="text-[var(--color-primary)]">{pct}%</span>
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
        {chapters?.length === 0 && (
          <Card variant="white" className="col-span-full py-16 text-center border-dashed">
            <p className="text-muted font-medium">No chapters found for this subject.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
