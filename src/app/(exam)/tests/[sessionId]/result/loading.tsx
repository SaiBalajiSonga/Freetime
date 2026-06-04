'use client'

import { useState, useEffect } from 'react'

const RESULT_MESSAGES = [
  'Analyzing your performance',
  'Calculating your score',
  'Comparing with benchmarks',
  'Generating insights',
]

export default function ResultLoading() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % RESULT_MESSAGES.length)
    }, 2200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="flex flex-col items-center text-center px-6">
        {/* ── Animated score ring ── */}
        <div className="relative size-32 mb-8">
          <svg className="size-full -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="6"
            />
            {/* Animated fill ring */}
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="283"
              className="score-ring-animate"
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-14 rounded-2xl bg-blue-50 flex items-center justify-center">
              <svg className="size-7 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
          </div>
        </div>

        {/* ── Status text with cycling messages ── */}
        <h2 className="text-xl font-bold text-foreground tracking-tight mb-1 flex items-center gap-1">
          {RESULT_MESSAGES[messageIndex]}
          <span className="inline-flex gap-0.5 ml-0.5">
            <span className="typing-dot inline-block size-1 rounded-full bg-blue-500" />
            <span className="typing-dot inline-block size-1 rounded-full bg-blue-500" />
            <span className="typing-dot inline-block size-1 rounded-full bg-blue-500" />
          </span>
        </h2>
        <p className="text-sm text-muted font-medium">
          This will just take a moment
        </p>
      </div>
    </div>
  )
}
