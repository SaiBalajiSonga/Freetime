'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Atom, Sigma, FlaskConical, Target, Timer, TrendingUp, CheckCircle2, ChevronRight, BookOpen } from 'lucide-react'
import { Card, DifficultyBadge, FloatingButton, SectionHeader, PageHeader } from '@/components/site/dashboard-ui'
import { HeroBanner } from '@/components/site/hero-banner'
import { SubjectTile, SubjectTileRow } from '@/components/site/subject-tile'
import { StatCard } from '@/components/site/stat-card'
import { getDifficultyFromProgress } from '@/lib/progress'

type DashboardClientProps = {
  userAttempts: any[]
  sp: Record<string, { total: number; solved: number }>
  totalSolved: number
  totalQ: number
  pct: number
  accuracy: number
  hrs: number
  mns: number
  display: string
  inProgress: number
  streak: number
  weekDays: Array<{ label: string; date: string; count: number }>
  maxBar: number
  dcm: Record<string, number>
  todayKey: string
  weeks: Array<Array<{ key: string; count: number; future: boolean }>>
  sColors: Record<string, [string, string]>
  dash: number
  circ: number
}

export default function DashboardClient({
  userAttempts,
  sp,
  totalSolved,
  totalQ,
  pct,
  accuracy,
  hrs,
  mns,
  display,
  inProgress,
  streak,
  weekDays,
  maxBar,
  todayKey,
}: DashboardClientProps) {

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  }

  const searchParams = useSearchParams()
  const analyticsSection = searchParams.get('section')

  useEffect(() => {
    if (analyticsSection !== 'analytics') return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById('analytics')?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' })
  }, [analyticsSection])

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      
      {/* ── Page Header ── */}
      <PageHeader 
        title={`Hi, ${display}!`}
        subtitle="Central hub for all your learning needs"
      />

      {/* ── Hero Banner ── */}
      <motion.section variants={itemVariants}>
        <HeroBanner />
      </motion.section>

      {/* ── Stats Row ── */}
      <motion.section variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          tone="blue"
          icon={<CheckCircle2 className="h-5 w-5 text-white" />}
          value={totalSolved}
          label="Questions Solved"
          sub="Keep up the pace!"
        />
        <StatCard 
          tone="green"
          icon={<Target className="h-5 w-5 text-white" />}
          value={`${accuracy}%`}
          label="Avg. Accuracy"
          sub="Based on recent attempts"
        />
        <StatCard 
          tone="orange"
          icon={<TrendingUp className="h-5 w-5 text-white" />}
          value={`${streak} days`}
          label="Current Streak"
          sub="Don't break the chain"
        />
        <StatCard 
          tone="purple"
          icon={<Timer className="h-5 w-5 text-white" />}
          value={hrs > 0 ? `${hrs}h ${mns}m` : `${mns}m`}
          label="Time Spent"
          sub="Total practice time"
        />
      </motion.section>

      {/* ── Pick A Subject ── */}
      <motion.section variants={itemVariants} className="space-y-4">
        <SectionHeader
          title="Pick A Subject To Learn"
          action={
            <Link href="/subjects" className="text-sm font-semibold text-[var(--color-primary)] hover:underline">
              View All
            </Link>
          }
        />
        <SubjectTileRow>
          <SubjectTile 
            href="/subjects?filter=Mathematics"
            name="Mathematics"
            icon={<Sigma className="h-6 w-6" />}
            color="green"
            count={sp['Mathematics']?.total || 0}
          />
          <SubjectTile 
            href="/subjects?filter=Physics"
            name="Physics"
            icon={<Atom className="h-6 w-6" />}
            color="blue"
            count={sp['Physics']?.total || 0}
          />
          <SubjectTile 
            href="/subjects?filter=Chemistry"
            name="Chemistry"
            icon={<FlaskConical className="h-6 w-6" />}
            color="orange"
            count={sp['Chemistry']?.total || 0}
          />
        </SubjectTileRow>
      </motion.section>

      {/* ── Core Progress & Activity ── */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.section id="analytics" variants={itemVariants} className="space-y-4">
          <SectionHeader title="Weekly Pulse" />
          <Card variant="white" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted">Track your daily momentum this week.</p>
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] bg-blue-50 px-3 py-1 rounded-full">
                <TrendingUp className="h-4 w-4" />
                {weekDays.reduce((a: any, d: any) => a + d.count, 0)} sessions
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-3 items-end h-[160px] pb-6 border-b border-[var(--color-border)]">
              {weekDays.map((day) => (
                <div key={day.date} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full flex items-end justify-center h-[120px]">
                    <div
                      className="w-full max-w-[32px] rounded-t-md bg-blue-100 group-hover:bg-blue-200 transition-colors relative"
                      style={{ height: `${Math.max(10, (day.count / maxBar) * 100)}%` }}
                    >
                      {day.count > 0 && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          {day.count}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold ${day.date === todayKey ? 'text-[var(--color-primary)]' : 'text-muted-2'}`}>
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
               <div>
                 <p className="text-xs uppercase tracking-wider text-muted-2 font-semibold">Total Solved</p>
                 <p className="text-2xl font-bold text-foreground mt-1">{totalSolved}</p>
               </div>
               <div>
                 <p className="text-xs uppercase tracking-wider text-muted-2 font-semibold">Total Time</p>
                 <p className="text-2xl font-bold text-foreground mt-1">{hrs > 0 ? `${hrs}h ${mns}m` : `${mns}m`}</p>
               </div>
            </div>
          </Card>
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-4">
          <SectionHeader 
            title="Recent Activity" 
            action={
              userAttempts.length > 0 && (
                <Link href="/subjects" className="text-sm font-semibold text-[var(--color-primary)] hover:underline">
                  View All
                </Link>
              )
            }
          />
          <Card variant="white" className="p-0 overflow-hidden">
            <div className="divide-y divide-[var(--color-border)]">
              {userAttempts.slice(0, 5).map((attempt: any, index: number) => (
                <div
                  key={attempt.id || index}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-bold text-foreground truncate">{attempt.questions?.chapters?.name || 'Practice session'}</p>
                    <p className="text-[11px] font-medium text-muted mt-1">
                      {new Date(attempt.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      attempt.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {attempt.is_correct ? 'Correct' : 'Wrong'}
                    </span>
                  </div>
                </div>
              ))}
              {!userAttempts.length && (
                <div className="p-8 text-center text-sm text-muted">
                  <div className="size-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center mb-3">
                    <Timer className="h-5 w-5 text-slate-400" />
                  </div>
                  No recent attempts yet.<br/>Start a practice set!
                </div>
              )}
            </div>
          </Card>
        </motion.section>
      </div>

      <FloatingButton href="/subjects" label="Practice" icon={<FlaskConical className="h-4 w-4" />} />
    </motion.div>
  )
}
