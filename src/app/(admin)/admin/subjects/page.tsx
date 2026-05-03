import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AdminNav } from '../admin-nav'
import { DeleteSubjectButton } from '../questions/delete-buttons'

export default async function AdminSubjectsPage() {
  const supabase = await createClient()

  const { data: subjects, error } = await supabase
    .from('subjects')
    .select('*')
    .order('name')

  const { data: allQuestions } = await supabase
    .from('questions')
    .select('id, chapters(subject_id)')

  const subjectCounts: Record<string, number> = {}
  allQuestions?.forEach(q => {
    // @ts-ignore
    const sid = q.chapters?.subject_id
    if (sid) subjectCounts[sid] = (subjectCounts[sid] || 0) + 1
  })

  if (error) {
    return <div className="text-red-400">Error loading subjects: {error.message}</div>
  }

  const subjectMeta: Record<string, { icon: string; accentColor: string }> = {
    'Physics':     { icon: '⚡', accentColor: 'text-accent-cyan' },
    'Chemistry':   { icon: '🧪', accentColor: 'text-amber-400' },
    'Mathematics': { icon: '📐', accentColor: 'text-emerald-400' },
  }

  return (
    <div className="space-y-6">
      <AdminNav />

      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-[-0.03em]">Subjects</h1>
        <p className="text-sm text-muted mt-1">Manage subjects and their chapters.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {subjects?.map((subject) => {
          const meta = subjectMeta[subject.name] || { icon: '📚', accentColor: 'text-accent-cyan' }
          const count = subjectCounts[subject.id] || 0

          return (
            <div key={subject.id} className="rounded-2xl border border-border bg-surface hover:bg-surface-2 hover:border-border-strong p-6 h-full group transition-all duration-300 relative overflow-hidden flex flex-col">
              <Link href={`/admin/subjects/${subject.id}`} className="absolute inset-0 z-0" />
              {/* Top gradient line on hover */}
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-start justify-between relative z-10">
                <div className="size-12 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {meta.icon}
                </div>
                <svg className={`w-5 h-5 text-muted-2 group-hover:${meta.accentColor} transition-colors group-hover:translate-x-1 duration-200`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              
              <h3 className="font-bold text-lg text-foreground mt-5 relative z-10">{subject.name}</h3>
              <p className="text-sm text-muted mt-1 relative z-10">{count} Questions total</p>
              
              <div className="mt-auto pt-6 flex justify-end relative z-10">
                <DeleteSubjectButton subjectId={subject.id} subjectName={subject.name} count={count} />
              </div>
            </div>
          )
        })}
        {subjects?.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <div className="size-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <p className="text-muted font-medium">No subjects found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
