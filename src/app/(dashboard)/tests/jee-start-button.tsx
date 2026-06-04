'use client'

import { useTransition } from 'react'
import { createJeeSession } from './actions'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function JeeStartButton({ 
  disabled, 
  className,
  label = "Start JEE Mains Mock",
  testName
}: { 
  disabled?: boolean
  className?: string
  label?: React.ReactNode
  testName?: string
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
      const result = await createJeeSession(testName)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-3 mt-2">
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={handleStart}
        disabled={disabled || isPending}
        className={className || "w-full py-2.5 rounded-md font-semibold text-sm text-white bg-[var(--color-primary)] transition-all hover:opacity-90 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating Paper...
          </>
        ) : (
          label
        )}
      </button>
    </div>
  )
}
