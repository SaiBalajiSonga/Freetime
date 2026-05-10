import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, BookOpen, Trophy, Lock } from 'lucide-react'
import ExamStartButton from './exam-start-button'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

type ExamStatus = 'live' | 'upcoming' | 'ended'

function getStatus(startsAt: string, endsAt: string): ExamStatus {
  const now = new Date()
  if (now < new Date(startsAt)) return 'upcoming'
  if (now > new Date(endsAt)) return 'ended'
  return 'live'
}

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  const { examId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: exam } = await supabase
    .from('weekly_exams')
    .select('*')
    .eq('id', examId)
    .eq('is_published', true)
    .single()

  if (!exam) redirect('/exams')

  const { data: existingSession } = await supabase
    .from('test_sessions')
    .select('id, status, score, max_score')
    .eq('user_id', user.id)
    .eq('weekly_exam_id', examId)
    .maybeSingle()

  const status = getStatus(exam.starts_at, exam.ends_at)
  const questionCount = (exam.question_ids as string[]).length
  const maxScore = questionCount * 4

  return (
    <div className="space-y-6 animate-in-up max-w-3xl">
      <div>
        <Link
          href="/exams"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Exams
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-extrabold text-gradient">{exam.title}</h1>
          <span className={`text-[10px] font-bold uppercase tracking-wide rounded-md px-2.5 py-1 flex-shrink-0 ${
            status === 'live'
              ? 'bg-emerald-100 text-emerald-700'
              : status === 'upcoming'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-500'
          }`}>
            {status === 'live' ? 'Live' : status === 'upcoming' ? 'Upcoming' : 'Ended'}
          </span>
        </div>
        {exam.description && (
          <p className="text-sm text-muted">{exam.description}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Questions', value: questionCount.toString(), icon: <BookOpen className="h-4 w-4" /> },
          { label: 'Duration', value: `${exam.duration_minutes} min`, icon: <Clock className="h-4 w-4" /> },
          { label: 'Max Marks', value: maxScore.toString(), icon: <Trophy className="h-4 w-4" /> },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-surface p-4 text-center">
            <div className="flex justify-center mb-1 text-violet-500">{item.icon}</div>
            <p className="text-xl font-extrabold text-gradient">{item.value}</p>
            <p className="text-xs text-muted mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Timing */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
        <h2 className="font-bold text-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4 text-violet-500" />
          Exam Window
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-surface-2 border border-border px-4 py-3">
            <p className="text-[10px] text-muted uppercase tracking-wider font-medium mb-1">Starts</p>
            <p className="font-semibold text-foreground">{formatDateTime(exam.starts_at)}</p>
          </div>
          <div className="rounded-xl bg-surface-2 border border-border px-4 py-3">
            <p className="text-[10px] text-muted uppercase tracking-wider font-medium mb-1">Ends</p>
            <p className="font-semibold text-foreground">{formatDateTime(exam.ends_at)}</p>
          </div>
        </div>
      </div>

      {/* Marking scheme */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
        <h2 className="font-bold text-foreground">Marking Scheme</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-surface-2 border border-border p-4 space-y-1.5">
            <p className="text-[10px] text-muted font-medium uppercase tracking-wide">Correct</p>
            <p className="text-emerald-400 font-bold text-lg">+4</p>
          </div>
          <div className="rounded-xl bg-surface-2 border border-border p-4 space-y-1.5">
            <p className="text-[10px] text-muted font-medium uppercase tracking-wide">Unattempted</p>
            <p className="text-muted font-bold text-lg">0</p>
          </div>
        </div>
        <p className="text-xs text-muted">No negative marking for this exam.</p>
      </div>

      {/* CTA */}
      <div className="space-y-3">
        {existingSession?.status === 'submitted' ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex items-center justify-between">
              <div>
                <p className="font-bold text-emerald-400 text-sm">Exam Submitted</p>
                <p className="text-2xl font-extrabold text-foreground mt-0.5">
                  {existingSession.score}
                  <span className="text-base font-medium text-muted">/{existingSession.max_score}</span>
                </p>
              </div>
              <Trophy className="h-8 w-8 text-amber-400" />
            </div>
            <Link
              href={`/tests/${existingSession.id}/result`}
              className="block w-full py-4 rounded-2xl font-bold text-base bg-surface-2 border border-border text-foreground hover:bg-surface text-center transition-all"
            >
              View Detailed Results
            </Link>
          </div>
        ) : existingSession?.status === 'in_progress' ? (
          <Link
            href={`/tests/${existingSession.id}/instructions`}
            className="block w-full py-4 rounded-2xl font-bold text-base bg-amber-400 hover:bg-amber-300 text-black transition-all flex items-center justify-center gap-2 shadow-[0_0_32px_-8px_rgba(251,191,36,0.5)]"
          >
            Resume Exam
          </Link>
        ) : status === 'upcoming' ? (
          <button
            disabled
            className="w-full py-4 rounded-2xl font-bold text-base bg-slate-100 text-slate-400 cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Lock className="h-5 w-5" />
            Starts {formatDateTime(exam.starts_at)}
          </button>
        ) : status === 'ended' ? (
          <button
            disabled
            className="w-full py-4 rounded-2xl font-bold text-base bg-slate-100 text-slate-400 cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Lock className="h-5 w-5" />
            Exam Closed
          </button>
        ) : (
          <ExamStartButton examId={examId} />
        )}
      </div>
    </div>
  )
}
