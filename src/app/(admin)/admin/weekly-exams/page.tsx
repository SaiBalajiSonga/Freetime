'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { Plus, CalendarClock, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toggleExamPublished, deleteWeeklyExam } from './actions'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function getStatus(startsAt: string, endsAt: string) {
  const now = new Date()
  const starts = new Date(startsAt)
  const ends = new Date(endsAt)
  if (now < starts) return 'upcoming'
  if (now > ends) return 'ended'
  return 'live'
}

function useCountdown(startsAt: string) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    function calc() {
      const diff = new Date(startsAt).getTime() - Date.now()
      if (diff <= 0) { setLabel(''); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setLabel(`Starts in ${h > 0 ? `${h}h ` : ''}${m}m`)
    }
    calc()
    const id = setInterval(calc, 30000)
    return () => clearInterval(id)
  }, [startsAt])
  return label
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'live') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold bg-emerald-600 text-white">
      <span className="live-dot h-1.5 w-1.5 rounded-full bg-white inline-block" />
      Live
    </span>
  )
  if (status === 'upcoming') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
      Upcoming
    </span>
  )
  return (
    <span className="px-2.5 py-1 rounded text-[11px] font-bold line-through"
      style={{ background: '#1c2333', color: '#64748b', border: '1px solid #2a3142' }}
    >
      Ended
    </span>
  )
}

