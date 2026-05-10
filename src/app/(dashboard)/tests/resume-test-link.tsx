'use client'

import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'

export function ResumeTestLink({ 
  sessionId, 
  children, 
  className 
}: { 
  sessionId: string
  children: ReactNode
  className?: string 
}) {
  const router = useRouter()

  return (
    <div 
      onClick={() => {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {})
        }
        router.push(`/tests/${sessionId}`)
      }}
      className={`cursor-pointer ${className || ''}`}
    >
      {children}
    </div>
  )
}
