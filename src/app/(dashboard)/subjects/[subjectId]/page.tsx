import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpenCheck, ChevronRight } from 'lucide-react'
import { Card, DifficultyBadge, SectionHeader } from '@/components/site/dashboard-ui'

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
    return <div className="text-red-400">Error loading data.</div>
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

  const progressToStatus = (value: number) => (value >= 70 ? 'easy' : value >= 40 ? 'medium' : 'hard')

  return (
    <div className="space-y-8 animate-in-up">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/subjects" className="text-muted-2 hover:text-[#93C5FD] font-medium transition-colors">
          Subjects
        </Link>
        <ChevronRight className="h-4 w-4 text-muted-2" />
        <span className="font-bold text-foreground">{subject?.name}</span>
      </div>

      <SectionHeader
        label="Chapters"
        title={`${subject?.name} roadmap`}
        subtitle="Each chapter card shows how far you have pushed through the questions."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {chapters?.map(chapter => {
          const stats = chapterStats[chapter.id] || { total: 0, solved: 0 }
          const pct = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0

          return (
            <Link key={chapter.id} href={`/chapters/${chapter.id}`} className="block">
              <Card variant="dark" className="h-full">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-surface-2 text-[#93C5FD]">
                      <BookOpenCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-foreground leading-tight">{chapter.name}</h3>
                      <p className="text-xs text-muted mt-1">{stats.total} questions</p>
                    </div>
                  </div>
                  <DifficultyBadge level={progressToStatus(pct)} />
                </div>

                <div className="mt-5">
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-[#3B82F6]/80" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
                    <span>{stats.solved} solved</span>
                    <span className="text-foreground font-semibold">{pct}%</span>
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
        {chapters?.length === 0 && (
          <Card variant="dark" className="col-span-full py-16 text-center">
            <p className="text-muted font-medium">No chapters found for this subject.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
