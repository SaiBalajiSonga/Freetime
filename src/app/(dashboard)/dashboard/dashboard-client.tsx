'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { BarChart3, BookOpen, ClipboardList, Flame, FlaskConical, Target, Timer, TrendingUp } from 'lucide-react'
import { Card, DifficultyBadge, FloatingButton, GridItem, SectionHeader } from '@/components/site/dashboard-ui'

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
}: any) {

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  const quickActions = [
    { href: '/subjects', label: 'Subjects', icon: <BookOpen className="h-5 w-5" />, tone: 'blue', description: 'Browse topics' },
    { href: '/subjects', label: 'Practice', icon: <FlaskConical className="h-5 w-5" />, tone: 'green', description: 'Start drills' },
    { href: '/tests', label: 'Tests', icon: <ClipboardList className="h-5 w-5" />, tone: 'yellow', description: 'Mock exams' },
    { href: '/dashboard?section=analytics', label: 'Analytics', icon: <BarChart3 className="h-5 w-5" />, tone: 'red', description: 'Track growth' },
  ] as const

  const subjectTone: Record<string, 'blue' | 'yellow' | 'green' | 'red'> = {
    Physics: 'blue',
    Chemistry: 'yellow',
    Mathematics: 'green',
  }

  const searchParams = useSearchParams()
  const analyticsSection = searchParams.get('section')
  const progressToDifficulty = (value: number) => (value >= 70 ? 'easy' : value >= 40 ? 'medium' : 'hard')

  useEffect(() => {
    if (analyticsSection !== 'analytics') return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById('analytics')?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' })
  }, [analyticsSection])

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-10">
      <motion.section variants={itemVariants} className="rounded-3xl border border-white/[0.08] bg-surface/80 p-6 md:p-8 shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-label mb-2">Welcome back</p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-[-0.03em]">Hi, {display} 👋</h1>
            <p className="text-sm text-muted mt-2 max-w-md">Your dashboard is tuned for fast focus. Pick a lane and keep stacking wins.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-surface-2/80 px-4 py-3">
              <Flame className="h-5 w-5 text-[#FACC15]" />
              <div>
                <p className="text-lg font-bold text-foreground leading-none">{streak}</p>
                <p className="text-[10px] text-muted-2 font-semibold uppercase tracking-[0.2em]">Streak</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-surface-2/80 px-4 py-3">
              <Target className="h-5 w-5 text-[#84CC16]" />
              <div>
                <p className="text-lg font-bold text-foreground leading-none">{accuracy}%</p>
                <p className="text-[10px] text-muted-2 font-semibold uppercase tracking-[0.2em]">Accuracy</p>
              </div>
            </div>
            <Link href="/subjects" className="rounded-2xl bg-[#3B82F6] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_-18px_rgba(59,130,246,0.8)] transition-transform hover:-translate-y-1">
              Start practice
            </Link>
            <div className="flex size-12 items-center justify-center rounded-full border border-white/[0.08] bg-surface-2 text-lg font-bold text-[#93C5FD]">
              {display?.[0]?.toUpperCase() ?? '?'}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="space-y-5">
        <SectionHeader
          label="Quick actions"
          title="Jump back in"
          subtitle="Everything you need is one tap away."
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {quickActions.map((action) => (
            <GridItem key={action.label} {...action} />
          ))}
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="space-y-5">
        <SectionHeader
          label="Core progress"
          title="Stacked subject cards"
          subtitle="Color-coded cards highlight where you are winning and what needs attention."
        />
        <div className="grid gap-5 lg:grid-cols-3">
          <Card variant="colored" tone="blue" className="lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/70 font-semibold">Overall</p>
                <h3 className="text-3xl font-extrabold mt-2" aria-label={`Overall progress ${pct}%`}>
                  {pct}%
                </h3>
                <p className="text-sm text-white/70 mt-1">{totalSolved} of {totalQ} solved</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <DifficultyBadge level={progressToDifficulty(pct)} className="text-white border-white/40" />
                <div className="rounded-2xl border border-white/20 px-3 py-2 text-xs text-white/80">
                  <span className="font-semibold">{inProgress}</span> in progress
                </div>
              </div>
            </div>
            <div className="mt-6">
              <div className="h-2 w-full rounded-full bg-white/15 overflow-hidden">
                <div className="h-full rounded-full bg-white/80" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-white/70">
                <span>{hrs > 0 ? `${hrs}h ${mns}m` : `${mns}m`} total time</span>
                <span>{accuracy}% accuracy</span>
              </div>
            </div>
          </Card>

          {Object.entries(sp).map(([subj, stats]: any) => {
            const progress = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0
            const tone = subjectTone[subj] || 'blue'
            return (
              <Card key={subj} variant="colored" tone={tone}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{subj}</h3>
                    <p className="text-sm text-white/70 mt-1">{stats.solved} solved • {stats.total - stats.solved} remaining</p>
                  </div>
                  <DifficultyBadge level={progressToDifficulty(progress)} className="text-white border-white/40" />
                </div>
                <div className="mt-6">
                  <div className="h-2 w-full rounded-full bg-white/15 overflow-hidden">
                    <div className="h-full rounded-full bg-white/80" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-white/70">
                    <span>{progress}% complete</span>
                    <span className="uppercase tracking-[0.15em]">Focus</span>
                  </div>
                </div>
              </Card>
            )
          })}
          {!Object.keys(sp).length && (
            <Card variant="dark" className="lg:col-span-2 text-center">
              <p className="text-muted">No subjects tracked yet.</p>
              <Link href="/subjects" className="mt-3 inline-block text-sm font-semibold text-[#93C5FD]">Explore subjects →</Link>
            </Card>
          )}
        </div>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.section id="analytics" variants={itemVariants}>
          <Card variant="dark" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="section-label mb-2">Analytics</p>
                <h3 className="text-lg font-bold text-foreground">Weekly pulse</h3>
                <p className="text-xs text-muted mt-1">Track daily momentum this week.</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <TrendingUp className="h-4 w-4 text-[#3B82F6]" />
                {weekDays.reduce((a: any, d: any) => a + d.count, 0)} sessions
              </div>
            </div>
            <div className="grid grid-cols-7 gap-3 items-end">
              {weekDays.map((day: any, index: number) => (
                <div key={day.label + index} className="flex flex-col items-center gap-2">
                  <div className="flex h-20 w-full items-end">
                    <div
                      className="w-full rounded-xl bg-[#3B82F6]/30"
                      style={{ height: `${Math.max(20, (day.count / maxBar) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-muted-2">{day.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-muted">
              <div className="rounded-2xl border border-white/[0.08] bg-surface-2/70 p-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-2">Solved</p>
                <p className="text-lg font-bold text-foreground">{totalSolved}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-surface-2/70 p-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-2">Time</p>
                <p className="text-lg font-bold text-foreground flex items-center gap-1">
                  <Timer className="h-4 w-4 text-[#FACC15]" />
                  {hrs > 0 ? `${hrs}h ${mns}m` : `${mns}m`}
                </p>
              </div>
            </div>
          </Card>
        </motion.section>

        <motion.section variants={itemVariants}>
          <Card variant="dark" className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="section-label mb-2">Recent activity</p>
                <h3 className="text-lg font-bold text-foreground">Latest attempts</h3>
              </div>
              {userAttempts.length > 0 && (
                <Link href="/subjects" className="text-xs font-semibold text-[#93C5FD] hover:text-white transition-colors">
                  See all
                </Link>
              )}
            </div>
            <div className="space-y-3">
              {userAttempts.slice(0, 5).map((attempt: any, index: number) => (
                <div
                  key={attempt.id || index}
                  className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-surface-2/70 px-4 py-3 transition-transform hover:-translate-y-0.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{attempt.questions?.chapters?.name || 'Practice session'}</p>
                    <p className="text-[11px] text-muted mt-1">
                      {new Date(attempt.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${
                    attempt.is_correct ? 'text-[#84CC16]' : 'text-[#EF4444]'
                  }`}>
                    {attempt.is_correct ? 'Correct' : 'Wrong'}
                  </span>
                </div>
              ))}
              {!userAttempts.length && (
                <div className="rounded-2xl border border-white/[0.08] bg-surface-2/70 px-4 py-6 text-center text-sm text-muted">
                  No recent attempts yet. Start a practice set to see activity here.
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
