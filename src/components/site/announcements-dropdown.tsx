'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type Announcement = {
  id: string
  title: string
  message: string
  created_at: string
}

export function AnnouncementsDropdown({ 
  initialUnread, 
  userId 
}: { 
  initialUnread: boolean
  userId: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [hasUnread, setHasUnread] = useState(initialUnread)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function fetchAnnouncements() {
    setIsLoading(true)
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (data) setAnnouncements(data)
    setIsLoading(false)
  }

  async function markAsRead() {
    setHasUnread(false)
    await supabase.from('profiles').update({ 
      last_read_announcement: new Date().toISOString() 
    }).eq('id', userId)
  }

  function toggleDropdown() {
    if (!isOpen) {
      fetchAnnouncements()
      if (hasUnread) markAsRead()
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className={cn(
          "relative p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-2 transition-colors",
          isOpen && "bg-surface-2 text-foreground"
        )}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse shadow-[0_0_8px_var(--color-primary)]" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[var(--color-border)] rounded-xl shadow-xl z-50 overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-foreground">Announcements</h3>
            {!hasUnread && (
              <span className="text-[10px] uppercase font-bold text-muted flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Up to date
              </span>
            )}
          </div>
          
          <div className="max-h-[400px] min-h-[300px] overflow-y-auto overscroll-contain flex flex-col">
            {isLoading && announcements.length === 0 ? (
              <div className="p-5 space-y-6 flex-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse space-y-3">
                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                    <div className="space-y-2">
                      <div className="h-2 bg-slate-100 rounded w-full"></div>
                      <div className="h-2 bg-slate-100 rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : announcements.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="size-20 rounded-full bg-slate-50 flex items-center justify-center mb-4 ring-1 ring-slate-100/50 shadow-inner">
                  <Bell className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
                </div>
                <h4 className="text-[15px] font-bold text-slate-800 mb-1 tracking-tight">You're completely up to date</h4>
                <p className="text-[13px] text-slate-500 max-w-[240px] leading-relaxed">
                  Important announcements, platform updates, and new features will be delivered here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <h4 className="text-sm font-bold text-foreground mb-1">{announcement.title}</h4>
                    <p className="text-[11px] text-muted-2 mb-2 font-medium">
                      {new Date(announcement.created_at).toLocaleDateString(undefined, { 
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </p>
                    <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{announcement.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
