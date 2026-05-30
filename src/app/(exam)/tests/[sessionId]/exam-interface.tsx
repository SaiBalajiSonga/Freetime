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
      // Red: slopes down to the right
      return 'bg-[#e53e3e] text-white [clip-path:polygon(0_0,100%_15%,100%_85%,0_100%)]'
    case 'answered':
      // Green: slopes up to the right
      return 'bg-[#38a169] text-white [clip-path:polygon(0_15%,100%_0,100%_100%,0_85%)]'
    case 'marked':
    case 'answered_marked':
      return 'bg-[#805ad5] text-white rounded-full'
    default:
      return isActive 
        ? 'bg-white text-black border-2 border-[#1a6fc4] rounded' 
        : 'bg-[#e2e2e2] text-[#555] border border-[#ccc] rounded'
  }
}

type SharedProps = {
  session: any
  userName: string
  rollNo: string
  avatarUrl: string | null
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
  session, userName, rollNo, avatarUrl, sq, currentIdx, currentSq, currentQ, localAnswer, timeLeft,
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
    <div className="fixed inset-0 z-50 flex flex-col bg-[#eef2f5] text-[#333] select-none" style={{ fontFamily: 'Arial, sans-serif' }}>
      
      {/* TOP HEADER BAR */}
      <div className="flex items-center justify-between px-4 h-14 bg-[#1a4b93] border-b border-[#12366b] flex-shrink-0 shadow-sm z-10">
        
        {/* Left: Candidate Info */}
        <div className="flex items-center gap-3 w-1/3">
          <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-sm uppercase">
                {userName.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="text-[13px] font-bold text-white truncate" title={userName}>
              {userName}
            </span>
            <span className="text-[11px] text-blue-200 truncate" title={rollNo}>Roll No: {rollNo}</span>
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
                className={`px-6 h-full text-[13px] font-bold transition-colors border-b-[3px] ${
                  isActive ? 'bg-[#153e7a] text-white border-white' : 'border-transparent text-blue-200 hover:bg-[#153e7a]/50 hover:text-white'
                }`}
              >
                {sub.name}
              </button>
            )
          })}
        </div>

        {/* Right: Timer */}
        <div className="w-1/3 flex justify-end">
          <div className={`px-4 py-1.5 border flex items-center gap-2 rounded-[4px] shadow-sm ${
            timeCritical ? 'bg-red-500 border-red-600 text-white animate-pulse' : 'bg-white/10 border-white/20 text-white'
          }`}>
            <span className={`text-[11px] font-bold uppercase ${timeCritical ? 'text-white' : 'text-blue-200'}`}>Time Left</span>
            <span className="font-mono text-[15px] font-bold tracking-wider">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT COLUMN: QUESTION AREA */}
        <div className="flex-1 flex flex-col bg-[#eef2f5] transition-all duration-300">
          
          {/* Question Top Bar */}
          <div className="flex items-center justify-between px-5 h-12 border-b border-[#d1d9e6] bg-[#dbe4f0] flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[15px] text-[#222]">Question {qNum}:</span>
              <ArrowDownCircle className="w-5 h-5 text-[#1a4b93] ml-1" />
            </div>
            <div className="flex items-center gap-2 text-[12px] font-bold">
              <span className="text-[#555] mr-1">Marking Scheme:</span>
              <span className="bg-[#28a745]/10 text-[#28a745] px-2 py-0.5 rounded border border-[#28a745]/30">+4</span>
              <span className="text-[#999]">|</span>
              <span className={`px-2 py-0.5 rounded border ${isMcq ? 'bg-[#dc3545]/10 text-[#dc3545] border-[#dc3545]/30' : 'bg-white text-[#555] border-[#ccc]'}`}>
                {isMcq ? '-1' : '0'}
              </span>
            </div>
          </div>

          {/* Scrollable Question Body */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="bg-white p-5 rounded-[4px] text-[15px] leading-relaxed text-[#222] mb-6 border border-[#c5d0e0] shadow-sm">
              <Latex>{currentQ.statement}</Latex>

              {/* Question diagram — only rendered when image_url exists */}
              {currentQ.image_url && (
                <div className="flex justify-center my-6 p-3 rounded-lg border border-[#e1e6ed] bg-[#f8f9fa]">
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
                      className={`w-full flex items-center gap-4 px-4 py-3 border text-left transition-colors rounded-[4px] shadow-sm ${
                        selected
                          ? 'bg-[#eef5fc] border-[#1a4b93]'
                          : 'bg-white border-[#d1d9e6] hover:bg-[#f4f7f9] hover:border-[#b0c4de]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selected ? 'border-[#1a4b93]' : 'border-[#aaa]'
                      }`}>
                        {selected && <div className="w-2.5 h-2.5 rounded-full bg-[#1a4b93]" />}
                      </div>
                      <span className={`font-bold text-[14px] shrink-0 ${selected ? 'text-[#1a4b93]' : 'text-[#666]'}`}>
                        ({letter})
                      </span>
                      <span className={`text-[14px] ${selected ? 'text-[#111]' : 'text-[#333]'}`}>
                        <Latex>{opt.text}</Latex>
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="mt-4 bg-white p-5 border border-[#d1d9e6] rounded-[4px] shadow-sm inline-block">
                <input
                  type="text"
                  inputMode="decimal"
                  value={localAnswer}
                  onChange={e => {
                    const val = e.target.value;
                    if (/^-?\d*\.?\d*$/.test(val)) {
                      onAnswerChange(val);
                    }
                  }}
                  placeholder="Enter value"
                  className="w-48 px-3 py-2 bg-white border border-[#ccc] rounded-[4px] text-[#333] text-sm focus:outline-none focus:border-[#1a4b93] focus:ring-1 focus:ring-[#1a4b93]"
                />
                
                {/* Virtual Keypad (Visual only for real keyboard support) */}
                <div className="mt-4 grid grid-cols-3 gap-2 w-48">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map(btn => (
                    <button
                      key={btn}
                      onClick={() => {
                        const val = localAnswer + btn;
                        if (/^-?\d*\.?\d*$/.test(val)) {
                          onAnswerChange(val);
                        }
                      }}
                      className="h-10 bg-[#f4f7f9] border border-[#d1d9e6] rounded-[4px] hover:bg-[#eef2f5] font-bold text-[#444] transition-colors shadow-sm"
                    >
                      {btn}
                    </button>
                  ))}
                  <button
                    onClick={() => onAnswerChange(localAnswer.slice(0, -1))}
                    className="h-10 bg-[#f4f7f9] border border-[#d1d9e6] rounded-[4px] hover:bg-[#eef2f5] flex items-center justify-center transition-colors shadow-sm"
                  >
                    <Delete className="w-4 h-4 text-[#666]" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Row — two rows: primary buttons on top, nav on bottom */}
          <div className="px-5 py-3 border-t border-[#c5d0e0] bg-[#dbe4f0] flex-shrink-0 space-y-2">
            {/* Row 1: Save & Next + Clear + Mark buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onClear}
                disabled={localAnswer.trim() === ''}
                className={`px-4 py-2 font-bold text-[13px] rounded-[4px] border transition-colors uppercase whitespace-nowrap shadow-sm ${
                  localAnswer.trim() !== ''
                    ? 'bg-white text-[#222] border-[#999] hover:bg-[#e9ecef]'
                    : 'bg-[#f4f7f9] text-[#999] border-[#d1d9e6] cursor-not-allowed'
                }`}
              >
                Clear Response
              </button>
              <button
                onClick={handleMarkAndNext}
                className="px-4 py-2 bg-[#6f42c1] text-white font-bold text-[13px] rounded-[4px] hover:bg-[#5a32a3] transition-colors uppercase border border-[#5a32a3] whitespace-nowrap shadow-sm"
              >
                Mark for Review &amp; Next
              </button>
              <button
                onClick={handleSaveMarkAndNext}
                className="px-4 py-2 bg-[#fd7e14] text-white font-bold text-[13px] rounded-[4px] hover:bg-[#e36c0a] transition-colors uppercase border border-[#e36c0a] whitespace-nowrap shadow-sm"
              >
                Save &amp; Mark for Review
              </button>
              <button
                onClick={handleSaveAndNext}
                className={`ml-auto py-2 min-w-[130px] px-4 font-bold text-[13px] rounded-[4px] transition-colors uppercase border whitespace-nowrap text-center shadow-sm ${
                  localAnswer.trim() !== ''
                    ? 'bg-[#28a745] text-white hover:bg-[#218838] border-[#218838]'
                    : 'bg-white text-[#222] hover:bg-[#e9ecef] border-[#999]'
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
                className="px-6 py-1.5 bg-white text-[#222] font-bold text-[13px] rounded-[4px] border border-[#999] hover:bg-[#e9ecef] disabled:opacity-50 transition-colors uppercase shadow-sm"
              >
                Back
              </button>
            </div>
          </div>
        </div>

        {/* SIDEBAR TOGGLE */}
        <div 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-5 bg-[#dbe4f0] border-x border-[#c5d0e0] cursor-pointer flex items-center justify-center hover:bg-[#c5d0e0] transition-colors z-10 shadow-sm"
        >
          {sidebarOpen ? <ChevronRight className="w-4 h-4 text-[#555]" /> : <ChevronLeft className="w-4 h-4 text-[#555]" />}
        </div>

        {/* RIGHT COLUMN: QUESTION PALETTE SIDEBAR */}
        <div 
          className={`bg-[#eef2f5] flex flex-col overflow-hidden transition-all duration-300 shrink-0 ${
            sidebarOpen ? 'w-[320px]' : 'w-0'
          }`}
        >
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            
            {/* Legend Box */}
            <div className="border border-[#c5d0e0] p-3 rounded-[4px] bg-white shadow-sm">
              <div className="grid grid-cols-2 gap-y-2.5 gap-x-1">
                <div className="flex items-center gap-2">
                  <div className={`w-[26px] h-[26px] text-[11px] font-bold flex items-center justify-center shrink-0 ${getShapeClasses('not_visited')}`}>
                    {stats.notVisited}
                  </div>
                  <span className="text-[11px] text-[#444] leading-tight">Not Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-[26px] h-[26px] text-[11px] font-bold flex items-center justify-center shrink-0 ${getShapeClasses('not_answered')}`}>
                    {stats.notAnswered}
                  </div>
                  <span className="text-[11px] text-[#444] leading-tight">Not Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-[26px] h-[26px] text-[11px] font-bold flex items-center justify-center shrink-0 ${getShapeClasses('answered')}`}>
                    <span className="mr-0.5">{stats.answered}</span>
                  </div>
                  <span className="text-[11px] text-[#444] leading-tight">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-[26px] h-[26px] text-[11px] font-bold flex items-center justify-center shrink-0 ${getShapeClasses('marked')}`}>
                    {stats.marked}
                  </div>
                  <span className="text-[11px] text-[#444] leading-tight">Marked for Review</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-[#e1e6ed]">
                <div className={`w-[26px] h-[26px] text-[11px] font-bold flex items-center justify-center shrink-0 relative ${getShapeClasses('answered_marked')}`}>
                  {stats.answeredMarked}
                  <div className="absolute w-2 h-2 rounded-full bg-[#38a169] -bottom-[1px] -right-[1px] border border-white" />
                </div>
                <span className="text-[11px] text-[#666] leading-tight w-[200px]">
                  Answered &amp; Marked for Review (will be considered for evaluation)
                </span>
              </div>
            </div>

            {/* Grid Box */}
            <div className="border border-[#c5d0e0] p-3 rounded-[4px] bg-white flex-1 shadow-sm">
              <div className="font-bold text-[13px] text-[#222] mb-3">{activeSubjectName}</div>
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
                    >
                      <span className={s.visit_status === 'answered' ? 'mr-0.5' : ''}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      {s.visit_status === 'answered_marked' && (
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-[#38a169] -bottom-[1px] -right-[1px] border border-white" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="p-3 bg-[#dbe4f0] border-t border-[#c5d0e0]">
            <button
              onClick={onShowSubmit}
              className="w-full py-3 bg-[#1a4b93] hover:bg-[#12366b] text-white font-bold text-[15px] rounded-[4px] transition-colors shadow-sm"
            >
              Submit
            </button>
          </div>
        </div>
      </div>

      {/* FULLSCREEN ALERT MODAL */}
      {isFullscreenAlert && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white border border-slate-200 rounded-[8px] shadow-2xl w-full max-w-md mx-4 p-8 text-center space-y-6">
            <div className="size-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-2">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-bold text-[22px] text-slate-900">Fullscreen Exited</h3>
            <p className="text-[15px] text-slate-600">
              You must remain in fullscreen mode while taking the exam. Please click the button below to resume your test.
            </p>
            <button
              onClick={resumeFullscreen}
              className="w-full py-3.5 rounded-[4px] font-bold text-[15px] bg-[#1a6fc4] text-white hover:bg-[#155ba0] transition-colors shadow-sm"
            >
              Resume Exam
            </button>
          </div>
        </div>
      )}

      {/* SUBMIT MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-[8px] shadow-2xl w-full max-w-sm mx-4 p-6 space-y-5">
            <h3 className="font-bold text-[18px] text-slate-900 border-b border-slate-200 pb-3">Confirm Submission</h3>
            
            <div className="space-y-3 text-[14px]">
              <div className="flex justify-between text-slate-700">
                <span>Answered</span>
                <span className="font-bold text-[#28a745]">{stats.answered}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Not Answered</span>
                <span className="font-bold text-[#dc3545]">{stats.notAnswered}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Marked for Review</span>
                <span className="font-bold text-[#6f42c1]">{stats.marked}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Not Visited</span>
                <span className="font-bold text-slate-500">{stats.notVisited}</span>
              </div>
            </div>

            <p className="text-[12px] text-[#dc3545] pt-2">This action cannot be undone. You will not be able to change your answers.</p>

            <div className="flex gap-3 pt-3">
              <button
                onClick={onHideSubmit}
                className="flex-1 py-2.5 rounded-[4px] border border-slate-300 text-[14px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
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
