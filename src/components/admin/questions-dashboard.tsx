import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, ChevronLeft, ChevronRight, Upload, AlertTriangle, ArrowRight, FileQuestion, CheckSquare, Hash, Flame, Archive, Info } from 'lucide-react'
import { QuestionsTable } from '@/app/(admin)/admin/questions/questions-table'
import { FilterBar } from '@/components/admin/filter-bar'
import { PageSizeSelect } from '@/components/admin/page-size-select'

type QuestionsDashboardProps = {
  title: string
  description: React.ReactNode
  icon: React.ElementType
  iconColorClass: string
  visibility: 'public' | 'exam'
  basePath: string
  params: {
    page?: string
    pageSize?: string
    q?: string
    subject?: string
    difficulty?: string
    type?: string
  }
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <div className="relative group/tooltip flex items-center justify-center cursor-help ml-1">
      <div className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-white/10 transition-colors">
        <Info className="h-3.5 w-3.5 text-[#64748b] group-hover/tooltip:text-white transition-colors" />
      </div>
      
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max max-w-[320px] p-3 rounded-lg bg-[#1c2333] border border-[#2a3142] text-[13px] text-[#94a3b8] font-normal leading-relaxed opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 shadow-[0_8px_30px_rgb(0,0,0,0.5)] z-50 pointer-events-none text-left transform scale-95 group-hover/tooltip:scale-100 origin-bottom">
        {text}
      </div>
    </div>
  )
}

