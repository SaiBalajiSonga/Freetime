import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  FileQuestion,
  Archive,
  CalendarClock,
  FolderInput,
  Radio,
} from 'lucide-react'

export const metadata = {
  title: 'Dashboard — Admin',
  description: 'Admin overview: question stats, content health, scheduled exams.',
}

// ── Helper: status from dates ──────────────────────────────────────
function getStatus(startsAt: string, endsAt: string) {
  const now = new Date()
  const starts = new Date(startsAt)
  const ends = new Date(endsAt)
  if (now < starts) return 'upcoming'
  if (now > ends) return 'ended'
  return 'live'
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ── Stat card ─────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  accent,
  value,
  subtitle,
  label,
  pulse,
}: {
  icon: React.ElementType
  accent: string
  value: number | string
  subtitle: string
  label: string
  pulse?: boolean
}) {
  return (
    <div className="rounded-lg p-5 flex flex-col gap-3" style={{ background: '#161b27', border: '1px solid #2a3142' }}>
      <div className="flex items-start justify-between gap-3">
        <div
          className="size-9 rounded-md flex items-center justify-center shrink-0"
          style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
        >
          {pulse ? (
            <span className="relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full opacity-60" style={{ background: accent }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: accent }} />
            </span>
          ) : (
            <Icon className="h-4 w-4" style={{ color: accent }} />
          )}
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-white leading-none tabular-nums">{value}</p>
          <p className="text-[11px] mt-1" style={{ color: '#64748b' }}>{subtitle}</p>
        </div>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>{label}</p>
    </div>
  )
}

