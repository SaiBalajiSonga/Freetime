'use client'

import { useState, useEffect, useRef, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { submitTest } from '@/app/(dashboard)/tests/actions'
import ExamInterface from './exam-interface'
import { useOfflineSync } from './use-offline-sync'

export type SessionQuestion = {
  id: string
  question_id: string
  order_index: number
  answer_given: string | null
  is_marked_for_review: boolean
  visit_status: string
  time_taken: number
  questions: {
    id: string
    type: 'mcq' | 'numerical'
    statement: string
    difficulty: string
    correct_answer: string | null
    hint: string | null
    solution: string | null
    image_url: string | null
    chapters: { id: string; name: string; subjects: { id: string; name: string } }
  }
  options: { id: string; question_id: string; text: string; is_correct: boolean }[]
}

type Props = {
  session: any
  sessionQuestions: SessionQuestion[]
  userName: string
  rollNo: string
  avatarUrl: string | null
}

export default function TestClient({ session, sessionQuestions: initial, userName, rollNo, avatarUrl }: Props) {
  const router = useRouter()
  const isJee = session.mode === 'jee_mains'

  const [sq, setSq] = useState<SessionQuestion[]>(initial)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(session.time_limit_minutes * 60)
  const [questionTimer, setQuestionTimer] = useState(0)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [, startTransition] = useTransition()

  const { saveOrQueue, attemptSync, isOffline, pendingCount } = useOfflineSync(session.id)

  const questionTimerRef = useRef(0)
  const autoSubmitted = useRef(false)

  const currentSq = sq[currentIdx]
  const currentQ = currentSq?.questions

  // Derive current answer state from sq
  const [localAnswer, setLocalAnswer] = useState<string>(currentSq?.answer_given ?? '')

  // Sync localAnswer when navigating
  useEffect(() => {
    setLocalAnswer(sq[currentIdx]?.answer_given ?? '')
  }, [currentIdx, sq])

  // Global countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1 && !autoSubmitted.current) {
          autoSubmitted.current = true
          clearInterval(interval)
          handleSubmit(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Per-question timer
  useEffect(() => {
    questionTimerRef.current = 0
    setQuestionTimer(0)
    const interval = setInterval(() => {
      questionTimerRef.current += 1
      setQuestionTimer(questionTimerRef.current)
    }, 1000)
    return () => clearInterval(interval)
  }, [currentIdx])

  const computeVisitStatus = (answer: string, isMarked: boolean) => {
    const has = answer.trim() !== ''
    if (has && isMarked) return 'answered_marked'
    if (has) return 'answered'
    if (isMarked) return 'marked'
    return 'not_answered'
  }

  const navigateTo = useCallback(async (idx: number, overrides?: { answer?: string; marked?: boolean }) => {
    if (idx === currentIdx || idx < 0 || idx >= sq.length) return

    const cur = sq[currentIdx]
    const answer = overrides && 'answer' in overrides ? overrides.answer! : localAnswer
    const isMarked = overrides && 'marked' in overrides ? overrides.marked! : cur.is_marked_for_review
    const visitStatus = computeVisitStatus(answer, isMarked)
    const timeTaken = cur.time_taken + questionTimerRef.current

    // Optimistic update of the palette for the current question
    setSq(prev => prev.map((q, i) =>
      i === currentIdx
        ? { ...q, answer_given: answer || null, visit_status: visitStatus, time_taken: timeTaken, is_marked_for_review: isMarked }
        : q
    ))

    // Await the local save/queueing to give the user the visual feel of "save/mark first, then move"
    await saveOrQueue({
      sessionQuestionId: cur.id,
      answer: answer || null,
      isMarked,
      timeTaken,
    })

    // Perform the navigation

    setLocalAnswer(sq[idx]?.answer_given ?? '')
    setCurrentIdx(idx)
    questionTimerRef.current = 0
  }, [currentIdx, sq, localAnswer])

  const handleClear = () => {
    setLocalAnswer('')
    const cur = sq[currentIdx]
    
    // Immediately update palette so user sees it change to 'not_answered'
    setSq(prev => prev.map((q, i) =>
      i === currentIdx ? { 
        ...q, 
        is_marked_for_review: false,
        visit_status: 'not_answered',
        answer_given: null
      } : q
    ))

    // Persist the clear immediately
    startTransition(async () => {
      await saveOrQueue({
        sessionQuestionId: cur.id,
        answer: null,
        isMarked: false,
        timeTaken: cur.time_taken + questionTimerRef.current,
      })
    })
  }

  const handleMarkToggle = () => {
    const newMarked = !currentSq.is_marked_for_review
    setSq(prev => prev.map((q, i) =>
      i === currentIdx ? { ...q, is_marked_for_review: newMarked } : q
    ))
  }

  const handleSetMark = (marked: boolean) => {
    setSq(prev => prev.map((q, i) =>
      i === currentIdx ? { ...q, is_marked_for_review: marked } : q
    ))
  }

  const handleSubmit = async (auto = false) => {
    if (!auto) setShowSubmitModal(false)
    setIsSubmitting(true)

    // Save current question first
    const cur = sq[currentIdx]
    const answer = localAnswer
    const isMarked = cur.is_marked_for_review
    const visitStatus = computeVisitStatus(answer, isMarked)
    const timeTaken = cur.time_taken + questionTimerRef.current

    await saveOrQueue({
      sessionQuestionId: cur.id,
      answer: answer || null,
      isMarked,
      timeTaken,
    })

    // Try to flush offline queue before submitting
    const syncSuccess = await attemptSync()
    if (!syncSuccess) {
      alert("You are currently offline. Your answers are saved locally. Please restore your internet connection to submit the test.")
      setIsSubmitting(false)
      return
    }

    const totalTimeTaken = session.time_limit_minutes * 60 - timeLeft
    const res = await submitTest(session.id, totalTimeTaken)

    if (res?.error) {
      setIsSubmitting(false)
      alert('Submit failed: ' + res.error)
      return
    }

    if (session.weekly_exam_id) {
      router.push(`/exams/${session.weekly_exam_id}/result`)
    } else {
      router.push(`/tests/${session.id}/result`)
    }
  }

  const stats = {
    answered: sq.filter(q => q.visit_status === 'answered' || q.visit_status === 'answered_marked').length,
    notAnswered: sq.filter(q => q.visit_status === 'not_answered').length,
    marked: sq.filter(q => q.visit_status === 'marked').length,
    notVisited: sq.filter(q => q.visit_status === 'not_visited').length,
    answeredMarked: sq.filter(q => q.visit_status === 'answered_marked').length,
  }

  const sharedProps = {
    session,
    userName,
    rollNo,
    avatarUrl,
    sq,
    currentIdx,
    currentSq,
    currentQ,
    localAnswer,
    timeLeft,
    questionTimer,
    showSubmitModal,
    isSubmitting,
    stats,
    isOffline,
    pendingCount,
    onNavigate: navigateTo,
    onAnswerChange: setLocalAnswer,
    onClear: handleClear,
    onMarkToggle: handleMarkToggle,
    onSetMark: handleSetMark,
    onShowSubmit: () => setShowSubmitModal(true),
    onHideSubmit: () => setShowSubmitModal(false),
    onSubmit: () => handleSubmit(false),
  }

  return <ExamInterface {...sharedProps} />
}
