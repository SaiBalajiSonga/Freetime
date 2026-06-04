'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ClipboardList, GraduationCap, Calendar, CheckCircle2, XCircle, MinusCircle, Clock, ChevronRight, PlayCircle, Plus } from 'lucide-react'
import { ResumeTestLink } from './resume-test-link'
import type { TestSessionItem, SetupData } from './page'
import { Modal } from '@/components/ui/modal'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import CustomTestModalContent from './custom-test-modal'
import JeeMockModalContent from './jee-mock-modal'

type Tab = 'active' | 'attempted' | 'missed'

const TABS: { key: Tab; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'attempted', label: 'Attempted' },
  { key: 'missed', label: 'Missed' },
]

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function getExpiresString(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  if (d > 0) return `Expires in ${d}d ${h}h`
  if (h > 0) return `Expires in ${h}h`
  return `Expires soon`
}

export default function TestsClient({ sessions, setupData }: { sessions: TestSessionItem[], setupData?: SetupData }) {
  const [activeTab, setActiveTab] = useState<Tab>('active')
  const [activeModal, setActiveModal] = useState<'none' | 'custom' | 'jee'>('none')

  const counts: Record<Tab, number> = {
    active:   sessions.filter(s => s.status === 'active').length,
    attempted:sessions.filter(s => s.status === 'attempted').length,
    missed:   sessions.filter(s => s.status === 'missed').length,
  }

  const { filtered, sessionIndexes } = useMemo(() => {
    // Sort oldest first to calculate sequential index
    const sortedByOldest = [...sessions].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    
    const modeCounters: Record<string, number> = {}
    const sessionNumbers: Record<string, number> = {}
    
    sortedByOldest.forEach(s => {
      const mode = s.mode || 'custom'
      if (!modeCounters[mode]) modeCounters[mode] = 0
      modeCounters[mode]++
      sessionNumbers[s.id] = modeCounters[mode]
    })

    const filteredList = sessions.filter(s => s.status === activeTab)

    return { filtered: filteredList, sessionIndexes: sessionNumbers }
  }, [sessions, activeTab])

  return (
    <div className="space-y-0 animate-in-up">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Practice Tests</h1>
          <p className="text-sm text-muted mt-0.5">Start a custom test or a full JEE Mains mock exam.</p>
        </div>
        
        {/* Create Test Buttons */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-center px-4 py-2.5 rounded-md font-semibold text-sm text-white bg-[var(--color-primary)] border-none outline-none focus:ring-0 transition-all hover:opacity-90 shadow-sm gap-2">
                <Plus className="h-4 w-4" />
                <span>New Mock Test</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 border border-slate-200 shadow-xl rounded-md p-1.5 bg-white ring-0">
              <DropdownMenuItem onClick={() => setActiveModal('custom')} className="cursor-pointer p-3 rounded-sm transition-colors hover:bg-slate-100 focus:bg-slate-100 outline-none flex items-start gap-3">
                <div className="p-2 bg-cyan-50 rounded-md shrink-0">
                  <ClipboardList className="h-5 w-5 text-cyan-600" />
                </div>
                <div className="flex flex-col mt-0.5">
                  <span className="font-semibold text-sm text-slate-900">Custom Model</span>
                  <span className="text-xs text-slate-500 mt-0.5">Select chapters and topics</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveModal('jee')} className="cursor-pointer p-3 rounded-sm transition-colors hover:bg-slate-100 focus:bg-slate-100 outline-none flex items-start gap-3 mt-1">
                <div className="p-2 bg-amber-50 rounded-md shrink-0">
                  <GraduationCap className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex flex-col mt-0.5">
                  <span className="font-semibold text-sm text-slate-900">JEE Model</span>
                  <span className="text-xs text-slate-500 mt-0.5">Official NTA pattern simulator</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-[var(--color-border)] mb-6">
        <div className="flex gap-0">
          {TABS.map(tab => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-5 py-3 text-sm font-semibold transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-[var(--color-primary)]'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {tab.label}
                {counts[tab.key] > 0 && (
                  <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'bg-slate-100 text-muted'
                  }`}>
                    {counts[tab.key]}
                  </span>
                )}
                {/* Active underline */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[var(--color-primary)] rounded-t-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white py-16 text-center">
          <div className="size-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="h-7 w-7 text-slate-300" />
          </div>
          <p className="font-bold text-foreground mb-1">
            {activeTab === 'active' && 'No active tests'}
            {activeTab === 'attempted' && "You haven't completed any tests yet"}
            {activeTab === 'missed' && "You haven't missed any tests"}
          </p>
          <p className="text-sm text-muted">Check back later or switch tabs.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((session: TestSessionItem) => (
            <TestSessionCard key={session.id} session={session} index={sessionIndexes[session.id]} />
          ))}
        </div>
      )}

      {/* Modals */}
      {setupData && (
        <>
          <Modal 
            isOpen={activeModal === 'custom'} 
            onClose={() => setActiveModal('none')} 
            title="Custom Model"
            maxWidth="max-w-2xl"
          >
            <CustomTestModalContent subjects={setupData.subjects} chapters={setupData.chapters} />
          </Modal>

          <Modal 
            isOpen={activeModal === 'jee'} 
            onClose={() => setActiveModal('none')} 
            title="JEE Model"
            maxWidth="max-w-xl"
          >
            <JeeMockModalContent jeeAvail={setupData.jeeAvail} />
          </Modal>
        </>
      )}
    </div>
  )
}

// ── Test Session Card ────────────────────────────────────────────────────────
function TestSessionCard({ session, index }: { session: TestSessionItem, index?: number }) {
  const isCustom = session.mode === 'custom'
  const isJee = session.mode === 'jee_mains'
  const isWeekly = session.mode === 'weekly_exam'

  const shortId = session.id.split('-')[0].substring(0, 4).toUpperCase()
  
  const defaultTitle = isJee 
    ? `JEE Model ${index || `#${shortId}`}` 
    : isWeekly 
      ? (session.config?.exam_title || `Weekly Exam ${index || `#${shortId}`}`) 
      : `Custom Practice ${index || `#${shortId}`}`
      
  const title = session.config?.test_name || defaultTitle

  const subjects = (session.config as any)?.subjects
  const subjectTags = subjects && Array.isArray(subjects) 
    ? subjects.map((s: any) => (s.subject_name || '').substring(0, 4).toUpperCase()).filter(Boolean).join(' • ') 
    : null
  
  const badgeCls = session.status === 'active' ? 'bg-[#00B4D8] text-white' : session.status === 'attempted' ? 'bg-gray-500 text-white' : 'bg-red-500 text-white'
  const badgeLabel = session.status === 'active' ? 'UPCOMING' : session.status === 'attempted' ? 'COMPLETED' : 'MISSED'

  const iconBg = isJee ? 'bg-[#FF9E80]' : isWeekly ? 'bg-[#B09EFF]' : 'bg-[#B09EFF]'
  const Icon = isJee ? GraduationCap : isWeekly ? Calendar : ClipboardList
  
  const pct = session.max_score ? Math.round(((session.score || 0) / session.max_score) * 100) : null

  let totalMcq = 0
  let totalNum = 0
  let timeLimit = session.config?.time_limit_minutes || 0

  if (subjects && Array.isArray(subjects)) {
    subjects.forEach((s: any) => {
      totalMcq += (s.mcq_count || 0)
      totalNum += (s.numerical_count || 0)
    })
  }

  // Fallback for JEE or generic mock tests
  if (totalMcq === 0 && totalNum === 0) {
    totalMcq = isJee ? 60 : 20
    totalNum = isJee ? 30 : 5
    if (!timeLimit) timeLimit = isJee ? 180 : 60
  }
  
  const totalQs = totalMcq + totalNum
  const estimatedMaxMarks = totalQs * 4

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group transition-all hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.1)] hover:border-slate-300/80">
      <div className="p-4 sm:p-5 flex flex-col gap-4">
        
        {/* Top Header: Icon + Title + Badge */}
        <div className="flex items-start justify-between gap-4">
          
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div className={`size-16 rounded-lg ${iconBg} flex items-center justify-center shadow-sm`}>
                <Icon className="h-7 w-7 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <h3 className="font-bold text-slate-800 text-[16px] leading-tight mb-1.5 truncate">{title}</h3>
              <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 text-[12px] text-slate-500">
                <span className="font-medium text-slate-600">{totalQs} Qs</span>
                <span className="text-slate-300">•</span>
                <span className="font-medium text-slate-600">{timeLimit} Mins</span>
                <span className="text-slate-300">•</span>
                <span className="font-medium text-slate-600">{estimatedMaxMarks} Marks</span>
                {subjectTags && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="tracking-wide text-[10px] uppercase font-bold text-slate-400">{subjectTags}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <span className={`flex-shrink-0 text-[11px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-sm leading-none ${badgeCls}`}>
            {badgeLabel}
          </span>
        </div>

        {/* Date Boxes / Score section */}
        {session.status === 'attempted' ? (
          <div className="flex gap-3 max-w-[500px]">
            <div className="flex-1 bg-slate-50/50 rounded-lg border border-slate-100 flex flex-col overflow-hidden">
              <span className="text-[10px] text-center text-slate-500 py-1.5 bg-slate-50 border-b border-slate-100">Score</span>
              <span className="text-[13px] text-center text-slate-800 font-bold py-2">{session.score} / {session.max_score}</span>
            </div>
            <div className="flex-1 bg-green-50/50 rounded-lg border border-green-100 flex flex-col overflow-hidden">
              <span className="text-[10px] text-center text-green-600 py-1.5 bg-green-50 border-b border-green-100">Correct</span>
              <span className="text-[13px] text-center text-green-700 font-bold py-2">{session.correct ?? 0}</span>
            </div>
            <div className="flex-1 bg-red-50/50 rounded-lg border border-red-100 flex flex-col overflow-hidden">
              <span className="text-[10px] text-center text-red-500 py-1.5 bg-red-50 border-b border-red-100">Wrong</span>
              <span className="text-[13px] text-center text-red-600 font-bold py-2">{session.incorrect ?? 0}</span>
            </div>
            <div className="flex-1 bg-slate-50/50 rounded-lg border border-slate-200 flex flex-col overflow-hidden">
              <span className="text-[10px] text-center text-slate-500 py-1.5 bg-slate-100 border-b border-slate-200">Skipped</span>
              <span className="text-[13px] text-center text-slate-600 font-bold py-2">{session.unattempted ?? 0}</span>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 max-w-[500px]">
            <div className="flex-1 bg-slate-50/50 rounded-lg border border-slate-100 flex flex-col overflow-hidden">
              <span className="text-[10px] text-center text-slate-500 py-1.5 bg-slate-50 border-b border-slate-100">Created On</span>
              <span className="text-xs text-center text-slate-700 font-medium py-2 flex items-center justify-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-amber-500" /> {formatDate(session.created_at)}
              </span>
            </div>
            {session.expires_at && (
              <div className="flex-1 bg-slate-50/50 rounded-lg border border-slate-100 flex flex-col overflow-hidden">
                <span className="text-[10px] text-center text-slate-500 py-1.5 bg-slate-50 border-b border-slate-100">Expires</span>
                <span className="text-xs text-center text-slate-700 font-medium py-2 flex items-center justify-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500" /> {formatDate(session.expires_at)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action row (Aligned under the date blocks) */}
      <div className="border-t border-slate-100 bg-white flex items-center">
        <div className="max-w-[500px] w-full flex">
          <div className="flex-1 flex justify-center py-4">
            {session.status === 'active' && (
              <ResumeTestLink
                sessionId={session.id}
                className="text-[12px] font-bold text-[#0066FF] hover:text-blue-700 transition-colors uppercase tracking-widest"
              >
                Resume Test
              </ResumeTestLink>
            )}

            {session.status === 'attempted' && (
              <Link
                href={`/tests/${session.id}/result`}
                className="text-[12px] font-bold text-[#0066FF] hover:text-blue-700 transition-colors uppercase tracking-widest"
              >
                View Result
              </Link>
            )}

            {session.status === 'missed' && (
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest cursor-not-allowed">
                Test Expired
              </span>
            )}
          </div>
          <div className="flex-1 flex justify-center py-4">
            {/* Empty secondary action slot (matches 'NOTIFY ME' space) */}
          </div>
        </div>
      </div>
    </div>
  )
}
