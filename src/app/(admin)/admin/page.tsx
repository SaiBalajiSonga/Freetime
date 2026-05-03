import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { DeleteQuestionButton, DeleteAllQuestionsButton } from './questions/delete-buttons'
import { AdminNav } from './admin-nav'

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const page = Number(params.page) || 1
  const pageSize = 15
  const offset = (page - 1) * pageSize

  const { count: totalCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })

  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, statement, type, difficulty, chapters(name, subjects(name))')
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) {
    return <div className="text-red-400">Error loading questions: {error.message}</div>
  }

  const totalPages = Math.ceil((totalCount || 0) / pageSize)

  return (
    <div className="space-y-6">
      <AdminNav />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-[-0.03em]">Question Management</h1>
          <p className="text-sm text-muted mt-1">{totalCount || 0} total questions</p>
        </div>
        <div className="flex items-center gap-3">
          {(totalCount || 0) > 0 && <DeleteAllQuestionsButton count={totalCount || 0} />}
          <Link href="/admin/import" className="inline-flex items-center justify-center h-8 px-4 text-sm font-medium rounded-pill border border-border-strong bg-transparent text-foreground hover:bg-surface-2 transition-colors">
            Import
          </Link>
          <Link href="/admin/questions/new" className="inline-flex items-center justify-center gap-2 h-8 px-4 text-sm font-medium rounded-pill bg-gradient-primary text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.55)] hover:brightness-110 transition-all">
            <Plus className="h-4 w-4" />
            Add Question
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-wider">ID</th>
                <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-wider">Subject</th>
                <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-wider">Chapter</th>
                <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-wider max-w-[280px]">Statement</th>
                <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-wider">Difficulty</th>
                <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-wider">Type</th>
                <th className="text-left py-4 px-5 font-bold text-muted-2 text-[11px] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {questions?.map((q, idx) => {
                const qId = `Q-${String((page - 1) * pageSize + idx + 1).padStart(3, '0')}`
                const diffColor: Record<string, string> = {
                  easy:   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
                  medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
                  hard:   'bg-red-500/10 text-red-400 border border-red-500/20',
                }

                return (
                  <tr key={q.id} className="hover:bg-surface-2/60 transition-colors">
                    <td className="py-3.5 px-5 text-muted-2 font-mono text-xs font-medium">{qId}</td>
                    <td className="py-3.5 px-5 text-foreground font-medium">
                      {/* @ts-ignore */}
                      {q.chapters?.subjects?.name || '—'}
                    </td>
                    {/* @ts-ignore */}
                    <td className="py-3.5 px-5 text-muted">{q.chapters?.name || '—'}</td>
                    <td className="py-3.5 px-5 text-muted max-w-[280px] truncate">{q.statement}</td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${diffColor[q.difficulty] || 'bg-surface-2 text-muted border border-border'}`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-muted-2 uppercase text-xs font-bold">{q.type}</td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <Link href={`/questions/${q.id}`} className="text-accent-cyan hover:text-accent-glow text-xs font-bold transition-colors">
                          View
                        </Link>
                        <Link href={`/admin/questions/${q.id}/edit`} className="text-amber-400 hover:text-amber-300 text-xs font-bold transition-colors">
                          Edit
                        </Link>
                        <DeleteQuestionButton questionId={q.id} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {questions?.length === 0 && (
          <div className="py-16 text-center">
            <div className="size-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-muted font-medium">No questions yet.</p>
          </div>
        )}

        {/* Pagination */}
        {(totalCount || 0) > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-surface-2/40">
            <span className="text-xs text-muted-2 font-medium">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              {page > 1 && (
                <Link href={`/admin?page=${page - 1}`}>
                  <button className="size-8 rounded-xl hover:bg-surface-2 flex items-center justify-center transition-colors">
                    <ChevronLeft className="h-4 w-4 text-muted" />
                  </button>
                </Link>
              )}
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p: number
                if (totalPages <= 7) p = i + 1
                else if (page <= 4) p = i + 1
                else if (page >= totalPages - 3) p = totalPages - 6 + i
                else p = page - 3 + i
                return (
                  <Link key={p} href={`/admin?page=${p}`}>
                    <button className={`size-8 rounded-xl text-xs font-bold flex items-center justify-center transition-all ${
                      p === page
                        ? 'bg-gradient-primary text-white shadow-[0_4px_12px_-4px_rgba(37,99,235,0.5)]'
                        : 'text-muted hover:bg-surface-2'
                    }`}>
                      {p}
                    </button>
                  </Link>
                )
              })}
              {page < totalPages && (
                <Link href={`/admin?page=${page + 1}`}>
                  <button className="size-8 rounded-xl hover:bg-surface-2 flex items-center justify-center transition-colors">
                    <ChevronRight className="h-4 w-4 text-muted" />
                  </button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
