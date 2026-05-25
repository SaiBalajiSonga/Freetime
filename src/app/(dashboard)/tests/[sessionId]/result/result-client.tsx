'use client'

import { useState } from 'react'
import Link from 'next/link'
import Latex from '@/components/ui/latex'
import {
  CheckCircle2, XCircle, MinusCircle, Clock, Target,
  ChevronDown, ChevronUp, ArrowRight, Trophy, Medal, Timer, BarChart3,
} from 'lucide-react'

type Option = { id: string; question_id: string; text: string; is_correct: boolean }

type SQ = {
  id: string
  order_index: number
  answer_given: string | null
  is_correct: boolean | null
  marks_awarded: number
  visit_status: string
  time_taken: number
  questions: {
    id: string
    type: 'mcq' | 'numerical'
    statement: string
    difficulty: string
    correct_answer: string | null
    solution: string | null
    chapters: { id: string; name: string; subjects: { id: string; name: string } }
  }
  options: Option[]
}

type LeaderboardEntry = {
  rank: number
  id: string
  user_id: string
  score: number
  correct: number
  incorrect: number
  time_taken: number
  name: string | null
  math_score: number
  physics_score: number
  chem_score: number
  math_incorrect: number
  physics_incorrect: number
  chem_incorrect: number
}

type Props = {
  session: any
  sessionQuestions: SQ[]
  leaderboard?: LeaderboardEntry[] | null
  currentUserId?: string
}

