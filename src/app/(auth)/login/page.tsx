'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { login } from '../actions'
import { Sparkles, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

const initialState = {
  error: null as string | null,
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
    return await login(formData)
  }, initialState)

  return (
    <div className="min-h-screen w-full bg-[#0A0A0F] text-[#F0F0FA] flex flex-col md:flex-row relative overflow-hidden font-geist">
      
      {/* ── LEFT PANEL (45%): VISUALS ── */}
      <div className="w-full md:w-[45%] shrink-0 bg-[#0A0A0F] relative border-b md:border-b-0 md:border-r border-[rgba(255,255,255,0.07)] p-8 md:p-12 flex flex-col justify-between overflow-hidden min-h-[360px] md:min-h-screen mesh-gradient-bg">
        
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2 z-10"
        >
          <span className="text-[26px] font-[400] font-editorial text-[#F0F0FA] tracking-tight">
            JEEsociety
          </span>
          <span className="text-[12px] font-[500] bg-[#2D6EF5]/15 text-[#2D6EF5] px-2.5 py-0.5 rounded-full border border-[#2D6EF5]/30">
            Plus
          </span>
        </motion.div>

        {/* Mini Masonry Preview */}
        <div className="z-10 my-auto py-10 max-w-[360px] w-full self-center">
          <div className="grid grid-cols-2 gap-3.5">
            
            {/* Card 1 (Stat) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="col-span-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-[16px] p-4 backdrop-blur-xl shadow-lg"
            >
              <span className="text-[10px] font-[500] text-[#8A8AAF] tracking-wider uppercase">CURATED SETS</span>
              <div className="text-[24px] font-[700] font-mono text-[#F0F0FA] mt-0.5">1,200+ Questions</div>
              <p className="text-[11px] text-[#8A8AAF] mt-1">Physics · Chemistry · Maths</p>
            </motion.div>

            {/* Card 2 (Streak) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-[16px] p-4 backdrop-blur-xl shadow-lg"
            >
              <span className="text-[10px] font-[500] text-[#8A8AAF] tracking-wider uppercase">CONSISTENCY</span>
              <div className="text-[18px] font-[400] font-editorial text-[#F0F0FA] mt-1">🔥 47 days</div>
              <div className="flex gap-0.5 mt-2.5">
                <div className="size-2 rounded-[1px] bg-[#00D4AA]/20" />
                <div className="size-2 rounded-[1px] bg-[#00D4AA]/50" />
                <div className="size-2 rounded-[1px] bg-[#00D4AA]" />
                <div className="size-2 rounded-[1px] bg-[#00D4AA]" />
              </div>
            </motion.div>

            {/* Card 3 (Accuracy) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-[16px] p-4 backdrop-blur-xl shadow-lg"
            >
              <span className="text-[10px] font-[500] text-[#8A8AAF] tracking-wider uppercase">MOCK RECORD</span>
              <div className="text-[20px] font-[700] font-mono text-[#00D4AA] mt-1">98% Acc.</div>
              <p className="text-[10px] text-[#8A8AAF] mt-2">Active state accuracy</p>
            </motion.div>

          </div>
        </div>

        {/* Bottom Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-left z-10 max-w-[340px]"
        >
          <p className="text-[13px] font-[300] font-geist text-[#8A8AAF] leading-relaxed italic">
            "The best time to start drilling was yesterday. The second best time is now."
          </p>
        </motion.div>
      </div>

      {/* ── RIGHT PANEL (55%): FORM ── */}
      <div className="w-full md:w-[55%] bg-[#111118] min-h-screen px-6 py-12 md:p-20 flex flex-col justify-between">
        
        {/* Back Link to Landing */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="self-start"
        >
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-[13px] font-geist text-[#8A8AAF] hover:text-[#F0F0FA] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
            Back to jeesociety.plus
          </Link>
        </motion.div>

        {/* Main Content Form Wrapper */}
        <div className="my-auto max-w-[400px] w-full mx-auto py-10">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mb-8"
          >
            <h1 className="text-[36px] font-[400] font-editorial text-[#F0F0FA] tracking-tight leading-none mb-2">
              Welcome back.
            </h1>
            <p className="text-[15px] font-[300] text-[#8A8AAF] mt-1.5">
              Sign in to your dashboard
            </p>
          </motion.div>

          {/* Social Sign-In */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <button
              type="button"
              className="w-full h-12 rounded-[12px] bg-[#1A1A26] hover:bg-[#1A1A26]/80 border border-[rgba(255,255,255,0.07)] hover:border-[rgba(45,110,245,0.4)] flex items-center justify-center gap-3 text-[14px] font-[500] text-[#F0F0FA] active:scale-[0.99] transition-all duration-150"
            >
              {/* Google SVG Icon */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.478 0-6.3-2.822-6.3-6.3 0-3.478 2.822-6.3 6.3-6.3 1.506 0 2.882.532 3.97 1.402l2.907-2.907C18.847 2.487 15.767 1.5 12.24 1.5c-5.79 0-10.5 4.71-10.5 10.5s4.71 10.5 10.5 10.5c5.388 0 9.874-3.86 10.5-9H12.24z"
                />
              </svg>
              Continue with Google
            </button>
          </motion.div>

          {/* Divider */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="relative my-6 flex items-center justify-center"
          >
            <div className="absolute inset-x-0 h-px bg-[rgba(255,255,255,0.07)]" />
            <span className="relative z-10 bg-[#111118] px-4 text-[12px] font-geist text-[#3E3E5E] tracking-widest uppercase">
              or
            </span>
          </motion.div>

          {/* Error Banner */}
          {state?.error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-[12px] bg-[rgba(255,92,92,0.08)] border border-[rgba(255,92,92,0.15)] text-[#FF5C5C] text-[13px] font-[500] mb-5"
            >
              {state.error}
            </motion.div>
          )}

          {/* Standard Form */}
          <form action={formAction} className="space-y-5">
            
            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col gap-2"
            >
              <label htmlFor="email" className="text-[13px] font-[500] text-[#8A8AAF] font-geist">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full bg-[#1A1A26] border border-[rgba(255,255,255,0.07)] rounded-[12px] px-4 py-3 text-[15px] font-[400] text-[#F0F0FA] placeholder-[#3E3E5E] focus:border-[#2D6EF5] focus:ring-4 focus:ring-[#2D6EF5]/15 focus:outline-none transition-all duration-150"
              />
            </motion.div>

            {/* Password Field */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="flex flex-col gap-2 relative"
            >
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-[13px] font-[500] text-[#8A8AAF] font-geist">
                  Password
                </label>
                <Link 
                  href="#" 
                  className="text-[12px] font-geist text-[#2D6EF5] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#1A1A26] border border-[rgba(255,255,255,0.07)] rounded-[12px] pl-4 pr-12 py-3 text-[15px] font-[400] text-[#F0F0FA] placeholder-[#3E3E5E] focus:border-[#2D6EF5] focus:ring-4 focus:ring-[#2D6EF5]/15 focus:outline-none transition-all duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#3E3E5E] hover:text-[#8A8AAF] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="pt-2"
            >
              <button
                type="submit"
                disabled={isPending}
                className="w-full h-12 rounded-full bg-gradient-to-r from-[#2D6EF5] to-[#1A4FD4] hover:brightness-[1.1] hover:shadow-[0_0_25px_rgba(45,110,245,0.25)] text-white font-[500] text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </motion.div>

          </form>

        </div>

        {/* Footer of Right Panel */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="text-center text-[14px] text-[#8A8AAF]"
        >
          Don't have an account?{' '}
          <Link href="/signup" className="text-[#2D6EF5] hover:underline font-[500]">
            Get started
          </Link>
        </motion.div>

      </div>

    </div>
  )
}
