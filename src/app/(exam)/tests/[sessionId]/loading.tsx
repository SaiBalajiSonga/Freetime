'use client'

import { useState, useEffect } from 'react'

const EXAM_QUOTES = [
  { text: "It's not that I'm so smart, it's just that I stay with problems longer.", author: "Albert Einstein" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
  { text: "Learning is the only thing the mind never exhausts, never fears, and never regrets.", author: "Leonardo da Vinci" },
  { text: "It does not matter how slowly you go so long as you do not stop.", author: "Confucius" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "Everything is theoretically impossible, until it is done.", author: "Robert A. Heinlein" },
  { text: "The search for truth is more precious than its possession.", author: "Albert Einstein" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Failure is simply the opportunity to begin again, this time more intelligently.", author: "Henry Ford" },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
]

export default function ExamSessionLoading() {
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * EXAM_QUOTES.length))
  const [fadeIn, setFadeIn] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false)
      setTimeout(() => {
        setQuoteIndex(prev => (prev + 1) % EXAM_QUOTES.length)
        setFadeIn(true)
      }, 400)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const quote = EXAM_QUOTES[quoteIndex]

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 dot-pattern opacity-30" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">
        {/* ── Orbital animation ── */}
        <div className="relative size-20 mb-8">
          {/* Pulsing center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-8 rounded-full bg-blue-100 pulse-ring" />
            <div className="absolute size-4 rounded-full bg-blue-500 shadow-lg" />
          </div>
          {/* Orbiting dots */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="orbit-dot" />
            <div className="orbit-dot" />
            <div className="orbit-dot" />
          </div>
        </div>

        {/* ── Loading text with typing dots ── */}
        <h2 className="text-xl font-bold text-foreground tracking-tight mb-1 flex items-center gap-1">
          Preparing your exam
          <span className="inline-flex gap-0.5 ml-0.5">
            <span className="typing-dot inline-block size-1 rounded-full bg-blue-500" />
            <span className="typing-dot inline-block size-1 rounded-full bg-blue-500" />
            <span className="typing-dot inline-block size-1 rounded-full bg-blue-500" />
          </span>
        </h2>
        <p className="text-sm text-muted font-medium mb-10">
          Loading questions and setting up your session
        </p>

        {/* ── Quote carousel ── */}
        <div
          className="transition-all duration-400 ease-in-out min-h-[80px] flex flex-col items-center justify-center"
          style={{ opacity: fadeIn ? 1 : 0, transform: fadeIn ? 'translateY(0)' : 'translateY(8px)' }}
        >
          <div className="relative px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 max-w-sm">
            <svg className="absolute -top-2.5 left-6 text-slate-200" width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
              <path d="M0 12L9 0L18 12H0Z" />
            </svg>
            <p className="text-sm text-foreground leading-relaxed italic font-medium">
              &ldquo;{quote.text}&rdquo;
            </p>
            <p className="text-xs text-muted mt-2 font-semibold">
              — {quote.author}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
