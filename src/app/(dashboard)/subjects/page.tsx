import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type React from 'react'
import { Atom, BookOpen, FlaskConical, Sigma, ChevronRight } from 'lucide-react'
import { Card, PageHeader } from '@/components/site/dashboard-ui'

export default async function SubjectsPage() {
  const supabase = await createClient()

  const { data: subjects, error } = await supabase.from('subjects').select('*').order('name')

  const { data: allQuestions } = await supabase.from('questions').select('id, chapters(subject_id)')

  const subjectCounts: Record<string, number> = {}
  allQuestions?.forEach(q => {
    // @ts-expect-error Supabase joined type doesn't include subject_id
    const sid = q.chapters?.subject_id
    if (sid) subjectCounts[sid] = (subjectCounts[sid] || 0) + 1
  })

  if (error) {
    return <div className="text-red-500">Error loading subjects: {error.message}</div>
  }

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
        title="Learn"
        subtitle="Choose a subject to dive into chapters and practice questions."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {subjects?.map(subject => {
          const meta = subjectMeta[subject.name] || {
            icon: <BookOpen className="h-6 w-6" />,
            color: 'blue' as const,
          }
          const count = subjectCounts[subject.id] || 0
          
          const boxClass = meta.color === 'blue' ? 'icon-box-blue' :
                           meta.color === 'green' ? 'icon-box-green' :
                           'icon-box-orange'

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
                  <h3 className="text-xl font-bold text-foreground">{subject.name}</h3>
                  <p className="text-sm text-muted mt-1">{count} questions available</p>
                  
                  <div className="mt-5">
                    <div className="progress-track">
                      <div className="progress-fill w-[12%]" />
                    </div>
                    <p className="text-[11px] text-muted-2 mt-2 font-medium uppercase tracking-wider">
                      Tap to view chapters
                    </p>
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
