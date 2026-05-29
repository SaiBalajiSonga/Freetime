import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CheckCircle2, XCircle, Circle, ChevronRight } from 'lucide-react'
import Latex from '@/components/ui/latex'
import { Card, DifficultyBadge, SectionHeader } from '@/components/site/dashboard-ui'

export default async function ChapterQuestionsPage({ params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params
  const supabase = await createClient()

  const [
    { data: chapter, error: chapterError },
    { data: questions, error: questionsError },
    { data: authUser }
  ] = await Promise.all([
    supabase.from('chapters').select('*, subjects(id, name)').eq('id', chapterId).single(),
    supabase.from('questions').select('id, type, statement, difficulty').eq('chapter_id', chapterId),
    supabase.auth.getUser()
  ])

  if (chapterError || questionsError) {
    return <div className="text-red-400">Error loading data.</div>
  }

  let attempts: any[] = []
  if (authUser.user) {
    const { data } = await supabase
      .from('attempts')
      .select('question_id, is_correct')
      .eq('user_id', authUser.user.id)
      .in('question_id', questions?.map(q => q.id) || [])
    attempts = data || []
  }

  const getStatus = (qId: string) => {
    const a = attempts.find(a => a.question_id === qId)
    if (!a) return 'unsolved'
    return a.is_correct ? 'solved' : 'attempted'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/subjects" className="text-muted-2 hover:text-[#93C5FD] font-medium transition-colors">Subjects</Link>
        <ChevronRight className="h-4 w-4 text-muted-2" />
        {/* @ts-ignore */}
        <Link href={`/subjects/${chapter?.subjects?.id}`} className="text-muted-2 hover:text-[#93C5FD] font-medium transition-colors">
          {/* @ts-ignore */}
          {chapter?.subjects?.name}
        </Link>
        <ChevronRight className="h-4 w-4 text-muted-2" />
        <span className="font-bold text-foreground">{chapter?.name}</span>
      </div>

      <SectionHeader
        label="Question list"
        title={chapter?.name || 'Chapter questions'}
        subtitle={`${questions?.length || 0} questions ready to solve`}
      />

      <Card variant="white" className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="font-semibold text-foreground">{chapter?.name}</h2>
          <p className="text-xs text-muted mt-1">Pick a question to start practicing.</p>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {questions?.map((q, idx) => {
            const status = getStatus(q.id)
            return (
              <Link key={q.id} href={`/questions/${q.id}`} className="block">
                <div className="flex items-center justify-between px-6 py-4 transition-all hover:bg-white/[0.03]">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {status === 'solved'    && <CheckCircle2 className="h-4 w-4 text-[#84CC16] shrink-0" />}
                    {status === 'attempted' && <XCircle className="h-4 w-4 text-[#EF4444] shrink-0" />}
                    {status === 'unsolved'  && <Circle className="h-4 w-4 text-muted-2 shrink-0" />}

                    <span className="text-sm text-muted-2 font-mono shrink-0 w-7 font-medium">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <p className="text-sm text-muted truncate font-medium">
                      <Latex>{q.statement}</Latex>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <DifficultyBadge level={q.difficulty} />
                    <ChevronRight className="h-4 w-4 text-muted-2" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {questions?.length === 0 && (
          <div className="py-16 text-center">
            <div className="size-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">📝</span>
            </div>
            <p className="text-muted font-medium">No questions in this chapter yet.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
