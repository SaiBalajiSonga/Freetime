'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    let mounted = true
    async function getUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (mounted) {
          setUser(session?.user || null)
          setLoading(false)
        }
      } catch {
        if (mounted) setLoading(false)
      }
    }
    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setUser(session?.user || null)
      }
    })

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <nav 
      className={`fixed top-0 w-full z-50 transition-all duration-300 border-b border-[rgba(255,255,255,0.07)] ${
        scrolled 
          ? 'h-[60px] bg-[rgba(10,10,15,0.92)] backdrop-blur-[32px] saturate-[180%]' 
          : 'h-[60px] bg-[rgba(10,10,15,0.85)] backdrop-blur-[20px] saturate-[180%]'
      }`}
    >
      <div className="mx-auto max-w-[1280px] h-full px-6 lg:px-12 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-[18px] font-[400] font-editorial text-[#F0F0FA] tracking-tight">
            JEEsociety
          </span>
          <span className="text-[12px] font-[500] font-geist bg-[#2D6EF5]/15 text-[#2D6EF5] px-2 py-0.5 rounded-full border border-[#2D6EF5]/30">
            Plus
          </span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8 font-geist text-[14px] font-[400] text-[#8A8AAF]">
          <Link href="#features" className="hover:text-[#F0F0FA] transition-colors duration-200">
            Features
          </Link>
          <Link href="#showcase" className="hover:text-[#F0F0FA] transition-colors duration-200">
            Prep Feed
          </Link>
          <Link href="#subjects" className="hover:text-[#F0F0FA] transition-colors duration-200">
            Subjects
          </Link>
          <Link href="#testimonials" className="hover:text-[#F0F0FA] transition-colors duration-200">
            Testimonials
          </Link>
        </div>

        {/* CTA Button */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="w-[120px] h-[36px] flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-[#8A8AAF]" />
            </div>
          ) : (
            <Link
              href={user ? '/dashboard' : '/login'}
              className="inline-flex items-center justify-center h-[36px] px-5 text-[14px] font-[500] font-geist rounded-full text-white bg-gradient-to-r from-[#2D6EF5] to-[#1A4FD4] hover:brightness-[1.1] hover:shadow-[0_0_20px_rgba(45,110,245,0.3)] active:scale-[0.97] transition-all duration-200"
            >
              {user ? 'Enter Platform' : 'Sign In'}
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
