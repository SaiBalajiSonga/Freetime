'use client'

import { useTransition } from 'react'
import { createJeeSession } from './actions'
import { Loader2, Zap } from 'lucide-react'
import { useState } from 'react'

export default function JeeStartButton({ 
  disabled, 
  className,
  label = "Start JEE Mains Mock",
  icon = <Zap className="h-5 w-5" />
}: { 
  disabled?: boolean
  className?: string
  label?: React.ReactNode
  icon?: React.ReactNode
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleStart() {
    setError(null)
    
    // Request fullscreen on click
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Could not enter fullscreen:', err)
      })
    }

    startTransition(async () => {
      const result = await createJeeSession()
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={handleStart}
        disabled={disabled || isPending}
        className={className || "w-full py-3 rounded-xl font-bold text-sm bg-amber-400 hover:bg-amber-500 text-amber-950 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"}
      >
        {isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating Paper…
          </>
        ) : (
          <>
            {icon}
            {label}
          </>
        )}
      </button>
    </div>
  )
}
