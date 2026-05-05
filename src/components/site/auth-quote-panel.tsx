'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Atom, FlaskConical, Sigma } from 'lucide-react'

const quotes = [
  {
    quote: "I have no special talents. I am only passionately curious.",
    author: "Albert Einstein",
    icon: <Atom className="h-6 w-6 text-white/80" />
  },
  {
    quote: "What I cannot create, I do not understand.",
    author: "Richard Feynman",
    icon: <Sigma className="h-6 w-6 text-white/80" />
  },
  {
    quote: "Nothing in life is to be feared, it is only to be understood.",
    author: "Marie Curie",
    icon: <FlaskConical className="h-6 w-6 text-white/80" />
  }
]

export function AuthQuotePanel() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % quotes.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="hidden md:flex relative w-1/2 bg-[var(--color-primary)] overflow-hidden flex-col justify-between p-12 text-white">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 text-[100px] font-mono leading-none rotate-12">∫</div>
        <div className="absolute bottom-20 right-10 text-[60px] font-mono leading-none -rotate-12">∑</div>
        <div className="absolute top-1/3 right-1/4 text-[80px] font-mono leading-none rotate-45">π</div>
        <div className="absolute top-1/2 left-1/4 text-[40px] font-mono leading-none -rotate-45">E=mc²</div>
      </div>
      
      {/* Soft gradient sheen */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

      {/* Branding */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="font-extrabold text-xl tracking-tight block leading-tight">JEE Practice</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Study OS</span>
        </div>
      </div>

      {/* Quote Carousel */}
      <div className="relative z-10 mb-8 min-h-[160px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4"
          >
            <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
              {quotes[current].icon}
            </div>
            <p className="text-2xl font-bold leading-snug tracking-tight">
              "{quotes[current].quote}"
            </p>
            <p className="text-sm font-medium text-white/70">
              — {quotes[current].author}
            </p>
          </motion.div>
        </AnimatePresence>
        
        {/* Indicators */}
        <div className="flex gap-2 mt-8">
          {quotes.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-6 bg-white' : 'w-2 bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
