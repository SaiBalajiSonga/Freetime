'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { Plus, Calendar, Trash2, ChevronDown } from 'lucide-react'
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
      <tr className="hover:bg-surface-2/60 transition-colors">
        <td className="py-3.5 px-5">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-violet-400 shrink-0" />
            <span className="font-medium text-foreground truncate max-w-[220px]">{exam.title}</span>
          </div>
        </td>
        <td className="py-3.5 px-5">
          {status === 'live' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
              Live
            </span>
          )}
          {status === 'upcoming' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {countdown || 'Upcoming'}
            </span>
          )}
          {status === 'ended' && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface-2 text-muted border border-white/10 opacity-70">
              Ended
            </span>
          )}
        </td>
        <td className="py-3.5 px-5">
          {/* Published toggle */}
          <button
            type="button"
            onClick={() => onTogglePublish(exam.id, !exam.is_published)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors scale-90 ${exam.is_published ? 'bg-emerald-500' : 'bg-surface-2 border border-white/10'}`}
            id={`toggle-publish-${exam.id}`}
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${exam.is_published ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
          <span className={`ml-2 text-xs font-medium ${exam.is_published ? 'text-emerald-400' : 'text-muted-2'}`}>
            {exam.is_published ? 'Published' : 'Draft'}
          </span>
        </td>
        <td className="py-3.5 px-5 text-muted text-xs">{formatDateTime(exam.starts_at)}</td>
        <td className="py-3.5 px-5 text-muted text-xs">{formatDateTime(exam.ends_at)}</td>
        <td className="py-3.5 px-5 font-mono text-foreground text-xs">{(exam.question_ids as string[]).length}</td>
        <td className="py-3.5 px-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="px-3 py-1 rounded-md bg-accent-cyan/10 text-accent-cyan hover:bg-accent-cyan/20 text-[11px] font-bold transition-colors"
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => onDelete(exam.id)}
              className="text-red-400/60 hover:text-red-400 transition-colors"
              id={`delete-exam-${exam.id}`}
              title="Delete exam"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
      {open && (
        <tr className="bg-surface-2/30">
          <td colSpan={7} className="px-8 py-4">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-muted-2 text-xs font-bold uppercase tracking-wider">Questions</span>
                <p className="font-mono text-foreground font-bold text-lg">{(exam.question_ids as string[]).length}</p>
              </div>
              <div>
                <span className="text-muted-2 text-xs font-bold uppercase tracking-wider">Exam ID</span>
                <p className="font-mono text-muted text-xs mt-0.5">{exam.id.slice(0, 16)}…</p>
              </div>
              <Link
                href={`/admin/questions?ids=${(exam.question_ids as string[]).slice(0, 5).join(',')}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-accent-cyan border border-accent-cyan/20 rounded-lg hover:bg-accent-cyan/10 transition-colors"
              >
                Preview Questions →
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-[-0.03em]">Weekly Exams</h1>
          <p className="text-sm text-muted mt-1">{exams.length} total exam{exams.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/admin/weekly-exams/new"
          className="inline-flex items-center gap-2 h-8 px-4 text-xs font-bold rounded-lg bg-gradient-primary text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.55)] hover:brightness-110 transition-all"
          id="new-exam-btn"
        >
          <Plus className="h-4 w-4" />
          New Exam
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/[0.08] bg-surface overflow-hidden">
          <div className="animate-pulse flex flex-col">
            <div className="h-12 bg-surface-2/60 border-b border-white/[0.08]" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 border-b border-white/[0.05] flex items-center px-5 gap-4">
                <div className="h-4 w-1/4 bg-white/5 rounded" />
                <div className="h-4 w-16 bg-white/5 rounded" />
                <div className="h-4 w-20 bg-white/5 rounded" />
                <div className="h-4 w-32 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : exams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-surface py-20 text-center">
          <div className="size-16 rounded-2xl bg-surface-2 border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-7 w-7 text-violet-400" />
          </div>
          <p className="text-foreground font-bold mb-1">No weekly exams yet</p>
          <p className="text-xs text-muted-2 mb-5">Create your first scheduled exam to get started.</p>
          <Link
            href="/admin/weekly-exams/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-primary text-white font-bold text-sm hover:brightness-110 transition-all"
          >
            <Plus className="h-4 w-4" />
            Create First Exam
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] bg-surface-2/60">
                  <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-widest">Title</th>
                  <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-widest">Status</th>
                  <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-widest">Published</th>
                  <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-widest">Starts At</th>
                  <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-widest">Ends At</th>
                  <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-widest">Questions</th>
                  <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
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
