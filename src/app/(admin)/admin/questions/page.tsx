import { FileQuestion } from 'lucide-react'
import { QuestionsDashboard } from '@/components/admin/questions-dashboard'

export const metadata = {
  title: 'PYQ Questions — Admin',
  description: 'Manage all practice and exam bank questions.',
}

export default async function AdminQuestionsPage({
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
      title="PYQ Questions"
      description="Manage all practice questions visible to students."
      icon={FileQuestion}
      iconColorClass="text-blue-400"
      visibility="public"
      basePath="/admin/questions"
      params={params}
    />
  )
}
