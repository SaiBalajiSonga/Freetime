import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/site/dashboard-ui'
import { FileText, Download, BookOpen } from 'lucide-react'

export const metadata = {
  title: 'Learn — Study Materials',
}

export default async function LearnPage() {
  const supabase = await createClient()

  let materials: any[] = []
  try {
    const { data } = await supabase
      .from('study_materials')
      .select('*, subjects(name)')
      .order('created_at', { ascending: false })
    materials = data || []
  } catch (e) {
    console.error(e)
  }

  return (
    <div className="space-y-8 animate-in-up">
      <PageHeader 
        title="Study Materials" 
        subtitle="Access PDF notes, summaries, and resources." 
      />
      
      {materials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((m) => (
            <div key={m.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="size-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                {m.subjects?.name && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    {m.subjects.name}
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">{m.title}</h3>
              {m.description && (
                <p className="text-sm text-slate-500 mb-6 line-clamp-2 flex-1">{m.description}</p>
              )}
              {!m.description && <div className="flex-1 mb-6" />}
              
              <a 
                href={m.file_url} 
                target="_blank" 
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-primary)] hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors"
              >
                <Download className="w-4 h-4" />
                View & Download PDF
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-8 rounded-3xl border-2 border-dashed border-[var(--color-border)] bg-slate-50/50">
          <div className="size-20 rounded-2xl bg-white shadow-xl border border-blue-100 flex items-center justify-center mb-6">
            <BookOpen className="h-10 w-10 text-blue-500" />
          </div>
          <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">No Materials Yet</h2>
          <p className="text-muted max-w-md mx-auto leading-relaxed">
            Your instructors haven't uploaded any study materials yet. They will appear here when available.
          </p>
        </div>
      )}
    </div>
  )
}
