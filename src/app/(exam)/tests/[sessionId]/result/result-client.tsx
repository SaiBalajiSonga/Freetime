'use client'

import { useState } from 'react'
import Link from 'next/link'
import Latex from '@/components/ui/latex'
import {
  CheckCircle2, XCircle, MinusCircle, Clock, Target,
  ChevronDown, ChevronUp, ArrowRight, Trophy, Medal,
  Timer, BarChart3, Lock, BookOpen, Zap,
  Crosshair, Brain, Sparkles, Activity
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis
} from 'recharts'

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-md text-sm z-50">
        <p className="font-bold text-slate-800 mb-1">{label || payload[0].payload.name}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div className="size-2 rounded-sm" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="text-slate-600">{entry.name}: </span>
            <span className="font-semibold text-slate-800">{entry.value}{entry.name === 'Accuracy' ? '%' : ''}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomScatterTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-md text-sm z-50">
        <p className="font-bold text-slate-800 mb-1">{data.name}</p>
        <p className="text-slate-600">Time: <span className="font-semibold text-slate-800">{formatDuration(data.time)}</span></p>
        {data.accuracy !== undefined && <p className="text-slate-600">Accuracy: <span className="font-semibold text-slate-800">{data.accuracy}%</span></p>}
        <p className="text-slate-600">Status: <span className="font-semibold capitalize text-slate-800">{data.status}</span></p>
      </div>
    );
  }
  return null;
};

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

  // Data for Recharts
  const pieData = [
    { name: 'Correct', value: session.correct, color: 'url(#colorCorrect)' },
    { name: 'Incorrect', value: session.incorrect, color: 'url(#colorIncorrect)' },
    { name: 'Skipped', value: session.unattempted, color: 'url(#colorSkipped)' },
  ].filter(d => d.value > 0);

  const subjectBarData = subjects.map(([name, data]) => ({
    name: name.slice(0, 4),
    fullName: name,
    Correct: data.correct,
    Incorrect: data.incorrect,
    Skipped: data.unattempted,
  }));

  const radarData = (['easy', 'medium', 'hard'] as const).filter(l => diffMap[l].total > 0).map(level => {
    const d = diffMap[level];
    const acc = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
    return {
      subject: level.charAt(0).toUpperCase() + level.slice(1),
      Accuracy: acc,
      fullMark: 100,
    }
  });

  const scatterData = sessionQuestions.map((sq, i) => {
    const status = !sq.answer_given ? 'skipped' : sq.is_correct ? 'correct' : 'incorrect';
    return {
      x: i + 1,
      time: sq.time_taken ?? 0,
      z: 1,
      status,
      name: `Q${i + 1}`,
      fill: status === 'correct' ? '#4ade80' : status === 'incorrect' ? '#f87171' : '#fbbf24'
    };
  });

  // Mock Topper Data
  const topperBarData = subjects.map(([name, data]) => {
    const maxScore = data.total * 4; // Assuming 4 marks per question
    const yourScore = data.score;
    const topperScore = Math.round(maxScore * 0.95); // Topper gets 95%
    return {
      name: name.slice(0, 4),
      fullName: name,
      You: yourScore,
      Topper: topperScore,
      Max: maxScore,
    };
  });

  const chapterMatrixMap: Record<string, { correct: number; total: number; time: number }> = {}
  for (const sq of sessionQuestions) {
    const chName = sq.questions.chapters?.name || 'Uncategorised'
    if (!chapterMatrixMap[chName]) chapterMatrixMap[chName] = { correct: 0, total: 0, time: 0 }
    chapterMatrixMap[chName].total++
    if (sq.is_correct) chapterMatrixMap[chName].correct++
    chapterMatrixMap[chName].time += (sq.time_taken ?? 0)
  }
  const strengthsData = Object.entries(chapterMatrixMap)
    .filter(([, data]) => data.total > 0)
    .map(([name, data]) => {
      const accuracy = Math.round((data.correct / data.total) * 100);
      const avgTime = Math.round(data.time / data.total);
      
      // Categorize for colors
      let status = 'neutral';
      if (accuracy >= 70 && avgTime <= 120) status = 'strength'; // Fast & Accurate
      else if (accuracy < 50 && avgTime > 120) status = 'weakness'; // Slow & Inaccurate
      else if (accuracy >= 70 && avgTime > 120) status = 'slow'; // Slow but Accurate
      else if (accuracy < 50 && avgTime <= 120) status = 'careless'; // Fast but Inaccurate

      return {
        name,
        accuracy,
        time: avgTime,
        z: 100, // Dot size
        status,
        fill: status === 'strength' ? '#4ade80' : 
              status === 'weakness' ? '#f87171' : 
              status === 'careless' ? '#fbbf24' : '#60a5fa'
      }
    });


  // ── Gamified Insights Generation ──────────────────────────────────────────
  const insights = [];
  if (accuracy >= 80 && avgTime < 60) {
    insights.push({ icon: <Zap className="size-5 text-amber-500" />, text: "You're a Speed Demon! High accuracy and fast pacing. Exceptional work.", color: "bg-amber-50 border-amber-200 text-amber-800" });
  } else if (accuracy >= 80) {
    insights.push({ icon: <Crosshair className="size-5 text-emerald-500" />, text: "Sharpshooter! Your accuracy is top-tier. Work on improving your speed slightly.", color: "bg-emerald-50 border-emerald-200 text-emerald-800" });
  } else if (accuracy < 50 && avgTime < 45) {
    insights.push({ icon: <Activity className="size-5 text-red-500" />, text: "Slow down! You're rushing through questions and losing marks to careless mistakes.", color: "bg-red-50 border-red-200 text-red-800" });
  } else if (accuracy >= 50) {
    insights.push({ icon: <Brain className="size-5 text-blue-500" />, text: "Steady progress. Focus on identifying your weak chapters to boost that accuracy.", color: "bg-blue-50 border-blue-200 text-blue-800" });
  }

  // Find strongest and weakest subjects
  if (isMultiSubject) {
    const sortedSubjects = [...subjects].sort((a, b) => {
      const aAcc = a[1].total > 0 ? a[1].correct / a[1].total : 0;
      const bAcc = b[1].total > 0 ? b[1].correct / b[1].total : 0;
      return bAcc - aAcc;
    });
    if (sortedSubjects.length >= 2) {
      const best = sortedSubjects[0];
      const worst = sortedSubjects[sortedSubjects.length - 1];
      const bestAcc = best[1].total > 0 ? Math.round((best[1].correct / best[1].total) * 100) : 0;
      const worstAcc = worst[1].total > 0 ? Math.round((worst[1].correct / worst[1].total) * 100) : 0;
      
      if (bestAcc > worstAcc + 20) {
         insights.push({ 
           icon: <Sparkles className="size-5 text-purple-500" />, 
           text: `Your ${best[0]} is incredibly strong (${bestAcc}%). Spend more time revising ${worst[0]} (${worstAcc}%) to balance your score.`,
           color: "bg-purple-50 border-purple-200 text-purple-800"
         });
      }
    }
  }

  return (
    <div className="space-y-8 animate-in-up pb-20 max-w-7xl mx-auto">

      {/* ── AI ACTIONABLE INSIGHTS ────────────────────────────────────────── */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, idx) => (
            <div key={idx} className={`flex items-start gap-4 p-5 rounded-3xl border-2 ${insight.color} shadow-[0_4px_20px_rgb(0,0,0,0.03)]`}>
              <div className="mt-0.5 bg-white p-2.5 rounded-2xl shadow-sm">{insight.icon}</div>
              <p className="text-sm font-semibold leading-relaxed pr-2">{insight.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── SCORE HERO ───────────────────────────────────────────────────── */}
      <div className={`rounded-3xl bg-gradient-to-br ${heroBg} border-2 p-8 space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                {session.mode === 'jee_mains' ? 'JEE Mains Mock' : session.mode === 'weekly_exam' ? 'Weekly Exam' : 'Custom Test'}
              </span>
            </div>
            <p className="text-sm text-muted font-medium">{remark}</p>
          </div>
          <div className={`text-6xl font-extrabold stat-number ${scoreColor} text-right tracking-tight`}>
            {session.score}
            <span className="text-2xl text-muted font-semibold">/{session.max_score}</span>
            <p className="text-sm font-bold text-muted mt-2 text-right">{pct}% SCORE</p>
          </div>
        </div>

        {/* Summary Chart */}
        <div className="mt-8 bg-white/70 backdrop-blur-xl rounded-3xl border-2 border-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Performance Summary</h2>
          <div className="flex flex-col md:flex-row items-center gap-12 justify-center">
            <div className="relative size-48 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="colorCorrect" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ade80" stopOpacity={1}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id="colorIncorrect" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f87171" stopOpacity={1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id="colorSkipped" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fbbf24" stopOpacity={1}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-extrabold text-slate-800">{session.correct + session.incorrect + session.unattempted}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Qs</span>
              </div>
            </div>
            
            <div className="flex flex-col">
              <div className="flex flex-col gap-3">
                 <div className="flex items-center gap-3">
                    <div className="size-3 rounded-md bg-[#3AB0FF]"></div>
                    <span className="font-bold text-slate-700 w-8">{session.correct + session.incorrect}</span>
                    <span className="text-sm text-slate-500">Attempted Qs</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="size-3 rounded-md bg-[#4ade80]"></div>
                    <span className="font-bold text-slate-700 w-8">{session.correct}</span>
                    <span className="text-sm text-slate-500">Answered Correctly</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="size-3 rounded-md bg-[#f87171]"></div>
                    <span className="font-bold text-slate-700 w-8">{session.incorrect}</span>
                    <span className="text-sm text-slate-500">Incorrect Answers</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="size-3 rounded-md bg-[#fbbf24]"></div>
                    <span className="font-bold text-slate-700 w-8">{session.unattempted}</span>
                    <span className="text-sm text-slate-500">Skipped Qs</span>
                 </div>
              </div>
              
              <div className="mt-6 pt-5 border-t border-slate-100 flex gap-8">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 mb-1">Avg Time/Qstion</p>
                  <p className="font-bold text-slate-800 text-lg">{formatDuration(avgTime)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 mb-1">Accuracy</p>
                  <p className="font-bold text-slate-800 text-lg">{accuracy}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RANK SECTION — Weekly exams only ─────────────────────────────── */}
      {isWeeklyExam && (
        examEnded ? (
          rankData ? (
            /* ✅ Exam over, rank revealed */
            <div className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-indigo-50 to-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
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
            <div className="rounded-md border border-border bg-surface p-5 text-center">
              <p className="text-sm text-muted">Rank data could not be loaded. Please refresh.</p>
            </div>
          )
        ) : (
          /* ⏳ Exam still open — rank pending */
          <div className="rounded-3xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-md bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                <Lock className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-foreground text-base">Rank & Percentile will be released soon</h2>
                <p className="text-sm text-muted mt-1">
                  Like Allen, Narayana, and nlearn — rankings are calculated <strong>only after the exam window closes</strong> so every student gets a fair shot regardless of when they started.
                </p>
                {examEndsAt && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-white border border-blue-200 rounded-md px-4 py-2">
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

      {/* ── BREAKDOWNS (SUBJECT & DIFFICULTY) ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isMultiSubject && (
          <div className="rounded-3xl bg-surface border-2 border-border p-8 space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-accent-electric" />
              <h2 className="font-bold text-foreground">Subject Breakdown</h2>
            </div>
            <div className="space-y-3 mt-auto">
              {subjects.map(([name, data]) => {
                const s = getSubjectStyle(name)
                const maxScore = data.total * 4
                const correctPct = data.total > 0 ? (data.correct / data.total) * 100 : 0
                const incorrectPct = data.total > 0 ? (data.incorrect / data.total) * 100 : 0
                const subAcc = data.correct + data.incorrect > 0
                  ? Math.round((data.correct / (data.correct + data.incorrect)) * 100)
                  : 0
                return (
                  <div key={name} className={`rounded-2xl border-l-4 ${s.border} bg-surface-2 border border-border p-5`}>
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
                    <div className="h-3 rounded-md bg-border overflow-hidden flex">
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

        {hasDiffData && (
          <div className="rounded-3xl bg-surface border-2 border-border p-8 space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent-electric" />
              <h2 className="font-bold text-foreground">Difficulty Breakdown</h2>
            </div>
            <div className="space-y-3 mt-auto">
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
                        <span className={`text-[10px] font-black uppercase tracking-wide px-2.5 py-0.5 rounded-md border ${badge}`}>
                          {level}
                        </span>
                        <span className="text-xs text-muted">{correct}/{total} correct</span>
                      </div>
                      <span className={`text-sm font-bold ${text}`}>{pct}%</span>
                    </div>
                    <div className="h-2.5 rounded-md bg-surface-2 overflow-hidden">
                      <div
                        className={`h-full rounded-md ${bar} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── MICRO ANALYSIS MATRIX ─────────────────────────────────────────── */}
      {strengthsData.length > 0 && (
          <div className="rounded-3xl bg-surface border-2 border-border p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-accent-electric" />
                <h2 className="font-bold text-foreground">Micro Analysis Matrix</h2>
              </div>
            </div>
            <p className="text-xs text-muted mb-4">Topic analysis: Accuracy (Y) vs Time per Question (X).</p>
            <div className="h-64 relative mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="time" type="number" name="Time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} label={{ value: 'Avg Time (s)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis dataKey="accuracy" type="number" name="Accuracy" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft', offset: 10, fill: '#94a3b8', fontSize: 12 }} />
                  <ZAxis dataKey="z" range={[100, 100]} />
                  <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomScatterTooltip />} />
                  <Scatter data={strengthsData} shape="circle">
                    {strengthsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-3 justify-center flex-wrap text-[10px] font-semibold text-muted mt-4">
              <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-sm bg-[#4ade80]"></div>Strength</div>
              <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-sm bg-[#60a5fa]"></div>Slow but accurate</div>
              <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-sm bg-[#fbbf24]"></div>Careless</div>
              <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-sm bg-[#f87171]"></div>Weakness</div>
            </div>
          </div>
      )}

      {/* ── PACING SCATTER PLOT ───────────────────────────────────────────── */}
      <div className="rounded-3xl bg-surface border-2 border-border p-8 space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-accent-electric" />
            <h2 className="font-bold text-foreground">Pacing & Time Analysis</h2>
          </div>
          <div className="flex gap-4 text-xs font-semibold text-muted">
            <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-sm bg-[#4ade80]"></div>Correct</div>
            <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-sm bg-[#f87171]"></div>Wrong</div>
            <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-sm bg-[#fbbf24]"></div>Skipped</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            { label: 'Avg per question', value: formatDuration(avgTime), color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
            { label: 'Avg on correct', value: correctSqs.length > 0 ? formatDuration(avgCorrectTime) : '—', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
            { label: 'Avg on wrong', value: wrongSqs.length > 0 ? formatDuration(avgWrongTime) : '—', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
            { label: 'Total Time', value: formatDuration(session.time_taken ?? 0), color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
          ].map(item => (
            <div key={item.label} className={`rounded-2xl border ${item.bg} p-4 text-center shadow-sm`}>
              <p className={`text-xl font-extrabold stat-number ${item.color}`}>{item.value}</p>
              <p className="text-[10px] font-medium text-muted mt-1 uppercase tracking-wide">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="h-72 w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="x" type="number" name="Question" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={['dataMin - 1', 'dataMax + 1']} label={{ value: 'Question Number', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 12 }} />
              <YAxis dataKey="time" type="number" name="Time (s)" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} label={{ value: 'Seconds', angle: -90, position: 'insideLeft', offset: 10, fill: '#94a3b8', fontSize: 12 }} />
              <ZAxis dataKey="z" range={[60, 60]} />
              <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomScatterTooltip />} />
              <Scatter data={scatterData} shape="circle">
                {scatterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── QUESTION REVIEW ───────────────────────────────────────────────── */}
      <div className="rounded-3xl bg-surface border-2 border-border overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
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
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${
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
                              className={`flex items-start gap-2 p-3 rounded-md border text-sm ${
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
                        <div className="rounded-md border border-border bg-surface px-4 py-2.5">
                          <p className="text-[10px] text-muted mb-0.5 font-medium uppercase tracking-wide">Your answer</p>
                          <p className={sq.is_correct ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                            {sq.answer_given ?? '—'}
                          </p>
                        </div>
                        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5">
                          <p className="text-[10px] text-muted mb-0.5 font-medium uppercase tracking-wide">Correct answer</p>
                          <p className="text-emerald-600 font-bold">{q.correct_answer}</p>
                        </div>
                      </div>
                    )}

                    {q.solution && (
                      <div className="rounded-md border border-border bg-surface p-4">
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
          className="flex-1 py-3.5 rounded-md font-bold text-sm text-center bg-gradient-primary text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md"
        >
          {session.weekly_exam_id ? 'Back to Exams' : 'Take Another Test'}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={session.weekly_exam_id ? '/exams' : '/tests'}
          className="px-6 py-3.5 rounded-md font-bold text-sm border border-border bg-surface text-muted hover:text-foreground hover:border-border-strong transition-all"
        >
          {session.weekly_exam_id ? 'Home' : 'All Tests'}
        </Link>
      </div>
    </div>
  )
}
