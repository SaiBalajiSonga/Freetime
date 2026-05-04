'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Spline from '@splinetool/react-spline'
import { ArrowRight, Brain, Trophy, Activity, Zap } from 'lucide-react'
import { Nav } from '@/components/site/nav'
import { Badge } from '@/components/ui/badge'
import { AmbientBackdrop } from '@/components/site/ambient-backdrop'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-hidden relative">
      <AmbientBackdrop intensity="strong" />
      <Nav />

      <main className="relative pt-28 lg:pt-40">
        <section className="mx-auto max-w-7xl px-6 pb-20 lg:pb-28 grid lg:grid-cols-[1fr_1.05fr] gap-14 lg:gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-8 z-10"
          >
            <Badge>Adaptive practice</Badge>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-[4.25rem] leading-[0.96] font-extrabold tracking-[-0.04em]">
              Master JEE
              <br />
              with <span className="text-gradient">depth-first</span>
              <br />
              problem solving.
            </h1>

            <p className="text-base md:text-lg text-muted leading-relaxed max-w-[34rem]">
              A focused workspace for physics, chemistry, and mathematics — with analytics that surface what to drill next, not
              just how many questions you clicked.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-1">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 h-12 px-8 text-base font-semibold rounded-pill bg-gradient-primary text-white shadow-[0_12px_40px_-10px_rgba(59,130,246,0.55)] hover:brightness-110 active:scale-[0.98] transition-all"
              >
                Enter platform
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center px-6 text-sm font-semibold rounded-pill border border-white/15 text-muted hover:text-foreground hover:border-accent-electric/40 hover:bg-surface-2/60 transition-all backdrop-blur-sm"
              >
                Sign in
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-muted-2 text-sm font-medium">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent-electric" />
                High-yield question sets
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon /> 3D-ready visualizations
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:block"
          >
            <div className="gradient-border-wrap shadow-[0_32px_80px_-40px_rgba(0,0,0,0.85)]">
              <div className="gradient-border-inner aspect-square rounded-[19px] overflow-hidden flex items-center justify-center relative">
                <div
                  className="absolute inset-0 opacity-90"
                  style={{
                    background:
                      'radial-gradient(ellipse 80% 60% at 30% 20%, rgba(59,130,246,0.12), transparent), linear-gradient(165deg, rgba(96,165,250,0.08) 0%, rgba(3,3,8,0.4) 100%)',
                  }}
                />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-accent-electric/15" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-accent-electric/10" />
                <Spline scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode" className="w-full h-full scale-[1.02]" />
              </div>
            </div>
            <div
              className="pointer-events-none absolute -bottom-6 -right-4 h-28 w-28 rounded-full blur-2xl opacity-70"
              style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.45), transparent 70%)' }}
            />
          </motion.div>
        </section>

        <section id="features" className="relative border-t border-white/[0.06] bg-surface/30 backdrop-blur-md">
          <div className="absolute inset-0 bg-gradient-mesh opacity-40 pointer-events-none" />
          <div className="mx-auto max-w-7xl px-6 py-20 md:py-28 relative">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-2xl mx-auto mb-16 md:mb-20"
            >
              <p className="section-label mb-3">Product</p>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-foreground tracking-[-0.03em]">
                Built for <span className="text-gradient">serious</span> prep
              </h2>
              <p className="text-muted text-base md:text-lg leading-relaxed">
                Clear hierarchy, fast navigation, and feedback loops that mirror how top performers actually train.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              <FeatureCard
                icon={<Brain className="w-6 h-6 text-accent-electric" />}
                title="Difficulty that scales"
                desc="Move from fundamentals to exam tempo without jumping into chaos — stay in the stretch zone."
                delay={0.06}
              />
              <FeatureCard
                icon={<Activity className="w-6 h-6 text-accent-blue" />}
                title="Analytics you can act on"
                desc="See streaks, accuracy, and topic load — so your next session is a decision, not a guess."
                delay={0.12}
              />
              <FeatureCard
                icon={<Trophy className="w-6 h-6 text-accent-electric" />}
                title="Motivation without noise"
                desc="Leaderboards and streaks that reward consistency — tuned to feel premium, not arcade-y."
                delay={0.18}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function CheckCircleIcon() {
  return (
    <svg className="w-4 h-4 text-accent-electric" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function FeatureCard({
  icon,
  title,
  desc,
  delay,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, delay }}
      className="group relative p-8 rounded-2xl surface-glass card-hover-lift overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-electric/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="w-12 h-12 rounded-xl icon-3d border border-white/[0.08] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-3 text-foreground tracking-tight">{title}</h3>
      <p className="text-muted text-sm leading-relaxed">{desc}</p>
    </motion.div>
  )
}