function ExamRow({ exam, onDelete, onTogglePublish }: {
  exam: any
  onDelete: (id: string) => void
  onTogglePublish: (id: string, published: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const status = getStatus(exam.starts_at, exam.ends_at)
  const countdown = useCountdown(exam.starts_at)

  return (
    <>
      <tr className="transition-colors hover:bg-[#1a2035]" style={{ borderBottom: '1px solid #1e2536' }}>
        <td className="py-3.5 px-5">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="font-medium text-white truncate max-w-[220px]">{exam.title}</span>
          </div>
        </td>
        <td className="py-3.5 px-5">
          <StatusBadge status={status} />
          {status === 'upcoming' && countdown && (
            <span className="ml-2 text-[10px]" style={{ color: '#64748b' }}>{countdown}</span>
          )}
        </td>
        <td className="py-3.5 px-5">
          {/* Published toggle — h-6 w-11 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onTogglePublish(exam.id, !exam.is_published)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${exam.is_published ? 'bg-emerald-500' : 'bg-[#2a3142]'}`}
              id={`toggle-publish-${exam.id}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${exam.is_published ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`text-xs font-medium ${exam.is_published ? 'text-emerald-400' : 'text-[#64748b]'}`}>
              {exam.is_published ? 'Published' : 'Draft'}
            </span>
          </div>
        </td>
        <td className="py-3.5 px-5 text-[12px]" style={{ color: '#94a3b8' }}>{formatDateTime(exam.starts_at)}</td>
        <td className="py-3.5 px-5 text-[12px]" style={{ color: '#94a3b8' }}>{formatDateTime(exam.ends_at)}</td>
        <td className="py-3.5 px-5 font-mono text-white text-xs">{(exam.question_ids as string[]).length}</td>
        <td className="py-3.5 px-5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="px-3 py-1 rounded text-[11px] font-bold transition-colors"
              style={{
                background: open ? '#2a3142' : '#1c2333',
                border: '1px solid #2a3142',
                color: open ? '#fff' : '#94a3b8',
              }}
            >
              {open ? 'Close' : 'Details'}
            </button>
            <button
              type="button"
              onClick={() => onDelete(exam.id)}
              className="text-red-500/60 hover:text-red-400 transition-colors p-1"
              id={`delete-exam-${exam.id}`}
              title="Delete exam"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded detail row */}
      {open && (
        <tr style={{ background: '#0d1117', borderLeft: '4px solid rgba(245,158,11,0.4)', borderBottom: '1px solid #1e2536' }}>
          <td colSpan={7} className="px-8 py-4">
            <div className="flex items-center gap-8 text-sm">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Questions</span>
                <p className="font-mono text-white font-black text-xl mt-0.5">{(exam.question_ids as string[]).length}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Exam ID</span>
                <p className="font-mono text-[11px] mt-0.5" style={{ color: '#64748b' }}>{exam.id.slice(0, 16)}…</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Status</span>
                <p className="mt-1"><StatusBadge status={getStatus(exam.starts_at, exam.ends_at)} /></p>
              </div>
              <Link
                href={`/admin/weekly-exams`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-400 rounded transition-colors"
                style={{ border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)' }}
              >
                View All Exams →
              </Link>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function AdminWeeklyExamsPage() {
  const supabase = createClient()
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    supabase.from('weekly_exams').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setExams(data ?? [])
      setLoading(false)
    })
  }, [])

  function handleDelete(id: string) {
    if (!confirm('Delete this weekly exam? This cannot be undone.')) return
    startTransition(async () => {
      await deleteWeeklyExam(id)
      setExams((prev) => prev.filter((e) => e.id !== id))
    })
  }

  function handleTogglePublish(id: string, published: boolean) {
    startTransition(async () => {
      await toggleExamPublished(id, published)
      setExams((prev) => prev.map((e) => e.id === id ? { ...e, is_published: published } : e))
    })
  }

  const liveCount = exams.filter(e => getStatus(e.starts_at, e.ends_at) === 'live').length
  const upcomingCount = exams.filter(e => getStatus(e.starts_at, e.ends_at) === 'upcoming').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="size-9 rounded-md flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              <CalendarClock className="h-4 w-4 text-amber-400" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Weekly Exams</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[13px]" style={{ color: '#64748b' }}>{exams.length} total</span>
            {liveCount > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">{liveCount} live</span>
            )}
            {upcomingCount > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">{upcomingCount} upcoming</span>
            )}
          </div>
        </div>
        <Link
          href="/admin/weekly-exams/new"
          className="inline-flex items-center gap-2 h-9 px-4 text-sm font-bold rounded-md bg-amber-500 text-black hover:bg-amber-400 transition-all shadow-[0_4px_14px_rgba(245,158,11,0.35)]"
          id="new-exam-btn"
        >
          <Plus className="h-4 w-4" />
          New Exam
        </Link>
      </div>

      {loading ? (
        <div className="rounded-lg overflow-hidden" style={{ background: '#161b27', border: '1px solid #2a3142' }}>
          <div className="animate-pulse flex flex-col">
            <div className="h-11" style={{ background: '#1c2333', borderBottom: '1px solid #2a3142' }} />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 flex items-center px-5 gap-4" style={{ borderBottom: '1px solid #1e2536' }}>
                <div className="h-3 w-1/4 bg-white/5 rounded" />
                <div className="h-3 w-16 bg-white/5 rounded" />
                <div className="h-3 w-20 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : exams.length === 0 ? (
        <div className="rounded-lg border-dashed py-20 text-center"
          style={{ border: '2px dashed #2a3142', background: '#161b27' }}
        >
          <div className="size-14 rounded-lg flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            <CalendarClock className="h-6 w-6 text-amber-400" />
          </div>
          <p className="text-white font-bold mb-1">No weekly exams yet</p>
          <p className="text-xs mb-5" style={{ color: '#64748b' }}>Create your first scheduled exam to get started.</p>
          <Link
            href="/admin/weekly-exams/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition-all"
          >
            <Plus className="h-4 w-4" />
            Create First Exam
          </Link>
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ background: '#161b27', border: '1px solid #2a3142' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#1c2333', borderBottom: '1px solid #2a3142' }}>
                  <th className="text-left py-3 px-5 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Title</th>
                  <th className="text-left py-3 px-5 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Status</th>
                  <th className="text-left py-3 px-5 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Published</th>
                  <th className="text-left py-3 px-5 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Starts At</th>
                  <th className="text-left py-3 px-5 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Ends At</th>
                  <th className="text-left py-3 px-5 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Questions</th>
                  <th className="text-left py-3 px-5 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <ExamRow
                    key={exam.id}
                    exam={exam}
                    onDelete={handleDelete}
                    onTogglePublish={handleTogglePublish}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
