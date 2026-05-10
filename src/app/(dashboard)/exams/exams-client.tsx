'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Calendar, Clock, BookOpen, Trophy, ClipboardList, Loader2 } from 'lucide-react'
import { createWeeklyExamSession } from '@/app/(dashboard)/tests/actions'

type ExamItem = {
  id: string
  title: string
  description: string
  starts_at: string
  ends_at: string
  duration_minutes: number
  question_ids: string[]
  status: 'upcoming' | 'active' | 'attempted' | 'missed'
  session: { id: string; status: string; score: number; max_score: number } | null
}

type Tab = 'upcoming' | 'active' | 'attempted' | 'missed'

const TABS: { key: Tab; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'active', label: 'Active' },
  { key: 'attempted', label: 'Attempted' },
  { key: 'missed', label: 'Missed' },
]

// ── Formatting helpers ──────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).toUpperCase()
}

function fmtGroupDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function groupByDate(exams: ExamItem[]) {
  const map: Record<string, ExamItem[]> = {}
  for (const e of exams) {
    const key = fmtGroupDate(e.starts_at)
    if (!map[key]) map[key] = []
    map[key].push(e)
  }
  return Object.entries(map)
}

// ── Badge ───────────────────────────────────────────────────────────────────
const badgeCfg: Record<Tab, { label: string; cls: string }> = {
  upcoming: { label: 'UPCOMING', cls: 'bg-cyan-500 text-white' },
  active:   { label: 'LIVE NOW', cls: 'bg-emerald-500 text-white' },
  attempted:{ label: 'ATTEMPTED', cls: 'bg-violet-500 text-white' },
  missed:   { label: 'MISSED', cls: 'bg-slate-400 text-white' },
}

// ── Countdown ────────────────────────────────────────────────────────────────
function countdown(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return 'Starting now'
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (d > 0) return `Starts in ${d}d ${h}h`
  if (h > 0) return `Starts in ${h}h ${m}m`
  return `Starts in ${m}m`
}