export async function QuestionsDashboard({
  title,
  description,
  icon: Icon,
  iconColorClass,
  visibility,
  basePath,
  params
}: QuestionsDashboardProps) {
  const supabase = createAdminClient()

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
    .eq('visibility', visibility)

  if (filters.q) query = query.ilike('statement', `%${filters.q}%`)
  if (filters.difficulty) query = query.eq('difficulty', filters.difficulty)
  if (filters.type) query = query.eq('type', filters.type)
  if (filters.subject) query = query.eq('chapters.subjects.id', filters.subject)

  query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1)

  const { data: questions, error, count: filteredCount } = await query

  const filtered = (questions as any[]) ?? []

  if (error) {
    return <div className="text-red-400 p-4 rounded-lg border border-red-500/20 bg-red-500/10">Error loading questions: {error.message}</div>
  }

  // ── Compute Stats ────────────────────────────────────────────────
  const { data: statsData } = await supabase
    .from('questions')
    .select('type, difficulty, chapters(subjects(id, name))')
    .eq('visibility', visibility)

  const stats = {
    total: 0,
    mcq: 0,
    num: 0,
    easy: 0,
    medium: 0,
    hard: 0,
    subjects: {} as Record<string, { name: string; count: number }>,
  }

  if (statsData) {
    stats.total = statsData.length
    statsData.forEach((q) => {
      if (q.type === 'mcq') stats.mcq++
      if (q.type === 'numerical') stats.num++
      
      if (q.difficulty === 'easy') stats.easy++
      if (q.difficulty === 'medium') stats.medium++
      if (q.difficulty === 'hard') stats.hard++

      const subjectId = (q.chapters as any)?.subjects?.id
      const subjectName = (q.chapters as any)?.subjects?.name
      if (subjectId && subjectName) {
        if (!stats.subjects[subjectId]) {
          stats.subjects[subjectId] = { name: subjectName, count: 0 }
        }
        stats.subjects[subjectId].count++
      }
    })
  }

  const subjectList = Object.values(stats.subjects).sort((a, b) => b.count - a.count)

  // ── Subjects for filter dropdown ─────────────────────────────────
  const { data: subjects } = await supabase.from('subjects').select('id, name').order('name')

  const displayCount = filteredCount ?? 0
  const totalPages = Math.ceil(displayCount / pageSize)
  const hasFilters = !!(filters.q || filters.subject || filters.difficulty || filters.type)



  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-white tracking-tight">
            <Icon className={`h-5 w-5 ${iconColorClass}`} />
            {title}
          </h1>
          <div className="text-[13px] mt-0.5" style={{ color: '#64748b' }}>
            {description}
          </div>
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
            className={`inline-flex items-center gap-1.5 h-8 px-4 text-xs font-bold rounded-md text-white transition-colors shadow-sm ${
              visibility === 'exam' 
                ? 'bg-violet-600 hover:bg-violet-500 shadow-[0_4px_14px_rgba(139,92,246,0.35)]' 
                : 'bg-blue-600 hover:bg-blue-500 shadow-[0_4px_14px_rgba(59,130,246,0.35)]'
            }`}
            id="add-question-btn"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Question
          </Link>
        </div>
      </div>

      {/* ── Visual Stats Dashboard ── */}
      {stats.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Box 1: Question Types */}
          <div className="rounded-xl p-5" style={{ background: '#161b27', border: '1px solid #2a3142' }}>
            <div className="flex items-center gap-1.5 mb-4">
              <h3 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Question Types</h3>
              <InfoTooltip text="Shows the proportion of Multiple Choice Questions vs Numerical format questions." />
            </div>
            <div className="flex w-full h-3.5 rounded-full overflow-hidden bg-[#1c2333] mb-4">
              <div style={{ width: `${(stats.mcq / stats.total) * 100}%`, backgroundColor: '#06b6d4' }} className="h-full" />
              <div style={{ width: `${(stats.num / stats.total) * 100}%`, backgroundColor: '#8b5cf6' }} className="h-full" />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-[3px]" style={{ backgroundColor: '#06b6d4' }} />
                <span className="text-xs font-medium text-[#94a3b8]">MCQ <span className="text-white ml-1">{stats.mcq}</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-[3px]" style={{ backgroundColor: '#8b5cf6' }} />
                <span className="text-xs font-medium text-[#94a3b8]">Numerical <span className="text-white ml-1">{stats.num}</span></span>
              </div>
            </div>
          </div>

          {/* Box 2: Difficulty */}
          <div className="rounded-xl p-5" style={{ background: '#161b27', border: '1px solid #2a3142' }}>
            <div className="flex items-center gap-1.5 mb-4">
              <h3 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Difficulty</h3>
              <InfoTooltip text="Breaks down your question bank by difficulty level to ensure balanced exams." />
            </div>
            <div className="flex w-full h-3.5 rounded-full overflow-hidden bg-[#1c2333] mb-4">
              <div style={{ width: `${(stats.easy / stats.total) * 100}%`, backgroundColor: '#10b981' }} className="h-full" />
              <div style={{ width: `${(stats.medium / stats.total) * 100}%`, backgroundColor: '#f59e0b' }} className="h-full" />
              <div style={{ width: `${(stats.hard / stats.total) * 100}%`, backgroundColor: '#ef4444' }} className="h-full" />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-[3px]" style={{ backgroundColor: '#10b981' }} />
                <span className="text-xs font-medium text-[#94a3b8]">Easy <span className="text-white ml-1">{stats.easy}</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-[3px]" style={{ backgroundColor: '#f59e0b' }} />
                <span className="text-xs font-medium text-[#94a3b8]">Med <span className="text-white ml-1">{stats.medium}</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-[3px]" style={{ backgroundColor: '#ef4444' }} />
                <span className="text-xs font-medium text-[#94a3b8]">Hard <span className="text-white ml-1">{stats.hard}</span></span>
              </div>
            </div>
          </div>

          {/* Box 3: Subject Breakdown */}
          <div className="rounded-xl p-5 flex flex-col justify-center" style={{ background: '#161b27', border: '1px solid #2a3142' }}>
            <div className="flex items-center gap-1.5 mb-4">
              <h3 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Top Subjects</h3>
              <InfoTooltip text="Displays the top 3 subjects with the most questions in your database." />
            </div>
            {subjectList.length === 0 ? (
              <p className="text-xs text-[#64748b]">No subjects found.</p>
            ) : (
              <div className="space-y-3.5">
                {subjectList.slice(0, 3).map((sub, i) => {
                  const colors = ['#3b82f6', '#ec4899', '#f97316']
                  const color = colors[i % colors.length]
                  return (
                    <div key={sub.name}>
                      <div className="flex justify-between text-[11px] mb-1.5">
                        <span className="text-[#94a3b8] font-medium truncate pr-2">{sub.name}</span>
                        <span className="text-white font-bold">{sub.count}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#1c2333]">
                        <div className="h-full rounded-full" style={{ width: `${(sub.count / stats.total) * 100}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ── Filter bar ── */}
      <FilterBar subjects={subjects ?? []} currentFilters={filters} basePath={basePath} />

      {hasFilters && (
        <p className="text-xs" style={{ color: '#64748b' }}>
          Showing <span className="font-bold text-white">{displayCount}</span> of{' '}
          <span className="font-bold text-white">{stats.total.toLocaleString()}</span> questions
        </p>
      )}

      {/* ── Table and Pagination Container ── */}
      <div className="rounded-lg overflow-hidden flex flex-col shadow-sm" style={{ background: '#161b27', border: '1px solid #2a3142' }}>
        <QuestionsTable
          questions={filtered as any}
          page={page}
          pageSize={pageSize}
          totalCount={displayCount}
          basePath={basePath}
        />

        {/* ── Integrated Pagination Footer ── */}
        {displayCount > 0 && (
          <div className="grid grid-cols-3 items-center px-5 py-3 border-t bg-[#161b27]" style={{ borderColor: '#2a3142' }}>
            {/* Left */}
            <div className="flex items-center justify-start">
              <PageSizeSelect currentSize={pageSize} basePath={basePath} />
            </div>

            {/* Center: Pagination Controls */}
            <div className="flex items-center justify-center gap-1.5">
              <Link
                href={page > 1 ? `${basePath}?${new URLSearchParams({ ...params as Record<string, string>, page: String(page - 1) }).toString()}` : '#'}
                className={`flex items-center gap-1 px-3 h-8 rounded-md text-[13px] font-bold transition-all ${
                  page > 1
                    ? 'bg-[#1c2333] text-[#94a3b8] hover:text-white hover:bg-[#2a3142] border border-[#2a3142] hover:border-white/20'
                    : 'bg-transparent text-[#64748b] opacity-50 cursor-not-allowed pointer-events-none'
                }`}
                aria-label="Previous Page"
              >
                <ChevronLeft className="h-4 w-4 -ml-1" />
                Prev
              </Link>
              
              {(() => {
                const maxVisible = 5;
                let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
                let endPage = startPage + maxVisible - 1;

                if (endPage > totalPages) {
                  endPage = totalPages;
                  startPage = Math.max(1, endPage - maxVisible + 1);
                }

                const pages = [];
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <Link
                      key={i}
                      href={`${basePath}?${new URLSearchParams({ ...params as Record<string, string>, page: String(i) }).toString()}`}
                      className={`flex items-center justify-center size-8 rounded-md text-[13px] font-bold transition-all ${
                        page === i
                          ? (visibility === 'exam' ? 'bg-violet-600 text-white shadow-sm' : 'bg-blue-600 text-white shadow-sm')
                          : 'bg-[#1c2333] text-[#94a3b8] hover:text-white hover:bg-[#2a3142] border border-[#2a3142]'
                      }`}
                    >
                      {i}
                    </Link>
                  )
                }
                return pages;
              })()}

              <Link
                href={page < totalPages ? `${basePath}?${new URLSearchParams({ ...params as Record<string, string>, page: String(page + 1) }).toString()}` : '#'}
                className={`flex items-center gap-1 px-3 h-8 rounded-md text-[13px] font-bold transition-all ${
                  page < totalPages
                    ? 'bg-[#1c2333] text-[#94a3b8] hover:text-white hover:bg-[#2a3142] border border-[#2a3142] hover:border-white/20'
                    : 'bg-transparent text-[#64748b] opacity-50 cursor-not-allowed pointer-events-none'
                }`}
                aria-label="Next Page"
              >
                Next
                <ChevronRight className="h-4 w-4 -mr-1" />
              </Link>
            </div>

            {/* Right: Record count */}
            <div className="flex items-center justify-end">
              <span className="text-[13px] font-medium" style={{ color: '#94a3b8' }}>
                <span className="text-white">{Math.min((page - 1) * pageSize + 1, displayCount)}</span>
                {' '}-{' '}
                <span className="text-white">{Math.min(page * pageSize, displayCount)}</span>
                {' '}of{' '}
                <span className="text-white">{displayCount.toLocaleString()}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
