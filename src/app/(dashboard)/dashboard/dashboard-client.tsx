'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

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
  dcm,
  todayKey,
  weeks,
  sColors,
  dash,
  circ
}: any) {

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">

      {/* ── Hero card ── */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl surface-glass-strong border border-white/[0.08]">
        <div
          className="pointer-events-none absolute top-[-80px] right-[-60px] w-[280px] h-[280px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.14) 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute bottom-[-100px] left-[10%] w-[220px] h-[220px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 p-8">
          <div className="flex justify-between items-start">
            <div>
              <p className="section-label">Overview</p>
              <h1 className="text-2xl font-extrabold text-foreground mt-1.5 tracking-[-0.03em]">Hi, {display} 👋</h1>
              <p className="text-muted text-sm mt-1">Keep the momentum going. You&apos;re doing great.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-4 py-2.5 flex items-center gap-2 border border-white/[0.08] bg-surface-2/80 rounded-xl backdrop-blur-sm">
                <span className="text-lg">🔥</span>
                <div>
                  <p className="text-lg font-extrabold text-foreground tracking-tight leading-none">{streak}</p>
                  <p className="text-[9px] text-muted-2 font-bold uppercase tracking-wider mt-0.5">Streak</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Ring */}
          <div className="flex flex-col items-center py-8">
            <div className="relative">
              <svg className="w-[190px] h-[190px]" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="12" />
                <motion.circle
                  cx="90" cy="90" r="80" fill="none" stroke="url(#rGrad)" strokeWidth="12" strokeLinecap="round"
                  initial={{ strokeDashoffset: circ }}
                  animate={{ strokeDashoffset: circ - dash }}
                  transition={{ duration: 1.5, delay: 0.3 }}
                  strokeDasharray={`${circ} ${circ}`}
                />
                <defs>
                  <linearGradient id="rGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#93c5fd" />
                    <stop offset="50%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[52px] font-extrabold text-foreground leading-none tracking-tight">
                  {pct}<span className="text-2xl text-muted-2">%</span>
                </span>
                <span className="text-muted-2 text-[11px] font-bold uppercase tracking-widest mt-1">Completed</span>
              </div>
            </div>
          </div>

          {/* Stat pills */}
          <div className="flex justify-center gap-3 flex-wrap">
            {[
              { emoji: '✅', val: totalSolved, label: 'Solved' },
              { emoji: '⏳', val: inProgress, label: 'In Progress' },
              { emoji: '🎯', val: `${accuracy}%`, label: 'Accuracy' },
              { emoji: '📚', val: totalQ, label: 'Total' },
              { emoji: '⏱️', val: hrs > 0 ? `${hrs}h ${mns}m` : `${mns}m`, label: 'Time' },
            ].map(s => (
              <motion.div
                key={s.label}
                whileHover={{ y: -3 }}
                className="px-4 py-3 text-center min-w-[90px] border border-white/[0.07] bg-surface-2/70 rounded-2xl backdrop-blur-sm transition-all hover:border-accent-electric/25 hover:shadow-[0_8px_28px_-12px_rgba(59,130,246,0.2)]"
              >
                <span className="text-sm">{s.emoji}</span>
                <p className="text-lg font-extrabold text-foreground mt-1 tracking-tight leading-none">{s.val}</p>
                <p className="text-[9px] text-muted-2 font-bold uppercase tracking-widest mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Weekly + Heatmap ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Weekly bars */}
        <motion.div variants={itemVariants} className="rounded-2xl surface-glass p-6 border border-white/[0.06]">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-base font-bold text-foreground">This Week</h2>
              <p className="text-muted-2 text-xs mt-0.5">Daily practice activity</p>
            </div>
            <div className="px-3 py-1.5 border border-white/[0.08] bg-surface-2/80 rounded-xl">
              <span className="text-xs font-bold text-accent-electric">{weekDays.reduce((a: any, d: any) => a + d.count, 0)} total</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-2 h-[120px]">
            {weekDays.map((d: any, i: any) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex justify-center" style={{ height: '90px' }}>
                  <motion.div
                    initial={{ height: 4 }}
                    animate={{ height: Math.max(d.count > 0 ? (d.count / maxBar) * 80 : 4, 4) }}
                    transition={{ duration: 0.8, delay: 0.4 + (i * 0.05) }}
                    className="rounded-lg"
                    style={{
                      width: '100%', maxWidth: '32px',
                      marginTop: 'auto',
                      background: d.isToday
                        ? 'linear-gradient(180deg, #93c5fd, #2563eb)'
                        : d.count > 0
                          ? 'linear-gradient(180deg, rgba(96,165,250,0.45), rgba(37,99,235,0.2))'
                          : 'rgba(255,255,255,0.04)',
                      boxShadow: d.count > 0 && d.isToday ? '0 4px 18px rgba(59,130,246,0.35)' : 'none',
                    }}
                  />
                </div>
                <span className={`text-[10px] font-bold ${d.isToday ? 'text-accent-electric' : 'text-muted-2'}`}>{d.label}</span>
                <span className={`text-[9px] font-medium ${d.isToday ? 'text-accent-glow' : 'text-muted-2/50'}`}>{d.date}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Heatmap */}
        <motion.div variants={itemVariants} className="rounded-2xl surface-glass p-6 border border-white/[0.06]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Practice Map</h2>
              <p className="text-muted-2 text-xs mt-0.5">{Object.keys(dcm).length} active days</p>
            </div>
            <div className="flex gap-1.5 items-center">
              <span className="text-[8px] text-muted-2/50 font-medium">Less</span>
              {[4, 6, 8, 10, 12].map(o => <div key={o} className="w-2 h-2 rounded-sm" style={{ backgroundColor: `rgba(96,165,250,${o / 14})` }} />)}
              <span className="text-[8px] text-muted-2/50 font-medium">More</span>
            </div>
          </div>
          <div className="flex gap-[3px]">
            <div className="flex flex-col gap-[3px] mr-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="h-[13px] flex items-center">
                  <span className="text-[8px] text-muted-2/50 font-medium">{d}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-[3px] flex-1">
              {weeks.map((wk: any, wi: any) => (
                <motion.div
                  key={wi}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 + (wi * 0.03) }}
                  className="flex flex-col gap-[3px] flex-1"
                >
                  {wk.map((d: any, di: any) => {
                    let bg = 'rgba(255,255,255,0.03)'
                    if (!d.future && d.count > 0) bg = d.count >= 8 ? 'rgba(96,165,250,0.95)' : d.count >= 4 ? 'rgba(96,165,250,0.65)' : d.count >= 2 ? 'rgba(96,165,250,0.38)' : 'rgba(96,165,250,0.2)'
                    if (d.future) bg = 'transparent'
                    return <div key={di} className={`aspect-square rounded-[3px] ${d.key === todayKey ? 'ring-1 ring-accent-electric/45' : ''}`} style={{ backgroundColor: bg, minHeight: '13px' }} />
                  })}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Subject Progress + Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <motion.div variants={itemVariants} className="lg:col-span-3 rounded-2xl surface-glass p-6 border border-white/[0.06]">
          <h2 className="text-lg font-bold text-foreground mb-5">Subject Progress</h2>
          <div className="space-y-5">
            {Object.entries(sp).map(([subj, stats]: any, index) => {
              const p = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0
              const [barCol] = sColors[subj] || ['#22d3ee']
              return (
                <div key={subj} className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-accent-electric" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm font-semibold text-foreground">{subj}</span>
                      <span className="text-xs font-bold text-accent-electric">{p}%</span>
                    </div>
                    <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden border border-white/[0.06]">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${p}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.3 + (index * 0.1) }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: barCol, boxShadow: `0 0 10px ${barCol}` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-2 mt-1.5 font-medium">{stats.solved} of {stats.total} solved</p>
                  </div>
                </div>
              )
            })}
            {!Object.keys(sp).length && <p className="text-sm text-muted text-center py-6">No subjects yet.</p>}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-2 rounded-2xl surface-glass p-6 border border-white/[0.06]">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-foreground">Recent Activity</h2>
            {userAttempts.length > 0 && <Link href="/subjects" className="text-xs font-semibold text-accent-electric hover:text-accent-glow transition-colors">See all</Link>}
          </div>
          <div className="space-y-1">
            {userAttempts.slice(0, 6).map((a: any, i: any) => (
              <motion.div
                key={a.id}
                whileHover={{ x: 4 }}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl border-b border-white/[0.05] last:border-0 hover:bg-surface-2/80 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="size-7 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-[11px] font-bold text-muted-2">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{(a as any).questions?.chapters?.name || '—'}</p>
                    <p className="text-[10px] text-muted-2 font-medium">{new Date(a.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${a.is_correct ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-rose-400 bg-rose-400/10 border-rose-400/20'}`}>
                  {a.is_correct ? '✓ Correct' : '✗ Wrong'}
                </span>
              </motion.div>
            ))}
            {!userAttempts.length && (
              <div className="text-center py-10">
                <div className="size-12 rounded-xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl">⚡</span>
                </div>
                <p className="text-sm text-muted font-medium">No activity yet</p>
                <Link href="/subjects" className="text-xs text-accent-electric font-bold mt-2 inline-block hover:text-accent-glow">Start practicing →</Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
