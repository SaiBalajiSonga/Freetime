import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ResultsClient from './results-client'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default async function AdminExamResultsPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  const { examId } = await params
  const supabase = await createAdminClient()

  // Fetch the exam
  const { data: exam, error: examError } = await supabase
    .from('weekly_exams')
    .select('*')
    .eq('id', examId)
    .single()

  if (examError || !exam) {
    redirect('/admin/weekly-exams')
  }

  // Fetch the leaderboard data using RPC
  const { data: leaderboard, error: lbError } = await supabase
    .rpc('get_jee_leaderboard', { p_weekly_exam_id: examId })

  if (lbError) {
    console.error('Leaderboard fetch error:', lbError)
  }

  // Calculate summary stats
  const totalParticipants = leaderboard?.length || 0
  const maxScore = exam.question_ids ? exam.question_ids.length * 4 : 0
  let avgScore = 0
  let highestScore = 0
  let lowestScore = 0

  if (totalParticipants > 0) {
    const scores = leaderboard!.map((row: any) => row.score)
    avgScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / totalParticipants)
    highestScore = Math.max(...scores)
    lowestScore = Math.min(...scores)
  }

  const stats = {
    totalParticipants,
    maxScore,
    avgScore,
    highestScore,
    lowestScore
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/weekly-exams"
          className="p-2 hover:bg-[#2a3142] rounded-lg transition-colors text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            {exam.title} <span className="text-sm font-normal text-slate-400 bg-[#2a3142] px-2 py-0.5 rounded-full">Results</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Data analysis and leaderboard for this weekly exam.
          </p>
        </div>
      </div>

      <ResultsClient 
        exam={exam} 
        leaderboard={leaderboard || []} 
        stats={stats} 
      />
    </div>
  )
}
