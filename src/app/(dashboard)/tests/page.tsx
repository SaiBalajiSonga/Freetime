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
    <div className="space-y-10 animate-in-up">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gradient mb-1">Tests</h1>
        <p className="text-muted text-sm">Choose a mode and start practising under exam conditions.</p>
      </div>

      {/* Mode Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Custom Test Card */}
        <Link
          href="/tests/new"
          className="group relative flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 transition-all hover:border-accent-cyan/50 hover:shadow-[0_0_32px_-8px_rgba(34,211,238,0.15)]"
        >
          <div className="flex items-start justify-between">
            <div className="size-12 rounded-2xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-accent-cyan" />
            </div>
            <ChevronRight className="h-5 w-5 text-muted-2 transition-transform group-hover:translate-x-1" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Custom Test</h2>
            <p className="text-sm text-muted mt-1">Design your own exam with full control.</p>
          </div>
          <ul className="space-y-2 mt-1">
            {[
              'Multi-subject & chapter filtering',
              'Difficulty control (Easy / Medium / Hard)',
              'Set question count and timer',
            ].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-2">
                <span className="size-1.5 rounded-full bg-accent-cyan flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-cyan">
              Start Custom Test <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>

        {/* JEE Mains Mock Card */}
        <Link
          href="/tests/jee"
          className="group relative flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 transition-all hover:border-amber-400/50 hover:shadow-[0_0_32px_-8px_rgba(251,191,36,0.15)]"
        >
          <div className="flex items-start justify-between">
            <div className="size-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-amber-400" />
            </div>
            <ChevronRight className="h-5 w-5 text-muted-2 transition-transform group-hover:translate-x-1" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">JEE Mains Mock</h2>
            <p className="text-sm text-muted mt-1">Full-length paper — official NTA interface.</p>
          </div>
          <ul className="space-y-2 mt-1">
            {[
              '90 questions (30 Physics + 30 Chem + 30 Math)',
              '+4 / −1 marking scheme (MCQ)',
              '3-hour timed exam, 360 max marks',
            ].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-2">
                <span className="size-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400">
              Start JEE Mock <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>
      </div>

      {/* Past Sessions */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Recent Tests</h2>

        {pastSessions.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-10 text-center">
            <div className="size-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="h-7 w-7 text-muted-2" />
            </div>
            <p className="text-foreground font-semibold mb-1">No tests yet</p>
            <p className="text-sm text-muted">Your completed and in-progress tests will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
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
                  : pct >= 75 ? 'text-emerald-400'
                    : pct >= 50 ? 'text-amber-400'
                      : 'text-red-400'

              return (
                <Link
                  key={session.id}
                  href={href}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-all hover:border-border-strong hover:bg-surface-2"
                >
                  {/* Mode icon */}
                  <div className={`size-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
                    session.mode === 'jee_mains'
                      ? 'bg-amber-400/10 border border-amber-400/20'
                      : 'bg-accent-cyan/10 border border-accent-cyan/20'
                  }`}>
                    {session.mode === 'jee_mains'
                      ? <GraduationCap className="h-5 w-5 text-amber-400" />
                      : <ClipboardList className="h-5 w-5 text-accent-cyan" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">
                        {session.mode === 'jee_mains' ? 'JEE Mains Mock' : 'Custom Test'}
                      </span>
                      {isInProgress ? (
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-400/15 text-amber-400 border border-amber-400/20 rounded-full px-2 py-0.5">
                          In Progress
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-emerald-400/15 text-emerald-400 border border-emerald-400/20 rounded-full px-2 py-0.5">
                          Submitted
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5">{formatDate(session.created_at)}</p>
                  </div>

                  {/* Stats */}
                  {!isInProgress && session.status === 'submitted' && (
                    <div className="hidden sm:flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {session.correct ?? 0}
                      </span>
                      <span className="flex items-center gap-1 text-red-400">
                        <XCircle className="h-3.5 w-3.5" />
                        {session.incorrect ?? 0}
                      </span>
                      <span className="flex items-center gap-1 text-muted">
                        <MinusCircle className="h-3.5 w-3.5" />
                        {session.unattempted ?? 0}
                      </span>
                      {session.time_taken != null && (
                        <span className="flex items-center gap-1 text-muted">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDuration(session.time_taken)}
                        </span>
                      )}
                      <span className={`font-bold text-sm ${scoreColor}`}>
                        {session.score}/{session.max_score}
                      </span>
                    </div>
                  )}

                  {isInProgress && (
                    <span className="text-xs text-accent-cyan font-medium whitespace-nowrap">
                      Resume →
                    </span>
                  )}

                  <ChevronRight className="h-4 w-4 text-muted-2 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
