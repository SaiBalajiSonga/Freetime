'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Send, Loader2, X, AlertCircle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Announcement = {
  id: string
  title: string
  message: string
  type?: string
  priority?: string
  created_at: string
}

export default function AdminAnnouncementsClient({ initialAnnouncements }: { initialAnnouncements: Announcement[] }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('General Info')
  const [priority, setPriority] = useState('Normal')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const supabase = createClient()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !message.trim()) return

    setIsSubmitting(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('announcements')
      .insert({ title, message, type, priority })
      .select()
      .single()

    setIsSubmitting(false)

    if (err) {
      setError(err.message)
    } else if (data) {
      setAnnouncements([data, ...announcements])
      setTitle('')
      setMessage('')
      setType('General Info')
      setPriority('Normal')
      setIsModalOpen(false) // Close modal on success
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    
    setAnnouncements(announcements.filter(a => a.id !== id))
    await supabase.from('announcements').delete().eq('id', id)
  }

  return (
    <>
      <div className="p-5 sm:p-8 w-full animate-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Manage Announcements</h1>
            <p className="text-sm text-slate-400">Broadcast important updates, events, and maintenance alerts to all students.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-500 transition-colors shrink-0 shadow-lg shadow-blue-500/20"
          >
            <Plus className="h-4 w-4" />
            New Announcement
          </button>
        </div>

        {/* Main Content: Recent Announcements */}
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 border border-dashed border-[#30363d] rounded-xl bg-[#161b22]/30">
              <div className="size-12 rounded-full bg-[#161b22] border border-[#30363d] flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-slate-500" />
              </div>
              <h3 className="text-white font-medium mb-1">No Announcements Yet</h3>
              <p className="text-sm text-slate-400">Click "New Announcement" to broadcast your first message.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {announcements.map(announcement => (
                <div 
                  key={announcement.id} 
                  className="flex flex-col p-5 rounded-xl border shadow-sm transition-colors hover:border-[#4b5563] group"
                  style={{ background: '#161b22', borderColor: '#30363d' }}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex flex-col items-start gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest ${
                          (announcement.priority || 'Normal') === 'Critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          (announcement.priority || 'Normal') === 'High' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                          'bg-[#0d1117] text-slate-400 border border-[#30363d]'
                        }`}>
                          {announcement.priority || 'Normal'}
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {announcement.type || 'General Info'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-[17px] text-white leading-tight">{announcement.title}</h3>
                    </div>
                    <button 
                      onClick={() => handleDelete(announcement.id)}
                      className="p-1.5 -mr-1.5 -mt-1.5 text-slate-500 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-rose-500/10 hover:text-rose-400 rounded-md transition-all shrink-0"
                      title="Delete Announcement"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-[14px] text-slate-300 whitespace-pre-wrap leading-relaxed flex-1 mb-5">{announcement.message}</p>
                  <div className="mt-auto pt-4 border-t border-[#30363d]/50 flex items-center justify-between">
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                      Broadcasted on
                    </p>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      {new Date(announcement.created_at).toLocaleDateString(undefined, { 
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Announcement */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="w-full max-w-2xl rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            style={{ background: '#0d1117', borderColor: '#30363d' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d] bg-[#161b22]">
              <div>
                <h2 className="text-[17px] font-semibold text-white">Broadcast Announcement</h2>
                <p className="text-[12px] text-slate-400 mt-0.5">Send a notification to all active students on the platform.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-[#30363d] rounded-md transition-colors shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              {error && <p className="text-sm text-rose-400 mb-5 bg-rose-500/10 p-3 rounded-md border border-rose-500/20">{error}</p>}
              <form onSubmit={handleCreate} className="space-y-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Category</label>
                    <Select value={type} onValueChange={(val) => val && setType(val)}>
                      <SelectTrigger className="w-full rounded-lg border px-4 py-5 text-[14px] text-white focus:ring-1 focus:ring-blue-500 bg-[#161b22] border-[#30363d] shadow-sm">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent 
                        alignItemWithTrigger={false} 
                        align="start"
                        className="bg-[#0d1117] border border-[#30363d] text-slate-300 shadow-xl w-[calc(var(--anchor-width))] rounded-lg overflow-hidden"
                      >
                        <SelectItem value="General Info" className="focus:bg-[#161b22] focus:text-white cursor-pointer py-2.5 px-3 rounded-md">General Info</SelectItem>
                        <SelectItem value="Platform Update" className="focus:bg-[#161b22] focus:text-white cursor-pointer py-2.5 px-3 rounded-md">Platform Update</SelectItem>
                        <SelectItem value="Maintenance" className="focus:bg-[#161b22] focus:text-white cursor-pointer py-2.5 px-3 rounded-md">Maintenance Alert</SelectItem>
                        <SelectItem value="Event / Contest" className="focus:bg-[#161b22] focus:text-white cursor-pointer py-2.5 px-3 rounded-md">Event / Contest</SelectItem>
                        <SelectItem value="New Feature" className="focus:bg-[#161b22] focus:text-white cursor-pointer py-2.5 px-3 rounded-md">New Feature</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Priority Level</label>
                    <Select value={priority} onValueChange={(val) => val && setPriority(val)}>
                      <SelectTrigger className="w-full rounded-lg border px-4 py-5 text-[14px] text-white focus:ring-1 focus:ring-blue-500 bg-[#161b22] border-[#30363d] shadow-sm">
                        <SelectValue placeholder="Select Priority" />
                      </SelectTrigger>
                      <SelectContent 
                        alignItemWithTrigger={false} 
                        align="start"
                        className="bg-[#0d1117] border border-[#30363d] text-slate-300 shadow-xl w-[calc(var(--anchor-width))] rounded-lg overflow-hidden"
                      >
                        <SelectItem value="Normal" className="focus:bg-[#161b22] focus:text-white cursor-pointer py-2.5 px-3 rounded-md">Normal (Standard styling)</SelectItem>
                        <SelectItem value="High" className="focus:bg-[#161b22] focus:text-white cursor-pointer py-2.5 px-3 rounded-md">High (Highlighted styling)</SelectItem>
                        <SelectItem value="Critical" className="focus:bg-[#161b22] focus:text-white cursor-pointer py-2.5 px-3 rounded-md">Critical (Urgent alert styling)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Announcement Title</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    className="w-full rounded-lg border px-4 py-2.5 text-[15px] font-medium text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500 bg-[#161b22] border-[#30363d] transition-shadow shadow-sm"
                    placeholder="e.g. Scheduled System Maintenance This Sunday"
                    required
                  />
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Message Body</label>
                    <span className="text-[11px] text-slate-500 font-medium">Supports plain text line breaks</span>
                  </div>
                  <textarea 
                    value={message} 
                    onChange={e => setMessage(e.target.value)} 
                    className="w-full rounded-lg border px-4 py-3 text-[14px] min-h-[180px] text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y placeholder-slate-500 bg-[#161b22] border-[#30363d] transition-shadow leading-relaxed shadow-sm"
                    placeholder="Write the exact details of the announcement here. Be as clear and concise as possible..."
                    required
                  />
                </div>
                
                <div className="pt-5 flex items-center justify-end gap-3 border-t border-[#30363d] mt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-lg text-[14px] font-semibold text-slate-300 hover:text-white hover:bg-[#30363d] transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-7 py-2.5 rounded-lg text-[14px] font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50 shadow-md shadow-blue-500/20"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Broadcast Now
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
