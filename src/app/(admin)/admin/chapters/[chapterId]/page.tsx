import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { DeleteQuestionButton, DeleteChapterButton } from '../../questions/delete-buttons'
import Latex from '@/components/ui/latex'
import { Plus } from 'lucide-react'

export default async function AdminChapterQuestionsPage({ params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params
  const supabase = await createClient()

  const [
    { data: chapter, error: chapterError },
    { data: questions, error: questionsError },
  ] = await Promise.all([
    supabase.from('chapters').select('*, subjects(id, name)').eq('id', chapterId).single(),
    supabase.from('questions').select('id, type, statement, difficulty').eq('chapter_id', chapterId).order('created_at', { ascending: false }),
  ])

  if (chapterError || questionsError) {
    return <div className="text-red-400">Error loading data.</div>
  }

  const diffColor: Record<string, string> = {
    easy:   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    hard:   'bg-red-500/10 text-red-400 border border-red-500/20',
  }

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm mb-2">
            <Link href="/admin/subjects" className="text-muted-2 hover:text-accent-cyan font-medium transition-colors">Subjects</Link>
            <svg className="w-3.5 h-3.5 text-border-strong" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {/* @ts-ignore */}
            <Link href={`/admin/subjects/${chapter?.subjects?.id}`} className="text-muted-2 hover:text-accent-cyan font-medium transition-colors">
              {/* @ts-ignore */}
              {chapter?.subjects?.name}
            </Link>
            <svg className="w-3.5 h-3.5 text-border-strong" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-bold text-foreground">{chapter?.name}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-[-0.03em]">{chapter?.name}</h1>
          <p className="text-sm text-muted mt-1 font-medium">{questions?.length || 0} Questions</p>
        </div>
        
        <div className="flex items-center gap-3">
          {questions && questions.length > 0 && (
             <DeleteChapterButton chapterId={chapter.id} chapterName={chapter.name} count={questions.length} />
          )}
          <Link href={`/admin/questions/new?chapter_id=${chapter.id}`} className="inline-flex items-center justify-center gap-2 h-8 px-4 text-sm font-medium rounded-pill bg-gradient-primary text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.55)] hover:brightness-110 transition-all">
            <Plus className="h-4 w-4" />
            Add Question
          </Link>
        </div>
      </div>

      {/* Question List */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="divide-y divide-border">
          {questions?.map((q, idx) => {
            return (
              <div key={q.id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-2 transition-colors group">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className="text-sm text-muted-2 font-mono shrink-0 w-7 font-medium">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <p className="text-sm text-muted truncate font-medium flex-1">
                    <Latex>{q.statement.substring(0, 150) + (q.statement.length > 150 ? '...' : '')}</Latex>
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0 ml-4">
                  <span className={`px-2.5 py-0.5 rounded-pill text-[10px] font-bold uppercase tracking-wider ${diffColor[q.difficulty] || 'bg-surface-2 text-muted border border-border'}`}>
                    {q.difficulty}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-pill text-[10px] font-bold uppercase tracking-wider bg-surface-2 text-muted-2 border border-border">
                    {q.type}
                  </span>
                  
                  <div className="flex items-center gap-3 ml-2 pl-4 border-l border-border">
                    <Link href={`/questions/${q.id}`} className="text-accent-cyan hover:text-accent-glow text-xs font-bold transition-colors">
                      View
                    </Link>
                    <Link href={`/admin/questions/${q.id}/edit`} className="text-amber-400 hover:text-amber-300 text-xs font-bold transition-colors">
                      Edit
                    </Link>
                    <DeleteQuestionButton questionId={q.id} />
                  </div>
                </div>
              </div>
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
