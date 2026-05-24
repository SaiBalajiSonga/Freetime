import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, ChevronLeft, ChevronRight, Upload, AlertTriangle, ArrowRight, FileQuestion, CheckSquare, Hash, Flame } from 'lucide-react'
import { DeleteAllQuestionsButton } from './delete-buttons'
import { QuestionsTable } from './questions-table'
import { FilterBar } from '@/components/admin/filter-bar'
import { PageSizeSelect } from '@/components/admin/page-size-select'

export const metadata = {
  title: 'PYQ Questions — Admin',
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
    return <div className="text-red-400 p-4 rounded-lg border border-red-500/20 bg-red-500/10">Error loading questions: {error.message}</div>
  }

  // ── Global stats (unfiltered) ────────────────────────────────────
  const [
    { count: totalCount },
    { count: mcqCount },
    { count: numCount },
    { count: hardCount },
  ] = await Promise.all([
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('type', 'mcq'),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('type', 'numerical'),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('difficulty', 'hard'),
  ])

  // ── Subjects for filter dropdown ─────────────────────────────────
  const { data: subjects } = await supabase.from('subjects').select('id, name').order('name')

  const displayCount = filteredCount ?? 0
  const totalPages = Math.ceil(displayCount / pageSize)
  const hasFilters = !!(filters.q || filters.subject || filters.difficulty || filters.type)

  const statCards = [
    { label: 'Total Questions', value: totalCount ?? 0, icon: FileQuestion, accent: '#3b82f6' },
    { label: 'MCQ',             value: mcqCount ?? 0,   icon: CheckSquare,   accent: '#06b6d4' },
    { label: 'Numerical',       value: numCount ?? 0,   icon: Hash,          accent: '#8b5cf6' },
    { label: 'Hard',            value: hardCount ?? 0,  icon: Flame,         accent: '#ef4444' },
  ]

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-white tracking-tight">
            <FileQuestion className="h-5 w-5 text-blue-400" />
            PYQ Questions
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: '#64748b' }}>
            Manage all practice questions
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/import"
            className="inline-flex items-center gap-1.5 h-8 px-4 text-xs font-bold rounded-md transition-colors"
            style={{ border: '1px solid #2a3142', background: '#161b27', color: '#94a3b8' }}
          >
            <Upload className="h-3.5 w-3.5" />
            Import
          </Link>
          <Link
            href="/admin/questions/new"
            className="inline-flex items-center gap-1.5 h-8 px-4 text-xs font-bold rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-[0_4px_14px_rgba(59,130,246,0.35)]"
            id="add-question-btn"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Question
          </Link>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, accent }) => (
          <div
            key={label}
            className="rounded-lg p-5 flex items-center justify-between gap-3"
            style={{ background: '#161b27', border: '1px solid #2a3142' }}
          >
            <div
              className="size-9 rounded-md flex items-center justify-center shrink-0"
              style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
            >
              <Icon className="h-4 w-4" style={{ color: accent }} />
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-white tabular-nums leading-none">{value.toLocaleString()}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: '#64748b' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <FilterBar subjects={subjects ?? []} currentFilters={filters} />

      {/* ── Filtered count if filters active ── */}
      {hasFilters && (
        <p className="text-xs" style={{ color: '#64748b' }}>
          Showing <span className="font-bold text-white">{displayCount}</span> of{' '}
          <span className="font-bold text-white">{(totalCount ?? 0).toLocaleString()}</span> questions
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
      {displayCount > 0 && (
        <div className="flex items-center justify-between px-2 pt-2">
          <div className="flex items-center gap-4">
            <span className="text-[13px] font-medium" style={{ color: '#64748b' }}>
              {displayCount.toLocaleString()} questions
            </span>
            <PageSizeSelect currentSize={pageSize} />
          </div>
          <div className="flex items-center gap-1">
            {page > 1 && (
              <Link href={`/admin?${new URLSearchParams({ ...params as Record<string, string>, page: String(page - 1) }).toString()}`}>
                <button className="size-8 rounded-md hover:bg-[#1c2333] flex items-center justify-center transition-colors text-[#64748b] hover:text-white">
                  <ChevronLeft className="h-4 w-4" />
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
                <Link key={p} href={`/admin?${new URLSearchParams({ ...params as Record<string, string>, page: String(p) }).toString()}`}>
                  <button className={`size-8 rounded-md text-[13px] font-bold flex items-center justify-center transition-all ${
                    p === page
                      ? 'bg-blue-600 text-white'
                      : 'text-[#64748b] hover:bg-[#1c2333] hover:text-white'
                  }`}>
                    {p}
                  </button>
                </Link>
              )
            })}
            {page < totalPages && (
              <Link href={`/admin?${new URLSearchParams({ ...params as Record<string, string>, page: String(page + 1) }).toString()}`}>
                <button className="size-8 rounded-md hover:bg-[#1c2333] flex items-center justify-center transition-colors text-[#64748b] hover:text-white">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Danger Zone ── */}
      {(totalCount ?? 0) > 0 && (
        <details className="rounded-lg border border-red-500/20 bg-red-500/5 overflow-hidden group">
          <summary className="group flex items-center justify-between px-5 py-4 cursor-pointer text-red-400/70 hover:text-red-400 text-sm font-bold transition-colors select-none">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Danger Zone
            </div>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </summary>
          <div className="px-5 pb-5 pt-2 border-t border-red-500/10">
            <p className="text-xs mb-4" style={{ color: '#64748b' }}>
              Permanently delete <span className="font-bold text-white">{(totalCount ?? 0).toLocaleString()}</span> questions,
              all their options, and all student attempt records. This action cannot be undone.
            </p>
            <DeleteAllQuestionsButton count={totalCount ?? 0} />
          </div>
        </details>
      )}
    </div>
  )
}
