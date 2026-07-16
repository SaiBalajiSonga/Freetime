import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, BookOpen, FileText } from 'lucide-react'

export default async function AdminMaterialsPage() {
  const supabase = createAdminClient()

  // Fetch materials
  // Wrapping in try-catch in case the user hasn't run the SQL script yet to prevent 500 errors
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
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <BookOpen className="text-blue-500 w-6 h-6" />
            Study Materials
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage PDFs and study resources for students.
          </p>
        </div>
        <Link
          href="/admin/materials/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Material
        </Link>
      </div>

      <div className="bg-[#1c2333] border border-white/[0.05] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121827] border-b border-white/[0.05] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-5">Title</th>
                <th className="py-4 px-5">Subject</th>
                <th className="py-4 px-5">File URL</th>
                <th className="py-4 px-5 text-right">Date Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {materials.length > 0 ? (
                materials.map((m) => (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-5 text-sm font-bold text-white">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-500" />
                        {m.title}
                      </div>
                      {m.description && (
                        <p className="text-xs text-slate-500 mt-1 font-normal line-clamp-1">{m.description}</p>
                      )}
                    </td>
                    <td className="py-3 px-5 text-sm font-medium text-slate-200">
                      {m.subjects?.name || 'General'}
                    </td>
                    <td className="py-3 px-5 text-sm text-slate-400">
                      <a href={m.file_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                        View PDF
                      </a>
                    </td>
                    <td className="py-3 px-5 text-sm text-right text-slate-500 font-medium">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 text-sm">
                    No study materials uploaded yet. Click "Add Material" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
