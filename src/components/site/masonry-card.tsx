'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Atom, FlaskConical, Sigma, Sparkles, TrendingUp, Trophy } from 'lucide-react'

interface QuestionCardProps {
  subject: 'physics' | 'chemistry' | 'maths'
  difficulty: 'easy' | 'medium' | 'hard'
  topic: string
  problemText: string
  solutionLink?: string
}

interface StatCardProps {
  number: string
  label: string
  trend?: string
  trendUp?: boolean
  showSparkline?: boolean
}

interface TopicCardProps {
  subject: 'physics' | 'chemistry' | 'maths'
  chapterName: string
  problemsLeft: number
  totalProblems: number
}

interface StreakCardProps {
  streakDays: number
  heatmapData?: number[] // 28 values for a 4-week grid
}

interface LeaderboardUser {
  rank: number
  initials: string
  name: string
  score: string
  isCurrentUser?: boolean
}

interface LeaderboardCardProps {
  title: string
  users: LeaderboardUser[]
}

interface MasonryCardProps {
  variant: 'question' | 'stat' | 'topic' | 'streak' | 'leaderboard'
  questionProps?: QuestionCardProps
  statProps?: StatCardProps
  topicProps?: TopicCardProps
  streakProps?: StreakCardProps
  leaderboardProps?: LeaderboardCardProps
  className?: string
  delay?: number
}

