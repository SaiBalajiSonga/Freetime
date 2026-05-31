'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'h-[56px] bg-white/85 backdrop-blur-2xl border-b border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
          : 'h-[56px] bg-white/50 backdrop-blur-xl border-b border-transparent'
      }`}
    >
      <div className="mx-auto max-w-[1400px] h-full px-6 lg:px-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-[17px] font-[600] text-slate-900 tracking-tight font-sans">
            JEEsociety
          </span>
          <span className="text-[11px] font-[600] bg-blue-600/10 text-blue-600 px-2.5 py-0.5 rounded-full border border-blue-200/60">
            Plus
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8 text-[14px] font-[450] text-slate-400">
          <Link href="#features" className="hover:text-slate-900 transition-colors duration-200">Features</Link>
          <Link href="#showcase" className="hover:text-slate-900 transition-colors duration-200">Platform</Link>
          <Link href="#subjects" className="hover:text-slate-900 transition-colors duration-200">Subjects</Link>
          <Link href="#testimonials" className="hover:text-slate-900 transition-colors duration-200">Reviews</Link>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center h-[38px] px-6 text-[14px] font-[600] rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-[0_2px_10px_rgba(37,99,235,0.2)] active:scale-[0.97] transition-all duration-200"
          >
            Sign up
          </Link>
        </div>
      </div>
    </nav>
  )
}
