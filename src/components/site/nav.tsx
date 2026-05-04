'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export function Nav() {
  return (
    <nav className="fixed top-0 w-full z-50 nav-glass">
      <div className="mx-auto max-w-7xl px-6 h-[72px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="size-10 rounded-xl icon-3d-blue border border-accent-electric/25 transition-transform duration-300 group-hover:scale-[1.03]">
            <Sparkles className="w-5 h-5 text-accent-electric" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">JEE Practice</span>
        </Link>

        <div className="hidden md:flex items-center gap-10 text-sm font-medium text-muted-2">
          <Link href="#features" className="hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="#subjects" className="hover:text-foreground transition-colors">
            Subjects
          </Link>
          <Link href="#leaderboard" className="hover:text-foreground transition-colors">
            Leaderboard
          </Link>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center h-10 px-6 text-sm font-semibold rounded-pill bg-gradient-primary text-white shadow-[0_8px_28px_-8px_rgba(59,130,246,0.55)] transition-all hover:brightness-110 active:scale-[0.98]"
        >
          Start Practicing
        </Link>
      </div>
    </nav>
  )
}
