import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, ChevronLeft, ChevronRight, Upload, AlertTriangle } from 'lucide-react'
import { DeleteAllQuestionsButton } from './questions/delete-buttons'
import { QuestionsTable } from './questions/questions-table'
import { FilterBar } from '@/components/admin/filter-bar'
import { StatsBar } from '@/components/admin/stats-bar'

export const metadata = {
  title: 'Question Management — Admin',
  description: 'Manage all practice and exam bank questions.',
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    pageSize?: string
    q?: string
    subject?: string
    difficulty?: string
    type?: string
  }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = Number(params.pageSize) || 25
  const offset = (page - 1) * pageSize

  // ── Filters ─────────────────────────────────────────────────────
  const filters = {
    q: params.q ?? '',
    subject: params.subject ?? '',
    difficulty: params.difficulty ?? '',
    type: params.type ?? '',
  }

  // ── Build filtered query ─────────────────────────────────────────
  let query = supabase
    .from('questions')
    .select(
      'id, statement, type, difficulty, image_url, correct_answer, hint, solution, chapters!inner(name, subjects!inner(id, name)), options:question_options(id, text, is_correct)',
      { count: 'exact' }
    )

  if (filters.q) query = query.ilike('statement', `%${filters.q}%`)
  if (filters.difficulty) query = query.eq('difficulty', filters.difficulty)
  if (filters.type) query = query.eq('type', filters.type)

  query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1)

  const { data: questions, error, count: filteredCount } = await query

  // ── Subject filtering (post-fetch, since it's nested) ───────────
  let filtered = (questions as any[]) ?? []
  if (filters.subject) {
    filtered = filtered.filter((q: any) => q.chapters?.subjects?.id === filters.subject)
  }

  if (error) {
    return <div className="text-red-400 p-4 rounded-xl border border-red-500/20 bg-red-500/10">Error loading questions: {error.message}</div>
  }

  // ── Global stats (unfiltered) ────────────────────────────────────
  const [
    { count: totalCount },
    { count: mcqCount },
    { count: numCount },
    { count: easyCount },
    { count: medCount },
    { count: hardCount },
  ] = await Promise.all([
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('type', 'mcq'),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('type', 'numerical'),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('difficulty', 'easy'),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('difficulty', 'medium'),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('difficulty', 'hard'),
  ])

  // ── Subjects for filter dropdown ─────────────────────────────────
  const { data: subjects } = await supabase.from('subjects').select('id, name').order('name')

  const displayCount = filteredCount ?? 0
  const totalPages = Math.ceil(displayCount / pageSize)
  const hasFilters = !!(filters.q || filters.subject || filters.difficulty || filters.type)

  const globalStats = [
    { label: 'Total', value: totalCount ?? 0 },
    { label: 'MCQ', value: mcqCount ?? 0, color: 'text-accent-cyan' },
    { label: 'Numerical', value: numCount ?? 0, color: 'text-violet-400' },
    { label: 'Easy', value: easyCount ?? 0, color: 'text-emerald-400' },
    { label: 'Medium', value: medCount ?? 0, color: 'text-amber-400' },
    { label: 'Hard', value: hardCount ?? 0, color: 'text-red-400' },
  ]

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-[-0.03em]">Question Management</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <StatsBar stats={globalStats} />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/import"
            className="inline-flex items-center gap-1.5 h-8 px-4 text-xs font-bold rounded-lg border border-white/10 bg-surface-2 text-foreground hover:bg-white/[0.08] transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            Import
          </Link>
          <Link
            href="/admin/questions/new"
            className="inline-flex items-center gap-1.5 h-8 px-4 text-xs font-bold rounded-lg bg-gradient-primary text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.55)] hover:brightness-110 transition-all"
            id="add-question-btn"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Question
          </Link>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <FilterBar subjects={subjects ?? []} currentFilters={filters} />

      {/* ── Filtered count if filters active ── */}
      {hasFilters && (
        <p className="text-xs text-muted-2">
          Showing <span className="font-bold text-foreground">{displayCount}</span> of{' '}
          <span className="font-bold text-foreground">{(totalCount ?? 0).toLocaleString()}</span> questions
        </p>
      )}

      {/* ── Table ── */}
      <QuestionsTable
        questions={filtered as any}
        page={page}
        pageSize={pageSize}
        totalCount={displayCount}
      />

      {/* ── Pagination ── */}
      {displayCount > 0 && totalPages > 1 && (
        <div className="rounded-2xl border border-white/[0.08] bg-surface overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 bg-surface-2/40">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-2 font-medium">
                Page {page} of {totalPages} · {displayCount.toLocaleString()} questions
              </span>
              {/* Page size selector */}
              <select
                onChange={(e) => {
                  const u = new URL(window.location.href)
                  u.searchParams.set('pageSize', e.target.value)
                  u.searchParams.delete('page')
                  window.location.href = u.toString()
                }}
                defaultValue={String(pageSize)}
                className="h-7 px-2 text-xs rounded-lg border border-white/10 bg-surface-2 text-foreground focus:outline-none cursor-pointer"
                id="page-size-select"
              >
                {[15, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n} / page</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              {page > 1 && (
                <Link href={`/admin?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}>
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
                  <Link key={p} href={`/admin?${new URLSearchParams({ ...params, page: String(p) }).toString()}`}>
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
                <Link href={`/admin?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}>
                  <button className="size-8 rounded-xl hover:bg-surface-2 flex items-center justify-center transition-colors">
                    <ChevronRight className="h-4 w-4 text-muted" />
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Danger Zone ── */}
      {(totalCount ?? 0) > 0 && (
        <details className="rounded-2xl border border-red-500/20 bg-red-500/5 overflow-hidden group">
          <summary className="flex items-center gap-2 px-5 py-4 cursor-pointer text-red-400/70 hover:text-red-400 text-sm font-bold transition-colors select-none">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </summary>
          <div className="px-5 pb-5 pt-2 border-t border-red-500/10">
            <p className="text-xs text-muted-2 mb-4">
              Permanently delete <span className="font-bold text-foreground">{(totalCount ?? 0).toLocaleString()}</span> questions,
              all their options, and all student attempt records. This action cannot be undone.
            </p>
            <DeleteAllQuestionsButton count={totalCount ?? 0} />
          </div>
        </details>
      )}
    </div>
  )
}
