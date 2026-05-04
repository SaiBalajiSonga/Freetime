import { createClient } from '@/lib/supabase/server'
import QuestionView from './question-view'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function QuestionPage({ params }: { params: Promise<{ questionId: string }> }) {
  const { questionId } = await params
  const supabase = await createClient()

  const [
    { data: question, error: qError },
    { data: options, error: optError },
    { data: authUser }
  ] = await Promise.all([
    supabase.from('questions').select('*, chapters(id, name, subjects(id, name))').eq('id', questionId).single(),
    supabase.from('question_options').select('*').eq('question_id', questionId).order('id'),
    supabase.auth.getUser()
  ])

  if (qError || !question) {
    return <div>Question not found or error loading it.</div>
  }

  let attempts: any[] = []
  if (authUser.user) {
    const { data: attemptList } = await supabase
      .from('attempts')
      .select('*')
      .eq('question_id', questionId)
      .eq('user_id', authUser.user.id)
      .order('created_at', { ascending: false })
    
    if (attemptList) attempts = attemptList
  }

  return (
    <div className="space-y-4">
      <div>
        <Link href={`/chapters/${question?.chapters?.id}`} className="inline-flex items-center gap-2 text-sm text-muted-2 hover:text-accent-electric mb-4 transition-colors font-medium">
          <ArrowLeft className="h-4 w-4" />
          Back to {question?.chapters?.name}
        </Link>
      </div>
      
      <QuestionView 
        question={question} 
        options={options || []} 
        attempts={attempts} 
      />
    </div>
  )
}
