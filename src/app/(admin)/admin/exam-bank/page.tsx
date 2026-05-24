import { Archive } from 'lucide-react'
import { QuestionsDashboard } from '@/components/admin/questions-dashboard'

export const metadata = {
  title: 'Exam Bank — Admin',
  description: 'Manage hidden questions for weekly exams.',
}

export default async function AdminExamBankPage({
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

  return (
    <QuestionsDashboard
      title="Exam Bank"
      description={
        <>
          Questions here are <span className="font-semibold text-white">invisible to students</span> during practice.
        </>
      }
      icon={Archive}
      iconColorClass="text-violet-400"
      visibility="exam"
      basePath="/admin/exam-bank"
      params={params}
    />
  )
}
