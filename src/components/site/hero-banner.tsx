'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Slide = {
  id: number
  headline: string
  sub: string
  tag: string
  gradient: string
  emoji: string
}

const slides: Slide[] = [
  {
    id: 1,
    headline: 'Every question solved\nis a step closer.',
    sub: '#YourDreamsAreOurDreams',
    tag: 'Daily Motivation',
    gradient: 'from-[#dbeafe] via-[#bfdbfe] to-[#e0f2fe]',
    emoji: '🚀',
  },
  {
    id: 2,
    headline: 'Consistency beats\nbrilliance every time.',
    sub: 'Show up today. Dominate tomorrow.',
    tag: 'Study Tip',
    gradient: 'from-[#d1fae5] via-[#a7f3d0] to-[#ecfdf5]',
    emoji: '🔥',
  },
  {
    id: 3,
    headline: 'JEE is a marathon,\nnot a sprint.',
    sub: 'Build your pace. Build your score.',
    tag: 'JEE Insight',
    gradient: 'from-[#ede9fe] via-[#ddd6fe] to-[#f5f3ff]',
    emoji: '🎯',
  },
  {
    id: 4,
    headline: 'Practice questions daily.\nBuild unshakeable concepts.',
    sub: 'Start with one chapter. Master it.',
    tag: 'Pro Strategy',
    gradient: 'from-[#fef3c7] via-[#fde68a] to-[#fffbeb]',
    emoji: '⚡',
  },
]

export function HeroBanner() {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)

  const goTo = useCallback((idx: number, dir: number) => {
    setDirection(dir)
    setCurrent(idx)
  }, [])

  const next = useCallback(() => {
    goTo((current + 1) % slides.length, 1)
  }, [current, goTo])

  const prev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length, -1)
  }, [current, goTo])

  useEffect(() => {
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [next])

  const slide = slides[current]

  return (
    <div
      className={`hero-banner bg-gradient-to-r ${slide.gradient} relative overflow-hidden transition-all duration-700`}
      style={{ minHeight: '180px' }}
    >
      {/* Dot pattern overlay */}
      <div className="absolute inset-0 dot-pattern opacity-30 pointer-events-none" />

      {/* Large decorative emoji */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[80px] opacity-15 pointer-events-none select-none hidden sm:block">
        {slide.emoji}
      </div>

      <div className="relative z-10 p-6 md:p-8 flex flex-col justify-center min-h-[180px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -30 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary)] bg-white/60 rounded-full px-3 py-0.5 mb-3">
              {slide.tag}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] leading-tight whitespace-pre-line">
              {slide.headline}
            </h2>
            <p className="text-sm text-[#475569] mt-2 font-medium">{slide.sub}</p>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-5">
          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goTo(i, i > current ? 1 : -1)}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? 'w-5 h-2 bg-[var(--color-primary)]'
                    : 'w-2 h-2 bg-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/60'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Arrow buttons */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={prev}
              className="size-7 rounded-full bg-white/70 hover:bg-white flex items-center justify-center text-[var(--color-primary)] transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              className="size-7 rounded-full bg-white/70 hover:bg-white flex items-center justify-center text-[var(--color-primary)] transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