export function MasonryCard({
  variant,
  questionProps,
  statProps,
  topicProps,
  streakProps,
  leaderboardProps,
  className = '',
  delay = 0
}: MasonryCardProps) {
  
  const baseCardStyles = "bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-[20px] p-5 hover:-translate-y-[3px] hover:border-[rgba(45,110,245,0.4)] transition-all duration-250 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.4),0_8px_24px_rgba(0,0,0,0.3)] hover:shadow-[0_0_40px_rgba(45,110,245,0.15)] group"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`${baseCardStyles} ${className}`}
    >
      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none" />

      {/* QUESTION CARD */}
      {variant === 'question' && questionProps && (
        <div className="flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              {/* Subject Tag */}
              {questionProps.subject === 'physics' && (
                <span className="px-2.5 py-1 text-[11px] font-[500] font-geist rounded-full bg-[rgba(45,110,245,0.12)] text-[#6B9FFF] border border-[rgba(45,110,245,0.2)]">
                  Physics
                </span>
              )}
              {questionProps.subject === 'chemistry' && (
                <span className="px-2.5 py-1 text-[11px] font-[500] font-geist rounded-full bg-[rgba(0,212,170,0.10)] text-[#00D4AA] border border-[rgba(0,212,170,0.2)]">
                  Chemistry
                </span>
              )}
              {questionProps.subject === 'maths' && (
                <span className="px-2.5 py-1 text-[11px] font-[500] font-geist rounded-full bg-[rgba(245,166,35,0.10)] text-[#F5A623] border border-[rgba(245,166,35,0.2)]">
                  Maths
                </span>
              )}

              {/* Difficulty Badge */}
              <span className={`text-[10px] font-[600] font-geist uppercase px-2 py-0.5 rounded-md ${
                questionProps.difficulty === 'easy' ? 'bg-[rgba(0,212,170,0.1)] text-[#00D4AA]' :
                questionProps.difficulty === 'medium' ? 'bg-[rgba(245,166,35,0.1)] text-[#F5A623]' :
                'bg-[rgba(255,92,92,0.1)] text-[#FF5C5C]'
              }`}>
                {questionProps.difficulty}
              </span>
            </div>
            
            {/* Topic label */}
            <p className="text-[12px] font-[500] font-geist text-[#8A8AAF] mb-2">{questionProps.topic}</p>
            
            {/* Question Snippet */}
            <h4 className="text-[15px] font-[400] font-editorial text-[#F0F0FA] leading-relaxed line-clamp-4 select-none">
              {questionProps.problemText}
            </h4>
          </div>

          <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.05)] flex items-center justify-between">
            <span className="text-[11px] font-geist text-[#3E3E5E]">JEE Advanced Syllabus</span>
            <button className="text-[12px] font-[500] font-geist text-[#8A8AAF] hover:text-[#F0F0FA] hover:underline underline-offset-4 transition-colors flex items-center gap-1">
              View Solution <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>
      )}

      {/* STAT CARD */}
      {variant === 'stat' && statProps && (
        <div className="flex flex-col justify-between h-full">
          <div>
            <p className="text-[12px] font-[500] font-geist text-[#8A8AAF] tracking-wide uppercase">{statProps.label}</p>
            <h3 className="text-[42px] font-[700] font-mono text-[#F0F0FA] tracking-tight mt-1 leading-none">
              {statProps.number}
            </h3>
          </div>

          <div className="flex items-end justify-between mt-4">
            {statProps.trend && (
              <span className={`text-[12px] font-geist flex items-center gap-1 ${statProps.trendUp ? 'text-[#00D4AA]' : 'text-[#FF5C5C]'}`}>
                {statProps.trendUp && <TrendingUp className="w-3 h-3" />}
                {statProps.trend}
              </span>
            )}
            
            {statProps.showSparkline && (
              <svg className="w-24 h-8 text-[#00D4AA]" viewBox="0 0 100 30" fill="none">
                <path
                  d="M0 25 L20 18 L40 22 L60 8 L80 12 L100 2"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M0 25 L20 18 L40 22 L60 8 L80 12 L100 2 L100 30 L0 30 Z"
                  fill="url(#sparkline-gradient)"
                  opacity="0.15"
                />
                <defs>
                  <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00D4AA" />
                    <stop offset="100%" stopColor="#00D4AA" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            )}
          </div>
        </div>
      )}

      {/* TOPIC CARD */}
      {variant === 'topic' && topicProps && (
        <div className="flex items-center justify-between h-full">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#1A1A26] text-[#8A8AAF] flex items-center justify-center shrink-0 border border-[rgba(255,255,255,0.05)]">
              {topicProps.subject === 'physics' && <Atom className="w-5 h-5 text-[#2D6EF5]" />}
              {topicProps.subject === 'chemistry' && <FlaskConical className="w-5 h-5 text-[#00D4AA]" />}
              {topicProps.subject === 'maths' && <Sigma className="w-5 h-5 text-[#F5A623]" />}
            </div>
            
            <div>
              <span className="text-[11px] font-[500] font-geist text-[#3E3E5E] tracking-wider uppercase">
                {topicProps.subject}
              </span>
              <h4 className="text-[16px] font-[500] font-geist text-[#F0F0FA] leading-tight mt-0.5">
                {topicProps.chapterName}
              </h4>
              <p className="text-[12px] font-geist text-[#8A8AAF] mt-1">
                {topicProps.problemsLeft} problems left
              </p>
            </div>
          </div>

          {/* Progress Ring */}
          <div className="relative size-12 shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="18"
                className="stroke-[#1A1A26]"
                strokeWidth="3.5"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r="18"
                className={`${
                  topicProps.subject === 'physics' ? 'stroke-[#2D6EF5]' :
                  topicProps.subject === 'chemistry' ? 'stroke-[#00D4AA]' :
                  'stroke-[#F5A623]'
                }`}
                strokeWidth="3.5"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 18}
                strokeDashoffset={2 * Math.PI * 18 * (1 - (topicProps.totalProblems - topicProps.problemsLeft) / topicProps.totalProblems)}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-[#F0F0FA]">
              {Math.round(((topicProps.totalProblems - topicProps.problemsLeft) / topicProps.totalProblems) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* STREAK CARD */}
      {variant === 'streak' && streakProps && (
        <div className="flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-[500] font-geist text-[#3E3E5E] uppercase tracking-widest">Consistency</span>
              <span className="flex items-center gap-1 text-[12px] font-geist text-[#00D4AA] bg-[rgba(0,212,170,0.1)] px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <h3 className="text-[26px] font-[400] font-editorial text-[#F0F0FA] leading-tight">
              🔥 {streakProps.streakDays} day streak
            </h3>
            <p className="text-[12px] font-geist text-[#8A8AAF] mt-1">Excellent mock consistency this month.</p>
          </div>

          {/* GitHub style activity heatmap (7 columns x 4 rows = 28 squares) */}
          <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.05)]">
            <div className="grid grid-flow-col grid-rows-4 gap-1.5 justify-start">
              {(streakProps.heatmapData || [
                0,1,0,2,3,0,1,
                2,0,1,0,2,2,3,
                1,1,0,3,0,2,1,
                2,3,2,3,2,3,3
              ]).map((activity, i) => (
                <div
                  key={i}
                  className={`size-3 rounded-[2px] transition-all duration-200 ${
                    activity === 0 ? 'bg-[#1A1A26] border border-[rgba(255,255,255,0.02)]' :
                    activity === 1 ? 'bg-[#00D4AA]/20' :
                    activity === 2 ? 'bg-[#00D4AA]/50' :
                    'bg-[#00D4AA]'
                  }`}
                  title={`${activity} sessions`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LEADERBOARD CARD */}
      {variant === 'leaderboard' && leaderboardProps && (
        <div className="flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[14px] font-[500] font-geist text-[#F0F0FA] flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-[#F5A623]" />
                {leaderboardProps.title}
              </h4>
              <span className="text-[10px] font-geist text-[#3E3E5E] tracking-widest uppercase">Live Ranks</span>
            </div>

            {/* List */}
            <div className="space-y-2">
              {leaderboardProps.users.map((item, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                    item.isCurrentUser 
                      ? 'bg-[rgba(45,110,245,0.12)] border-[rgba(45,110,245,0.3)] shadow-[0_0_15px_rgba(45,110,245,0.1)]' 
                      : 'bg-[#1A1A26]/40 border-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.05)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[12px] font-mono shrink-0 w-4 text-center ${
                      item.rank === 1 ? 'text-[#F5A623] font-bold' :
                      item.rank === 2 ? 'text-[#8A8AAF]' :
                      item.rank === 3 ? 'text-[#FF5C5C]' :
                      'text-[#3E3E5E]'
                    }`}>
                      #{item.rank}
                    </span>
                    <div className="size-6 rounded-full bg-[#1A1A26] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-[10px] font-[500] font-geist text-[#F0F0FA] shrink-0">
                      {item.initials}
                    </div>
                    <span className={`text-[13px] font-geist font-[400] text-[#F0F0FA] truncate ${
                      item.isCurrentUser ? 'font-[600]' : ''
                    }`}>
                      {item.name}
                    </span>
                  </div>
                  <span className="text-[12px] font-mono text-[#8A8AAF] shrink-0">
                    {item.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.05)] text-center">
            <p className="text-[11px] font-geist text-[#8A8AAF]">
              You're <strong className="text-[#2D6EF5]">#4</strong> — 2 spots from podium
            </p>
          </div>
        </div>
      )}

    </motion.div>
  )
}
