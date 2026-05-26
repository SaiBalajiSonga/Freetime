'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { NavAuth } from './nav-auth'

export function Nav() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/60 backdrop-blur-md border-b border-slate-200/50">
      <div className="mx-auto max-w-[1400px] px-6 h-[80px] flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="size-10 rounded-full border border-blue-200 flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.05] bg-white">
            <Sparkles className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 font-serif">JEE Practice</span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-12 text-[15px] font-medium text-slate-400">
          <Link href="#features" className="hover:text-slate-900 transition-colors">
            Features
          </Link>
          <Link href="#subjects" className="hover:text-slate-900 transition-colors">
            Subjects
          </Link>
          <Link href="#leaderboard" className="hover:text-slate-900 transition-colors">
            Leaderboard
          </Link>
        </div>

        {/* CTA / User Profile */}
        <NavAuth />
      </div>
    </nav>
  )
}
