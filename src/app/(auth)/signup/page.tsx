'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signup } from '../actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthQuotePanel } from '@/components/site/auth-quote-panel'
import { Sparkles } from 'lucide-react'

const initialState = {
  error: null as string | null,
}

const inputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all font-medium text-sm'

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
    return await signup(formData)
  }, initialState)

  return (
    <div className="flex bg-white rounded-3xl shadow-[0_8px_32px_rgba(15,23,42,0.08)] overflow-hidden w-full border border-slate-100">
      
      {/* Left side: Visuals */}
      <AuthQuotePanel />

      {/* Right side: Form */}
      <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center">
        
        {/* Mobile Header Branding (Hidden on md+) */}
        <div className="md:hidden flex items-center gap-2 mb-8">
          <div className="size-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-foreground">JEE Practice</span>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">Create Account</h1>
          <p className="text-slate-500 font-medium">Join JEE Practice and start preparing today.</p>
        </div>

        {state?.error && (
          <Alert className="bg-red-50 text-red-600 border-red-100 mb-6 rounded-xl">
            <AlertDescription className="font-semibold">{state.error}</AlertDescription>
          </Alert>
        )}

        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-bold text-slate-700">
              Full Name
            </Label>
            <input id="name" name="name" type="text" placeholder="John Doe" required className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-bold text-slate-700">
              Email Address
            </Label>
            <input id="email" name="email" type="email" placeholder="you@example.com" required className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-bold text-slate-700">
              Phone Number
            </Label>
            <input id="phone" name="phone" type="tel" placeholder="+91 XXXXX XXXXX" required className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target_jee_year" className="text-sm font-bold text-slate-700">
              Target JEE Year
            </Label>
            <input id="target_jee_year" name="target_jee_year" type="number" min="2024" max="2035" placeholder="e.g. 2026" required className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-bold text-slate-700">
              Password
            </Label>
            <input id="password" name="password" type="password" required className={inputClass} />
          </div>

          <Button type="submit" className="w-full h-12 text-base font-bold bg-[var(--color-primary)] hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all" disabled={isPending}>
            {isPending ? 'Creating account…' : 'Sign up'}
          </Button>
        </form>

        <p className="text-sm text-center text-slate-500 font-medium mt-8">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--color-primary)] hover:underline font-bold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
