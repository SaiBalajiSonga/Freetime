import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  ClipboardList,
  GraduationCap,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
  ChevronRight,
} from 'lucide-react'
import { PageHeader, Card } from '@/components/site/dashboard-ui'

export const metadata = {
  title: 'Tests — JEE Practice',
  description: 'Start a custom test or a full JEE Mains mock exam.',
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function TestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let pastSessions: any[] = []
  if (user) {
    const { data } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    if (data) pastSessions = data
  }

  return (
    <div className="space-y-8 animate-in-up">
      {/* Page Header */}
      <PageHeader 
        title="Tests"
        subtitle="Choose a mode and start practising under exam conditions."
      />

      {/* Mode Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Custom Test Card */}
        <Link href="/tests/new" className="block group">
          <Card variant="white" className="h-full flex flex-col group-hover:border-cyan-400 group-hover:shadow-[0_8px_32px_rgba(6,182,212,0.15)]">
            <div className="flex items-start justify-between mb-4">
              <div className="size-12 rounded-2xl bg-cyan-50 flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-cyan-500" />
              </div>
              <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-cyan-500 transition-colors">
                <ChevronRight className="h-4 w-4 text-muted group-hover:text-white" />
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-foreground">Custom Test</h2>
              <p className="text-sm text-muted mt-1">Design your own exam with full control.</p>
            </div>
            
            <ul className="space-y-2.5 mt-5 mb-6">
              {[
                'Multi-subject & chapter filtering',
                'Difficulty control (Easy / Medium / Hard)',
                'Set question count and timer',
              ].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm font-medium text-muted-2">
                  <span className="size-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            
            <div className="mt-auto pt-4 border-t border-[var(--color-border)]">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-500">
                Start Custom Test <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Card>
        </Link>

        {/* JEE Mains Mock Card */}
        <Link href="/tests/jee" className="block group">
          <Card variant="white" className="h-full flex flex-col group-hover:border-amber-400 group-hover:shadow-[0_8px_32px_rgba(251,191,36,0.15)]">
            <div className="flex items-start justify-between mb-4">
              <div className="size-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-amber-500" />
              </div>
              <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                <ChevronRight className="h-4 w-4 text-muted group-hover:text-white" />
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-foreground">JEE Mains Mock</h2>
              <p className="text-sm text-muted mt-1">Full-length paper — official NTA interface.</p>
            </div>
            
            <ul className="space-y-2.5 mt-5 mb-6">
              {[
                '90 questions (30 Physics + 30 Chem + 30 Math)',
                '+4 / −1 marking scheme (MCQ)',
                '3-hour timed exam, 360 max marks',
              ].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm font-medium text-muted-2">
                  <span className="size-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            
            <div className="mt-auto pt-4 border-t border-[var(--color-border)]">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-500">
                Start JEE Mock <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Card>
        </Link>
      </div>

      {/* Past Sessions */}
      <div className="mt-10">
        <h2 className="text-xl font-bold text-foreground mb-4 tracking-tight">Recent Tests</h2>

        {pastSessions.length === 0 ? (
          <Card variant="white" className="py-12 text-center border-dashed">
            <div className="size-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-foreground font-bold mb-1">No tests yet</p>
            <p className="text-sm text-muted">Your completed and in-progress tests will appear here.</p>
          </Card>
        ) : (
          <Card variant="white" className="p-0 overflow-hidden">
            <div className="divide-y divide-[var(--color-border)]">
              {pastSessions.map(session => {
                const isInProgress = session.status === 'in_progress'
                const href = isInProgress
                  ? `/tests/${session.id}`
                  : `/tests/${session.id}/result`

                const pct = session.max_score
                  ? Math.round((session.score / session.max_score) * 100)
                  : null

                const scoreColor =
                  pct === null ? 'text-muted'
                    : pct >= 75 ? 'text-green-600'
                      : pct >= 50 ? 'text-amber-500'
                        : 'text-red-500'

                return (
                  <Link
                    key={session.id}
                    href={href}
                    className="group flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                  >
                    {/* Mode icon */}
                    <div className={`size-12 rounded-xl flex-shrink-0 flex items-center justify-center ${
                      session.mode === 'jee_mains'
                        ? 'bg-amber-50 text-amber-500'
                        : 'bg-cyan-50 text-cyan-500'
                    }`}>
                      {session.mode === 'jee_mains'
                        ? <GraduationCap className="h-6 w-6" />
                        : <ClipboardList className="h-6 w-6" />
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-sm text-foreground">
                          {session.mode === 'jee_mains' ? 'JEE Mains Mock' : 'Custom Test'}
                        </span>
                        {isInProgress ? (
                          <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 rounded-md px-2 py-0.5">
                            In Progress
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700 rounded-md px-2 py-0.5">
                            Submitted
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-medium text-muted">{formatDate(session.created_at)}</p>
                    </div>

                    {/* Stats */}
                    {!isInProgress && session.status === 'submitted' && (
                      <div className="hidden sm:flex items-center gap-4 text-xs font-medium">
                        <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {session.correct ?? 0}
                        </span>
                        <span className="flex items-center gap-1 text-red-500 bg-red-50 px-2 py-1 rounded-md">
                          <XCircle className="h-3.5 w-3.5" />
                          {session.incorrect ?? 0}
                        </span>
                        <span className="flex items-center gap-1 text-muted-2 bg-slate-100 px-2 py-1 rounded-md">
                          <MinusCircle className="h-3.5 w-3.5" />
                          {session.unattempted ?? 0}
                        </span>
                        {session.time_taken != null && (
                          <span className="flex items-center gap-1 text-muted-2">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDuration(session.time_taken)}
                          </span>
                        )}
                        <span className={`font-bold text-base ml-2 ${scoreColor}`}>
                          {session.score}/{session.max_score}
                        </span>
                      </div>
                    )}

                    {isInProgress && (
                      <span className="text-xs text-cyan-500 font-bold uppercase tracking-wider whitespace-nowrap">
                        Resume <ChevronRight className="h-3 w-3 inline" />
                      </span>
                    )}

                    <ChevronRight className="h-5 w-5 text-muted-2 flex-shrink-0 transition-transform group-hover:translate-x-1 sm:hidden" />
                  </Link>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
