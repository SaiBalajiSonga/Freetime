'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signup } from '../actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles } from 'lucide-react'

const initialState = {
  error: null as string | null,
}

const inputClass =
  'w-full bg-surface-2/80 border border-white/[0.08] rounded-xl px-4 py-3 text-foreground placeholder:text-muted-2 focus:border-accent-electric focus:outline-none focus:ring-2 focus:ring-accent-electric/25 transition text-sm'

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
    return await signup(formData)
  }, initialState)

  return (
    <div className="w-full max-w-sm space-y-8 relative z-10">
      <div className="flex flex-col items-center gap-4">
        <div className="size-12 rounded-xl icon-3d-blue border border-accent-electric/25 grid place-items-center">
          <Sparkles className="w-6 h-6 text-accent-electric" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-[-0.03em] text-foreground">Create an account</h1>
          <p className="text-sm text-muted mt-1">Enter your details to join JEE Practice</p>
        </div>
      </div>

      <div className="rounded-2xl surface-glass-strong p-8 space-y-6">
        {state?.error && (
          <Alert className="bg-red-500/10 border-red-500/20 text-red-400">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-foreground">
              Full Name
            </Label>
            <input id="name" name="name" type="text" placeholder="John Doe" required className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </Label>
            <input id="email" name="email" type="email" placeholder="m@example.com" required className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </Label>
            <input id="password" name="password" type="password" required className={inputClass} />
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isPending}>
            {isPending ? 'Creating account…' : 'Sign up'}
          </Button>
        </form>

        <p className="text-sm text-center text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-accent-electric hover:text-accent-glow font-medium transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
