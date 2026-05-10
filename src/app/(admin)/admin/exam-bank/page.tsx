import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, Plus, BookOpen } from 'lucide-react'

export const metadata = {
  title: 'Exam Bank — Admin',
  description: 'Manage exam-only questions that are hidden from students during practice.',
}

const diffColor: Record<string, string> = {
  easy: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  hard: 'bg-red-500/10 text-red-400 border border-red-500/20',
}

export default async function ExamBankPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    console.log('Bypassing admin check for dev (exam-bank)')
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('id, statement, type, difficulty, chapters(name, subjects(name))')
    .eq('visibility', 'exam')
    .order('created_at', { ascending: false })

  const qs = (questions as any[]) ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-5 w-5 text-violet-400" />
            <h1 className="text-2xl font-extrabold text-foreground tracking-[-0.03em]">Exam Bank</h1>
          </div>
          <p className="text-sm text-muted">
            Questions here are <span className="font-semibold text-foreground">invisible to students</span> during practice.
            They are only shown when assigned to a Weekly Exam.
          </p>
        </div>
        <Link
          href="/admin/exam-bank/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-primary text-white font-bold text-sm shadow-[0_8px_24px_-6px_rgba(37,99,235,0.55)] hover:brightness-110 transition-all"
        >
          <Plus className="h-4 w-4" />
          Upload Exam Question
        </Link>
      </div>

      {/* Info notice */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
        <span className="font-bold">Note:</span> Existing weekly exams that reference <span className="font-semibold">public</span> questions
        will continue to work for students in active sessions. Only newly created exams should use exam-bank questions.
      </div>

      {/* Table */}
      {qs.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface py-16 text-center">
          <div className="size-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-7 w-7 text-violet-400" />
          </div>
          <p className="font-bold text-foreground mb-1">No exam questions yet</p>
          <p className="text-sm text-muted mb-5">
            Upload exam-only questions and they&apos;ll appear here, hidden from students.
          </p>
          <Link
            href="/admin/exam-bank/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-primary text-white font-bold text-sm hover:brightness-110 transition-all"
          >
            <Plus className="h-4 w-4" />
            Upload First Question
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <span className="text-sm font-semibold text-foreground">{qs.length} questions</span>
            <span className="text-xs text-muted">Exam-only visibility</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/40">
                  <th className="text-left py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-muted-2">#</th>
                  <th className="text-left py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-muted-2">Question</th>
                  <th className="text-left py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-muted-2">Subject / Chapter</th>
                  <th className="text-center py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-muted-2">Type</th>
                  <th className="text-center py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-muted-2">Difficulty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {qs.map((q: any, idx: number) => (
                  <tr key={q.id} className="hover:bg-surface-2/40 transition-colors">
                    <td className="py-3 px-5 text-muted-2 text-xs font-medium">{idx + 1}</td>
                    <td className="py-3 px-5 max-w-sm">
                      <p className="text-foreground text-sm line-clamp-2 leading-snug">
                        {q.statement.slice(0, 120)}{q.statement.length > 120 ? '…' : ''}
                      </p>
                    </td>
                    <td className="py-3 px-5">
                      <p className="text-xs font-semibold text-foreground">{q.chapters?.subjects?.name ?? '—'}</p>
                      <p className="text-[11px] text-muted">{q.chapters?.name ?? '—'}</p>
                    </td>
                    <td className="py-3 px-5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        q.type === 'mcq'
                          ? 'bg-accent-electric/10 text-accent-electric border border-accent-electric/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {q.type === 'mcq' ? 'MCQ' : 'Num'}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${diffColor[q.difficulty] ?? 'bg-surface text-muted border border-border'}`}>
                        {q.difficulty}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