function formatDuration(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${sec}s`
  return `${s}s`
}

type Filter = 'all' | 'correct' | 'wrong' | 'skipped'

export default function ResultClient({ session, sessionQuestions, leaderboard, currentUserId }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const pct = session.max_score > 0
    ? Math.round((session.score / session.max_score) * 100)
    : 0

  const remark =
    pct >= 80 ? 'Excellent! Outstanding performance. 🎉' :
    pct >= 60 ? 'Good job! Keep pushing. 💪' :
    pct >= 40 ? 'Decent effort. More practice needed. 📚' :
    'Keep going — every attempt builds skill. 🔥'

  const scoreColor =
    pct >= 75 ? 'text-emerald-400' :
    pct >= 50 ? 'text-amber-400' :
    'text-red-400'

  const accuracy = session.correct + session.incorrect > 0
    ? Math.round((session.correct / (session.correct + session.incorrect)) * 100)
    : 0

  // Subject breakdown
  const subjectMap: Record<string, { correct: number; incorrect: number; unattempted: number; score: number; total: number }> = {}
  for (const sq of sessionQuestions) {
    const name = sq.questions.chapters.subjects.name
    if (!subjectMap[name]) subjectMap[name] = { correct: 0, incorrect: 0, unattempted: 0, score: 0, total: 0 }
    subjectMap[name].total++
    subjectMap[name].score += sq.marks_awarded
    if (!sq.answer_given) subjectMap[name].unattempted++
    else if (sq.is_correct) subjectMap[name].correct++
    else subjectMap[name].incorrect++
  }
  const subjects = Object.entries(subjectMap)
  const isMultiSubject = subjects.length > 1

  // Filter questions
  const filtered = sessionQuestions.filter(sq => {
    if (filter === 'correct') return sq.is_correct === true
    if (filter === 'wrong') return sq.is_correct === false && !!sq.answer_given
    if (filter === 'skipped') return !sq.answer_given
    return true
  })

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-8 animate-in-up pb-16">
      {/* SCORE HERO */}
      <div className="rounded-2xl surface-glass-strong p-6 space-y-5 border border-white/[0.07]">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-5 w-5 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                {session.mode === 'jee_mains' ? 'JEE Mains Mock' : session.mode === 'weekly_exam' ? 'Weekly Exam' : 'Custom Test'}
              </span>
            </div>
            <p className="text-base text-muted mt-1">{remark}</p>
          </div>
          <div className={`text-5xl font-extrabold stat-number ${scoreColor}`}>
            {session.score}
            <span className="text-2xl text-muted font-bold">/{session.max_score}</span>
          </div>
        </div>

        {/* Stat pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { icon: <Target className="h-4 w-4" />, label: 'Accuracy', value: `${accuracy}%`, color: 'text-accent-electric' },
            { icon: <CheckCircle2 className="h-4 w-4" />, label: 'Correct', value: session.correct, color: 'text-emerald-400' },
            { icon: <XCircle className="h-4 w-4" />, label: 'Wrong', value: session.incorrect, color: 'text-red-400' },
            { icon: <MinusCircle className="h-4 w-4" />, label: 'Skipped', value: session.unattempted, color: 'text-muted' },
            { icon: <Clock className="h-4 w-4" />, label: 'Time', value: formatDuration(session.time_taken ?? 0), color: 'text-muted' },
          ].map(item => (
            <div key={item.label} className="rounded-xl border border-white/[0.07] bg-surface-2/70 backdrop-blur-sm p-3 flex items-center gap-2">
              <span className={item.color}>{item.icon}</span>
              <div>
                <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-muted">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SUBJECT BREAKDOWN */}
      {isMultiSubject && (
        <div className="rounded-2xl surface-glass p-6 space-y-4 border border-white/[0.06]">
          <h2 className="font-bold text-foreground">Subject Breakdown</h2>
          <div className="space-y-4">
            {subjects.map(([name, data]) => {
              const subPct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
              return (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-foreground">{name}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-emerald-400">{data.correct}✓</span>
                      <span className="text-red-400">{data.incorrect}✗</span>
                      <span className="text-muted">{data.unattempted}–</span>
                      <span className="font-bold text-accent-electric">{data.score} pts</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-primary transition-all"
                      style={{ width: `${subPct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TIME MANAGEMENT PANEL */}
      {(() => {
        const correctSqs = sessionQuestions.filter(sq => sq.is_correct === true)
        const wrongSqs = sessionQuestions.filter(sq => sq.is_correct === false && !!sq.answer_given)
        const avgTime = sessionQuestions.length > 0
          ? Math.round(sessionQuestions.reduce((s, sq) => s + (sq.time_taken ?? 0), 0) / sessionQuestions.length)
          : 0
        const avgCorrectTime = correctSqs.length > 0
          ? Math.round(correctSqs.reduce((s, sq) => s + (sq.time_taken ?? 0), 0) / correctSqs.length)
          : 0
        const avgWrongTime = wrongSqs.length > 0
          ? Math.round(wrongSqs.reduce((s, sq) => s + (sq.time_taken ?? 0), 0) / wrongSqs.length)
          : 0
        const maxAvg = Math.max(avgCorrectTime, avgWrongTime, 1)

        return (
          <div className="rounded-2xl surface-glass p-6 space-y-4 border border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-accent-electric" />
              <h2 className="font-bold text-foreground">Time Management</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Avg per question', value: formatDuration(avgTime), color: 'text-accent-electric' },
                { label: 'Avg on correct', value: correctSqs.length > 0 ? formatDuration(avgCorrectTime) : '—', color: 'text-emerald-400' },
                { label: 'Avg on wrong', value: wrongSqs.length > 0 ? formatDuration(avgWrongTime) : '—', color: 'text-red-400' },
              ].map(item => (
                <div key={item.label} className="rounded-xl border border-white/[0.07] bg-surface-2/70 p-3 text-center">
                  <p className={`text-lg font-extrabold ${item.color}`}>{item.value}</p>
                  <p className="text-[11px] text-muted mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
            {(correctSqs.length > 0 || wrongSqs.length > 0) && (
              <div className="space-y-2">
                <p className="text-xs text-muted-2 font-medium">Correct vs Wrong — time comparison</p>
                <div className="space-y-1.5">
                  <div>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-emerald-400 font-medium">Correct</span>
                      <span className="text-emerald-400">{formatDuration(avgCorrectTime)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(avgCorrectTime / maxAvg) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-red-400 font-medium">Wrong</span>
                      <span className="text-red-400">{formatDuration(avgWrongTime)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                      <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${(avgWrongTime / maxAvg) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* DIFFICULTY BREAKDOWN PANEL */}
      {(() => {
        const levels = ['easy', 'medium', 'hard'] as const
        const diffMap: Record<string, { total: number; correct: number }> = {
          easy: { total: 0, correct: 0 },
          medium: { total: 0, correct: 0 },
          hard: { total: 0, correct: 0 },
        }
        for (const sq of sessionQuestions) {
          const d = sq.questions.difficulty
          if (diffMap[d]) {
            diffMap[d].total++
            if (sq.is_correct) diffMap[d].correct++
          }
        }
        const hasData = levels.some(l => diffMap[l].total > 0)
        if (!hasData) return null

        const diffColors: Record<string, { bar: string; text: string; badge: string }> = {
          easy: { bar: 'bg-emerald-500', text: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
          medium: { bar: 'bg-amber-500', text: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
          hard: { bar: 'bg-red-500', text: 'text-red-400', badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
        }

        return (
          <div className="rounded-2xl surface-glass p-6 space-y-4 border border-white/[0.06]">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-accent-electric" />
              <h2 className="font-bold text-foreground">Difficulty Breakdown</h2>
            </div>
            <div className="space-y-3">
              {levels.filter(l => diffMap[l].total > 0).map(level => {
                const { total, correct } = diffMap[level]
                const pct = Math.round((correct / total) * 100)
                const { bar, text, badge } = diffColors[level]
                return (
                  <div key={level}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${badge}`}>
                          {level}
                        </span>
                        <span className="text-xs text-muted">{correct}/{total} correct</span>
                      </div>
                      <span className={`text-sm font-bold ${text}`}>{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                      <div className={`h-full rounded-full ${bar} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* LEADERBOARD (weekly exams only, after exam ends) */}
      {(() => {
        if (!leaderboard || leaderboard.length === 0) return null

        const totalParticipants = leaderboard.length
        const myEntry = leaderboard.find(e => e.user_id === currentUserId)
        const myRank = myEntry?.rank
        const percentile = totalParticipants > 1 && myRank 
          ? (((totalParticipants - myRank + 1) / totalParticipants) * 100).toFixed(2) 
          : '100.00'
        const displayLeaderboard = leaderboard.slice(0, 20)

        return (
          <div className="space-y-4">
            {myEntry && (
              <div className="rounded-2xl surface-glass-strong p-6 space-y-2 border border-violet-500/30 bg-violet-500/5">
                <h2 className="text-sm font-bold text-violet-300 uppercase tracking-wider">Your All India Rank (AIR)</h2>
                <div className="flex items-baseline gap-4">
                  <div className="text-5xl font-extrabold text-violet-400">#{myRank}</div>
                  <div className="text-xl font-medium text-muted-2">
                    {percentile} <span className="text-sm text-muted">Percentile</span>
                  </div>
                </div>
                <p className="text-xs text-muted mt-2">Based on {totalParticipants} total participants</p>
              </div>
            )}

            <div className="rounded-2xl surface-glass-strong overflow-hidden border border-white/[0.07]">
              <div className="flex items-center gap-2 p-5 border-b border-white/[0.06]">
                <Medal className="h-5 w-5 text-amber-400" />
                <h2 className="font-bold text-foreground">Leaderboard</h2>
                <span className="text-xs text-muted ml-auto">Top {displayLeaderboard.length} of {totalParticipants} students</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-surface-2/40">
                      <th className="text-left py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-muted-2">Rank</th>
                      <th className="text-left py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-muted-2">Name</th>
                      <th className="text-right py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-muted-2">Score</th>
                      <th className="text-right py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-muted-2">Math</th>
                      <th className="text-right py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-muted-2">Phy</th>
                      <th className="text-right py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-muted-2">Chem</th>
                      <th className="text-right py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-muted-2">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {displayLeaderboard.map((entry, idx) => {
                      const isMe = entry.user_id === currentUserId
                      const rankIcons: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
                      const displayRank = rankIcons[entry.rank] ?? `#${entry.rank}`
                      
                      return (
                        <tr
                          key={entry.id}
                          className={`transition-colors ${
                            isMe
                              ? 'bg-violet-500/10 border-l-2 border-l-violet-400'
                              : 'hover:bg-surface-2/40'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span className="font-bold text-muted-2 text-xs">
                              {displayRank}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-medium text-sm ${
                              isMe ? 'text-violet-300 font-bold' : 'text-foreground'
                            }`}>
                              {entry.name ?? 'Anonymous'}
                              {isMe && <span className="ml-1.5 text-[10px] font-bold bg-violet-500/20 text-violet-400 rounded px-1.5 py-0.5">You</span>}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`font-bold text-sm ${
                              entry.rank === 1 ? 'text-amber-400' : isMe ? 'text-violet-300' : 'text-foreground'
                            }`}>
                              {entry.score}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-muted text-xs">{entry.math_score}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-muted text-xs">{entry.physics_score}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-muted text-xs">{entry.chem_score}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-muted text-xs">{formatDuration(entry.time_taken ?? 0)}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      })()}

      {/* QUESTION REVIEW */}
      <div className="rounded-2xl surface-glass-strong overflow-hidden border border-white/[0.07]">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="font-bold text-foreground">Question Review</h2>
          <div className="flex gap-1">
            {(['all', 'correct', 'wrong', 'skipped'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border ${
                  filter === f
                    ? 'bg-accent-electric/15 border-accent-electric/40 text-accent-electric'
                    : 'border-white/[0.08] text-muted hover:text-foreground hover:border-white/15'
                }`}
              >
                {f} {f === 'all' ? `(${sessionQuestions.length})` :
                  f === 'correct' ? `(${session.correct})` :
                  f === 'wrong' ? `(${session.incorrect})` :
                  `(${session.unattempted})`}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {filtered.map(sq => {
            const q = sq.questions
            const isExp = expanded.has(sq.id)
            const isMcq = q.type === 'mcq'
            const statusIcon = !sq.answer_given
              ? <MinusCircle className="h-4 w-4 text-muted flex-shrink-0" />
              : sq.is_correct
                ? <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                : <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />

            const marksColor = sq.marks_awarded > 0 ? 'text-emerald-400' : sq.marks_awarded < 0 ? 'text-red-400' : 'text-muted'

            return (
              <div key={sq.id}>
                <button
                  onClick={() => toggleExpand(sq.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-surface-2 transition-colors text-left"
                >
                  {statusIcon}
                  <span className="text-xs text-muted-2 flex-shrink-0 w-6">Q{sq.order_index + 1}</span>
                  <span className="text-sm text-foreground flex-1 line-clamp-1">
                    <Latex>{q.statement.slice(0, 100)}</Latex>
                  </span>
                  <span className={`text-xs font-bold ${marksColor} flex-shrink-0`}>
                    {sq.marks_awarded > 0 ? '+' : ''}{sq.marks_awarded}
                  </span>
                  {isExp ? <ChevronUp className="h-4 w-4 text-muted-2 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-2 flex-shrink-0" />}
                </button>

                {isExp && (
                  <div className="px-5 pb-5 bg-surface-2 border-t border-border space-y-4">
                    {/* Full statement */}
                    <div className="pt-4 text-sm leading-relaxed text-foreground">
                      <Latex>{q.statement}</Latex>
                    </div>

                    {isMcq ? (
                      <div className="space-y-2">
                        {sq.options.map((opt, i) => {
                          const letter = String.fromCharCode(65 + i)
                          const isUserAnswer = sq.answer_given === opt.id
                          const isCorrectOpt = opt.is_correct
                          return (
                            <div
                              key={opt.id}
                              className={`flex items-start gap-2 p-3 rounded-xl border text-sm ${
                                isCorrectOpt
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                  : isUserAnswer && !isCorrectOpt
                                    ? 'bg-red-500/10 border-red-500/30 text-red-300'
                                    : 'bg-surface border-border text-muted'
                              }`}
                            >
                              <span className="font-bold flex-shrink-0">{letter}.</span>
                              <Latex>{opt.text}</Latex>
                              {isCorrectOpt && <CheckCircle2 className="h-3.5 w-3.5 ml-auto flex-shrink-0 mt-0.5" />}
                              {isUserAnswer && !isCorrectOpt && <XCircle className="h-3.5 w-3.5 ml-auto flex-shrink-0 mt-0.5" />}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="rounded-xl border border-white/[0.07] bg-surface-2/50 px-4 py-2 backdrop-blur-sm">
                          <p className="text-[10px] text-muted mb-0.5">Your answer</p>
                          <p className={sq.is_correct ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                            {sq.answer_given ?? '—'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
                          <p className="text-[10px] text-muted mb-0.5">Correct answer</p>
                          <p className="text-emerald-400 font-bold">{q.correct_answer}</p>
                        </div>
                      </div>
                    )}

                    {/* Solution */}
                    {q.solution && (
                      <div className="rounded-xl border border-white/[0.07] bg-surface-2/40 p-4 backdrop-blur-sm">
                        <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Solution</p>
                        <div className="text-sm text-muted leading-relaxed">
                          <Latex>{q.solution}</Latex>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="py-10 text-center text-muted text-sm">No questions match this filter.</div>
          )}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex gap-3">
        <Link
          href="/tests/new"
          className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-center bg-gradient-primary text-black hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          Take Another Test <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/tests"
          className="px-6 py-3.5 rounded-2xl font-bold text-sm border border-white/[0.1] bg-surface-2/50 text-muted hover:text-foreground hover:border-accent-electric/35 transition-all backdrop-blur-sm"
        >
          Back to Tests
        </Link>
      </div>
    </div>
  )
}
