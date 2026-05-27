import { Hammer, Wrench } from 'lucide-react'
import { PageHeader } from '@/components/site/dashboard-ui'

export const metadata = {
  title: 'Learn — Under Development',
}

export default function LearnPage() {
  return (
    <div className="space-y-8 animate-in-up">
      <PageHeader 
        title="Learn" 
        subtitle="Comprehensive learning modules and interactive lessons." 
      />
      
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 rounded-3xl border-2 border-dashed border-[var(--color-border)] bg-slate-50/50">
        <div className="relative mb-6">
          <div className="absolute -inset-4 bg-blue-100 rounded-full blur-xl opacity-50 animate-pulse" />
          <div className="relative size-20 rounded-2xl bg-white shadow-xl border border-blue-100 flex items-center justify-center">
            <Hammer className="h-10 w-10 text-blue-500" />
            <Wrench className="h-8 w-8 text-blue-400 absolute -bottom-2 -right-2" />
          </div>
        </div>
        
        <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">Under Development</h2>
        <p className="text-muted max-w-md mx-auto leading-relaxed">
          We are currently building this section to bring you rich, interactive learning materials. Check back soon for updates!
        </p>
      </div>
    </div>
  )
}
