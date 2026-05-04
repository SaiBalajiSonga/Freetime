import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type React from 'react'
import { Atom, BookOpen, FlaskConical, Sigma } from 'lucide-react'
import { Card, SectionHeader } from '@/components/site/dashboard-ui'

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
    return <div className="text-red-400">Error loading subjects: {error.message}</div>
  }

  const subjectMeta: Record<string, { icon: React.ReactNode; tone: 'blue' | 'green' | 'yellow' }> = {
    Physics: {
      icon: <Atom className="h-6 w-6" />,
      tone: 'blue',
    },
    Chemistry: {
      icon: <FlaskConical className="h-6 w-6" />,
      tone: 'yellow',
    },
    Mathematics: {
      icon: <Sigma className="h-6 w-6" />,
      tone: 'green',
    },
  }

  return (
    <div className="space-y-10 animate-in-up">
      <SectionHeader
        label="Library"
        title="Subjects"
        subtitle="Choose a subject to dive into chapters and questions with a single tap."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {subjects?.map(subject => {
          const meta = subjectMeta[subject.name] || {
            icon: <BookOpen className="h-6 w-6" />,
            tone: 'blue' as const,
          }
          const count = subjectCounts[subject.id] || 0

          return (
            <Link key={subject.id} href={`/subjects/${subject.id}`} className="block">
              <Card variant="colored" tone={meta.tone} className="h-full">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white">
                      {meta.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{subject.name}</h3>
                      <p className="text-sm text-white/70">{count} questions</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-white/80">Open →</span>
                </div>
                <div className="mt-6">
                  <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
                    <div className="h-full rounded-full bg-white/80 w-[12%]" />
                  </div>
                  <p className="text-[11px] text-white/70 mt-3">Tap to see chapters and progress</p>
                </div>
              </Card>
            </Link>
          )
        })}
        {subjects?.length === 0 && (
          <Card variant="dark" className="col-span-full py-16 text-center">
            <div className="size-16 rounded-2xl icon-3d mx-auto mb-4 flex items-center justify-center text-2xl border border-white/[0.08]">
              📚
            </div>
            <p className="text-muted font-medium">No subjects found.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