// ── Main component ──────────────────────────────────────────────────────────
export default function ExamsClient({ exams }: { exams: ExamItem[] }) {
  const [activeTab, setActiveTab] = useState<Tab>('upcoming')

  const counts: Record<Tab, number> = {
    upcoming: exams.filter(e => e.status === 'upcoming').length,
    active:   exams.filter(e => e.status === 'active').length,
    attempted:exams.filter(e => e.status === 'attempted').length,
    missed:   exams.filter(e => e.status === 'missed').length,
  }

  const filtered = exams.filter(e => e.status === activeTab)
  const grouped = groupByDate(filtered)

  return (
    <div className="animate-in-up space-y-0">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Scheduled Tests</h1>
          <p className="text-sm text-muted mt-0.5">Exams set by your instructor — one attempt per window.</p>
        </div>
        {/* Decorative icon */}
        <div className="hidden sm:flex size-16 rounded-2xl bg-cyan-50 items-center justify-center">
          <ClipboardList className="h-8 w-8 text-cyan-400" />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-[var(--color-border)] mb-6">
        <div className="flex gap-0">
          {TABS.map(tab => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-5 py-3 text-sm font-semibold transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-[var(--color-primary)]'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {tab.label}
                {counts[tab.key] > 0 && (
                  <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'bg-slate-100 text-muted'
                  }`}>
                    {counts[tab.key]}
                  </span>
                )}
                {/* Active underline */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[var(--color-primary)] rounded-t-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white py-16 text-center">
          <div className="size-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-7 w-7 text-slate-300" />
          </div>
          <p className="font-bold text-foreground mb-1">
            {activeTab === 'upcoming' && 'No upcoming exams'}
            {activeTab === 'active' && 'No live exams right now'}
            {activeTab === 'attempted' && "You haven't attempted any exams yet"}
            {activeTab === 'missed' && "You haven't missed any exams"}
          </p>
          <p className="text-sm text-muted">Check back later or switch tabs.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([dateLabel, dayExams]) => (
            <div key={dateLabel}>
              {/* Date row */}
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-sm font-semibold text-muted">{dateLabel}</span>
                <span className="text-xs text-muted">Total Tests — {dayExams.length}</span>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {dayExams.map(exam => (
                  <ExamCard key={exam.id} exam={exam} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Exam Card ────────────────────────────────────────────────────────────────
function ExamCard({ exam }: { exam: ExamItem }) {
  const { label, cls } = badgeCfg[exam.status]
  const qCount = exam.question_ids.length
  const maxMarks = qCount * 4

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm overflow-hidden">
      {/* Top section */}
      <div className="p-4 flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 relative">
          <div className="size-14 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-[0_4px_12px_rgba(139,92,246,0.35)]">
            <ClipboardList className="h-7 w-7 text-white" />
          </div>
          {/* Badge */}
          <span className={`absolute -top-2 -left-1 text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded ${cls}`}>
            {label}
          </span>
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-base leading-snug mb-1">{exam.title}</h3>
          <div className="flex items-center gap-3 text-xs text-muted flex-wrap">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {qCount} Qs
            </span>
            <span className="text-muted-2">•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {exam.duration_minutes} Mins
            </span>
            <span className="text-muted-2">•</span>
            <span className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              {maxMarks} Marks
            </span>
          </div>

          {/* Score (if attempted) */}
          {exam.status === 'attempted' && exam.session && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-2.5 py-1">
              <Trophy className="h-3 w-3" />
              Score: {exam.session.score}/{exam.session.max_score}
            </div>
          )}

          {/* Countdown (if upcoming) */}
          {exam.status === 'upcoming' && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
              <Clock className="h-3 w-3" />
              {countdown(exam.starts_at)}
            </div>
          )}
        </div>
      </div>

      {/* From / Till */}
      <div className="grid grid-cols-2 border-t border-[var(--color-border)]">
        <div className="px-4 py-3 border-r border-[var(--color-border)]">
          <p className="text-[10px] text-muted uppercase tracking-wider font-medium mb-1.5">Scheduled From</p>
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <Calendar className="h-3.5 w-3.5 text-violet-400" />
              {fmtDate(exam.starts_at)}
            </span>
            <span className="flex items-center gap-1.5 text-muted font-medium">
              <Clock className="h-3.5 w-3.5 text-violet-400" />
              {fmtTime(exam.starts_at)}
            </span>
          </div>
        </div>
        <div className="px-4 py-3">
          <p className="text-[10px] text-muted uppercase tracking-wider font-medium mb-1.5">Till</p>
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <Calendar className="h-3.5 w-3.5 text-violet-400" />
              {fmtDate(exam.ends_at)}
            </span>
            <span className="flex items-center gap-1.5 text-muted font-medium">
              <Clock className="h-3.5 w-3.5 text-violet-400" />
              {fmtTime(exam.ends_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Action row */}
      <div className="border-t border-[var(--color-border)] px-4 py-3 flex items-center justify-between bg-slate-50/60">
        {exam.status === 'active' && (
          <>
            <Link
              href={`/exams/${exam.id}`}
              className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-primary)] hover:opacity-80 transition-opacity"
            >
              View Details
            </Link>
            <CompactStartButton examId={exam.id} />
          </>
        )}

        {exam.status === 'upcoming' && (
          <>
            <Link
              href={`/exams/${exam.id}`}
              className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-primary)] hover:opacity-80 transition-opacity"
            >
              View Details
            </Link>
            <span className="text-sm font-extrabold uppercase tracking-wide text-slate-400 cursor-not-allowed">
              Not Started
            </span>
          </>
        )}

        {exam.status === 'attempted' && exam.session && (
          <>
            <Link
              href={`/exams/${exam.id}`}
              className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-primary)] hover:opacity-80 transition-opacity"
            >
              View Details
            </Link>
            <Link
              href={`/tests/${exam.session.id}/result`}
              className="text-sm font-extrabold uppercase tracking-wide text-emerald-600 hover:opacity-80 transition-opacity"
            >
              View Result
            </Link>
          </>
        )}

        {exam.status === 'missed' && (
          <>
            <Link
              href={`/exams/${exam.id}`}
              className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-primary)] hover:opacity-80 transition-opacity"
            >
              View Details
            </Link>
            <span className="text-sm font-extrabold uppercase tracking-wide text-slate-400">
              Expired
            </span>
          </>
        )}
      </div>
    </div>
  )
}

// ── Compact inline start button ─────────────────────────────────────────────
function CompactStartButton({ examId }: { examId: string }) {
  const [isPending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  function handleStart() {
    setErr(null)
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {})
    }
    startTransition(async () => {
      const result = await createWeeklyExamSession(examId)
      if (result?.error) setErr(result.error)
    })
  }

  return (
    <div>
      {err && <p className="text-xs text-red-400 mb-1">{err}</p>}
      <button
        type="button"
        onClick={handleStart}
        disabled={isPending}
        className="text-sm font-extrabold uppercase tracking-wide text-emerald-600 hover:opacity-80 transition-opacity disabled:opacity-40"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin inline" /> : 'Start Exam'}
      </button>
    </div>
  )
}
