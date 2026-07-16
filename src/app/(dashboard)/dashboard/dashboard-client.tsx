'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Atom, Sigma, FlaskConical, Timer, TrendingUp, CheckCircle2, ChevronRight, BookOpen, Gauge, Flame, CheckSquare, Hourglass } from 'lucide-react'
import { Card, DifficultyBadge, SectionHeader, PageHeader } from '@/components/site/dashboard-ui'
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
  bestStreak: number
  avgMinPerDay: number
  thisWeekSolved: number
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
  bestStreak,
  avgMinPerDay,
  thisWeekSolved,
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

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (analyticsSection !== 'analytics') return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById('analytics')?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' })
  }, [analyticsSection])

  // --- Smart Logic for Stat Cards ---
  let solvedSub = ''
  let solvedTrend: 'positive' | 'negative' | 'neutral' | 'warning' = 'neutral'
  if (thisWeekSolved === 0) {
    solvedSub = 'Sleeping on the job'
    solvedTrend = 'warning'
  } else if (thisWeekSolved < 5) {
    solvedSub = `Warming up (${thisWeekSolved} Qs)`
    solvedTrend = 'neutral'
  } else {
    solvedSub = `Crushing it (${thisWeekSolved} Qs)`
    solvedTrend = 'positive'
  }

  let accSub = ''
  let accTrend: 'positive' | 'negative' | 'neutral' | 'warning' = 'neutral'
  if (userAttempts.length === 0) {
    accSub = 'No shots fired'
    accTrend = 'neutral'
  } else if (accuracy < 50) {
    accSub = 'Needs practice'
    accTrend = 'warning'
  } else if (accuracy >= 80) {
    accSub = 'Deadly accurate'
    accTrend = 'positive'
  } else {
    accSub = `Solid (${userAttempts.length} attempts)`
    accTrend = 'neutral'
  }

  let streakSub = ''
  let streakTrend: 'positive' | 'negative' | 'neutral' | 'warning' = 'neutral'
  if (streak === 0) {
    streakSub = 'Start a streak'
    streakTrend = 'neutral'
  } else if (streak >= bestStreak && streak > 0) {
    streakSub = 'New best!'
    streakTrend = 'positive'
  } else {
    streakSub = `Chasing best (${bestStreak})`
    streakTrend = 'neutral'
  }

  let timeSub = ''
  let timeTrend: 'positive' | 'negative' | 'neutral' | 'warning' = 'neutral'
  if (avgMinPerDay === 0) {
    timeSub = 'Zero mins logged'
    timeTrend = 'warning'
  } else if (avgMinPerDay < 10) {
    timeSub = `Light work: ${avgMinPerDay}m/d`
    timeTrend = 'neutral'
  } else {
    timeSub = `Locked in: ${avgMinPerDay}m/d`
    timeTrend = 'positive'
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      
      {/* ── Page Header ── */}
      <PageHeader 
        title={`Hi, ${display}!`}
        subtitle="Central hub for all your learning needs"
      />

      {/* ── Stats Row ── */}
      <motion.section variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          tone="blue"
          icon={<CheckSquare fill="currentColor" fillOpacity={0.2} strokeWidth={2} />}
          value={`${totalSolved} Qs`}
          label="Questions Solved"
          sub={solvedSub}
          trend={solvedTrend}
        />
        <StatCard 
          tone="green"
          icon={<Gauge className="opacity-20" fill="none" stroke="currentColor" strokeWidth={2.5} />}
          value={`${accuracy}%`}
          label="Avg. Accuracy"
          sub={accSub}
          trend={accTrend}
        />
        <StatCard 
          tone="orange"
          icon={<Flame fill="currentColor" fillOpacity={0.2} strokeWidth={2} />}
          value={`${streak} days`}
          label="Current Streak"
          sub={streakSub}
          trend={streakTrend}
        />
        <StatCard 
          tone="purple"
          icon={<Timer fill="currentColor" fillOpacity={0.2} strokeWidth={2} />}
          value={hrs > 0 ? `${hrs}h ${mns}min` : `${mns}min`}
          label="Time Spent"
          sub={timeSub}
          trend={timeTrend}
        />
      </motion.section>

      {/* ── Pick A Subject ── */}
      <motion.section variants={itemVariants} className="space-y-4">
        <SectionHeader
          title="Pick A Subject To Practice"
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
            pct={sp['Mathematics']?.total ? Math.round((sp['Mathematics'].solved / sp['Mathematics'].total) * 100) : 0}
          />
          <SubjectTile 
            href="/subjects?filter=Physics"
            name="Physics"
            icon={<Atom className="h-6 w-6" />}
            color="blue"
            count={sp['Physics']?.total || 0}
            pct={sp['Physics']?.total ? Math.round((sp['Physics'].solved / sp['Physics'].total) * 100) : 0}
          />
          <SubjectTile 
            href="/subjects?filter=Chemistry"
            name="Chemistry"
            icon={<FlaskConical className="h-6 w-6" />}
            color="orange"
            count={sp['Chemistry']?.total || 0}
            pct={sp['Chemistry']?.total ? Math.round((sp['Chemistry'].solved / sp['Chemistry'].total) * 100) : 0}
          />
        </SubjectTileRow>
      </motion.section>

      {/* ── Hero Banner ── */}
      <motion.section variants={itemVariants}>
        <div className="overflow-hidden rounded-2xl">
          <HeroBanner />
        </div>
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
              {weekDays.map((day) => {
                const isZero = day.count === 0;
                return (
                  <div key={day.date} className="flex flex-col items-center gap-2 h-full justify-end group cursor-pointer">
                    <div className="w-full flex items-end justify-center h-[120px] relative">
                      
                      {/* Floating Tooltip */}
                      {!isZero && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200 pointer-events-none z-10 flex flex-col items-center">
                          <div className="bg-slate-800 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap">
                            {day.count} {day.count === 1 ? 'Question' : 'Questions'}
                          </div>
                          <div className="w-2 h-2 bg-slate-800 rotate-45 -mt-1.5 rounded-sm" />
                        </div>
                      )}

                      {/* Bar Shape */}
                      <div
                        className={`w-full max-w-[32px] rounded-t-xl transition-all duration-300 relative ${
                          isZero 
                            ? 'bg-slate-100/80 group-hover:bg-slate-200' 
                            : 'bg-gradient-to-t from-blue-600 to-blue-400 opacity-90 group-hover:opacity-100 shadow-[var(--shadow-blue-glow)]'
                        }`}
                        style={{ height: isZero ? '8px' : `${Math.max(15, (day.count / maxBar) * 100)}%` }}
                      />
                    </div>
                    
                    {/* X-Axis Label */}
                    <div className="flex flex-col items-center justify-center h-4 relative mt-1">
                      <span className={`text-[12px] font-bold z-10 transition-colors ${day.date === todayKey ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-600'}`}>
                        {day.label}
                      </span>
                      {day.date === todayKey && (
                        <div className="absolute -inset-x-2 -inset-y-1 bg-blue-100 rounded-md -z-0" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
               <p className="text-sm text-muted">You solved <strong className="text-foreground">{thisWeekSolved}</strong> questions this week across <strong className="text-foreground">{weekDays.filter(d => d.count > 0).length}</strong> days.</p>
            </div>
          </Card>
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-4">
          <SectionHeader 
            title="Recent Activity" 
            action={
              userAttempts.length > 0 && (
                <Link href="/tests" className="text-sm font-semibold text-[var(--color-primary)] hover:underline">
                  View All
                </Link>
              )
            }
          />
          <Card variant="white" className="p-0 overflow-hidden">
            {userAttempts.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
                <div className="size-20 rounded-full bg-blue-50 flex items-center justify-center mb-5">
                  <BookOpen className="h-10 w-10 text-[var(--color-primary)]" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">Start your first practice session</h3>
                <p className="text-sm text-muted mb-6 max-w-xs">Pick a subject above or take a custom test to begin your journey.</p>
                <Link 
                  href="/subjects" 
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] text-white px-6 py-2.5 font-bold hover:-translate-y-0.5 transition-transform shadow-[var(--shadow-blue-glow)]"
                >
                  Start Practising <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {userAttempts.slice(0, 5).map((attempt: any, index: number) => (
                  <div
                    key={attempt.id || index}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0 pr-4">
                      <p className="text-sm font-bold text-foreground truncate">{attempt.questions?.chapters?.name || 'Practice session'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[11px] font-medium text-muted">
                          {mounted ? new Date(attempt.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '...'}
                        </p>
                        <span className="text-muted-2">•</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-2 bg-slate-100 px-1.5 py-0.5 rounded">
                          {attempt.questions?.type === 'mcq' ? 'MCQ' : 'NUM'}
                        </span>
                        {!attempt.is_correct && attempt.questions?.chapters?.subjects?.name && (
                          <>
                            <span className="text-muted-2">•</span>
                            <span className="text-[11px] font-medium text-muted-2">{attempt.questions.chapters.subjects.name}</span>
                          </>
                        )}
                      </div>
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
              </div>
            )}
          </Card>
        </motion.section>
      </div>

    </motion.div>
  )
}
