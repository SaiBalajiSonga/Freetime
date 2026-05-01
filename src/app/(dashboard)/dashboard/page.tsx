import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const [{ data: authUser }, { data: attempts }, { data: allQuestions }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('attempts').select('*, questions(*, chapters(*, subjects(*)))').order('created_at', { ascending: false }),
    supabase.from('questions').select('id, chapters(subjects(id, name))')
  ])

  const userAttempts = attempts || []
  const solvedIds = new Set(userAttempts.filter(a => a.is_correct).map(a => a.question_id))
  const totalSolved = solvedIds.size
  const totalQ = allQuestions?.length || 0
  const pct = totalQ > 0 ? Math.round((totalSolved / totalQ) * 100) : 0
  const accuracy = userAttempts.length > 0 ? Math.round((userAttempts.filter(a => a.is_correct).length / userAttempts.length) * 100) : 0
  const totalSec = userAttempts.reduce((a, c) => a + (c.time_taken || 0), 0)
  const hrs = Math.floor(totalSec / 3600); const mns = Math.floor((totalSec % 3600) / 60)

  // Subject progress
  const sp: Record<string, { total: number; solved: number }> = {}
  allQuestions?.forEach(q => { const n = (q as any).chapters?.subjects?.name; if (n) { if (!sp[n]) sp[n] = { total: 0, solved: 0 }; sp[n].total++ } })
  userAttempts.filter(a => a.is_correct).filter((v,i,a)=>a.findIndex(v2=>v2.question_id===v.question_id)===i)
    .forEach(a => { const n = (a as any).questions?.chapters?.subjects?.name; if (n && sp[n]) sp[n].solved++ })

  const userName = (authUser.user?.email?.split('@')[0] || 'student')
  const display = userName.charAt(0).toUpperCase() + userName.slice(1)

  const attemptedIds = new Set(userAttempts.map(a => a.question_id))
  const totalAttempted = attemptedIds.size
  const inProgress = totalAttempted - totalSolved

  // Streak + heatmap
  const today = new Date()
  today.setUTCHours(0,0,0,0) // Normalize to midnight UTC
  const todayKey = today.toISOString().split('T')[0]
  
  const dcm: Record<string, number> = {}
  userAttempts.forEach(a => { 
    const k = new Date(a.created_at).toISOString().split('T')[0]
    dcm[k] = (dcm[k]||0) + 1 
  })

  let streak = 0; 
  const cd = new Date(today)
  if (dcm[todayKey]) { streak = 1; cd.setUTCDate(cd.getUTCDate()-1) }
  while (true) { 
    const k = cd.toISOString().split('T')[0]
    if (dcm[k]) { streak++; cd.setUTCDate(cd.getUTCDate()-1) } else break 
  }

  // Week days for bar chart
  const weekDays: { label: string; date: string; count: number; isToday: boolean }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setUTCDate(d.getUTCDate() - i)
    const k = d.toISOString().split('T')[0]
    weekDays.push({ label: d.toLocaleDateString('en', { weekday: 'short', timeZone: 'UTC' }).charAt(0), date: String(d.getUTCDate()), count: dcm[k]||0, isToday: i===0 })
  }
  const maxBar = Math.max(...weekDays.map(d => d.count), 1)

  // Heatmap 12 weeks
  const startDate = new Date(today); 
  startDate.setUTCDate(startDate.getUTCDate() - 83); 
  startDate.setUTCDate(startDate.getUTCDate() - startDate.getUTCDay())
  
  const weeks: { key: string; count: number; future: boolean }[][] = []
  const cur = new Date(startDate)
  while (weeks.length < 12) {
    const wk: { key: string; count: number; future: boolean }[] = []
    for (let d = 0; d < 7; d++) {
      const k = cur.toISOString().split('T')[0]
      wk.push({ key: k, count: dcm[k]||0, future: cur > today })
      cur.setUTCDate(cur.getUTCDate()+1)
    }
    weeks.push(wk)
  }

  const circ = 2 * Math.PI * 80
  const dash = (pct / 100) * circ
  const sColors: Record<string, [string, string]> = { Physics: ['#3b82f6','icon-3d-blue'], Chemistry: ['#f97316','icon-3d-orange'], Mathematics: ['#10b981','icon-3d-green'] }

  return (
    <div className="space-y-6 stagger-in">

      {/* ── Hero: Dark card with centered ring ── */}
      <div className="relative overflow-hidden rounded-[26px] noise-overlay" style={{ background: 'linear-gradient(145deg, #0c0a20 0%, #161240 40%, #1e1660 70%, #251a78 100%)' }}>
        <div className="absolute top-[-80px] right-[-60px] w-[280px] h-[280px] rounded-full animate-pulse-soft" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-100px] left-[10%] w-[220px] h-[220px] rounded-full animate-pulse-soft" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', animationDelay: '1.5s' }} />

        <div className="relative z-10 p-8">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/30 text-xs font-semibold uppercase tracking-widest">Dashboard</p>
              <h1 className="text-[26px] font-extrabold text-white mt-1.5 tracking-tight">Hi, {display} 👋</h1>
              <p className="text-white/35 text-sm mt-1">Keep the momentum going. You&apos;re doing great.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="stat-card-3d px-4 py-2.5 flex items-center gap-2">
                <span className="text-lg">🔥</span>
                <div>
                  <p className="stat-number text-lg text-white">{streak}</p>
                  <p className="text-[9px] text-white/30 font-bold uppercase">Streak</p>
                </div>
              </div>
            </div>
          </div>

          {/* Centered Progress Ring */}
          <div className="flex flex-col items-center py-8">
            <div className="relative">
              <svg className="w-[190px] h-[190px]" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="12" />
                <circle cx="90" cy="90" r="80" fill="none" stroke="url(#rGrad)" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={`${dash} ${circ - dash}`} className="progress-ring-animated" style={{ '--ring-circumference': circ } as any} />
                <defs>
                  <linearGradient id="rGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ transform: 'rotate(0deg)' }}>
                <span className="stat-number text-[52px] text-white">{pct}<span className="text-2xl text-white/40">%</span></span>
                <span className="text-white/25 text-[11px] font-bold uppercase tracking-wider mt-1">Completed</span>
              </div>
            </div>
          </div>

          {/* Stat pills row */}
          <div className="flex justify-center gap-3">
            {[
              { emoji: '✅', val: totalSolved, label: 'Solved' },
              { emoji: '⏳', val: inProgress, label: 'In Progress' },
              { emoji: '🎯', val: `${accuracy}%`, label: 'Accuracy' },
              { emoji: '📚', val: totalQ, label: 'Total' },
              { emoji: '⏱️', val: hrs > 0 ? `${hrs}h ${mns}m` : `${mns}m`, label: 'Time' },
            ].map(s => (
              <div key={s.label} className="stat-card-3d px-4 py-3 text-center min-w-[90px]">
                <span className="text-sm">{s.emoji}</span>
                <p className="stat-number text-lg text-white mt-1">{s.val}</p>
                <p className="text-[9px] text-white/25 font-bold uppercase tracking-wide mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Weekly Activity Bar + Heatmap ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Weekly bars */}
        <div className="glass-dark p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-base font-bold text-white">This Week</h2>
              <p className="text-white/25 text-xs mt-0.5">Daily practice activity</p>
            </div>
            <div className="stat-card-3d px-3 py-1.5">
              <span className="text-xs font-bold text-white/60">{weekDays.reduce((a,d)=>a+d.count,0)} total</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-2 h-[120px]">
            {weekDays.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex justify-center" style={{ height: '90px' }}>
                  <div
                    className="rounded-lg transition-all duration-500"
                    style={{
                      width: '100%', maxWidth: '32px',
                      height: `${Math.max(d.count > 0 ? (d.count / maxBar) * 80 : 4, 4)}px`,
                      marginTop: 'auto',
                      background: d.isToday
                        ? 'linear-gradient(180deg, #818cf8, #4f46e5)'
                        : d.count > 0
                          ? 'linear-gradient(180deg, rgba(129,140,248,0.5), rgba(79,70,229,0.3))'
                          : 'rgba(255,255,255,0.04)',
                      boxShadow: d.count > 0 && d.isToday ? '0 4px 12px rgba(79,70,229,0.4)' : 'none',
                    }}
                  />
                </div>
                <span className={`text-[10px] font-bold ${d.isToday ? 'text-indigo-400' : 'text-white/20'}`}>{d.label}</span>
                <span className={`text-[9px] font-medium ${d.isToday ? 'text-indigo-300' : 'text-white/15'}`}>{d.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <div className="glass-dark p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Practice Map</h2>
              <p className="text-white/25 text-xs mt-0.5">{Object.keys(dcm).length} active days</p>
            </div>
            <div className="flex gap-1.5 items-center">
              <span className="text-[8px] text-white/15 font-medium">Less</span>
              {[4, 6, 8, 10, 12].map(o => <div key={o} className="w-2 h-2 rounded-sm" style={{ backgroundColor: `rgba(99,102,241,${o/14})` }} />)}
              <span className="text-[8px] text-white/15 font-medium">More</span>
            </div>
          </div>
          <div className="flex gap-[3px]">
            <div className="flex flex-col gap-[3px] mr-1">
              {['S','M','T','W','T','F','S'].map((d,i) => <div key={i} className="h-[13px] flex items-center"><span className="text-[8px] text-white/15 font-medium">{d}</span></div>)}
            </div>
            <div className="flex gap-[3px] flex-1">
              {weeks.map((wk,wi) => (
                <div key={wi} className="flex flex-col gap-[3px] flex-1">
                  {wk.map((d,di) => {
                    let bg = 'rgba(255,255,255,0.03)'
                    if (!d.future && d.count > 0) bg = d.count >= 8 ? 'rgba(99,102,241,0.9)' : d.count >= 4 ? 'rgba(99,102,241,0.6)' : d.count >= 2 ? 'rgba(99,102,241,0.35)' : 'rgba(99,102,241,0.18)'
                    if (d.future) bg = 'transparent'
                    return <div key={di} className={`aspect-square rounded-[3px] ${d.key === todayKey ? 'ring-1 ring-indigo-400/50' : ''}`} style={{ backgroundColor: bg, minHeight: '13px' }} />
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Subject Progress + Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 premium-card p-6" style={{ cursor: 'default' }}>
          <h2 className="text-lg font-bold text-gray-900 mb-5">Subject Progress</h2>
          <div className="space-y-5">
            {Object.entries(sp).map(([subj, stats]) => {
              const p = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0
              const [barCol, iconCls] = sColors[subj] || ['#6366f1', 'icon-3d']
              return (
                <div key={subj} className="flex items-center gap-4">
                  <div className={`${iconCls} p-2.5 text-white shrink-0`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm font-semibold text-gray-800">{subj}</span>
                      <span className="text-xs font-medium text-gray-400">{p}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p}%`, backgroundColor: barCol }} />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">{stats.solved} of {stats.total} solved</p>
                  </div>
                </div>
              )
            })}
            {!Object.keys(sp).length && <p className="text-sm text-gray-400 text-center py-6">No subjects yet.</p>}
          </div>
        </div>

        <div className="lg:col-span-2 premium-card p-6" style={{ cursor: 'default' }}>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
            {userAttempts.length > 0 && <Link href="/subjects" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">See all</Link>}
          </div>
          <div className="space-y-0.5">
            {userAttempts.slice(0, 6).map((a, i) => (
              <div key={a.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-400">{i+1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{(a as any).questions?.chapters?.name || '—'}</p>
                    <p className="text-[10px] text-gray-400">{new Date(a.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${a.is_correct ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                  {a.is_correct ? '✓ Correct' : '✗ Wrong'}
                </span>
              </div>
            ))}
            {!userAttempts.length && (
              <div className="text-center py-10">
                <div className="icon-3d p-3 text-white w-fit mx-auto mb-3"><span className="text-lg">⚡</span></div>
                <p className="text-sm text-gray-400 font-medium">No activity yet</p>
                <Link href="/subjects" className="text-xs text-indigo-600 font-bold mt-1.5 inline-block">Start practicing →</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
