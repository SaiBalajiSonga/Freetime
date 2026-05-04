import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CheckCircle2, XCircle, Circle } from 'lucide-react'
import Latex from '@/components/ui/latex'

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

  const diffColor: Record<string, string> = {
    easy:   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    hard:   'bg-red-500/10 text-red-400 border border-red-500/20',
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/subjects" className="text-muted-2 hover:text-accent-electric font-medium transition-colors">Subjects</Link>
        <svg className="w-3.5 h-3.5 text-border-strong" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {/* @ts-ignore */}
        <Link href={`/subjects/${chapter?.subjects?.id}`} className="text-muted-2 hover:text-accent-electric font-medium transition-colors">
          {/* @ts-ignore */}
          {chapter?.subjects?.name}
        </Link>
        <svg className="w-3.5 h-3.5 text-border-strong" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-bold text-foreground">{chapter?.name}</span>
      </div>

      {/* Question List */}
      <div className="rounded-2xl surface-glass-strong overflow-hidden border border-white/[0.07]">
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <h2 className="font-bold text-lg text-foreground">{chapter?.name}</h2>
          <p className="text-xs text-muted mt-1 font-medium">{questions?.length || 0} Questions available</p>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {questions?.map((q, idx) => {
            const status = getStatus(q.id)
            return (
              <Link key={q.id} href={`/questions/${q.id}`} className="block">
                <div className="flex items-center justify-between px-6 py-4 hover:bg-surface-2/60 transition-colors group">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {status === 'solved'    && <CheckCircle2 className="h-4 w-4 text-accent-electric shrink-0" />}
                    {status === 'attempted' && <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
                    {status === 'unsolved'  && <Circle className="h-4 w-4 text-border-strong shrink-0" />}

                    <span className="text-sm text-muted-2 font-mono shrink-0 w-7 font-medium">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <p className="text-sm text-muted truncate font-medium">
                      <Latex>{q.statement.substring(0, 120)}</Latex>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className={`px-2.5 py-0.5 rounded-pill text-[10px] font-bold capitalize ${diffColor[q.difficulty] || 'bg-surface-2 text-muted border border-border'}`}>
                      {q.difficulty}
                    </span>
                    <svg className="w-4 h-4 text-muted-2 group-hover:text-accent-electric transition-all group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
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
      </div>
    </div>
  )
}