// ── Difficulty badge ───────────────────────────────────────────────
function DiffBadge({ diff }: { diff: string }) {
  const map: Record<string, string> = {
    easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    hard: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold capitalize border ${map[diff] ?? 'bg-white/5 text-[#64748b] border-white/10'}`}>
      {diff}
    </span>
  )
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // ── All data in parallel ─────────────────────────────────────────
  const [
    { count: totalCount },
    { count: thisWeekCount },
    { count: examBankCount },
    { count: mcqCount },
    { count: numCount },
    { count: easyCount },
    { count: medCount },
    { count: hardCount },
    { count: weeklyTotal },
    { count: liveCount },
    { data: upcomingExams },
    { data: recentQuestions },
    { count: examMcq },
    { count: examNum },
  ] = await Promise.all([
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('questions').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('visibility', 'exam'),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('type', 'mcq'),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('type', 'numerical'),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('difficulty', 'easy'),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('difficulty', 'medium'),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('difficulty', 'hard'),
    supabase.from('weekly_exams').select('*', { count: 'exact', head: true }),
    supabase.from('weekly_exams').select('*', { count: 'exact', head: true })
      .lte('starts_at', now).gte('ends_at', now),
    supabase.from('weekly_exams').select('id, title, starts_at, ends_at, question_ids, is_published')
      .gt('starts_at', now).order('starts_at', { ascending: true }).limit(3),
    supabase.from('questions').select(
      'id, statement, difficulty, type, chapters!inner(name, subjects!inner(name))'
    ).order('created_at', { ascending: false }).limit(5),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('visibility', 'exam').eq('type', 'mcq'),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('visibility', 'exam').eq('type', 'numerical'),
  ])

  const total = totalCount ?? 0
  const easy = easyCount ?? 0
  const med = medCount ?? 0
  const hard = hardCount ?? 0
  const easyPct = total > 0 ? Math.round((easy / total) * 100) : 0
  const medPct  = total > 0 ? Math.round((med  / total) * 100) : 0
  const hardPct = total > 0 ? Math.round((hard / total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Dashboard</h1>
        <p className="text-[13px] mt-0.5" style={{ color: '#64748b' }}>Overview of your question bank and exams</p>
      </div>

      {/* ── Zone 1: Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FileQuestion}
          accent="#3b82f6"
          value={(total).toLocaleString()}
          subtitle={`+${thisWeekCount ?? 0} this week`}
          label="Total Questions"
        />
        <StatCard
          icon={Archive}
          accent="#8b5cf6"
          value={(examBankCount ?? 0).toLocaleString()}
          subtitle={`${examMcq ?? 0} MCQ · ${examNum ?? 0} Num`}
          label="Exam Bank"
        />
        <StatCard
          icon={CalendarClock}
          accent="#f59e0b"
          value={(weeklyTotal ?? 0).toLocaleString()}
          subtitle={`${liveCount ?? 0} live now`}
          label="Weekly Exams"
        />
        <StatCard
          icon={Radio}
          accent="#10b981"
          value={(liveCount ?? 0).toLocaleString()}
          subtitle={`${(upcomingExams?.length ?? 0)} upcoming`}
          label="Live Right Now"
          pulse={true}
        />
      </div>

      {/* ── Zone 2: 5-col grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Left: 3/5 */}
        <div className="lg:col-span-3 flex flex-col gap-4">

          {/* Content Health */}
          <div className="rounded-lg overflow-hidden" style={{ background: '#161b27', border: '1px solid #2a3142' }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#1c2333', borderBottom: '1px solid #2a3142' }}>
              <div>
                <p className="text-sm font-bold text-white">Content Health</p>
                <p className="text-[11px]" style={{ color: '#64748b' }}>Difficulty &amp; type distribution</p>
              </div>
            </div>
            <div className="px-5 py-4 space-y-4">
              {/* Difficulty bars */}
              {[
                { label: 'Easy',   count: easy, pct: easyPct, color: '#10b981' },
                { label: 'Medium', count: med,  pct: medPct,  color: '#f59e0b' },
                { label: 'Hard',   count: hard, pct: hardPct, color: '#ef4444' },
              ].map(({ label, count, pct, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-[12px] font-semibold w-14 shrink-0" style={{ color: '#94a3b8' }}>{label}</span>
                  <div className="flex-1 rounded-sm h-2" style={{ background: '#1c2333' }}>
                    <div
                      className="h-2 rounded-sm transition-all"
                      style={{ width: `${pct}%`, background: `${color}99` }}
                    />
                  </div>
                  <span className="font-mono text-[11px] w-20 text-right shrink-0" style={{ color: '#64748b' }}>
                    {count.toLocaleString()} ({pct}%)
                  </span>
                </div>
              ))}

              <div className="border-t my-1" style={{ borderColor: '#2a3142' }} />

              {/* Type split */}
              <div className="flex items-center gap-4">
                <div className="flex-1 text-center">
                  <p className="text-2xl font-black text-white tabular-nums">{(mcqCount ?? 0).toLocaleString()}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: '#64748b' }}>MCQ</p>
                </div>
                <div className="w-px self-stretch" style={{ background: '#2a3142' }} />
                <div className="flex-1 text-center">
                  <p className="text-2xl font-black text-white tabular-nums">{(numCount ?? 0).toLocaleString()}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: '#64748b' }}>Numerical</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Questions */}
          <div className="rounded-lg overflow-hidden" style={{ background: '#161b27', border: '1px solid #2a3142' }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#1c2333', borderBottom: '1px solid #2a3142' }}>
              <p className="text-sm font-bold text-white">Recent Questions</p>
              <Link href="/admin" className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-[#1e2536]">
              {(recentQuestions ?? []).map((q: any, idx: number) => (
                <div
                  key={q.id}
                  className="flex items-start gap-3 px-5 py-3 hover:bg-[#1a2035] transition-colors"
                  style={{ borderBottom: idx < (recentQuestions?.length ?? 0) - 1 ? '1px solid #1e2536' : 'none' }}
                >
                  <span className="font-mono text-[10px] w-6 shrink-0 pt-0.5" style={{ color: '#64748b' }}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white line-clamp-1">
                      {q.statement.slice(0, 90)}{q.statement.length > 90 ? '…' : ''}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#64748b' }}>
                      {(q.chapters as any)?.subjects?.name ?? '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <DiffBadge diff={q.difficulty} />
                    <Link href={`/admin/questions/${q.id}/edit`} className="text-[11px] text-blue-400 hover:underline">
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
              {(recentQuestions?.length ?? 0) === 0 && (
                <div className="px-5 py-8 text-center text-sm" style={{ color: '#64748b' }}>
                  No questions yet. <Link href="/admin/questions/new" className="text-blue-400 hover:underline">Add one →</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: 2/5 */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Quick Actions */}
          <div className="rounded-lg overflow-hidden" style={{ background: '#161b27', border: '1px solid #2a3142' }}>
            <div className="px-5 py-3" style={{ background: '#1c2333', borderBottom: '1px solid #2a3142' }}>
              <p className="text-sm font-bold text-white">Quick Actions</p>
            </div>
            <div className="p-3 space-y-2">
              {[
                {
                  href: '/admin/questions/new',
                  icon: FileQuestion,
                  iconColor: '#60a5fa',
                  title: 'Add Question',
                  sub: 'Add a new PYQ or exam question',
                },
                {
                  href: '/admin/import',
                  icon: FolderInput,
                  iconColor: '#38bdf8',
                  title: 'Bulk Import',
                  sub: 'Upload a JSON file of questions',
                },
                {
                  href: '/admin/weekly-exams/new',
                  icon: CalendarClock,
                  iconColor: '#fbbf24',
                  title: 'Create Weekly Exam',
                  sub: 'Schedule a new timed exam',
                },
              ].map(({ href, icon: Icon, iconColor, title, sub }) => (
                <Link
                  key={href}
                  href={href}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all text-left group"
                  style={{
                    background: '#1c2333',
                    border: '1px solid #2a3142',
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0" style={{ color: iconColor }} />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-white group-hover:text-blue-300 transition-colors">{title}</p>
                    <p className="text-[11px]" style={{ color: '#64748b' }}>{sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Scheduled Exams */}
          <div className="rounded-lg overflow-hidden" style={{ background: '#161b27', border: '1px solid #2a3142' }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#1c2333', borderBottom: '1px solid #2a3142' }}>
              <p className="text-sm font-bold text-white">Scheduled Exams</p>
              <Link href="/admin/weekly-exams" className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors">
                View all →
              </Link>
            </div>
            {(upcomingExams?.length ?? 0) === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: '#64748b' }}>No upcoming exams</p>
                <Link href="/admin/weekly-exams/new" className="text-[12px] text-amber-400 hover:underline mt-1 inline-block">
                  Create one →
                </Link>
              </div>
            ) : (
              <div>
                {(upcomingExams ?? []).map((exam: any, idx: number) => {
                  const status = getStatus(exam.starts_at, exam.ends_at)
                  const statusMap: Record<string, React.ReactNode> = {
                    live: (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">Live</span>
                    ),
                    upcoming: (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">Upcoming</span>
                    ),
                    ended: (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold line-through" style={{ background: '#1c2333', color: '#64748b' }}>Ended</span>
                    ),
                  }
                  return (
                    <div
                      key={exam.id}
                      className="px-4 py-3 flex items-center justify-between"
                      style={{ borderBottom: idx < (upcomingExams?.length ?? 0) - 1 ? '1px solid #1e2536' : 'none' }}
                    >
                      <div className="min-w-0 mr-3">
                        <p className="font-medium text-sm text-white line-clamp-1">{exam.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {statusMap[status]}
                          <span className="text-[10px]" style={{ color: '#64748b' }}>{fmtDate(exam.starts_at)}</span>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] shrink-0" style={{ color: '#64748b' }}>
                        {(exam.question_ids as string[]).length} Qs
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
