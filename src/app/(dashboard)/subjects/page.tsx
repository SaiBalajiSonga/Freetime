import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type React from 'react'
import { Atom, BookOpen, FlaskConical, Sigma, ChevronRight } from 'lucide-react'
import { Card, PageHeader } from '@/components/site/dashboard-ui'

export default async function SubjectsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  const [{ data: subjects, error }, { data: attempts }] = await Promise.all([
    supabase.from('subjects').select('*, chapters(id, questions(count))').order('name'),
    supabase.from('attempts').select('question_id, is_correct, questions!inner(chapters!inner(subject_id))').eq('user_id', user?.id || '').eq('is_correct', true)
  ])

  if (error) {
    return <div className="text-red-500">Error loading subjects: {error.message}</div>
  }

  // Calculate solved counts per subject
  const solvedBySubject: Record<string, Set<string>> = {}
  attempts?.forEach(a => {
    // @ts-expect-error Supabase typing deeply nested
    const sid = a.questions?.chapters?.subject_id
    if (sid) {
      if (!solvedBySubject[sid]) solvedBySubject[sid] = new Set()
      solvedBySubject[sid].add(a.question_id)
    }
  })

  const subjectMeta: Record<string, { icon: React.ReactNode; color: 'blue' | 'green' | 'orange' }> = {
    Physics: {
      icon: <Atom className="h-6 w-6" />,
      color: 'blue',
    },
    Chemistry: {
      icon: <FlaskConical className="h-6 w-6" />,
      color: 'orange',
    },
    Mathematics: {
      icon: <Sigma className="h-6 w-6" />,
      color: 'green',
    },
  }

  return (
    <div className="space-y-8 animate-in-up">
      <PageHeader
        title="Practice"
        subtitle="Choose a subject to dive into chapters and practice questions."
      />

      <div className="grid gap-5 grid-cols-1 sm:grid-cols-3">
        {subjects?.map(subject => {
          const meta = subjectMeta[subject.name] || {
            icon: <BookOpen className="h-6 w-6" />,
            color: 'blue' as const,
          }
          const chapterCount = subject.chapters?.length || 0
          const count = subject.chapters?.reduce((acc: number, ch: any) => acc + (ch.questions?.[0]?.count || 0), 0) || 0
          
          const solved = solvedBySubject[subject.id]?.size || 0
          const pct = count > 0 ? Math.round((solved / count) * 100) : 0
          
          const boxClass = meta.color === 'blue' ? 'icon-box-blue' :
                           meta.color === 'green' ? 'icon-box-green' :
                           'icon-box-orange'
          const bgFill = meta.color === 'blue' ? 'bg-[#1d4ed8]' :
                         meta.color === 'green' ? 'bg-[#065f46]' :
                         'bg-[#c2410c]'

          return (
            <Link key={subject.id} href={`/subjects/${subject.id}`} className="block group">
              <Card variant="white" className="h-full flex flex-col hover:border-[var(--color-primary)]">
                <div className="flex items-start justify-between mb-4">
                  <div className={`icon-box size-12 ${boxClass}`}>
                    {meta.icon}
                  </div>
                  <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[var(--color-primary)] transition-colors">
                    <ChevronRight className="h-4 w-4 text-muted group-hover:text-white" />
                  </div>
                </div>
                
                <div className="mt-auto">
                  <h3 className="text-2xl font-black text-foreground">{subject.name}</h3>
                  <p className="text-sm font-medium text-muted mt-1">{count} questions · {chapterCount} chapters</p>
                  
                  <div className="mt-5">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${bgFill} transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[11px] text-foreground font-bold">{pct}% complete</p>
                      <p className="text-[11px] text-muted-2 font-medium">{solved} solved</p>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
        {subjects?.length === 0 && (
          <Card variant="white" className="col-span-full py-16 text-center">
            <div className="size-16 rounded-2xl bg-slate-100 mx-auto mb-4 flex items-center justify-center text-2xl">
              📚
            </div>
            <p className="text-muted font-medium">No subjects found.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
