import { useState, useEffect, useCallback } from 'react'
import { saveAnswer } from '@/app/(dashboard)/tests/actions'

export type SavePayload = {
  sessionQuestionId: string
  answer: string | null
  isMarked: boolean
  timeTaken: number
}

export function useOfflineSync(sessionId: string) {
  const [isOffline, setIsOffline] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  const storageKey = `offline_queue_${sessionId}`

  // Load queue from localStorage. We use a Record/Map where key = sessionQuestionId
  // This naturally deduplicates rapid clicks on the same question!
  const getQueue = (): Record<string, SavePayload> => {
    if (typeof window === 'undefined') return {}
    try {
      const data = localStorage.getItem(storageKey)
      return data ? JSON.parse(data) : {}
    } catch {
      return {}
    }
  }

  // Save queue to localStorage
  const setQueue = (queue: Record<string, SavePayload>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(queue))
      setPendingCount(Object.keys(queue).length)
    }
  }

  const saveOrQueue = useCallback(async (payload: SavePayload) => {
    // 1. Always queue locally FIRST (optimistic local save)
    const queue = getQueue()
    queue[payload.sessionQuestionId] = payload
    setQueue(queue)

    // 2. Try to sync immediately if online
    if (navigator.onLine) {
      await attemptSync()
    } else {
      setIsOffline(true)
    }
  }, [sessionId])

  const attemptSync = useCallback(async (): Promise<boolean> => {
    const queue = getQueue()
    const keys = Object.keys(queue)
    
    if (keys.length === 0) {
      const offline = !navigator.onLine
      setIsOffline(offline)
      return !offline
    }

    try {
      // Send all queued answers in parallel
      const promises = keys.map(k => saveAnswer(queue[k]))
      const results = await Promise.allSettled(promises)

      // Fetch fresh queue in case user answered more questions while we were syncing
      const newQueue = getQueue() 
      let hasError = false

      results.forEach((res, index) => {
        // Only remove from queue if it was successfully saved to DB
        if (res.status === 'fulfilled' && !res.value?.error) {
          delete newQueue[keys[index]]
        } else {
          hasError = true
        }
      })

      setQueue(newQueue)
      const offline = hasError || !navigator.onLine
      setIsOffline(offline)
      return !offline

    } catch (err) {
      // Network completely down
      setIsOffline(true)
      return false
    }
  }, [])

  // Setup event listeners for online/offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      attemptSync() // Flush queue when internet returns
    }
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial check and sync on mount
    setIsOffline(!navigator.onLine)
    // Run an initial sync in case they crashed and came back
    attemptSync()

    // Periodic background sync (every 30 seconds) to catch any silent failures
    const interval = setInterval(() => {
      if (navigator.onLine) attemptSync()
    }, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [attemptSync])

  return { saveOrQueue, attemptSync, isOffline, pendingCount }
}
