import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { DeleteAllQuestionsButton } from './questions/delete-buttons'
import { AdminNav } from './admin-nav'
import { QuestionsTable } from './questions/questions-table'

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

      {/* Table with multi-select */}
      <QuestionsTable questions={(questions as any) ?? []} page={page} pageSize={pageSize} />

      {(totalCount || 0) > 0 && totalPages > 1 && (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 bg-surface-2/40">
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
        </div>
      )}
    </div>
  )
}
