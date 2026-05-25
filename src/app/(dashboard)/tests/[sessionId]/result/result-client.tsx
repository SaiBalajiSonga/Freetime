'use client'

import { useState } from 'react'
import Link from 'next/link'
import Latex from '@/components/ui/latex'
import {
  CheckCircle2, XCircle, MinusCircle, Clock, Target,
  ChevronDown, ChevronUp, ArrowRight, Trophy, Medal,
  Timer, BarChart3, Lock, BookOpen, Zap,
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

type RankData = {
  rank: number
  percentile: string
  totalParticipants: number
}

type Props = {
  session: any
  sessionQuestions: SQ[]
  currentUserId?: string
  // Weekly exam specific
  examEnded?: boolean
  examEndsAt?: string | null
  rankData?: RankData | null
}

function formatDuration(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${sec}s`
  return `${s}s`
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

type Filter = 'all' | 'correct' | 'wrong' | 'skipped'

// JEE-standard subject color coding
const SUBJECT_STYLES: Record<string, {
  border: string; bg: string; text: string; bar: string
  statBg: string; statBorder: string; statText: string
}> = {
  'Mathematics': {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    bar: 'bg-blue-500',
    statBg: 'bg-blue-50',
    statBorder: 'border-blue-200',
    statText: 'text-blue-700',
  },
  'Physics': {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    bar: 'bg-amber-500',
    statBg: 'bg-amber-50',
    statBorder: 'border-amber-200',
    statText: 'text-amber-700',
  },
  'Chemistry': {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    bar: 'bg-emerald-500',
    statBg: 'bg-emerald-50',
    statBorder: 'border-emerald-200',
    statText: 'text-emerald-700',
  },
}

function getSubjectStyle(name: string) {
  return SUBJECT_STYLES[name] ?? {
    border: 'border-l-violet-500',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    bar: 'bg-violet-500',
    statBg: 'bg-violet-50',
    statBorder: 'border-violet-200',
    statText: 'text-violet-700',
  }
}

export default function ResultClient({
  session,
  sessionQuestions,
  currentUserId,
  examEnded,
  examEndsAt,
  rankData,
}: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const isWeeklyExam = !!session.weekly_exam_id

  const pct = session.max_score > 0
    ? Math.round((session.score / session.max_score) * 100)
    : 0

  const remark =
    pct >= 80 ? 'Excellent! Outstanding performance. 🎉' :
    pct >= 60 ? 'Good job! Keep pushing. 💪' :
    pct >= 40 ? 'Decent effort. More practice needed. 📚' :
    'Keep going — every attempt builds skill. 🔥'

  // Hero gradient: reflects performance level
  const heroBg =
    pct >= 75 ? 'from-emerald-50 via-teal-50 to-white border-emerald-200' :
    pct >= 50 ? 'from-amber-50 via-orange-50 to-white border-amber-200' :
    pct >= 30 ? 'from-blue-50 via-indigo-50 to-white border-blue-200' :
    'from-red-50 via-rose-50 to-white border-red-200'

  const scoreColor =
    pct >= 75 ? 'text-emerald-600' :
    pct >= 50 ? 'text-amber-600' :
    pct >= 30 ? 'text-blue-600' :
    'text-red-500'

  const accuracy = session.correct + session.incorrect > 0
    ? Math.round((session.correct / (session.correct + session.incorrect)) * 100)
    : 0

  // ── Subject breakdown ──────────────────────────────────────────────────────
  const subjectMap: Record<string, {
    correct: number; incorrect: number; unattempted: number; score: number; total: number
  }> = {}
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

  // ── Weak chapters ──────────────────────────────────────────────────────────
  const chapterMap: Record<string, { correct: number; incorrect: number; unattempted: number; total: number }> = {}
  for (const sq of sessionQuestions) {
    const chName = sq.questions.chapters?.name || 'Uncategorised'
    if (!chapterMap[chName]) chapterMap[chName] = { correct: 0, incorrect: 0, unattempted: 0, total: 0 }
    chapterMap[chName].total++
    if (!sq.answer_given) chapterMap[chName].unattempted++
    else if (sq.is_correct) chapterMap[chName].correct++
    else chapterMap[chName].incorrect++
  }
  const weakChapters = Object.entries(chapterMap)
    .filter(([, data]) => data.incorrect > 0 || (data.correct / data.total < 0.5))
    .sort((a, b) => b[1].incorrect - a[1].incorrect)

  // ── Time analysis ──────────────────────────────────────────────────────────
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

  // ── Difficulty map ─────────────────────────────────────────────────────────
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
  const hasDiffData = ['easy', 'medium', 'hard'].some(l => diffMap[l].total > 0)

  // ── Question filter ────────────────────────────────────────────────────────
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
    <div className="space-y-6 animate-in-up pb-20">

      {/* ── SCORE HERO ───────────────────────────────────────────────────── */}
      <div className={`rounded-2xl bg-gradient-to-br ${heroBg} border-2 p-6 space-y-5 shadow-sm`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                {session.mode === 'jee_mains' ? 'JEE Mains Mock' : session.mode === 'weekly_exam' ? 'Weekly Exam' : 'Custom Test'}
              </span>
            </div>
            <p className="text-sm text-muted">{remark}</p>
          </div>
          <div className={`text-5xl font-extrabold stat-number ${scoreColor} text-right`}>
            {session.score}
            <span className="text-xl text-muted font-semibold">/{session.max_score}</span>
            <p className="text-sm font-semibold text-muted mt-1 text-right">{pct}%</p>
          </div>
        </div>

        {/* Stat pills — 4-up grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              icon: <Target className="h-4 w-4" />,
              label: 'Accuracy',
              value: `${accuracy}%`,
              sub: 'of attempted',
              color: 'text-blue-700',
              bg: 'bg-white border-blue-200',
            },
            {
              icon: <CheckCircle2 className="h-4 w-4" />,
              label: 'Correct',
              value: session.correct,
              sub: `+${session.correct * 4} marks`,
              color: 'text-emerald-700',
              bg: 'bg-white border-emerald-200',
            },
            {
              icon: <XCircle className="h-4 w-4" />,
              label: 'Wrong',
              value: session.incorrect,
              sub: `${session.incorrect} attempts`,
              color: 'text-red-600',
              bg: 'bg-white border-red-200',
            },
            {
              icon: <MinusCircle className="h-4 w-4" />,
              label: 'Skipped',
              value: session.unattempted,
              sub: 'unattempted',
              color: 'text-slate-500',
              bg: 'bg-white border-slate-200',
            },
          ].map(item => (
            <div key={item.label} className={`rounded-xl border ${item.bg} px-4 py-3 flex items-center gap-3 shadow-sm`}>
              <span className={`${item.color} shrink-0`}>{item.icon}</span>
              <div className="min-w-0">
                <p className={`text-xl font-extrabold leading-none ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-muted mt-1 font-medium uppercase tracking-wide">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RANK SECTION — Weekly exams only ─────────────────────────────── */}
      {isWeeklyExam && (
        examEnded ? (
          rankData ? (
            /* ✅ Exam over, rank revealed */
            <div className="rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-indigo-50 to-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Medal className="h-5 w-5 text-violet-600" />
                <h2 className="font-bold text-violet-700 text-sm uppercase tracking-wider">
                  Your All India Rank (AIR)
                </h2>
              </div>
              <div className="flex items-end gap-8 flex-wrap">
                {/* Rank */}
                <div>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Rank</p>
                  <div className="text-7xl font-black text-violet-600 leading-none stat-number">
                    #{rankData.rank}
                  </div>
                </div>
                {/* Percentile */}
                <div className="pb-1">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Percentile</p>
                  <div className="text-4xl font-extrabold text-indigo-600 stat-number">{rankData.percentile}</div>
                  <p className="text-xs text-muted mt-0.5">out of 100</p>
                </div>
                {/* Participants */}
                <div className="pb-1">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Participants</p>
                  <div className="text-3xl font-bold text-foreground stat-number">{rankData.totalParticipants}</div>
                  <p className="text-xs text-muted mt-0.5">total students</p>
                </div>
              </div>
              <p className="text-xs text-violet-600 mt-4 font-medium">
                🎯 You scored better than {rankData.percentile}% of all {rankData.totalParticipants} participants
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-5 text-center">
              <p className="text-sm text-muted">Rank data could not be loaded. Please refresh.</p>
            </div>
          )
        ) : (
          /* ⏳ Exam still open — rank pending */
          <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                <Lock className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-foreground text-base">Rank & Percentile will be released soon</h2>
                <p className="text-sm text-muted mt-1">
                  Like Allen, Narayana, and nlearn — rankings are calculated <strong>only after the exam window closes</strong> so every student gets a fair shot regardless of when they started.
                </p>
                {examEndsAt && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-white border border-blue-200 rounded-xl px-4 py-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-semibold text-blue-700">
                      Releasing on {formatDateTime(examEndsAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {/* ── SUBJECT BREAKDOWN ─────────────────────────────────────────────── */}
      {isMultiSubject && (
        <div className="rounded-2xl bg-surface border border-border p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent-electric" />
            <h2 className="font-bold text-foreground">Subject Breakdown</h2>
          </div>
          <div className="space-y-3">
            {subjects.map(([name, data]) => {
              const s = getSubjectStyle(name)
              const maxScore = data.total * 4
              const correctPct = data.total > 0 ? (data.correct / data.total) * 100 : 0
              const incorrectPct = data.total > 0 ? (data.incorrect / data.total) * 100 : 0
              const subAcc = data.correct + data.incorrect > 0
                ? Math.round((data.correct / (data.correct + data.incorrect)) * 100)
                : 0
              return (
                <div key={name} className={`rounded-xl border-l-4 ${s.border} bg-surface-2 border border-border p-4`}>
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <span className={`font-bold text-sm ${s.text}`}>{name}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-emerald-600 font-semibold">{data.correct} ✓</span>
                      <span className="text-red-500 font-semibold">{data.incorrect} ✗</span>
                      <span className="text-muted">{data.unattempted} –</span>
                      <span className={`font-black text-base ${data.score >= 0 ? 'text-foreground' : 'text-red-500'}`}>
                        {data.score > 0 ? '+' : ''}{data.score}
                        <span className="text-xs font-medium text-muted">/{maxScore}</span>
                      </span>
                    </div>
                  </div>
                  {/* Segmented bar: correct (green) + wrong (red) + skipped (grey) */}
                  <div className="h-3 rounded-full bg-border overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-700"
                      style={{ width: `${correctPct}%` }}
                    />
                    <div
                      className="h-full bg-red-400 transition-all duration-700"
                      style={{ width: `${incorrectPct}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-[11px]">
                    <span className="text-emerald-600 font-medium">■ Correct {Math.round(correctPct)}%</span>
                    <span className="text-red-500 font-medium">■ Wrong {Math.round(incorrectPct)}%</span>
                    <span className="text-muted">■ Skipped {Math.round(100 - correctPct - incorrectPct)}%</span>
                    <span className={`ml-auto font-bold ${s.text}`}>{subAcc}% accuracy</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── DIFFICULTY BREAKDOWN ──────────────────────────────────────────── */}
      {hasDiffData && (
        <div className="rounded-2xl bg-surface border border-border p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent-electric" />
            <h2 className="font-bold text-foreground">Difficulty Breakdown</h2>
          </div>
          <div className="space-y-3">
            {(['easy', 'medium', 'hard'] as const).filter(l => diffMap[l].total > 0).map(level => {
              const { total, correct } = diffMap[level]
              const pct = Math.round((correct / total) * 100)
              const styles = {
                easy: { bar: 'bg-gradient-to-r from-emerald-400 to-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                medium: { bar: 'bg-gradient-to-r from-amber-400 to-amber-500', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
                hard: { bar: 'bg-gradient-to-r from-red-400 to-red-500', text: 'text-red-600', badge: 'bg-red-100 text-red-600 border-red-200' },
              }
              const { bar, text, badge } = styles[level]
              return (
                <div key={level}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wide px-2.5 py-0.5 rounded-full border ${badge}`}>
                        {level}
                      </span>
                      <span className="text-xs text-muted">{correct}/{total} correct</span>
                    </div>
                    <span className={`text-sm font-bold ${text}`}>{pct}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bar} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── TOPICS TO REVIEW ──────────────────────────────────────────────── */}
      {weakChapters.length > 0 && (
        <div className="rounded-2xl bg-surface border-2 border-red-100 p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-red-500" />
            <h2 className="font-bold text-foreground">Topics to Revise</h2>
          </div>
          <p className="text-sm text-muted">
            These chapters had the most mistakes or lowest accuracy. Prioritise these before your next attempt.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {weakChapters.slice(0, 6).map(([name, data]) => {
              const acc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
              return (
                <div key={name} className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <h3 className="font-semibold text-sm text-foreground line-clamp-1 mb-2">{name}</h3>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-red-500 font-bold">{data.incorrect} wrong</span>
                    <span className="text-muted">{data.unattempted} skipped</span>
                    <span className={`font-bold ${acc >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                      {acc}% accuracy
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── TIME ANALYSIS ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-surface border border-border p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-accent-electric" />
          <h2 className="font-bold text-foreground">Time Analysis</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: 'Avg per question',
              value: formatDuration(avgTime),
              sub: `Total: ${formatDuration(session.time_taken ?? 0)}`,
              color: 'text-blue-700',
              bg: 'bg-blue-50 border-blue-200',
            },
            {
              label: 'Avg on correct',
              value: correctSqs.length > 0 ? formatDuration(avgCorrectTime) : '—',
              sub: `${correctSqs.length} questions`,
              color: 'text-emerald-700',
              bg: 'bg-emerald-50 border-emerald-200',
            },
            {
              label: 'Avg on wrong',
              value: wrongSqs.length > 0 ? formatDuration(avgWrongTime) : '—',
              sub: `${wrongSqs.length} questions`,
              color: 'text-red-600',
              bg: 'bg-red-50 border-red-200',
            },
          ].map(item => (
            <div key={item.label} className={`rounded-xl border ${item.bg} p-4 text-center shadow-sm`}>
              <p className={`text-2xl font-extrabold stat-number ${item.color}`}>{item.value}</p>
              <p className="text-[11px] font-medium text-muted mt-1">{item.label}</p>
              <p className="text-[10px] text-muted mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
        {/* Correct vs Wrong visual bar */}
        {(correctSqs.length > 0 || wrongSqs.length > 0) && (() => {
          const maxAvg = Math.max(avgCorrectTime, avgWrongTime, 1)
          return (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Correct vs Wrong — time spent</p>
              {[
                { label: 'Correct', time: avgCorrectTime, color: 'bg-emerald-400', textColor: 'text-emerald-700' },
                { label: 'Wrong', time: avgWrongTime, color: 'bg-red-400', textColor: 'text-red-600' },
              ].map(bar => (
                <div key={bar.label}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className={`font-semibold ${bar.textColor}`}>{bar.label}</span>
                    <span className={bar.textColor}>{formatDuration(bar.time)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bar.color} transition-all duration-700`}
                      style={{ width: `${(bar.time / maxAvg) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )
        })()}
      </div>

      {/* ── QUESTION REVIEW ───────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-surface border border-border overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-border flex-wrap gap-3">
          <h2 className="font-bold text-foreground">Question Review</h2>
          <div className="flex flex-wrap gap-1.5">
            {([
              { f: 'all', label: `All (${sessionQuestions.length})`, activeClass: 'bg-slate-100 border-slate-300 text-slate-700' },
              { f: 'correct', label: `Correct (${session.correct})`, activeClass: 'bg-emerald-100 border-emerald-300 text-emerald-700' },
              { f: 'wrong', label: `Wrong (${session.incorrect})`, activeClass: 'bg-red-100 border-red-300 text-red-700' },
              { f: 'skipped', label: `Skipped (${session.unattempted})`, activeClass: 'bg-amber-100 border-amber-300 text-amber-700' },
            ] as { f: Filter; label: string; activeClass: string }[]).map(({ f, label, activeClass }) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  filter === f ? activeClass : 'border-border text-muted hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border">
          {filtered.map(sq => {
            const q = sq.questions
            const isExp = expanded.has(sq.id)
            const isMcq = q.type === 'mcq'
            const subjectName = q.chapters.subjects.name
            const sStyle = getSubjectStyle(subjectName)

            const statusIcon = !sq.answer_given
              ? <MinusCircle className="h-4 w-4 text-slate-400 flex-shrink-0" />
              : sq.is_correct
                ? <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                : <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />

            const marksColor = sq.marks_awarded > 0 ? 'text-emerald-600' : sq.marks_awarded < 0 ? 'text-red-500' : 'text-muted'
            const rowBg = !sq.answer_given ? '' : sq.is_correct ? 'hover:bg-emerald-50/40' : 'hover:bg-red-50/40'

            return (
              <div key={sq.id}>
                <button
                  onClick={() => toggleExpand(sq.id)}
                  className={`w-full flex items-center gap-3 px-5 py-4 ${rowBg} transition-colors text-left`}
                >
                  {statusIcon}
                  <span className="text-xs text-muted flex-shrink-0 w-6">Q{sq.order_index + 1}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${sStyle.statBg} ${sStyle.statText} border ${sStyle.statBorder}`}>
                    {subjectName.slice(0, 3).toUpperCase()}
                  </span>
                  <span className="text-sm text-foreground flex-1 line-clamp-1">
                    <Latex>{q.statement.slice(0, 100)}</Latex>
                  </span>
                  <span className={`text-xs font-bold ${marksColor} flex-shrink-0`}>
                    {sq.marks_awarded > 0 ? '+' : ''}{sq.marks_awarded}
                  </span>
                  {isExp
                    ? <ChevronUp className="h-4 w-4 text-muted flex-shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-muted flex-shrink-0" />
                  }
                </button>

                {isExp && (
                  <div className="px-5 pb-6 bg-surface-2 border-t border-border space-y-4">
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
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : isUserAnswer && !isCorrectOpt
                                    ? 'bg-red-50 border-red-200 text-red-800'
                                    : 'bg-surface border-border text-muted'
                              }`}
                            >
                              <span className="font-bold flex-shrink-0">{letter}.</span>
                              <Latex>{opt.text}</Latex>
                              {isCorrectOpt && <CheckCircle2 className="h-3.5 w-3.5 ml-auto flex-shrink-0 mt-0.5 text-emerald-600" />}
                              {isUserAnswer && !isCorrectOpt && <XCircle className="h-3.5 w-3.5 ml-auto flex-shrink-0 mt-0.5 text-red-500" />}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <div className="rounded-xl border border-border bg-surface px-4 py-2.5">
                          <p className="text-[10px] text-muted mb-0.5 font-medium uppercase tracking-wide">Your answer</p>
                          <p className={sq.is_correct ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                            {sq.answer_given ?? '—'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
                          <p className="text-[10px] text-muted mb-0.5 font-medium uppercase tracking-wide">Correct answer</p>
                          <p className="text-emerald-600 font-bold">{q.correct_answer}</p>
                        </div>
                      </div>
                    )}

                    {q.solution && (
                      <div className="rounded-xl border border-border bg-surface p-4">
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
            <div className="py-12 text-center text-muted text-sm">No questions match this filter.</div>
          )}
        </div>
      </div>

      {/* ── ACTION BUTTONS ────────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <Link
          href={session.weekly_exam_id ? '/exams' : '/tests/new'}
          className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-center bg-gradient-primary text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md"
        >
          {session.weekly_exam_id ? 'Back to Exams' : 'Take Another Test'}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={session.weekly_exam_id ? '/exams' : '/tests'}
          className="px-6 py-3.5 rounded-2xl font-bold text-sm border border-border bg-surface text-muted hover:text-foreground hover:border-border-strong transition-all"
        >
          {session.weekly_exam_id ? 'Home' : 'All Tests'}
        </Link>
      </div>
    </div>
  )
}
