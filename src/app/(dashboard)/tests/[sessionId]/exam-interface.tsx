'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Latex from '@/components/ui/latex'
import type { SessionQuestion } from './test-client'
import { ChevronRight, ChevronLeft, ArrowDownCircle, Delete } from 'lucide-react'

function formatTime(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function getShapeClasses(status: string, isActive = false) {
  switch (status) {
    case 'not_visited':
      return isActive 
        ? 'bg-white text-black border-2 border-[#1a6fc4] rounded' 
        : 'bg-[#e2e2e2] text-[#555] border border-[#ccc] rounded'
    case 'not_answered':
      return isActive 
        ? 'bg-[#ff6b6b] text-white [clip-path:polygon(0_0,100%_15%,100%_85%,0_100%)]' 
        : 'bg-[#e53e3e] text-white [clip-path:polygon(0_0,100%_15%,100%_85%,0_100%)]'
    case 'answered':
      return isActive 
        ? 'bg-[#48c774] text-white [clip-path:polygon(0_0,100%_15%,100%_85%,0_100%)]' 
        : 'bg-[#38a169] text-white [clip-path:polygon(0_0,100%_15%,100%_85%,0_100%)]'
    case 'marked':
    case 'answered_marked':
      return isActive 
        ? 'bg-[#9f7aea] text-white rounded-full' 
        : 'bg-[#805ad5] text-white rounded-full'
    default:
      return isActive 
        ? 'bg-white text-black border border-[#ccc] rounded' 
        : 'bg-[#e2e2e2] text-[#555] border border-[#ccc] rounded'
  }
}

type SharedProps = {
  session: any
  sq: SessionQuestion[]
  currentIdx: number
  currentSq: SessionQuestion
  currentQ: SessionQuestion['questions']
  localAnswer: string
  timeLeft: number
  showSubmitModal: boolean
  isSubmitting: boolean
  stats: { answered: number; notAnswered: number; marked: number; notVisited: number; answeredMarked: number }
  onNavigate: (idx: number, overrides?: { answer?: string; marked?: boolean }) => void
  onAnswerChange: (a: string) => void
  onClear: () => void
  onMarkToggle: () => void
  onSetMark?: (m: boolean) => void
  onShowSubmit: () => void
  onHideSubmit: () => void
  onSubmit: () => void
}

function groupBySubject(sq: SessionQuestion[]) {
  const groups: Record<string, { name: string; items: { sq: SessionQuestion; globalIdx: number }[] }> = {}
  sq.forEach((s, i) => {
    const name = s.questions.chapters.subjects.name
    if (!groups[name]) groups[name] = { name, items: [] }
    groups[name].items.push({ sq: s, globalIdx: i })
  })
  return Object.values(groups)
}

export default function ExamInterface({
  session, sq, currentIdx, currentSq, currentQ, localAnswer, timeLeft,
  showSubmitModal, isSubmitting, stats,
  onNavigate, onAnswerChange, onClear, onSetMark, onShowSubmit, onHideSubmit, onSubmit,
}: SharedProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isFullscreenAlert, setIsFullscreenAlert] = useState(false)

  const subjects = groupBySubject(sq)
  const activeSubjectName = currentSq.questions.chapters.subjects.name
  
  // Find questions belonging to current subject for the palette
  const activeSubjectGroup = subjects.find(s => s.name === activeSubjectName)!
  
  // Find local index within the subject for display "Question {N}"
  const localIndex = activeSubjectGroup.items.findIndex(item => item.globalIdx === currentIdx)
  const qNum = localIndex + 1

  const isMcq = currentQ.type === 'mcq'
  const timeCritical = timeLeft < 300

  useEffect(() => {
    const elem = document.documentElement

    // ── Strict Initial Fullscreen Enforcement ──
    const enforceFullscreen = async () => {
      if (!document.fullscreenElement && elem.requestFullscreen) {
        try {
          await elem.requestFullscreen()
        } catch {
          // If browser blocks auto-fullscreen (e.g. hard refresh), immediately show the lock screen
          setIsFullscreenAlert(true)
        }
      } else if (!document.fullscreenElement) {
        setIsFullscreenAlert(true)
      }
    }
    enforceFullscreen()

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    // ── Proctoring Event Handlers ──
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreenAlert(true)
      }
    }
    const handleContextMenu = (e: MouseEvent) => e.preventDefault()
    const handleCopy = (e: ClipboardEvent) => e.preventDefault()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        try { navigator.clipboard.writeText('').catch(() => {}) } catch {}
        e.preventDefault()
      }
      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase()
        if (k === 'c' || k === 'v' || k === 'p' || k === 's' || k === 'x') {
          e.preventDefault()
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('copy', handleCopy)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const resumeFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreenAlert(false))
        .catch(() => setIsFullscreenAlert(false))
    } else {
      setIsFullscreenAlert(false)
    }
  }

  // Save & Next: saves answer, clears mark
  const handleSaveAndNext = () => {
    const nextIdx = (currentIdx + 1) % sq.length
    onNavigate(nextIdx, { answer: localAnswer, marked: false })
  }

  // Mark for Review & Next: discards answer, marks only → status = 'marked' (purple)
  const handleMarkAndNext = () => {
    const nextIdx = (currentIdx + 1) % sq.length
    onNavigate(nextIdx, { answer: '', marked: true })
  }

  // Save & Mark for Review: saves answer + marks → status = 'answered_marked' (purple+green dot)
  const handleSaveMarkAndNext = () => {
    const nextIdx = (currentIdx + 1) % sq.length
    onNavigate(nextIdx, { answer: localAnswer, marked: true })
  }

  const handleBack = () => {
    if (currentIdx > 0) onNavigate(currentIdx - 1)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1a1a1a] text-[#e0e0e0] select-none" style={{ fontFamily: 'system-ui, Arial, sans-serif' }}>
      
      {/* TOP HEADER BAR */}
      <div className="flex items-center justify-between px-4 h-14 bg-[#1c2333] border-b border-[#333] flex-shrink-0">
        
        {/* Left: Candidate Info */}
        <div className="flex items-center gap-3 w-1/3">
          <div className="w-9 h-9 rounded-full bg-[#444] border border-[#555] flex items-center justify-center overflow-hidden shrink-0">
            <svg className="w-5 h-5 text-gray-300 mt-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-bold text-white">Candidate Name</span>
            <span className="text-[11px] text-gray-400">Roll No: 123456789</span>
          </div>
        </div>

        {/* Center: Section Tabs */}
        <div className="flex-1 flex justify-center h-full">
          {subjects.map(sub => {
            const isActive = sub.name === activeSubjectName
            return (
              <button
                key={sub.name}
                onClick={() => onNavigate(sub.items[0].globalIdx)}
                className={`px-6 h-full text-[13px] font-bold transition-colors ${
                  isActive ? 'bg-[#1a6fc4] text-white' : 'text-[#a0a0a0] hover:bg-[#252f44] hover:text-white'
                }`}
              >
                {sub.name}
              </button>
            )
          })}
        </div>

        {/* Right: Timer */}
        <div className="w-1/3 flex justify-end">
          <div className={`px-4 py-1.5 border flex items-center gap-2 rounded-[4px] bg-[#1a1a1a] ${
            timeCritical ? 'border-red-500 text-red-400 animate-pulse' : 'border-[#444] text-white'
          }`}>
            <span className="text-[11px] font-bold uppercase text-gray-400">Time Left</span>
            <span className="font-mono text-[15px] font-bold tracking-wider">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT COLUMN: QUESTION AREA */}
        <div className="flex-1 flex flex-col bg-[#1a1a1a] transition-all duration-300">
          
          {/* Question Top Bar */}
          <div className="flex items-center justify-between px-5 h-12 border-b border-[#333] bg-[#242424] flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[15px] text-white">Question {qNum}:</span>
              <ArrowDownCircle className="w-5 h-5 text-[#1a6fc4] ml-1" />
            </div>
            <div className="flex items-center gap-2 text-[12px] font-bold">
              <span className="text-gray-400 mr-1">Marking Scheme:</span>
              <span className="bg-[#28a745]/20 text-[#28a745] px-2 py-0.5 rounded border border-[#28a745]/30">+4</span>
              <span className="text-[#666]">|</span>
              <span className={`px-2 py-0.5 rounded border ${isMcq ? 'bg-[#dc3545]/20 text-[#dc3545] border-[#dc3545]/30' : 'bg-gray-700 text-gray-300 border-gray-600'}`}>
                {isMcq ? '-1' : '0'}
              </span>
            </div>
          </div>

          {/* Scrollable Question Body */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="bg-[#2a2a2a] p-5 rounded-[4px] text-[15px] leading-relaxed text-[#e0e0e0] mb-6">
              <Latex>{currentQ.statement}</Latex>

              {/* Question diagram — only rendered when image_url exists */}
              {currentQ.image_url && (
                <div className="flex justify-center my-6 bg-[#2a2a2a] p-3 rounded-lg border border-gray-700">
                  <Image
                    src={currentQ.image_url}
                    alt="Question diagram"
                    width={700}
                    height={300}
                    className="max-h-[300px] w-auto object-contain rounded"
                    unoptimized
                  />
                </div>
              )}
            </div>

            {isMcq ? (
              <div className="space-y-2">
                {currentSq.options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i)
                  const selected = localAnswer === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => onAnswerChange(opt.id)}
                      className={`w-full flex items-center gap-4 px-4 py-3 border text-left transition-colors rounded-[4px] ${
                        selected
                          ? 'bg-[#1a6fc4]/10 border-[#1a6fc4]'
                          : 'bg-[#242424] border-[#333] hover:bg-[#333]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selected ? 'border-[#1a6fc4]' : 'border-[#666]'
                      }`}>
                        {selected && <div className="w-2.5 h-2.5 rounded-full bg-[#1a6fc4]" />}
                      </div>
                      <span className={`font-bold text-[14px] shrink-0 ${selected ? 'text-[#1a6fc4]' : 'text-gray-400'}`}>
                        ({letter})
                      </span>
                      <span className="text-[14px] text-[#e0e0e0]">
                        <Latex>{opt.text}</Latex>
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="mt-4">
                <input
                  type="number"
                  value={localAnswer}
                  onChange={e => onAnswerChange(e.target.value)}
                  placeholder="Enter value"
                  className="w-48 px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded-[4px] text-white text-sm focus:outline-none focus:border-[#1a6fc4]"
                />
                
                {/* Virtual Keypad (Visual only for real keyboard support) */}
                <div className="mt-4 grid grid-cols-3 gap-2 w-48">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map(btn => (
                    <button
                      key={btn}
                      onClick={() => onAnswerChange(localAnswer + btn)}
                      className="h-10 bg-[#333] border border-[#444] rounded-[4px] hover:bg-[#444] font-bold text-[#e0e0e0] transition-colors"
                    >
                      {btn}
                    </button>
                  ))}
                  <button
                    onClick={() => onAnswerChange(localAnswer.slice(0, -1))}
                    className="h-10 bg-[#333] border border-[#444] rounded-[4px] hover:bg-[#444] flex items-center justify-center transition-colors"
                  >
                    <Delete className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Row — two rows: primary buttons on top, nav on bottom */}
          <div className="px-5 py-3 border-t border-[#333] bg-[#242424] flex-shrink-0 space-y-2">
            {/* Row 1: Save & Next + Clear + Mark buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onClear}
                className="px-4 py-2 bg-transparent text-white font-bold text-[12px] rounded-[4px] border border-[#666] hover:bg-[#333] transition-colors uppercase whitespace-nowrap"
              >
                Clear Response
              </button>
              <button
                onClick={handleMarkAndNext}
                className="px-4 py-2 bg-[#6f42c1] text-white font-bold text-[12px] rounded-[4px] hover:bg-[#5a32a3] transition-colors uppercase border border-[#5a32a3] whitespace-nowrap"
              >
                Mark for Review &amp; Next
              </button>
              <button
                onClick={handleSaveMarkAndNext}
                className="px-4 py-2 bg-[#fd7e14] text-white font-bold text-[12px] rounded-[4px] hover:bg-[#e36c0a] transition-colors uppercase border border-[#e36c0a] whitespace-nowrap"
              >
                Save &amp; Mark for Review
              </button>
              <button
                onClick={handleSaveAndNext}
                className={`ml-auto py-2 min-w-[130px] px-4 text-white font-bold text-[12px] rounded-[4px] transition-colors uppercase border whitespace-nowrap text-center ${
                  localAnswer.trim() !== ''
                    ? 'bg-[#28a745] hover:bg-[#218838] border-[#218838]'
                    : 'bg-[#555] hover:bg-[#666] border-[#555]'
                }`}
              >
                {localAnswer.trim() !== '' ? 'Save & Next' : 'Next'}
              </button>
            </div>
            {/* Row 2: Back */}
            <div className="flex items-center">
              <button
                onClick={handleBack}
                disabled={currentIdx === 0}
                className="px-6 py-1.5 bg-[#333] text-white font-bold text-[12px] rounded-[4px] border border-[#444] hover:bg-[#444] disabled:opacity-50 transition-colors uppercase"
              >
                &lt;&lt; Back
              </button>
            </div>
          </div>
        </div>

        {/* SIDEBAR TOGGLE */}
        <div 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-5 bg-[#2a2a2a] border-l border-[#333] cursor-pointer flex items-center justify-center hover:bg-[#333] transition-colors z-10"
        >
          {sidebarOpen ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronLeft className="w-4 h-4 text-gray-400" />}
        </div>

        {/* RIGHT COLUMN: QUESTION PALETTE SIDEBAR */}
        <div 
          className={`bg-[#242424] border-l border-[#333] flex flex-col overflow-hidden transition-all duration-300 shrink-0 ${
            sidebarOpen ? 'w-[320px]' : 'w-0 border-l-0'
          }`}
        >
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            
            {/* Legend Box */}
            <div className="border border-dashed border-[#555] p-3 rounded-[4px] bg-[#1f1f1f]">
              <div className="grid grid-cols-2 gap-y-2.5 gap-x-1">
                <div className="flex items-center gap-2">
                  <div className={`w-[26px] h-[26px] text-[11px] font-bold flex items-center justify-center shrink-0 ${getShapeClasses('not_visited')}`}>
                    {stats.notVisited}
                  </div>
                  <span className="text-[11px] text-gray-300 leading-tight">Not Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-[26px] h-[26px] text-[11px] font-bold flex items-center justify-center shrink-0 ${getShapeClasses('not_answered')}`}>
                    {stats.notAnswered}
                  </div>
                  <span className="text-[11px] text-gray-300 leading-tight">Not Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-[26px] h-[26px] text-[11px] font-bold flex items-center justify-center shrink-0 ${getShapeClasses('answered')}`}>
                    <span className="mr-0.5">{stats.answered}</span>
                  </div>
                  <span className="text-[11px] text-gray-300 leading-tight">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-[26px] h-[26px] text-[11px] font-bold flex items-center justify-center shrink-0 ${getShapeClasses('marked')}`}>
                    {stats.marked}
                  </div>
                  <span className="text-[11px] text-gray-300 leading-tight">Marked for Review</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-dashed border-[#555]">
                <div className={`w-[26px] h-[26px] text-[11px] font-bold flex items-center justify-center shrink-0 relative ${getShapeClasses('answered_marked')}`}>
                  {stats.answeredMarked}
                  <div className="absolute w-2 h-2 rounded-full bg-[#38a169] -bottom-[1px] -right-[1px] border border-[#242424]" />
                </div>
                <span className="text-[11px] text-gray-300 leading-tight w-[200px]">
                  Answered &amp; Marked for Review (will be considered for evaluation)
                </span>
              </div>
            </div>

            {/* Grid Box */}
            <div className="border border-dashed border-[#555] p-3 rounded-[4px] bg-[#1f1f1f] flex-1">
              <div className="font-bold text-[13px] text-white mb-3">{activeSubjectName}</div>
              <div className="grid grid-cols-5 gap-2">
                {activeSubjectGroup.items.map((item, idx) => {
                  const s = item.sq
                  const i = item.globalIdx
                  const isActive = i === currentIdx
                  const styleClasses = getShapeClasses(s.visit_status, isActive)

                  return (
                    <button
                      key={s.id}
                      onClick={() => onNavigate(i)}
                      title={`Question ${idx + 1}`}
                      className={`w-[42px] h-[36px] text-[13px] font-bold transition-all duration-200 flex items-center justify-center relative ${styleClasses} ${isActive ? 'z-10' : 'z-1 hover:brightness-110 hover:-translate-y-0.5'}`}
                      style={{
                        filter: isActive ? 'drop-shadow(1px 0 0 #000) drop-shadow(-1px 0 0 #000) drop-shadow(0 1px 0 #000) drop-shadow(0 -1px 0 #000)' : 'none'
                      }}
                    >
                      <span className={s.visit_status === 'answered' ? 'mr-0.5' : ''}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      {s.visit_status === 'answered_marked' && (
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-[#38a169] -bottom-[1px] -right-[1px] border border-[#242424]" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="p-3 bg-[#242424] border-t border-[#333]">
            <button
              onClick={onShowSubmit}
              className="w-full py-3 bg-[#1a6fc4] hover:bg-[#155ba0] text-white font-bold text-[15px] rounded-[4px] transition-colors"
            >
              Submit
            </button>
          </div>
        </div>
      </div>

      {/* FULLSCREEN ALERT MODAL */}
      {isFullscreenAlert && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md">
          <div className="bg-[#242424] border border-red-500/30 rounded-[8px] shadow-2xl w-full max-w-md mx-4 p-8 text-center space-y-6">
            <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-2">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-bold text-[22px] text-white">Fullscreen Exited</h3>
            <p className="text-[15px] text-gray-300">
              You must remain in fullscreen mode while taking the exam. Please click the button below to resume your test.
            </p>
            <button
              onClick={resumeFullscreen}
              className="w-full py-3.5 rounded-[4px] font-bold text-[15px] bg-[#1a6fc4] text-white hover:bg-[#155ba0] transition-colors shadow-lg"
            >
              Resume Exam
            </button>
          </div>
        </div>
      )}

      {/* SUBMIT MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#242424] border border-[#444] rounded-[8px] shadow-2xl w-full max-w-sm mx-4 p-6 space-y-5">
            <h3 className="font-bold text-[18px] text-white border-b border-[#444] pb-3">Confirm Submission</h3>
            
            <div className="space-y-3 text-[14px]">
              <div className="flex justify-between text-gray-300">
                <span>Answered</span>
                <span className="font-bold text-[#28a745]">{stats.answered}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Not Answered</span>
                <span className="font-bold text-[#dc3545]">{stats.notAnswered}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Marked for Review</span>
                <span className="font-bold text-[#6f42c1]">{stats.marked}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Not Visited</span>
                <span className="font-bold text-gray-500">{stats.notVisited}</span>
              </div>
            </div>

            <p className="text-[12px] text-[#dc3545] pt-2">This action cannot be undone. You will not be able to change your answers.</p>

            <div className="flex gap-3 pt-3">
              <button
                onClick={onHideSubmit}
                className="flex-1 py-2.5 rounded-[4px] border border-[#666] text-[14px] font-bold text-white hover:bg-[#333] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-[4px] font-bold text-[14px] bg-[#1a6fc4] text-white hover:bg-[#155ba0] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
