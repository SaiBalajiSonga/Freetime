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
  upcoming: { label: 'UPCOMING', cls: 'bg-blue-500 text-white' },
  active:   { label: 'LIVE NOW', cls: 'bg-green-500 text-white' },
  attempted:{ label: 'COMPLETED', cls: 'bg-gray-500 text-white' },
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
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.1)] hover:border-slate-300/80">
      <div className="p-4 sm:p-5 flex flex-col gap-4">
        
        {/* Top Header: Icon + Title + Badge */}
        <div className="flex items-start justify-between gap-4">
          
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div className="size-16 rounded-lg bg-[#B09EFF] flex items-center justify-center shadow-sm">
                <ClipboardList className="h-7 w-7 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <h3 className="font-bold text-slate-800 text-[16px] leading-tight mb-1.5 truncate">{exam.title}</h3>
              <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 text-[12px] text-slate-500">
                <span className="font-medium text-slate-600">{qCount} Qs</span>
                <span className="text-slate-300">•</span>
                <span className="font-medium text-slate-600">{exam.duration_minutes} Mins</span>
                <span className="text-slate-300">•</span>
                <span className="font-medium text-slate-600">{maxMarks} Marks</span>
                
                {exam.status === 'attempted' && exam.session && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="font-bold text-violet-600">Score: {exam.session.score}/{exam.session.max_score}</span>
                  </>
                )}
                {exam.status === 'upcoming' && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="font-bold text-amber-600">{countdown(exam.starts_at)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <span className={`flex-shrink-0 text-[11px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-sm leading-none ${cls}`}>
            {label}
          </span>
        </div>

        {/* Date Boxes */}
        <div className="flex gap-3 max-w-[500px]">
          <div className="flex-1 bg-slate-50/50 rounded-lg border border-slate-100 flex flex-col overflow-hidden">
            <span className="text-[10px] text-center text-slate-500 py-1.5 bg-slate-50 border-b border-slate-100">Scheduled From</span>
            <span className="text-[11px] text-center text-slate-700 font-medium py-2 flex items-center justify-center gap-1.5 whitespace-nowrap">
              <Calendar className="h-3.5 w-3.5 text-amber-500" /> {fmtDate(exam.starts_at)} <Clock className="h-3.5 w-3.5 text-amber-500 ml-0.5" /> {fmtTime(exam.starts_at)}
            </span>
          </div>
          <div className="flex-1 bg-slate-50/50 rounded-lg border border-slate-100 flex flex-col overflow-hidden">
            <span className="text-[10px] text-center text-slate-500 py-1.5 bg-slate-50 border-b border-slate-100">Till</span>
            <span className="text-[11px] text-center text-slate-700 font-medium py-2 flex items-center justify-center gap-1.5 whitespace-nowrap">
              <Calendar className="h-3.5 w-3.5 text-amber-500" /> {fmtDate(exam.ends_at)} <Clock className="h-3.5 w-3.5 text-amber-500 ml-0.5" /> {fmtTime(exam.ends_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Action row (Aligned under the date blocks) */}
      <div className="border-t border-slate-100 bg-white flex items-center">
        <div className="max-w-[500px] w-full flex">
          <div className="flex-1 flex justify-center py-4">
            {exam.status === 'active' && <CompactStartButton examId={exam.id} />}
            {exam.status === 'upcoming' && <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest cursor-not-allowed">Not Started</span>}
            {exam.status === 'attempted' && exam.session && (
              <Link href={`/tests/${exam.session.id}/result`} className="text-[12px] font-bold text-[#0066FF] hover:text-blue-700 transition-colors uppercase tracking-widest">
                View Result
              </Link>
            )}
            {exam.status === 'missed' && <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest cursor-not-allowed">Test Expired</span>}
          </div>
          <div className="flex-1 flex justify-center py-4">
            <Link href={`/exams/${exam.id}`} className="text-[12px] font-bold text-[#0066FF] hover:text-blue-700 transition-colors uppercase tracking-widest">
              View Details
            </Link>
          </div>
        </div>
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
