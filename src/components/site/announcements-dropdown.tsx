'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, CheckCircle2, Settings, FileText, BookOpen, Trophy, Megaphone, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type Announcement = {
  id: string
  title: string
  message: string
  type: string
  priority: string
  created_at: string
}

function getNotificationDetails(type: string, priority: string) {
  switch (type) {
    case 'Test':
      return { icon: FileText, color: 'text-blue-500', href: '/exams' }
    case 'Material':
      return { icon: BookOpen, color: 'text-purple-500', href: '/learn' }
    case 'Rank':
      return { icon: Trophy, color: 'text-amber-500', href: '/exams' }
    default:
      if (priority === 'Critical' || priority === 'High') {
        return { icon: AlertCircle, color: 'text-red-500', href: null }
      }
      return { icon: Megaphone, color: 'text-slate-500', href: null }
  }
}

export function AnnouncementsDropdown({ 
  initialUnread, 
  initialAnnouncements,
  userId,
  settings,
  lastReadDate
}: { 
  initialUnread: boolean
  initialAnnouncements: Announcement[]
  userId: string
  settings?: { tests: boolean; materials: boolean; ranks: boolean; general: boolean }
  lastReadDate?: string | null
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements)
  const [hasUnread, setHasUnread] = useState(initialUnread)
  // Only show loading state if we don't have initial announcements
  const [isLoading, setIsLoading] = useState(initialAnnouncements.length === 0)
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
    if (announcements.length === 0) setIsLoading(true)
    
    // Determine which types to fetch based on settings
    const allowedTypes = []
    if (settings?.general !== false) {
      allowedTypes.push('General Info', 'Platform Update', 'Maintenance', 'Event / Contest', 'New Feature')
    }
    if (settings?.tests !== false) allowedTypes.push('Test')
    if (settings?.materials !== false) allowedTypes.push('Material')
    if (settings?.ranks !== false) allowedTypes.push('Rank')
    
    // Fallback if somehow they disabled everything, but we still need a valid query
    if (allowedTypes.length === 0) {
      setAnnouncements([])
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .in('type', allowedTypes)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) {
        console.error('Error fetching announcements:', error)
      } else if (data) {
        setAnnouncements(data)
      }
    } catch (err) {
      console.error('Exception fetching announcements:', err)
    } finally {
      setIsLoading(false)
    }
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
        <div className="absolute -right-2 sm:-right-4 mt-2 w-[calc(100vw-2rem)] sm:w-[480px] bg-white border border-[var(--color-border)] rounded-lg shadow-xl z-50 overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-foreground text-lg">Announcements</h3>
            <div className="flex items-center gap-3">
              <a 
                href="/settings#notifications" 
                onClick={() => setIsOpen(false)} 
                className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 -m-1.5" 
                aria-label="Notification Settings"
                title="Notification Settings"
              >
                <Settings className="size-5" strokeWidth={1.5} />
              </a>
            </div>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto overscroll-contain flex flex-col">
            {isLoading && announcements.length === 0 ? (
              <div className="p-5 space-y-6 flex-1 min-h-[240px]">
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
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[280px]">
                <div className="size-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 ring-1 ring-slate-100/50 shadow-inner">
                  <Bell className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                </div>
                <h4 className="text-[16px] font-bold text-slate-800 mb-1.5 tracking-tight">You're completely up to date</h4>
                <p className="text-[14px] text-slate-500">
                  Check back later for new alerts and system updates.
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {announcements.map((announcement) => {
                  const details = getNotificationDetails(announcement.type, announcement.priority)
                  const Icon = details.icon
                  const isUnread = lastReadDate ? new Date(announcement.created_at) > new Date(lastReadDate) : true

                  const content = (
                    <div className={cn(
                      "flex gap-4 p-4 transition-all border-b border-slate-100 last:border-0",
                      isUnread ? "bg-white hover:bg-slate-50/50" : "bg-slate-100/40 hover:bg-slate-100/60"
                    )}>
                      <div className="mt-1 shrink-0">
                        <Icon 
                          className={cn("size-5", isUnread ? details.color : "text-slate-400")} 
                          strokeWidth={isUnread ? 2 : 1.5} 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <h4 className={cn(
                            "text-sm pr-2 truncate",
                            isUnread ? "font-bold text-slate-900" : "font-medium text-slate-700"
                          )}>
                            {announcement.title}
                          </h4>
                          <span className={cn(
                            "text-[11px] whitespace-nowrap shrink-0",
                            isUnread ? "font-bold text-blue-600" : "font-medium text-slate-400"
                          )}>
                            {new Date(announcement.created_at).toLocaleDateString(undefined, { 
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <p className={cn(
                          "text-[13px] leading-relaxed line-clamp-2",
                          isUnread ? "font-medium text-slate-700" : "text-slate-500"
                        )}>
                          {announcement.message}
                        </p>
                      </div>
                      {isUnread && (
                        <div className="shrink-0 mt-1.5 pr-1">
                          <div className="size-2 bg-blue-500 rounded-full" />
                        </div>
                      )}
                    </div>
                  )

                  if (details.href) {
                    return (
                      <Link key={announcement.id} href={details.href} onClick={() => setIsOpen(false)} className="block outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
                        {content}
                      </Link>
                    )
                  }

                  return <div key={announcement.id}>{content}</div>
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
