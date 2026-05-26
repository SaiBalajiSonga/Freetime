'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Settings, LayoutDashboard, LogOut, User, Loader2 } from 'lucide-react'

export function NavAuth() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        if (user) {
          const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
          if (!error && data) {
            setProfile(data)
          }
        }
      } catch (e) {
        console.error('Error loading user profile:', e)
      } finally {
        setLoading(false)
      }
    }
    loadUser()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        setProfile(data)
      } else {
        setProfile(null)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsOpen(false)
    router.push('/')
  }

  if (loading) {
    return <div className="h-10 w-10 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center justify-center h-11 px-7 text-[15px] font-bold rounded-full bg-blue-600 text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg active:scale-[0.98]"
      >
        Start Practicing
      </Link>
    )
  }

  // Get initials for Avatar
  const name = profile?.name || user.email || 'U'
  const initials = name.substring(0, 2).toUpperCase()

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center size-11 rounded-full bg-blue-100 border-2 border-blue-200 text-blue-700 font-bold hover:ring-4 hover:ring-blue-100 transition-all focus:outline-none"
      >
        {initials}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="px-4 py-4 border-b border-slate-50 bg-slate-50/50">
            <p className="text-sm font-bold text-slate-900 truncate">{profile?.name || 'User'}</p>
            <p className="text-xs text-slate-500 font-medium truncate">{user.email}</p>
            {profile?.display_id && (
              <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-md">
                ID: {profile.display_id}
              </span>
            )}
            {profile?.is_admin && (
              <span className="inline-block mt-2 ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-md">
                Admin
              </span>
            )}
          </div>
          
          <div className="p-2 space-y-1">
            <Link 
              href="/dashboard" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              Dashboard
            </Link>
            <Link 
              href="/settings" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              Account Settings
            </Link>
          </div>

          <div className="p-2 border-t border-slate-50">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-red-600 rounded-xl hover:bg-red-50 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
