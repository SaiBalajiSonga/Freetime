import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { DeleteQuestionButton, DeleteAllQuestionsButton } from './questions/delete-buttons'

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
    return <div>Error loading questions: {error.message}</div>
  }

  const totalPages = Math.ceil((totalCount || 0) / pageSize)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Admin Question Management</h1>
          <p className="text-sm text-gray-400 mt-1 font-medium">{totalCount || 0} total questions</p>
        </div>
        <div className="flex items-center gap-3">
          {(totalCount || 0) > 0 && <DeleteAllQuestionsButton count={totalCount || 0} />}
          <Link href="/admin/import">
            <Button variant="outline" className="text-sm h-10 rounded-xl border-gray-200 font-medium">
              Import
            </Button>
          </Link>
          <Link href="/admin/questions/new">
            <button className="h-10 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all active:scale-[0.98]">
              <Plus className="h-4 w-4" />
              Add Question
            </button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="premium-card overflow-hidden" style={{ cursor: 'default' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-4 px-5 font-bold text-gray-400 text-[11px] uppercase tracking-wider">ID</th>
                <th className="text-left py-4 px-5 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Subject</th>
                <th className="text-left py-4 px-5 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Chapter</th>
                <th className="text-left py-4 px-5 font-bold text-gray-400 text-[11px] uppercase tracking-wider max-w-[280px]">Statement</th>
                <th className="text-left py-4 px-5 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Difficulty</th>
                <th className="text-left py-4 px-5 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Type</th>
                <th className="text-left py-4 px-5 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions?.map((q, idx) => {
                const qId = `Q-${String((page - 1) * pageSize + idx + 1).padStart(3, '0')}`
                const diffColor: Record<string, string> = {
                  easy: 'bg-emerald-100 text-emerald-700',
                  medium: 'bg-amber-100 text-amber-700',
                  hard: 'bg-red-100 text-red-700',
                }

                return (
                  <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-5 text-gray-400 font-mono text-xs font-medium">{qId}</td>
                    <td className="py-3.5 px-5 text-gray-700 font-medium">
                      {/* @ts-ignore */}
                      {q.chapters?.subjects?.name || '—'}
                    </td>
                    {/* @ts-ignore */}
                    <td className="py-3.5 px-5 text-gray-600">{q.chapters?.name || '—'}</td>
                    <td className="py-3.5 px-5 text-gray-600 max-w-[280px] truncate">{q.statement}</td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${diffColor[q.difficulty] || 'bg-gray-100 text-gray-600'}`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-gray-500 uppercase text-xs font-bold">{q.type}</td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <Link href={`/questions/${q.id}`} className="text-indigo-600 hover:text-indigo-800 text-xs font-bold">
                          View
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
            <div className="icon-3d p-4 text-white w-fit mx-auto mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-gray-400 font-medium">No questions yet.</p>
          </div>
        )}

        {/* Pagination */}
        {(totalCount || 0) > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <span className="text-xs text-gray-400 font-medium">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              {page > 1 && (
                <Link href={`/admin?page=${page - 1}`}>
                  <button className="h-8 w-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
                    <ChevronLeft className="h-4 w-4 text-gray-400" />
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
                    <button className={`h-8 w-8 rounded-xl text-xs font-bold flex items-center justify-center transition-all ${
                      p === page
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/25'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}>
                      {p}
                    </button>
                  </Link>
                )
              })}
              {page < totalPages && (
                <Link href={`/admin?page=${page + 1}`}>
                  <button className="h-8 w-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
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
