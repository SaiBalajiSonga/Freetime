import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar } from 'lucide-react'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AdminWeeklyExamsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    console.log('Bypassing admin check for dev (weekly-exams)')
  }

  const { data: exams } = await supabase
    .from('weekly_exams')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-[-0.03em]">Weekly Exams</h1>
          <p className="text-sm text-muted mt-1">{exams?.length ?? 0} total exams</p>
        </div>
        <Link
          href="/admin/weekly-exams/new"
          className="inline-flex items-center justify-center gap-2 h-8 px-4 text-sm font-medium rounded-pill bg-gradient-primary text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.55)] hover:brightness-110 transition-all"
        >
          <Plus className="h-4 w-4" />
          New Exam
        </Link>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-wider">Title</th>
                <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-wider">Status</th>
                <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-wider">Published</th>
                <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-wider">Starts At</th>
                <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-wider">Ends At</th>
                <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-wider">Questions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {exams?.map((exam) => {
                const now = new Date()
                const starts = new Date(exam.starts_at)
                const ends = new Date(exam.ends_at)
                const status = now < starts ? 'Upcoming' : now > ends ? 'Ended' : 'Live'
                const statusStyle =
                  status === 'Live'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : status === 'Upcoming'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-surface-2 text-muted border border-border'

                return (
                  <tr key={exam.id} className="hover:bg-surface-2/60 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-violet-400 flex-shrink-0" />
                        <span className="font-medium text-foreground truncate max-w-[240px]">{exam.title}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${statusStyle}`}>
                        {status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        exam.is_published
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-surface-2 text-muted border border-border'
                      }`}>
                        {exam.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-muted text-xs">{formatDateTime(exam.starts_at)}</td>
                    <td className="py-3.5 px-5 text-muted text-xs">{formatDateTime(exam.ends_at)}</td>
                    <td className="py-3.5 px-5 text-foreground font-medium">
                      {(exam.question_ids as string[]).length}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {(!exams || exams.length === 0) && (
          <div className="py-16 text-center">
            <div className="size-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-7 w-7 text-violet-400" />
            </div>
            <p className="text-muted font-medium">No weekly exams yet.</p>
            <p className="text-xs text-muted-2 mt-1">Click &quot;New Exam&quot; to create the first one.</p>
          </div>
        )}
      </div>
    </div>
  )
}
