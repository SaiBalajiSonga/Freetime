'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Settings, LayoutDashboard, LogOut, User, Loader2, Shield } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function NavAuth({ initialUser, initialProfile, theme = 'light' }: { initialUser?: any, initialProfile?: any, theme?: 'light' | 'dark' }) {
  const [user, setUser] = useState<any>(initialUser || null)
  const [profile, setProfile] = useState<any>(initialProfile || null)
  const [loading, setLoading] = useState(initialUser === undefined)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const fetchedRef = useRef(false)

  useEffect(() => {
    let mounted = true

    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!mounted) return
        
        setUser(user)
        
        // Stop the loading spinner immediately once we have the auth session
        setLoading(false)
        
        if (user) {
          // Fetch profile details in the background so it doesn't block the avatar
          const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
          if (!error && data && mounted) {
            setProfile(data)
          }
        }
      } catch (e: any) {
        if (e.name !== 'AbortError' && !e.message?.includes('Lock')) {
          console.error('Error loading user profile:', e)
        }
        if (mounted) setLoading(false)
      }
    }

    // Only fetch client-side if we didn't get data from the server
    if (initialUser === undefined && !fetchedRef.current) {
      fetchedRef.current = true
      loadUser()
    } else {
      setLoading(false)
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (mounted) setProfile(data)
      } else {
        if (mounted) setProfile(null)
      }
    })

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [supabase, initialUser])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return <div className="h-11 w-11 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
  }

  if (!user) {
    return (
      <Link
        href="/"
        className="flex items-center justify-center size-10 rounded-full bg-slate-50 border border-slate-200/80 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors shadow-sm"
        title="Log in"
      >
        <User className="w-4 h-4" />
      </Link>
    )
  }

  // Get initials for Avatar
  const name = profile?.name || user.email || 'U'
  const initials = name.substring(0, 2).toUpperCase()

  const isDark = theme === 'dark'
  const isAdminRoute = pathname?.startsWith('/admin')

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            className={`flex items-center justify-center size-10 rounded-full border-2 font-semibold tracking-tight text-[13px] transition-all focus:outline-none shadow-sm ${
              isDark 
                ? 'bg-[#1a2030] border-[#2d3748] text-blue-300 hover:ring-4 hover:ring-white/10' 
                : 'bg-gradient-to-b from-blue-50 to-blue-100/50 border-blue-200/80 text-blue-700 hover:ring-4 hover:ring-blue-100/50 hover:border-blue-300'
            }`}
          >
            {initials}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          align="end" 
          sideOffset={8}
          className={`w-[270px] rounded-xl border p-1 z-50 backdrop-blur-xl ${
            isDark
              ? 'bg-[#141b2d] border-[#2a3650] shadow-[0_8px_40px_rgb(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.05)]'
              : 'bg-white/95 border-slate-200/70 shadow-[0_12px_36px_rgb(15,23,42,0.08)]'
          }`}
        >
          {/* Header Section */}
          <div className="px-2.5 py-3">
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center size-9 shrink-0 rounded-full border shadow-sm font-semibold text-[13px] tracking-tight ${
                isDark 
                  ? 'bg-[#1a2030] border-[#2d3748] text-blue-300' 
                  : 'bg-gradient-to-b from-slate-50 to-slate-100 border-slate-200/80 text-slate-700'
              }`}>
                {initials}
              </div>
              <div className="flex flex-col overflow-hidden">
                <p className={`text-[14px] leading-tight font-semibold tracking-tight truncate ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                  {profile?.name || 'User'}
                </p>
                <p className={`text-[12px] font-medium tracking-tight truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {user.email}
                </p>
              </div>
            </div>
            
            {(profile?.display_id || profile?.is_admin) && (
              <div className="flex items-center gap-2 mt-3.5 pl-0.5">
                {profile?.display_id && (
                  <span className={`inline-flex items-center px-2 py-[3px] text-[9.5px] font-bold uppercase tracking-[0.06em] rounded-md ${
                    isDark ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-200/50'
                  }`}>
                    ID: {profile.display_id}
                  </span>
                )}
                {profile?.is_admin && (
                  <span className={`inline-flex items-center px-2 py-[3px] text-[9.5px] font-bold uppercase tracking-[0.06em] rounded-md ${
                    isDark ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20' : 'bg-purple-50/80 text-purple-600 border border-purple-200/50'
                  }`}>
                    Admin
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className={`h-px w-full my-1 ${isDark ? 'bg-[#1e2536]' : 'bg-slate-100'}`} />
          
          {/* Menu Items Section */}
          <div className="p-1 space-y-0.5">
            {profile?.is_admin && !isAdminRoute && (
              <DropdownMenuItem asChild className={`cursor-pointer flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium tracking-tight rounded-md transition-all duration-200 ${
                isDark 
                  ? 'text-slate-300 hover:bg-[#1a2030] hover:text-white focus:bg-[#1a2030] focus:text-white' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus:bg-slate-50 focus:text-slate-900'
              }`}>
                <Link href="/admin">
                  <Shield className={`w-[15px] h-[15px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                  Admin Console
                </Link>
              </DropdownMenuItem>
            )}
            
            {(!profile?.is_admin || isAdminRoute) && (
              <DropdownMenuItem asChild className={`cursor-pointer flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium tracking-tight rounded-md transition-all duration-200 ${
                isDark 
                  ? 'text-slate-300 hover:bg-[#1a2030] hover:text-white focus:bg-[#1a2030] focus:text-white' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus:bg-slate-50 focus:text-slate-900'
              }`}>
                <Link href="/dashboard">
                  <LayoutDashboard className={`w-[15px] h-[15px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                  Student Dashboard
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem asChild className={`cursor-pointer flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium tracking-tight rounded-md transition-all duration-200 ${
              isDark 
                ? 'text-slate-300 hover:bg-[#1a2030] hover:text-white focus:bg-[#1a2030] focus:text-white' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus:bg-slate-50 focus:text-slate-900'
            }`}>
              <Link href="/settings">
                <Settings className={`w-[15px] h-[15px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                Account Settings
              </Link>
            </DropdownMenuItem>
          </div>

          <div className={`h-px w-full my-1 ${isDark ? 'bg-[#1e2536]' : 'bg-slate-100'}`} />

          <div className="p-1">
            <DropdownMenuItem 
              onClick={handleLogout}
              className={`cursor-pointer w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium tracking-tight rounded-md transition-all duration-200 ${
                isDark 
                  ? 'text-red-400 hover:bg-red-500/15 focus:bg-red-500/15 focus:text-red-300' 
                  : 'text-red-600 hover:bg-red-50/80 focus:bg-red-50/80 focus:text-red-700'
              }`}
            >
              <LogOut className={`w-[15px] h-[15px] ${isDark ? 'text-red-400' : 'text-red-500/70'}`} />
              Log out
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
