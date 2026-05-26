'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Admin] Caught error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-surface border border-border rounded-xl max-w-2xl mx-auto mt-10">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-6">
        <AlertCircle className="h-8 w-8 text-red-400" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
      <p className="text-sm text-muted max-w-md mx-auto mb-8">
        We encountered an error loading this admin page. This might be due to a network hiccup or database timeout.
      </p>
      
      <div className="flex gap-4">
        <Button 
          onClick={() => reset()}
          className="flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Try again
        </Button>
      </div>
      
      {error.message && (
        <div className="mt-8 p-4 bg-surface-2 rounded-lg text-left max-w-full w-full overflow-auto">
          <p className="text-xs text-red-400 font-mono whitespace-pre-wrap">{error.message}</p>
        </div>
      )}
    </div>
  )
}
