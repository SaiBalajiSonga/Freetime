import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { DeleteChapterButton } from '../../questions/delete-buttons'
import { Plus } from 'lucide-react'

export default async function AdminChaptersPage({ params }: { params: Promise<{ subjectId: string }> }) {
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
    return <div>Error loading data.</div>
  }

  const chapterIds = chapters?.map(c => c.id) || []
  const { data: questions } = await supabase
    .from('questions')
    .select('id, chapter_id')
    .in('chapter_id', chapterIds.length > 0 ? chapterIds : ['none'])

  const chapterStats: Record<string, { total: number }> = {}
  chapterIds.forEach(id => { chapterStats[id] = { total: 0 } })

  questions?.forEach(q => {
    if (chapterStats[q.chapter_id]) {
      chapterStats[q.chapter_id].total += 1
    }
  })

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm mb-2">
            <Link href="/admin/subjects" className="text-muted-2 hover:text-accent-cyan font-medium transition-colors">
              Subjects
            </Link>
            <svg className="w-3.5 h-3.5 text-border-strong" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-bold text-foreground">{subject?.name}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-[-0.03em]">Chapters in {subject?.name}</h1>
        </div>
      </div>

      {/* Chapter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {chapters?.map((chapter) => {
          const stats = chapterStats[chapter.id] || { total: 0 }

          return (
            <div key={chapter.id} className="rounded-2xl border border-border bg-surface hover:bg-surface-2 hover:border-border-strong p-6 h-full group transition-all duration-300 relative overflow-hidden flex flex-col">
              <Link href={`/admin/chapters/${chapter.id}`} className="absolute inset-0 z-0" />
              {/* Top gradient line on hover */}
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-start justify-between relative z-10">
                <h3 className="font-bold text-lg text-foreground leading-tight">{chapter.name}</h3>
                <svg className="w-5 h-5 text-muted-2 group-hover:text-accent-cyan transition-colors group-hover:translate-x-1 duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-sm text-muted mt-1 relative z-10">{stats.total} Questions total</p>
              
              <div className="mt-auto pt-6 flex justify-end relative z-10">
                <DeleteChapterButton chapterId={chapter.id} chapterName={chapter.name} count={stats.total} />
              </div>
            </div>
          )
        })}
        {chapters?.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <div className="size-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <p className="text-muted font-medium">No chapters found for this subject.</p>
          </div>
        )}
      </div>
    </div>
  )
}
