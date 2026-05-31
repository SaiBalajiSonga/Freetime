'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowRight, 
  Brain, 
  Trophy, 
  Activity, 
  Zap, 
  CheckCircle2, 
  ChevronDown, 
  Star, 
  Atom, 
  FlaskConical, 
  Sigma,
  Sparkles,
  Award,
  BookOpen
} from 'lucide-react'
import { Nav } from '@/components/site/nav'
import { MasonryCard } from '@/components/site/masonry-card'

// --- Custom CountUp Component ---
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
          let startTimestamp: number | null = null
          const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp
            const progress = Math.min((timestamp - startTimestamp) / duration, 1)
            setCount(Math.floor(progress * numericEnd))
            if (progress < 1) {
              window.requestAnimationFrame(step)
            }
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

// --- Custom 3D Tilt Card Component for Subjects ---
function SubjectCard({ 
  bg, 
  icon, 
  title, 
  chapters, 
  exploreLink, 
  svgPattern,
  stats
}: { 
  bg: string
  icon: React.ReactNode
  title: string
  chapters: string[]
  exploreLink: string
  svgPattern: React.ReactNode
  stats: string
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    const box = card.getBoundingClientRect()
    const x = e.clientX - box.left - box.width / 2
    const y = e.clientY - box.top - box.height / 2
    const rotateY = (x / (box.width / 2)) * 6 // max 6deg
    const rotateX = -(y / (box.height / 2)) * 6 // max 6deg
    setTilt({ x: rotateX, y: rotateY })
  }

  const handleMouseLeave = () => {
    setHovered(false)
    setTilt({ x: 0, y: 0 })
  }

  const handleMouseEnter = () => {
    setHovered(true)
  }

  return (
    <div
      className="tilt-card-wrapper h-[280px] w-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      <div
        className="w-full h-full rounded-[28px] p-8 overflow-hidden relative flex flex-col justify-between transition-all duration-200"
        style={{
          background: bg,
          transform: hovered 
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.02)` 
            : 'rotateX(0deg) rotateY(0deg) scale(1)',
          boxShadow: hovered 
            ? '0 20px 40px rgba(0,0,0,0.4), 0 0 50px rgba(45,110,245,0.1)' 
            : '0 4px 20px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        {/* SVG Decorative Background */}
        <div className="absolute right-0 bottom-0 opacity-[0.06] pointer-events-none w-1/2 h-1/2 flex items-end justify-end p-2 select-none">
          {svgPattern}
        </div>

        {/* Content */}
        <div className="flex items-center justify-between relative z-10">
          <div className="size-14 rounded-2xl bg-[#0A0A0F]/60 border border-[rgba(255,255,255,0.05)] flex items-center justify-center text-2xl shadow-inner select-none">
            {icon}
          </div>
          <span className="text-[11px] font-mono text-[#8A8AAF] tracking-wider bg-white/5 border border-white/10 px-3 py-1 rounded-full uppercase">
            {stats}
          </span>
        </div>

        <div className="relative z-10 mt-4">
          <h3 className="text-[28px] font-[400] font-editorial text-[#F0F0FA] leading-tight select-none">
            {title}
          </h3>
          
          <div className="flex flex-wrap gap-1.5 mt-3 select-none">
            {chapters.map((chapter, i) => (
              <span key={i} className="text-[11px] font-geist text-[#8A8AAF] bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
                {chapter}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 select-none relative z-10">
          <span className="text-[11px] font-geist text-[#3E3E5E]">Curated syllabus</span>
          <Link href={exploreLink} className="text-[13px] font-[500] font-geist text-[#8A8AAF] hover:text-[#F0F0FA] hover:underline underline-offset-4 flex items-center gap-1">
            Explore <span className="transform group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0FA] font-geist overflow-x-hidden relative noise-overlay">
      <Nav />

      {/* SECTION 1: HERO */}
      <header className="relative min-h-screen pt-24 flex items-center max-w-[1280px] mx-auto px-6 lg:px-12 grid lg:grid-cols-[55%_45%] gap-12 lg:gap-8 overflow-hidden z-10">
        
        {/* Left Column: Text + Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-8 z-10 max-w-[620px]"
        >
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-[rgba(255,255,255,0.07)] bg-white/5 px-4 py-1.5 text-[11px] font-[500] tracking-widest text-[#8A8AAF]">
            <span className="size-2 rounded-full bg-[#00D4AA] pulse-glow-dot" />
            ADAPTIVE PRACTICE
          </div>

          {/* Heading */}
          <h1 className="text-[4rem] sm:text-[4.8rem] lg:text-[4.5rem] leading-[1.05] font-[800] tracking-tighter font-display text-[#F0F0FA]">
            Master JEE with <br />
            <span className="text-[#2D6EF5] italic font-[700]">depth-first</span> <br />
            problem solving.
          </h1>

          {/* Description */}
          <p className="text-[17px] text-[#8A8AAF] leading-relaxed font-[300] max-w-[520px]">
            A focused workspace for physics, chemistry, and mathematics — with analytics that surface what to drill next.
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 text-[15px] font-[500] rounded-full bg-gradient-to-r from-[#2D6EF5] to-[#1A4FD4] text-white shadow-lg shadow-[#2D6EF5]/15 hover:brightness-[1.1] hover:shadow-[0_0_30px_rgba(45,110,245,0.25)] active:scale-[0.97] transition-all"
            >
              Enter Platform
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-12 px-6 text-[15px] font-[500] rounded-full bg-transparent text-[#F0F0FA] hover:border-[#4A4A7A] hover:bg-white/5 transition-all border border-[rgba(255,255,255,0.07)]"
            >
              Sign in
            </Link>
          </div>

          {/* Trust Signals */}
          <div className="flex flex-wrap items-center gap-4 text-[#8A8AAF] text-[13px] font-[400] mt-6 border-t border-[rgba(255,255,255,0.05)] pt-6">
            <div className="flex items-center gap-1.5">
              <span className="text-[#2D6EF5]">⚡</span> High-yield question sets
            </div>
            <div className="w-px h-3 bg-[rgba(255,255,255,0.07)] hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <span className="text-[#2D6EF5]">✦</span> 3D-ready visualizations
            </div>
            <div className="w-px h-3 bg-[rgba(255,255,255,0.07)] hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <span className="text-[#2D6EF5]">📊</span> Real-time analytics
            </div>
          </div>
        </motion.div>

        {/* Right Column: Mini Masonry Preview */}
        <div className="hidden lg:grid grid-cols-2 gap-4 h-[580px] self-center pr-2 relative">
          
          <div className="flex flex-col gap-4">
            <MasonryCard 
              variant="question" 
              questionProps={{
                subject: 'physics',
                difficulty: 'hard',
                topic: 'Rotational Dynamics',
                problemText: 'A uniform solid cylinder of mass M and radius R rolls without slipping down a plane inclined at angle θ. Determine its linear acceleration.'
              }}
              delay={0.1}
            />
            <MasonryCard 
              variant="stat" 
              statProps={{
                number: '98%',
                label: 'ACCURACY RATE',
                trend: '↑ 1.8% this week',
                trendUp: true,
                showSparkline: false
              }}
              delay={0.3}
            />
          </div>
          
          <div className="flex flex-col gap-4 pt-10">
            <MasonryCard 
              variant="topic" 
              topicProps={{
                subject: 'physics',
                chapterName: 'Electrostatics',
                problemsLeft: 12,
                totalProblems: 50
              }}
              delay={0.2}
            />
            <MasonryCard 
              variant="streak" 
              streakProps={{
                streakDays: 47
              }}
              delay={0.4}
            />
            <MasonryCard 
              variant="leaderboard" 
              leaderboardProps={{
                title: 'JEE Mains Mock',
                users: [
                  { rank: 1, initials: 'AN', name: 'Aman N.', score: '292' },
                  { rank: 2, initials: 'YJ', name: 'Yash J.', score: '288' },
                  { rank: 3, initials: 'SR', name: 'Suhail R.', score: '285' }
                ]
              }}
              delay={0.5}
            />
          </div>

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0A0A0F] to-transparent pointer-events-none" />
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-50 z-20">
          <ChevronDown className="w-5 h-5 text-[#8A8AAF] animate-bounce" />
        </div>
      </header>

      {/* SECTION 2: SOCIAL PROOF BAR */}
      <section className="w-full bg-[#111118] border-y border-[rgba(255,255,255,0.07)] py-16 z-20 relative">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12 flex flex-wrap justify-between items-center gap-8">
          
          <div className="flex flex-col flex-1 min-w-[200px] border-r border-[rgba(255,255,255,0.07)] last:border-0 pr-6">
            <h3 className="text-[36px] font-[700] font-mono text-[#F0F0FA] leading-none">
              <CountUp end="12,400+" />
            </h3>
            <p className="text-[13px] font-[400] font-geist text-[#8A8AAF] mt-2">Active aspirants</p>
          </div>
          
          <div className="flex flex-col flex-1 min-w-[200px] md:border-r border-[rgba(255,255,255,0.07)] last:border-0 pr-6">
            <h3 className="text-[36px] font-[700] font-mono text-[#F0F0FA] leading-none">
              <CountUp end="1,200+" />
            </h3>
            <p className="text-[13px] font-[400] font-geist text-[#8A8AAF] mt-2">Practice questions</p>
          </div>
          
          <div className="flex flex-col flex-1 min-w-[200px] border-r border-[rgba(255,255,255,0.07)] last:border-0 pr-6">
            <h3 className="text-[36px] font-[700] font-mono text-[#F0F0FA] leading-none">
              <CountUp end="3" />
            </h3>
            <p className="text-[13px] font-[400] font-geist text-[#8A8AAF] mt-2">Subjects covered</p>
          </div>
          
          <div className="flex flex-col flex-1 min-w-[200px] last:border-0">
            <h3 className="text-[36px] font-[700] font-mono text-[#F0F0FA] leading-none">
              <CountUp end="98%" />
            </h3>
            <p className="text-[13px] font-[400] font-geist text-[#8A8AAF] mt-2">Mock accuracy claimed</p>
          </div>

        </div>
      </section>

      {/* SECTION 3: FEATURES */}
      <section id="features" className="max-w-[1280px] mx-auto px-6 lg:px-12 py-24 md:py-32 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <span className="text-[11px] font-[600] tracking-widest uppercase text-[#2D6EF5]">PRODUCT</span>
          <h2 className="text-4xl md:text-5xl font-[400] font-editorial mt-3 mb-5 text-[#F0F0FA] tracking-tight">
            Built for serious prep
          </h2>
          <p className="text-[#8A8AAF] text-[18px] font-[300] leading-relaxed">
            Move away from gamified quiz interfaces. Train in a high-density, focus-first study workspace.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="p-8 rounded-[28px] bg-[#111118] border border-[rgba(255,255,255,0.07)] hover:border-[rgba(45,110,245,0.4)] hover:shadow-[0_0_40px_rgba(45,110,245,0.15)] group transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="size-12 rounded-full bg-[#1A1A26] flex items-center justify-center mb-6 border border-white/5">
                <Brain className="w-5 h-5 text-[#2D6EF5]" />
              </div>
              <h3 className="text-[22px] font-[400] font-editorial text-[#F0F0FA] mb-3">Difficulty that scales</h3>
              <p className="text-[#8A8AAF] text-[15px] font-[400] leading-relaxed">
                Move from fundamentals to exam tempo without jumping into chaos — stay in the stretch zone.
              </p>
            </div>
            
            {/* Visual Accent */}
            <div className="mt-8">
              <div className="text-[11px] font-mono text-[#3E3E5E] uppercase tracking-wider mb-2">Stretch Zone Scale</div>
              <div className="h-[3px] rounded-full w-full bg-gradient-to-r from-[#00D4AA] via-[#F5A623] to-[#FF5C5C]" />
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="p-8 rounded-[28px] bg-[#111118] border border-[rgba(255,255,255,0.07)] hover:border-[rgba(45,110,245,0.4)] hover:shadow-[0_0_40px_rgba(45,110,245,0.15)] group transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="size-12 rounded-full bg-[#1A1A26] flex items-center justify-center mb-6 border border-white/5">
                <Activity className="w-5 h-5 text-[#F5A623]" />
              </div>
              <h3 className="text-[22px] font-[400] font-editorial text-[#F0F0FA] mb-3">Analytics you can act on</h3>
              <p className="text-[#8A8AAF] text-[15px] font-[400] leading-relaxed">
                See streaks, accuracy, and topic load — so your next session is a decision, not a guess.
              </p>
            </div>
            
            {/* Visual Accent */}
            <div className="mt-8 flex items-center justify-between">
              <div className="text-[11px] font-mono text-[#3E3E5E] uppercase tracking-wider">Velocity chart</div>
              <svg className="w-24 h-6 text-[#00D4AA]" viewBox="0 0 100 20" fill="none">
                <path d="M0 15 L20 18 L40 10 L60 12 L80 4 L100 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="p-8 rounded-[28px] bg-[#111118] border border-[rgba(255,255,255,0.07)] hover:border-[rgba(45,110,245,0.4)] hover:shadow-[0_0_40px_rgba(45,110,245,0.15)] group transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="size-12 rounded-full bg-[#1A1A26] flex items-center justify-center mb-6 border border-white/5">
                <Trophy className="w-5 h-5 text-[#00D4AA]" />
              </div>
              <h3 className="text-[22px] font-[400] font-editorial text-[#F0F0FA] mb-3">Motivation without noise</h3>
              <p className="text-[#8A8AAF] text-[15px] font-[400] leading-relaxed">
                Leaderboards and streaks that reward consistency — tuned to feel premium, not arcade-y.
              </p>
            </div>
            
            {/* Visual Accent */}
            <div className="mt-8 flex items-center justify-between">
              <div className="text-[11px] font-mono text-[#3E3E5E] uppercase tracking-wider">Consistency rows</div>
              <div className="flex gap-1">
                <div className="size-3 rounded-[2px] bg-[#00D4AA]/20" />
                <div className="size-3 rounded-[2px] bg-[#00D4AA]/50" />
                <div className="size-3 rounded-[2px] bg-[#00D4AA]" />
                <div className="size-3 rounded-[2px] bg-[#00D4AA]" />
                <div className="size-3 rounded-[2px] bg-[#00D4AA]/80" />
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* SECTION 4: PINTEREST SHOWCASE */}
      <section id="showcase" className="bg-[#05050A] border-y border-[rgba(255,255,255,0.05)] py-24 relative z-20">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-20"
          >
            <span className="text-[11px] font-[600] tracking-widest uppercase text-[#00D4AA]">HOW IT WORKS</span>
            <h2 className="text-4xl md:text-5xl font-[400] font-editorial mt-3 mb-5 text-[#F0F0FA] tracking-tight">
              Your prep feed,<br />curated by performance
            </h2>
            <p className="text-[#8A8AAF] text-[18px] font-[300] leading-relaxed">
              Every mock rank, missed reaction, or study habit aggregated into a single editorial feed.
            </p>
          </motion.div>

          {/* 3-Column Masonry Showcase */}
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
            
            {/* Card A */}
            <div className="break-inside-avoid mb-6">
              <MasonryCard 
                variant="question" 
                questionProps={{
                  subject: 'physics',
                  difficulty: 'hard',
                  topic: 'JEE Advanced 2023 · Mechanics',
                  problemText: 'A particle is projected from the ground with velocity u at angle α. If its horizontal range is maximum, find the time of flight.'
                }}
              />
            </div>

            {/* Card B */}
            <div className="break-inside-avoid mb-6">
              <MasonryCard 
                variant="stat" 
                statProps={{
                  number: '94.2%',
                  label: 'ACCURACY THIS WEEK',
                  trend: '↑ 3.1% from last week',
                  trendUp: true,
                  showSparkline: true
                }}
              />
            </div>

            {/* Card C */}
            <div className="break-inside-avoid mb-6">
              <MasonryCard 
                variant="topic" 
                topicProps={{
                  subject: 'chemistry',
                  chapterName: 'Electrochemistry',
                  problemsLeft: 16,
                  totalProblems: 50
                }}
              />
            </div>

            {/* Card D */}
            <div className="break-inside-avoid mb-6">
              <MasonryCard 
                variant="streak" 
                streakProps={{
                  streakDays: 47
                }}
              />
            </div>

            {/* Card E */}
            <div className="break-inside-avoid mb-6">
              <MasonryCard 
                variant="leaderboard" 
                leaderboardProps={{
                  title: 'JEE Mains Mock · Week 22',
                  users: [
                    { rank: 1, initials: 'AN', name: 'Aman N.', score: '292' },
                    { rank: 2, initials: 'YJ', name: 'Yash J.', score: '288' },
                    { rank: 3, initials: 'SR', name: 'Suhail R.', score: '285' },
                    { rank: 4, initials: 'ME', name: 'You (Rank #4)', score: '282', isCurrentUser: true },
                    { rank: 5, initials: 'PT', name: 'Priya T.', score: '278' }
                  ]
                }}
              />
            </div>

            {/* Card F */}
            <div className="break-inside-avoid mb-6">
              <MasonryCard 
                variant="stat" 
                statProps={{
                  number: '1,200+',
                  label: 'TOTAL QUESTIONS CURATED',
                  trend: 'Physics · Chemistry · Maths',
                  trendUp: true,
                  showSparkline: false
                }}
              />
            </div>

            {/* Card G */}
            <div className="break-inside-avoid mb-6">
              <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-[20px] p-5 hover:-translate-y-[3px] hover:border-[rgba(45,110,245,0.4)] transition-all duration-250 group shadow-[0_1px_3px_rgba(0,0,0,0.4),0_8px_24px_rgba(0,0,0,0.3)]">
                <span className="text-[10px] font-geist text-[#FF5C5C] font-semibold uppercase tracking-widest bg-[rgba(255,92,92,0.08)] px-2 py-0.5 rounded-full">
                  Recommended Drill
                </span>
                <h4 className="text-[19px] font-[400] font-editorial text-[#F0F0FA] leading-tight mt-3">
                  Organic Chemistry — Named Reactions
                </h4>
                <p className="text-[12px] font-geist text-[#8A8AAF] mt-1.5 leading-relaxed">
                  Reason: You missed 4 of your last 5 questions covering nucleophilic substitution reactions here.
                </p>
                <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.05)] flex items-center justify-between">
                  <span className="text-[11px] font-geist text-[#3E3E5E]">High Yield Chapter</span>
                  <Link href="/login" className="text-[12px] font-geist text-[#8A8AAF] hover:text-[#F0F0FA] flex items-center gap-1">
                    Start Drill <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Card H */}
            <div className="break-inside-avoid mb-6">
              <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-[20px] p-5 hover:-translate-y-[3px] hover:border-[rgba(45,110,245,0.4)] transition-all duration-250 group shadow-[0_1px_3px_rgba(0,0,0,0.4),0_8px_24px_rgba(0,0,0,0.3)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-geist text-[#3E3E5E] tracking-wider uppercase">Time Breakdown</span>
                  <span className="text-[10px] font-mono text-[#8A8AAF]">Session Split</span>
                </div>

                <div className="flex items-center justify-center gap-6 py-2">
                  {/* SVG Donut Chart */}
                  <svg className="size-20 shrink-0 transform -rotate-90">
                    {/* Background */}
                    <circle cx="40" cy="40" r="30" className="stroke-[#1A1A26]" strokeWidth="8" fill="transparent" />
                    {/* Physics 40% */}
                    <circle cx="40" cy="40" r="30" className="stroke-[#2D6EF5]" strokeWidth="8" fill="transparent" strokeDasharray="188.4" strokeDashoffset="0" />
                    {/* Chemistry 35% */}
                    <circle cx="40" cy="40" r="30" className="stroke-[#00D4AA]" strokeWidth="8" fill="transparent" strokeDasharray="188.4" strokeDashoffset="75.36" />
                    {/* Maths 25% */}
                    <circle cx="40" cy="40" r="30" className="stroke-[#F5A623]" strokeWidth="8" fill="transparent" strokeDasharray="188.4" strokeDashoffset="141.3" />
                  </svg>
                  
                  <div className="flex flex-col gap-1 text-[11px] font-geist text-[#8A8AAF]">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#2D6EF5]" />
                      Phy: 40%
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#00D4AA]" />
                      Chem: 35%
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#F5A623]" />
                      Math: 25%
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.05)] text-center text-[11px] font-geist text-[#3E3E5E]">
                  Aggregated sessions for May 2026
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 5: SUBJECTS OVERVIEW */}
      <section id="subjects" className="max-w-[1280px] mx-auto px-6 lg:px-12 py-24 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <span className="text-[11px] font-[600] tracking-widest uppercase text-[#F5A623]">SUBJECTS</span>
          <h2 className="text-4xl md:text-5xl font-[400] font-editorial mt-3 mb-5 text-[#F0F0FA] tracking-tight">
            Every pillar of JEE,<br />covered in depth
          </h2>
          <p className="text-[#8A8AAF] text-[18px] font-[300] leading-relaxed">
            From basic particle motion equations to advanced stereochemistry structures.
          </p>
        </motion.div>

        {/* 3 Large Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-14">
          
          <SubjectCard 
            bg="linear-gradient(145deg, #0D1525 0%, #111830 100%)"
            icon={<Atom className="w-8 h-8 text-[#2D6EF5]" />}
            title="Physics"
            stats="25 CHAPTERS"
            chapters={['Mechanics', 'Electrostatics', 'Optics', 'Modern Physics', 'Thermodynamics']}
            exploreLink="/login"
            svgPattern={
              <svg className="w-28 h-16 text-[#2D6EF5]/20" viewBox="0 0 100 40">
                <path d="M0 20 Q25 5, 50 20 T100 20" stroke="currentColor" fill="none" strokeWidth="2" />
                <path d="M0 20 Q25 35, 50 20 T100 20" stroke="currentColor" fill="none" strokeWidth="1" strokeDasharray="2 2" />
              </svg>
            }
          />

          <SubjectCard 
            bg="linear-gradient(145deg, #0D1F1A 0%, #111E18 100%)"
            icon={<FlaskConical className="w-8 h-8 text-[#00D4AA]" />}
            title="Chemistry"
            stats="28 CHAPTERS"
            chapters={['Organic', 'Inorganic', 'Physical', 'Electrochemistry', 'Equilibrium']}
            exploreLink="/login"
            svgPattern={
              <svg className="w-24 h-24 text-[#00D4AA]/20" viewBox="0 0 40 40">
                <path d="M20 5 L35 12 L35 28 L20 35 L5 28 L5 12 Z" stroke="currentColor" fill="none" strokeWidth="1.5" />
                <path d="M20 15 L28 20 L28 28 L20 32 L12 28 L12 20 Z" stroke="currentColor" fill="none" strokeWidth="1" strokeDasharray="1 1" />
              </svg>
            }
          />

          <SubjectCard 
            bg="linear-gradient(145deg, #1F1508 0%, #1C1206 100%)"
            icon={<Sigma className="w-8 h-8 text-[#F5A623]" />}
            title="Mathematics"
            stats="22 CHAPTERS"
            chapters={['Calculus', 'Algebra', 'Coordinate Geometry', 'Vectors', 'Probability']}
            exploreLink="/login"
            svgPattern={
              <svg className="w-24 h-24 text-[#F5A623]/20" viewBox="0 0 40 40">
                <line x1="5" y1="5" x2="5" y2="35" stroke="currentColor" strokeWidth="1.5" />
                <line x1="5" y1="35" x2="35" y2="35" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 30 L15 20 L25 25 L35 10" stroke="currentColor" fill="none" strokeWidth="2" />
              </svg>
            }
          />

        </div>
      </section>

      {/* SECTION 6: TESTIMONIALS */}
      <section id="testimonials" className="bg-[#05050A] border-t border-b border-[rgba(255,255,255,0.05)] py-24 relative z-20">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-20"
          >
            <span className="text-[11px] font-[600] tracking-widest uppercase text-[#2D6EF5]">TESTIMONIALS</span>
            <h2 className="text-4xl md:text-5xl font-[400] font-editorial mt-3 mb-5 text-[#F0F0FA] tracking-tight">
              Approved by India's top achievers
            </h2>
            <p className="text-[#8A8AAF] text-[18px] font-[300] leading-relaxed">
              Read how serious JEE aspirants use JEEsociety Plus to elevate their preparation.
            </p>
          </motion.div>

          <div className="columns-1 md:columns-2 gap-6 max-w-[1000px] mx-auto">
            
            <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-[20px] p-6 mb-6 break-inside-avoid">
              <div className="flex gap-0.5 text-[#F5A623] mb-4">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <p className="text-[16px] font-[300] font-geist text-[#F0F0FA] leading-relaxed italic mb-6">
                "The depth of questions here matches the actual JEE Advanced paper perfectly. The distraction-free design allowed me to study hours without strain."
              </p>
              <div>
                <h5 className="text-[14px] font-[600] text-[#F0F0FA] font-geist">Aditya Sharma</h5>
                <p className="text-[12px] text-[#8A8AAF] mt-0.5">JEE Advanced 224 · AIR 847</p>
              </div>
            </div>

            <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-[20px] p-6 mb-6 break-inside-avoid">
              <div className="flex gap-0.5 text-[#F5A623] mb-4">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <p className="text-[16px] font-[300] font-geist text-[#F0F0FA] leading-relaxed italic mb-6">
                "The topic-level accuracy analytics saved me at least two hours of guess work daily. I knew exactly which organic chemistry mechanism to solve next."
              </p>
              <div>
                <h5 className="text-[14px] font-[600] text-[#F0F0FA] font-geist">Riya Patel</h5>
                <p className="text-[12px] text-[#8A8AAF] mt-0.5">JEE Advanced 224 · AIR 412</p>
              </div>
            </div>

            <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-[20px] p-6 mb-6 break-inside-avoid">
              <div className="flex gap-0.5 text-[#F5A623] mb-4">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <p className="text-[16px] font-[300] font-geist text-[#F0F0FA] leading-relaxed italic mb-6">
                "No arcade sounds, no generic level ups. A premium environment designed for rigorous preparation. Feels like an academic platform for researchers."
              </p>
              <div>
                <h5 className="text-[14px] font-[600] text-[#F0F0FA] font-geist">Sameer Deshmukh</h5>
                <p className="text-[12px] text-[#8A8AAF] mt-0.5">JEE Advanced 223 · AIR 1054</p>
              </div>
            </div>

            <div className="bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-[20px] p-6 mb-6 break-inside-avoid">
              <div className="flex gap-0.5 text-[#F5A623] mb-4">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <p className="text-[16px] font-[300] font-geist text-[#F0F0FA] leading-relaxed italic mb-6">
                "The calendar heatmap keeps me highly accountable. Seeing my consistency streak grow gave me the silent momentum I needed to cross 280+ mocks."
              </p>
              <div>
                <h5 className="text-[14px] font-[600] text-[#F0F0FA] font-geist">Kavya Nambiar</h5>
                <p className="text-[12px] text-[#8A8AAF] mt-0.5">JEE Advanced 224 · AIR 922</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 7: CTA BANNER */}
      <section className="py-24 max-w-[1100px] mx-auto px-6 lg:px-12 relative z-20">
        <div className="rounded-[28px] p-12 md:p-20 bg-[#111118] border border-[rgba(255,255,255,0.07)] bg-[radial-gradient(circle_at_center,rgba(45,110,245,0.08)_0%,transparent_100%)] text-center relative overflow-hidden flex flex-col items-center">
          
          <h2 className="text-4xl md:text-[56px] font-[400] font-editorial text-[#F0F0FA] leading-tight tracking-tight">
            Start drilling. <br className="sm:hidden" />
            <span className="text-[#2D6EF5]">Stop guessing.</span>
          </h2>
          
          <p className="text-[#8A8AAF] text-[18px] font-[300] leading-relaxed mt-6 max-w-xl">
            Surpass your mock plateaus. Leverage immediate depth-first diagnostic practices in physics, chemistry, and maths.
          </p>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 h-14 px-8 mt-10 text-[15px] font-[500] rounded-full bg-gradient-to-r from-[#2D6EF5] to-[#1A4FD4] text-white shadow-lg shadow-[#2D6EF5]/15 hover:brightness-[1.1] hover:shadow-[0_0_30px_rgba(45,110,245,0.25)] active:scale-[0.97] transition-all duration-200"
          >
            Enter Platform →
          </Link>
          
          <span className="text-[12px] font-geist text-[#3E3E5E] mt-4">
            No account required to browse general question sets
          </span>
        </div>
      </section>

      {/* SECTION 8: FOOTER */}
      <footer className="bg-[#05050A] border-t border-[rgba(255,255,255,0.07)] py-20 relative z-20">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-10">
          
          {/* Col 1 */}
          <div className="flex flex-col gap-4">
            <span className="text-[18px] font-[400] font-editorial text-[#F0F0FA] tracking-tight">
              JEEsociety Plus
            </span>
            <p className="text-[13px] font-[300] font-geist text-[#8A8AAF] leading-relaxed">
              Curating depth-first practice grids for India's most serious JEE Advanced candidates.
            </p>
          </div>

          {/* Col 2 */}
          <div className="flex flex-col gap-3 text-[14px]">
            <h5 className="font-geist font-[600] text-[#F0F0FA] tracking-wider uppercase text-[11px] mb-2 text-[#3E3E5E]">Product</h5>
            <Link href="#features" className="text-[#8A8AAF] hover:text-[#F0F0FA] transition-colors">Features</Link>
            <Link href="#subjects" className="text-[#8A8AAF] hover:text-[#F0F0FA] transition-colors">Subjects</Link>
            <Link href="/login" className="text-[#8A8AAF] hover:text-[#F0F0FA] transition-colors">Leaderboard</Link>
            <Link href="/login" className="text-[#8A8AAF] hover:text-[#F0F0FA] transition-colors">Mock Tests</Link>
          </div>

          {/* Col 3 */}
          <div className="flex flex-col gap-3 text-[14px]">
            <h5 className="font-geist font-[600] text-[#F0F0FA] tracking-wider uppercase text-[11px] mb-2 text-[#3E3E5E]">Community</h5>
            <Link href="#" className="text-[#8A8AAF] hover:text-[#F0F0FA] transition-colors">Discord Guild</Link>
            <Link href="#" className="text-[#8A8AAF] hover:text-[#F0F0FA] transition-colors">Twitter / X</Link>
            <Link href="#" className="text-[#8A8AAF] hover:text-[#F0F0FA] transition-colors">GitHub Sync</Link>
          </div>

          {/* Col 4 */}
          <div className="flex flex-col gap-3 text-[14px]">
            <h5 className="font-geist font-[600] text-[#F0F0FA] tracking-wider uppercase text-[11px] mb-2 text-[#3E3E5E]">Legal</h5>
            <Link href="#" className="text-[#8A8AAF] hover:text-[#F0F0FA] transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-[#8A8AAF] hover:text-[#F0F0FA] transition-colors">Terms of Service</Link>
          </div>

        </div>

        <div className="max-w-[1280px] mx-auto px-6 lg:px-12 border-t border-[rgba(255,255,255,0.05)] mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] font-geist text-[#3E3E5E]">&copy; 2026 JEEsociety Plus. All rights reserved.</p>
          <span className="text-[12px] font-geist text-[#3E3E5E] italic">
            Made for JEE aspirants, by JEE aspirants
          </span>
        </div>
      </footer>

    </div>
  )
}
