import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

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

  const subjectMeta: Record<string, { icon: string; gradient: string; accent: string; arrowHover: string; glow: string }> = {
    Physics: {
      icon: '⚡',
      gradient: 'from-blue-500/20 to-accent-blue/10 border-accent-electric/25',
      accent: 'text-accent-electric',
      arrowHover: 'group-hover:text-accent-electric',
      glow: 'group-hover:shadow-[0_0_40px_-12px_rgba(59,130,246,0.35)]',
    },
    Chemistry: {
      icon: '🧪',
      gradient: 'from-amber-500/20 to-amber-600/10 border-amber-400/25',
      accent: 'text-amber-400',
      arrowHover: 'group-hover:text-amber-400',
      glow: 'group-hover:shadow-[0_0_40px_-12px_rgba(251,191,36,0.25)]',
    },
    Mathematics: {
      icon: '📐',
      gradient: 'from-emerald-500/20 to-emerald-600/10 border-emerald-400/25',
      accent: 'text-emerald-400',
      arrowHover: 'group-hover:text-emerald-400',
      glow: 'group-hover:shadow-[0_0_40px_-12px_rgba(52,211,153,0.25)]',
    },
  }

  return (
    <div className="space-y-10 animate-in-up">
      <div>
        <p className="section-label mb-2">Library</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-[-0.03em]">
          <span className="text-gradient">Subjects</span>
        </h1>
        <p className="text-sm text-muted mt-2 max-w-lg">Choose a track — each card opens chapters and every question stays one click away.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {subjects?.map(subject => {
          const meta = subjectMeta[subject.name] || {
            icon: '📚',
            gradient: 'from-accent-electric/20 to-accent-blue/10 border-accent-electric/25',
            accent: 'text-accent-electric',
            arrowHover: 'group-hover:text-accent-electric',
            glow: 'group-hover:shadow-[0_0_40px_-12px_rgba(59,130,246,0.35)]',
          }
          const count = subjectCounts[subject.id] || 0

          return (
            <Link key={subject.id} href={`/subjects/${subject.id}`}>
              <div className={`rounded-2xl surface-glass p-6 h-full group transition-all duration-300 card-hover-lift relative overflow-hidden ${meta.glow}`}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-electric/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-start justify-between mb-5">
                  <div className={`size-14 rounded-2xl bg-gradient-to-br ${meta.gradient} border flex items-center justify-center text-3xl group-hover:scale-105 transition-transform duration-300`}>
                    {meta.icon}
                  </div>
                  <svg
                    className={`w-5 h-5 text-muted-2 transition-all duration-200 group-hover:translate-x-0.5 mt-1 ${meta.arrowHover}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className={`font-bold text-xl text-foreground ${meta.accent}`}>{subject.name}</h3>
                <p className="text-sm text-muted mt-1.5">{count} questions available</p>
                <div className="mt-5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-surface-2 rounded-full overflow-hidden border border-white/[0.06]">
                    <div className="h-full bg-gradient-primary rounded-full w-0 group-hover:w-[8%] transition-all duration-700 shadow-[0_0_12px_rgba(59,130,246,0.35)]" />
                  </div>
                  <span className={`text-[11px] font-semibold ${meta.accent}`}>Open →</span>
                </div>
              </div>
            </Link>
          )
        })}
        {subjects?.length === 0 && (
          <div className="col-span-full py-16 text-center rounded-2xl surface-glass border border-white/[0.06]">
            <div className="size-16 rounded-2xl icon-3d mx-auto mb-4 flex items-center justify-center text-2xl border border-white/[0.08]">
              📚
            </div>
            <p className="text-muted font-medium">No subjects found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
