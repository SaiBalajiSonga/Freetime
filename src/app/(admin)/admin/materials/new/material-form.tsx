'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { createMaterial } from './actions'
import { Alert, AlertDescription } from '@/components/ui/alert'

const inputClass =
  'w-full bg-[#121827] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors'

export function MaterialForm({ initialSubjects }: { initialSubjects: any[] }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    
    const res = await createMaterial(formData)
    if (res?.error) {
      setError(res.error)
      setIsPending(false)
    } else {
      router.push('/admin/materials')
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/admin/materials"
          className="p-2 hover:bg-[#2a3142] rounded-lg transition-colors text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Upload Study Material</h1>
          <p className="text-sm text-slate-400 mt-1">Upload a PDF resource for students.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="bg-[#1c2333] border border-white/[0.05] rounded-xl p-6 space-y-6">
        {error && (
          <Alert className="bg-red-500/10 text-red-500 border-red-500/20">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Title <span className="text-red-400">*</span></label>
            <input 
              name="title" 
              type="text" 
              required
              className={inputClass}
              placeholder="e.g. Newton's Laws Summary Notes"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea 
              name="description" 
              className={inputClass}
              placeholder="Optional brief description..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
            <select name="subject_id" className={inputClass}>
              <option value="">-- General (No specific subject) --</option>
              {initialSubjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">PDF File <span className="text-red-400">*</span></label>
            <input 
              name="file" 
              type="file" 
              accept=".pdf"
              required
              className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-slate-500 mt-2">Ensure you have created a public storage bucket named "study-materials" in Supabase.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-white/[0.05] flex justify-end">
          <Button 
            type="submit" 
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPending ? 'Uploading...' : 'Upload Material'}
          </Button>
        </div>
      </form>
    </div>
  )
}
