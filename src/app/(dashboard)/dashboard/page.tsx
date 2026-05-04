import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './dashboard-client'
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

  // Heatmap 12 weeks (ending on Saturday of current week)
  const startDate = new Date(today); 
  startDate.setUTCDate(startDate.getUTCDate() - startDate.getUTCDay()); // Sunday of this week
  startDate.setUTCDate(startDate.getUTCDate() - 77); // 11 weeks ago Sunday (12 weeks total)
  
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
  const sColors: Record<string, [string, string]> = {
    Physics: ['#60a5fa', 'icon-3d-blue'],
    Chemistry: ['#f97316', 'icon-3d-orange'],
    Mathematics: ['#34d399', 'icon-3d-green'],
  }

  return (
    <DashboardClient 
      userAttempts={userAttempts}
      sp={sp}
      totalSolved={totalSolved}
      totalQ={totalQ}
      pct={pct}
      accuracy={accuracy}
      hrs={hrs}
      mns={mns}
      display={display}
      inProgress={inProgress}
      streak={streak}
      weekDays={weekDays}
      maxBar={maxBar}
      dcm={dcm}
      todayKey={todayKey}
      weeks={weeks}
      sColors={sColors}
      dash={dash}
      circ={circ}
    />
  )
}
