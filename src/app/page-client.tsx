'use client'

import { useState, useEffect, useActionState, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Trophy,
  Brain,
  Target,
  Sparkles,
  Activity,
  Zap,
  BarChart3,
  LineChart,
  Eye,
  EyeOff,
  Atom,
  FlaskConical,
  Sigma,
  TrendingUp,
  Star,
  ChevronDown
} from 'lucide-react'
import { Nav } from '@/components/site/nav'
import { login } from './(auth)/actions'
import { COUNTRIES } from '@/lib/countries'

/* ═══════════════════════════════════════════
   Scroll Reveal — single IntersectionObserver
   replaces 8+ framer-motion whileInView wrappers
   ═══════════════════════════════════════════ */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    if (!els.length) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('revealed')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/* ═══════════════════════════════════════════
   CountUp — lightweight animated number
   ═══════════════════════════════════════════ */
function CountUp({ end, duration = 2000 }: { end: string; duration?: number }) {
  const [count, setCount] = useState(0)
  const [ref, setRef] = useState<HTMLElement | null>(null)

  const numericEnd = parseInt(end.replace(/[^0-9]/g, '')) || 0
  const suffix = end.replace(/[0-9,]/g, '')

  useEffect(() => {
    if (!ref) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start: number | null = null
          const step = (ts: number) => {
            if (!start) start = ts
            const p = Math.min((ts - start) / duration, 1)
            setCount(Math.floor(p * numericEnd))
            if (p < 1) window.requestAnimationFrame(step)
          }
          window.requestAnimationFrame(step)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref, numericEnd, duration])

  return (
    <span ref={setRef} className="font-mono tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  )
}

/* ═══════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════ */
export default function LandingPage() {
  const [authState, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
    return await login(formData)
  }, { error: null as string | null })
  
  const [showPassword, setShowPassword] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'id' | 'email' | 'phone'>('id')
  
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES.find(c => c.code === '+91') || COUNTRIES[0])
  const countryDropdownRef = useRef<HTMLDivElement>(null)
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchBufferRef = useRef('')

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isCountryDropdownOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      // Ignore modifier keys
      if (e.ctrlKey || e.metaKey || e.altKey) return
      
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        searchBufferRef.current += e.key.toLowerCase()
        
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current)
        }
        
        searchTimeoutRef.current = setTimeout(() => {
          searchBufferRef.current = ''
        }, 600)

        const matchedCountry = COUNTRIES.find(c => c.name.toLowerCase().startsWith(searchBufferRef.current))
        
        if (matchedCountry) {
          const el = document.getElementById(`country-${matchedCountry.code}-${matchedCountry.name}`)
          if (el) {
            el.scrollIntoView({ block: 'nearest' })
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [isCountryDropdownOpen])
  
  useScrollReveal()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      <Nav />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 1 — HERO
          Centered text + 3 bento preview cards
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header
        className="relative pt-20 pb-8 lg:pb-12 overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 40%, rgba(37,99,235,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 60% 50% at 80% 30%, rgba(16,185,129,0.04) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 50% 90%, rgba(139,92,246,0.03) 0%, transparent 60%)
          `
        }}
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-16 relative z-10">

          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            
            {/* ── Left: Hero Text ── */}
            <div className="text-left max-w-[700px] flex-1">

              {/* Pill badge */}
              <div className="animate-hero inline-flex items-center gap-2.5 rounded-full border border-blue-200/80 bg-blue-50/80 px-4 py-1.5 text-[11px] font-[600] tracking-[0.15em] text-blue-600 mb-8 backdrop-blur-sm">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
                ADAPTIVE PRACTICE
              </div>

              {/* Headline */}
              <h1 className="animate-hero-d1 text-[3.5rem] sm:text-[4rem] lg:text-[4.8rem] leading-[1.05] font-[800] tracking-tight font-sans text-slate-900">
                Master JEE with<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-500">depth-first</span><br />
                problem solving.
              </h1>

              {/* Description */}
              <p className="animate-hero-d2 text-[17px] text-slate-600 leading-relaxed font-[400] max-w-[500px] mt-6">
                A focused workspace for physics, chemistry, and mathematics — with analytics that surface what to drill next.
              </p>

              {/* Social Proof / Avatars */}
              <div className="animate-hero-d2 flex items-center justify-start gap-3.5 mt-8">
                <div className="flex items-center gap-4 text-[14px] text-slate-500 font-[500]">
                  <div className="flex -space-x-2">
                    <div className="size-8 rounded-full border-2 border-slate-50 bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 z-30">AS</div>
                    <div className="size-8 rounded-full border-2 border-slate-50 bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-600 z-20">RP</div>
                    <div className="size-8 rounded-full border-2 border-slate-50 bg-violet-100 flex items-center justify-center text-[10px] font-bold text-violet-600 z-10">SD</div>
                  </div>
                  Join 12,400+ serious aspirants
                </div>
              </div>

              {/* Trust signals */}
              <div className="animate-hero-d3 flex flex-wrap items-center justify-start gap-5 mt-10 text-[13px] font-[450]">
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="size-5 rounded-md bg-blue-50 flex items-center justify-center border border-blue-100">
                    <Zap className="w-3 h-3 text-blue-500" />
                  </div>
                  High-yield sets
                </div>
                <div className="w-px h-3.5 bg-slate-200 hidden sm:block" />
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="size-5 rounded-md bg-blue-50 flex items-center justify-center border border-blue-100">
                    <Sparkles className="w-3 h-3 text-blue-500" />
                  </div>
                  Real-time analytics
                </div>
                <div className="w-px h-3.5 bg-slate-200 hidden sm:block" />
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="size-5 rounded-md bg-blue-50 flex items-center justify-center border border-blue-100">
                    <Target className="w-3 h-3 text-blue-500" />
                  </div>
                  Adaptive difficulty
                </div>
              </div>
            </div>

            {/* ── Right: Auth Overlay ── */}
            <div id="auth" className="w-full max-w-[440px] shrink-0 relative animate-hero-d2 mt-12 lg:mt-0 scroll-mt-24">
              {/* Decorative glows behind the card */}
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-400/20 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-400/20 rounded-full blur-[80px] pointer-events-none" />
              
              {/* Auth Card */}
              <div className="relative bg-white shadow-2xl rounded-[32px] p-8 lg:p-10 z-10 border border-slate-100">
                
                {/* Login Form */}
                {authState?.error && (
                  <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-[13px] font-[600] text-red-600">
                    {authState.error}
                  </div>
                )}
                <form action={formAction} className="space-y-6">
                  <input type="hidden" name="login_method" value={loginMethod} />
                  
                  {/* Method Toggle */}
                  <div className="flex p-1 bg-slate-100/70 rounded-lg border border-slate-200/60">
                    <button type="button" onClick={() => setLoginMethod('id')} className={`flex-1 py-2 text-[13px] font-[600] rounded-md transition-all ${loginMethod === 'id' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>Unique ID</button>
                    <button type="button" onClick={() => setLoginMethod('email')} className={`flex-1 py-2 text-[13px] font-[600] rounded-md transition-all ${loginMethod === 'email' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>Email</button>
                    <button type="button" onClick={() => setLoginMethod('phone')} className={`flex-1 py-2 text-[13px] font-[600] rounded-md transition-all ${loginMethod === 'phone' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>Phone</button>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[14px] font-[600] text-slate-700" htmlFor="identifier">
                      {loginMethod === 'id' ? 'Unique ID' : loginMethod === 'email' ? 'Email Address' : 'Phone Number'}
                    </label>
                    {loginMethod === 'phone' ? (
                      <div ref={countryDropdownRef} className="flex h-[52px] rounded-lg border border-slate-200 bg-slate-50/50 shadow-sm focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-600/10 focus-within:border-blue-600 transition-all overflow-visible relative">
                        <input type="hidden" name="country_code" value={selectedCountry.code} />
                        
                        <button 
                          type="button" 
                          onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                          className="flex items-center gap-1.5 w-[75px] justify-center bg-transparent text-[14px] font-[500] text-slate-700 focus:outline-none hover:bg-slate-100/50 border-r border-slate-200 transition-colors"
                        >
                          <span className="text-[15px] font-[600]">{selectedCountry.code}</span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </button>

                        {isCountryDropdownOpen && (
                          <div className="absolute top-[calc(100%+4px)] left-0 w-[240px] max-h-[260px] overflow-y-auto bg-white border border-slate-300 shadow-lg rounded-md z-50 py-1 flex flex-col animate-in fade-in zoom-in-95 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                            {COUNTRIES.map((country) => (
                              <button
                                key={country.code + country.name}
                                id={`country-${country.code}-${country.name}`}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(country)
                                  setIsCountryDropdownOpen(false)
                                }}
                                className={`group flex items-center justify-between w-full px-4 py-1.5 text-left transition-none ${selectedCountry.code === country.code ? 'bg-slate-100' : 'hover:bg-blue-600 text-slate-700 hover:text-white'}`}
                              >
                                <span className={`text-[13px] truncate max-w-[150px] ${selectedCountry.code === country.code ? 'font-semibold text-slate-900' : 'font-normal group-hover:text-white'}`}>{country.name}</span>
                                <span className={`text-[13px] shrink-0 ${selectedCountry.code === country.code ? 'font-semibold text-slate-900' : 'text-slate-500 group-hover:text-blue-100'}`}>{country.code}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        <input 
                          id="identifier" 
                          name="identifier"
                          type="tel" 
                          pattern="[0-9]*"
                          onInput={(e) => {
                            e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '')
                          }}
                          placeholder="Enter Phone Number"
                          required
                          className="flex-1 bg-transparent px-4 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                    ) : (
                      <input 
                        id="identifier" 
                        name="identifier"
                        type={loginMethod === 'email' ? 'email' : 'text'} 
                        placeholder={`Enter ${loginMethod === 'id' ? 'Unique ID' : 'Email Address'}`}
                        required
                        className="w-full h-[52px] px-5 rounded-lg border border-slate-200 bg-slate-50/50 text-[15px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all shadow-sm"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[14px] font-[600] text-slate-700" htmlFor="password">Password</label>
                    <div className="relative">
                      <input 
                        id="password" 
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter Password"
                        required
                        className={`w-full h-[52px] py-0 leading-[52px] pl-5 pr-12 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all shadow-sm placeholder:text-[15px] placeholder:tracking-normal placeholder:font-normal ${!showPassword ? 'text-[20px] tracking-[0.15em] font-medium' : 'text-[15px]'}`}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition-colors focus:outline-none"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-[22px] h-[22px]" strokeWidth={1.25} /> : <Eye className="w-[22px] h-[22px]" strokeWidth={1.25} />}
                      </button>
                    </div>
                  </div>

                  <p className="text-[13px] text-slate-500 font-[400] leading-relaxed">
                    By Proceeding you are automatically accepting to <Link href="#" className="underline hover:text-slate-700 transition-colors underline-offset-2">T&C</Link> and <Link href="#" className="underline hover:text-slate-700 transition-colors underline-offset-2">Privacy policy</Link>.
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    <Link href="#" className="text-[14px] font-[500] text-slate-500 hover:text-slate-900 transition-colors">
                      Forgot password?
                    </Link>
                    <button type="submit" disabled={isPending} className="h-[48px] px-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-[600] text-[15px] shadow-lg shadow-blue-600/25 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                      {isPending ? 'Logging in...' : 'Login'}
                    </button>
                  </div>

                </form>
              </div>
            </div>

          </div>

          {/* ── Hero Bento Preview (3 floating cards) ── */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[1100px] mx-auto">

            {/* Card 1 — Question Preview */}
            <div className="animate-float bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 text-[11px] font-[600] rounded-full bg-blue-50 text-blue-600 border border-blue-100">Physics</span>
                <span className="text-[10px] font-[600] uppercase px-2 py-0.5 rounded-md bg-red-50 text-red-500 border border-red-100">Hard</span>
              </div>
              <p className="text-[12px] font-[500] text-slate-500 mb-1.5">Rotational Dynamics</p>
              <p className="text-[14px] font-[450] text-slate-700 leading-relaxed line-clamp-3">
                A uniform solid cylinder of mass M and radius R rolls without slipping down a plane inclined at angle θ. Determine its linear acceleration.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">JEE Advanced</span>
                <span className="text-[12px] font-[500] text-blue-600">View Solution →</span>
              </div>
            </div>

            {/* Card 2 — Accuracy Stat */}
            <div className="animate-float-d1 bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow duration-300">
              <p className="text-[12px] font-[600] text-slate-500 tracking-wide uppercase">Accuracy Rate</p>
              <h3 className="text-[40px] font-[700] font-mono text-slate-900 tracking-tight mt-1 leading-none">98%</h3>
              <div className="flex items-end justify-between mt-4">
                <span className="text-[12px] font-[500] flex items-center gap-1 text-emerald-600">
                  <TrendingUp className="w-3 h-3" />
                  +1.8% this week
                </span>
                <svg className="w-20 h-6 text-emerald-500" viewBox="0 0 100 24" fill="none">
                  <path d="M0 20 L20 14 L40 18 L60 6 L80 10 L100 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M0 20 L20 14 L40 18 L60 6 L80 10 L100 2 L100 24 L0 24 Z" fill="currentColor" opacity="0.08" />
                </svg>
              </div>
            </div>

            {/* Card 3 — Streak */}
            <div className="animate-float-d2 bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-[600] text-slate-500 uppercase tracking-widest">Consistency</span>
                <span className="text-[11px] font-[500] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Active</span>
              </div>
              <div className="flex items-center gap-2.5 mt-1">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
                  <TrendingUp className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="text-[22px] font-[600] text-slate-900 leading-tight font-editorial">47 day streak</h3>
              </div>
              <p className="text-[12px] text-slate-500 mt-1.5">Excellent mock consistency this month.</p>
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="grid grid-flow-col grid-rows-4 gap-1 justify-start">
                  {[0,1,0,2,3,0,1,2,0,1,0,2,2,3,1,1,0,3,0,2,1,2,3,2,3,2,3,3].map((a, i) => (
                    <div key={i} className={`size-2.5 rounded-[2px] ${a === 0 ? 'bg-slate-100' : a === 1 ? 'bg-emerald-200' : a === 2 ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 2 — SOCIAL PROOF BAR
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="w-full bg-white border-y border-slate-200 py-14 relative z-10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">

          <div className="reveal">
            <h3 className="text-[32px] font-[700] font-mono text-slate-900 leading-none">
              <CountUp end="12,400+" />
            </h3>
            <p className="text-[13px] font-[400] text-slate-500 mt-2">Active aspirants</p>
          </div>

          <div className="reveal reveal-d1">
            <h3 className="text-[32px] font-[700] font-mono text-slate-900 leading-none">
              <CountUp end="1,200+" />
            </h3>
            <p className="text-[13px] font-[400] text-slate-500 mt-2">Practice questions</p>
          </div>

          <div className="reveal reveal-d2">
            <h3 className="text-[32px] font-[700] font-mono text-slate-900 leading-none">
              <CountUp end="3" />
            </h3>
            <p className="text-[13px] font-[400] text-slate-500 mt-2">Subjects covered</p>
          </div>

          <div className="reveal reveal-d3">
            <h3 className="text-[32px] font-[700] font-mono text-slate-900 leading-none">
              <CountUp end="98%" />
            </h3>
            <p className="text-[13px] font-[400] text-slate-500 mt-2">Mock accuracy claimed</p>
          </div>

        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 3 — FEATURES (Bento Grid)
          1 large left + 2 stacked right
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="features" className="max-w-[1400px] mx-auto px-6 lg:px-16 py-24 relative z-10">

        {/* Section header — left aligned */}
        <div className="max-w-xl mb-14 reveal">
          <span className="text-[11px] font-[700] tracking-[0.2em] uppercase text-blue-600">Product</span>
          <h2 className="text-[2.5rem] md:text-[3rem] font-[700] font-sans mt-3 mb-4 text-slate-900 tracking-tight leading-[1.1]">
            Built for serious prep
          </h2>
          <p className="text-slate-600 text-[17px] font-[400] leading-relaxed">
            Move away from gamified quiz interfaces. Train in a high-density, focus-first study workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Large feature card — Difficulty */}
          <div className="lg:row-span-2 p-8 lg:p-10 rounded-2xl bg-white border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between reveal">
            <div>
              <div className="size-12 rounded-xl bg-blue-50 flex items-center justify-center mb-6 border border-blue-100">
                <Brain className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-[24px] font-[600] text-slate-900 mb-3 tracking-tight">Difficulty that scales</h3>
              <p className="text-slate-600 text-[15px] font-[400] leading-relaxed max-w-md">
                Move from fundamentals to exam tempo without jumping into chaos. Our adaptive engine keeps you in the stretch zone — where real growth happens.
              </p>
            </div>
            <div className="mt-10">
              <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-3">Stretch Zone Scale</div>
              <div className="h-2 rounded-full w-full bg-gradient-to-r from-emerald-400 via-blue-400 to-violet-500 shadow-sm" />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 font-mono">
                <span>Fundamentals</span>
                <span>Exam Level</span>
              </div>
            </div>
          </div>

          {/* Feature card — Analytics */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 reveal reveal-d1">
            <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center mb-5 border border-blue-100">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-[20px] font-[600] text-slate-900 mb-2 tracking-tight">Analytics you can act on</h3>
            <p className="text-slate-600 text-[14px] font-[400] leading-relaxed">
              See streaks, accuracy, and topic load — so your next session is a decision, not a guess.
            </p>
            <div className="mt-5 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Velocity</span>
              <svg className="w-24 h-6 text-emerald-500" viewBox="0 0 100 20" fill="none">
                <path d="M0 15 L20 18 L40 10 L60 12 L80 4 L100 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Feature card — Motivation */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 reveal reveal-d2">
            <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-5 border border-emerald-100">
              <Trophy className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-[20px] font-[600] text-slate-900 mb-2 tracking-tight">Motivation without noise</h3>
            <p className="text-slate-600 text-[14px] font-[400] leading-relaxed">
              Leaderboards and streaks that reward consistency — tuned to feel premium, not arcade-y.
            </p>
            <div className="mt-5 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Consistency</span>
              <div className="flex gap-1">
                {[20, 50, 100, 100, 80].map((opacity, i) => (
                  <div key={i} className="size-3 rounded-[3px]" style={{ backgroundColor: `rgba(16, 185, 129, ${opacity / 100})` }} />
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 4 — PLATFORM SHOWCASE
          3×2 grid of light-themed preview cards
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="showcase" className="bg-white border-y border-slate-200 py-24 relative z-10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-16">

          <div className="text-center max-w-2xl mx-auto mb-16 reveal">
            <span className="text-[11px] font-[700] tracking-[0.2em] uppercase text-emerald-600">How It Works</span>
            <h2 className="text-[2.5rem] md:text-[3rem] font-[700] font-sans mt-3 mb-4 text-slate-900 tracking-tight leading-[1.1]">
              Your prep feed, curated by performance
            </h2>
            <p className="text-slate-600 text-[17px] font-[400] leading-relaxed">
              Every mock rank, missed reaction, or study habit aggregated into a single editorial feed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* Showcase 1 — Question Card */}
            <div className="reveal bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 text-[11px] font-[600] rounded-full bg-blue-50 text-blue-600 border border-blue-100">Physics</span>
                <span className="text-[10px] font-[600] uppercase px-2 py-0.5 rounded-md bg-red-50 text-red-500 border border-red-100">Hard</span>
              </div>
              <p className="text-[12px] font-[500] text-slate-500 mb-1">JEE Advanced 2023 · Mechanics</p>
              <p className="text-[14px] font-[450] text-slate-700 leading-relaxed line-clamp-3">
                A particle is projected from the ground with velocity u at angle α. If its horizontal range is maximum, find the time of flight.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">JEE Advanced Syllabus</span>
                <span className="text-[12px] font-[500] text-blue-600 cursor-pointer">View Solution →</span>
              </div>
            </div>

            {/* Showcase 2 — Weekly Stat */}
            <div className="reveal reveal-d1 bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <p className="text-[12px] font-[600] text-slate-500 tracking-wide uppercase">Accuracy This Week</p>
              <h3 className="text-[36px] font-[700] font-mono text-slate-900 tracking-tight mt-1 leading-none">94.2%</h3>
              <div className="flex items-end justify-between mt-3">
                <span className="text-[12px] font-[500] flex items-center gap-1 text-emerald-600">
                  <TrendingUp className="w-3 h-3" />
                  +3.1% from last week
                </span>
                <svg className="w-20 h-7 text-emerald-500" viewBox="0 0 100 28" fill="none">
                  <path d="M0 24 L20 16 L40 20 L60 8 L80 12 L100 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M0 24 L20 16 L40 20 L60 8 L80 12 L100 2 L100 28 L0 28 Z" fill="currentColor" opacity="0.06" />
                </svg>
              </div>
            </div>

            {/* Showcase 3 — Topic Progress */}
            <div className="reveal reveal-d2 bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                    <FlaskConical className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-[11px] font-[500] text-slate-500 tracking-wider uppercase">Chemistry</span>
                    <h4 className="text-[15px] font-[600] text-slate-900 leading-tight mt-0.5">Electrochemistry</h4>
                    <p className="text-[12px] text-slate-500 mt-0.5">16 problems left</p>
                  </div>
                </div>
                <div className="relative size-11 shrink-0">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="22" cy="22" r="16" className="stroke-slate-100" strokeWidth="3.5" fill="transparent" />
                    <circle cx="22" cy="22" r="16" className="stroke-emerald-500" strokeWidth="3.5" fill="transparent"
                      strokeDasharray={2 * Math.PI * 16}
                      strokeDashoffset={2 * Math.PI * 16 * (1 - 34 / 50)}
                      strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-slate-600">68%</span>
                </div>
              </div>
            </div>

            {/* Showcase 4 — Leaderboard */}
            <div className="reveal reveal-d1 bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[14px] font-[600] text-slate-900 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-blue-500" />
                  JEE Mains Mock · Week 22
                </h4>
                <span className="text-[10px] text-slate-500 tracking-widest uppercase">Live</span>
              </div>
              <div className="space-y-1.5">
                {[
                  { rank: 1, initials: 'AN', name: 'Aman N.', score: '292', color: 'bg-blue-500' },
                  { rank: 2, initials: 'YJ', name: 'Yash J.', score: '288', color: 'bg-slate-400' },
                  { rank: 3, initials: 'SR', name: 'Suhail R.', score: '285', color: 'bg-slate-300' },
                  { rank: 4, initials: 'ME', name: 'You', score: '282', color: 'bg-blue-500', highlight: true },
                ].map((u) => (
                  <div key={u.rank} className={`flex items-center justify-between p-2 rounded-xl border transition-all ${u.highlight ? 'bg-blue-50 border-blue-200' : 'bg-slate-50/50 border-slate-200 hover:border-slate-200'}`}>
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[11px] font-mono shrink-0 w-4 text-center ${u.rank === 1 ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>#{u.rank}</span>
                      <div className={`size-6 rounded-full ${u.color} flex items-center justify-center text-[9px] font-[600] text-white shrink-0`}>{u.initials}</div>
                      <span className={`text-[13px] font-[450] text-slate-700 ${u.highlight ? 'font-[600]' : ''}`}>{u.name}</span>
                    </div>
                    <span className="text-[12px] font-mono text-slate-600">{u.score}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 text-center">
                <p className="text-[11px] text-slate-600">You&apos;re <strong className="text-blue-600">#4</strong> — 2 spots from podium</p>
              </div>
            </div>

            {/* Showcase 5 — Recommended Drill */}
            <div className="reveal reveal-d2 bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <span className="text-[10px] font-[600] text-red-500 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                Recommended Drill
              </span>
              <h4 className="text-[17px] font-[600] text-slate-900 leading-tight mt-3">
                Organic Chemistry — Named Reactions
              </h4>
              <p className="text-[12px] text-slate-600 mt-1.5 leading-relaxed">
                You missed 4 of your last 5 questions covering nucleophilic substitution reactions here.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">High Yield Chapter</span>
                <Link href="/#auth" className="text-[12px] font-[500] text-blue-600 hover:text-blue-700 transition-colors">
                  Start Drill →
                </Link>
              </div>
            </div>

            {/* Showcase 6 — Time Breakdown */}
            <div className="reveal reveal-d3 bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-[600] text-slate-500 tracking-wider uppercase">Time Breakdown</span>
                <span className="text-[10px] font-mono text-slate-500">Session Split</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Physics', pct: 40, color: 'bg-blue-500' },
                  { label: 'Chemistry', pct: 35, color: 'bg-emerald-500' },
                  { label: 'Maths', pct: 25, color: 'bg-violet-500' },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-600 font-[500]">{s.label}</span>
                      <span className="text-slate-500 font-mono">{s.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-center text-[11px] text-slate-500">
                Aggregated sessions · May 2026
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 5 — SUBJECTS
          3 cards with pastel gradient headers
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="subjects" className="max-w-[1400px] mx-auto px-6 lg:px-16 py-24 relative z-10">

        <div className="text-center max-w-2xl mx-auto mb-16 reveal">
          <span className="text-[11px] font-[700] tracking-[0.2em] uppercase text-violet-600">Subjects</span>
          <h2 className="text-[2.5rem] md:text-[3rem] font-[700] font-sans mt-3 mb-4 text-slate-900 tracking-tight leading-[1.1]">
            Every pillar of JEE, covered in depth
          </h2>
          <p className="text-slate-600 text-[17px] font-[400] leading-relaxed">
            From basic particle motion equations to advanced stereochemistry structures.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Physics */}
          <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-lg hover:scale-[1.01] transition-all duration-300 reveal">
            <div className="h-32 bg-gradient-to-br from-blue-50 to-blue-100/80 p-6 flex items-end justify-between relative overflow-hidden">
              {/* Decorative wave */}
              <svg className="absolute top-2 right-2 w-24 h-14 text-blue-300/20" viewBox="0 0 100 40">
                <path d="M0 20 Q25 5, 50 20 T100 20" stroke="currentColor" fill="none" strokeWidth="2" />
                <path d="M0 25 Q25 10, 50 25 T100 25" stroke="currentColor" fill="none" strokeWidth="1" strokeDasharray="3 3" />
              </svg>
              <div className="flex items-center gap-3 relative z-10">
                <div className="size-11 rounded-xl bg-white/80 border border-blue-200/50 flex items-center justify-center shadow-sm backdrop-blur-sm">
                  <Atom className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-[24px] font-[600] text-slate-900 font-editorial">Physics</h3>
              </div>
              <span className="text-[11px] font-[600] font-mono text-blue-600 tracking-wider uppercase relative z-10">25 Chapters</span>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-1.5">
                {['Mechanics', 'Electrostatics', 'Optics', 'Modern Physics', 'Thermodynamics'].map((ch, i) => (
                  <span key={i} className="text-[11px] font-[500] text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">{ch}</span>
                ))}
              </div>
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-200">
                <span className="text-[12px] text-slate-500">Curated syllabus</span>
                <Link href="/#auth" className="text-[13px] font-[500] text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                  Explore <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Chemistry */}
          <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-lg hover:scale-[1.01] transition-all duration-300 reveal reveal-d1">
            <div className="h-32 bg-gradient-to-br from-emerald-50 to-emerald-100/80 p-6 flex items-end justify-between relative overflow-hidden">
              <svg className="absolute top-3 right-3 w-20 h-20 text-emerald-300/20" viewBox="0 0 40 40">
                <path d="M20 5 L35 12 L35 28 L20 35 L5 28 L5 12 Z" stroke="currentColor" fill="none" strokeWidth="1.5" />
                <path d="M20 15 L28 20 L28 28 L20 32 L12 28 L12 20 Z" stroke="currentColor" fill="none" strokeWidth="1" strokeDasharray="2 2" />
              </svg>
              <div className="flex items-center gap-3 relative z-10">
                <div className="size-11 rounded-xl bg-white/80 border border-emerald-200/50 flex items-center justify-center shadow-sm backdrop-blur-sm">
                  <FlaskConical className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-[24px] font-[600] text-slate-900 font-editorial">Chemistry</h3>
              </div>
              <span className="text-[11px] font-[600] font-mono text-emerald-600 tracking-wider uppercase relative z-10">28 Chapters</span>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-1.5">
                {['Organic', 'Inorganic', 'Physical', 'Electrochemistry', 'Equilibrium'].map((ch, i) => (
                  <span key={i} className="text-[11px] font-[500] text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">{ch}</span>
                ))}
              </div>
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-200">
                <span className="text-[12px] text-slate-500">Curated syllabus</span>
                <Link href="/#auth" className="text-[13px] font-[500] text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors">
                  Explore <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Mathematics */}
          <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-lg hover:scale-[1.01] transition-all duration-300 reveal reveal-d2">
            <div className="h-32 bg-gradient-to-br from-violet-50 to-violet-100/80 p-6 flex items-end justify-between relative overflow-hidden">
              <svg className="absolute top-3 right-3 w-20 h-20 text-violet-300/20" viewBox="0 0 40 40">
                <line x1="5" y1="5" x2="5" y2="35" stroke="currentColor" strokeWidth="1.5" />
                <line x1="5" y1="35" x2="35" y2="35" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 30 L15 20 L25 25 L35 10" stroke="currentColor" fill="none" strokeWidth="2" />
              </svg>
              <div className="flex items-center gap-3 relative z-10">
                <div className="size-11 rounded-xl bg-white/80 border border-violet-200/50 flex items-center justify-center shadow-sm backdrop-blur-sm">
                  <Sigma className="w-5 h-5 text-violet-600" />
                </div>
                <h3 className="text-[24px] font-[600] text-slate-900 font-editorial">Mathematics</h3>
              </div>
              <span className="text-[11px] font-[600] font-mono text-violet-600 tracking-wider uppercase relative z-10">22 Chapters</span>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-1.5">
                {['Calculus', 'Algebra', 'Coordinate Geometry', 'Vectors', 'Probability'].map((ch, i) => (
                  <span key={i} className="text-[11px] font-[500] text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">{ch}</span>
                ))}
              </div>
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-200">
                <span className="text-[12px] text-slate-500">Curated syllabus</span>
                <Link href="/#auth" className="text-[13px] font-[500] text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors">
                  Explore <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 6 — TESTIMONIALS
          2×2 grid with avatar initials
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="testimonials" className="bg-white border-y border-slate-200 py-24 relative z-10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-16">

          <div className="text-center max-w-2xl mx-auto mb-16 reveal">
            <span className="text-[11px] font-[700] tracking-[0.2em] uppercase text-blue-600">Testimonials</span>
            <h2 className="text-[2.5rem] md:text-[3rem] font-[700] font-sans mt-3 mb-4 text-slate-900 tracking-tight leading-[1.1]">
              Approved by India&apos;s top achievers
            </h2>
            <p className="text-slate-600 text-[17px] font-[400] leading-relaxed">
              Read how serious JEE aspirants use JEEsociety Plus to elevate their preparation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[1000px] mx-auto">

            {[
              {
                quote: "The depth of questions here matches the actual JEE Advanced paper perfectly. The distraction-free design allowed me to study hours without strain.",
                name: 'Aditya Sharma',
                rank: 'JEE Advanced 2024 · AIR 847',
                initials: 'AS',
                color: 'bg-blue-500',
                accent: 'border-l-blue-500',
              },
              {
                quote: "The topic-level accuracy analytics saved me at least two hours of guess work daily. I knew exactly which organic chemistry mechanism to solve next.",
                name: 'Riya Patel',
                rank: 'JEE Advanced 2024 · AIR 412',
                initials: 'RP',
                color: 'bg-emerald-500',
                accent: 'border-l-emerald-500',
              },
              {
                quote: "No arcade sounds, no generic level ups. A premium environment designed for rigorous preparation. Feels like an academic platform for researchers.",
                name: 'Sameer Deshmukh',
                rank: 'JEE Advanced 2023 · AIR 1054',
                initials: 'SD',
                color: 'bg-violet-500',
                accent: 'border-l-violet-500',
              },
              {
                quote: "Seeing my consistency streak grow gave me the silent momentum I needed to cross 280+ mocks. The heatmap keeps me highly accountable.",
                name: 'Kavya Nambiar',
                rank: 'JEE Advanced 2024 · AIR 922',
                initials: 'KN',
                color: 'bg-blue-500',
                accent: 'border-l-blue-500',
              },
            ].map((t, i) => (
              <div
                key={i}
                className={`reveal ${i > 0 ? `reveal-d${i}` : ''} bg-white rounded-2xl border border-slate-200 border-l-[3px] ${t.accent} p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300`}
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-[15px] font-[400] text-slate-600 leading-relaxed mb-5 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                  <div className={`size-9 rounded-full ${t.color} flex items-center justify-center text-[11px] font-[700] text-white shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <h5 className="text-[14px] font-[600] text-slate-900">{t.name}</h5>
                    <p className="text-[12px] text-slate-500 mt-0.5">{t.rank}</p>
                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>



      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 8 — FOOTER
          Clean 3-column, no dummy links
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer className="bg-slate-50 border-t border-slate-200 py-16 relative z-10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-16 grid grid-cols-2 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-[600] text-slate-900 tracking-tight">JEEsociety</span>
              <span className="text-[11px] font-[600] bg-blue-600/10 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200/60">Plus</span>
            </div>
            <p className="text-[13px] font-[400] text-slate-500 leading-relaxed max-w-[240px]">
              Curating depth-first practice grids for India&apos;s most serious JEE Advanced candidates.
            </p>
          </div>

          {/* Product */}
          <div className="flex flex-col gap-2.5 text-[14px]">
            <h5 className="font-[600] text-slate-500 tracking-wider uppercase text-[11px] mb-1">Product</h5>
            <Link href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">Features</Link>
            <Link href="#subjects" className="text-slate-600 hover:text-slate-900 transition-colors">Subjects</Link>
            <Link href="/#auth" className="text-slate-600 hover:text-slate-900 transition-colors">Leaderboard</Link>
            <Link href="/#auth" className="text-slate-600 hover:text-slate-900 transition-colors">Mock Tests</Link>
          </div>

          {/* Community */}
          <div className="flex flex-col gap-2.5 text-[14px]">
            <h5 className="font-[600] text-slate-500 tracking-wider uppercase text-[11px] mb-1">Community</h5>
            <Link href="#" className="text-slate-600 hover:text-slate-900 transition-colors">WhatsApp Group</Link>
            <Link href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Discord</Link>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-2.5 text-[14px]">
            <h5 className="font-[600] text-slate-500 tracking-wider uppercase text-[11px] mb-1">Legal</h5>
            <Link href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Terms of Service</Link>
          </div>

        </div>

        <div className="max-w-[1400px] mx-auto px-6 lg:px-16 border-t border-slate-200 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-slate-500">&copy; 2026 JEEsociety Plus. All rights reserved.</p>
          <span className="text-[12px] text-slate-500">Made for JEE aspirants, by JEE aspirants</span>
        </div>
      </footer>

    </div>
  )
}
