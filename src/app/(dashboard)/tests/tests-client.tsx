'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ClipboardList, GraduationCap, Calendar, CheckCircle2, XCircle, MinusCircle, Clock, ChevronRight, PlayCircle, Plus } from 'lucide-react'
import { ResumeTestLink } from './resume-test-link'
import type { TestSessionItem, SetupData } from './page'
import { Modal } from '@/components/ui/modal'
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

  const filtered = sessions.filter(s => s.status === activeTab)

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
          <button 
            onClick={() => setActiveModal('custom')}
            className="flex flex-col items-center justify-center p-3 sm:px-4 sm:py-2 rounded-xl border-2 border-dashed border-cyan-200 bg-cyan-50/50 hover:bg-cyan-50 hover:border-cyan-400 transition-colors group relative overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-cyan-600" />
              <span className="text-sm font-bold text-cyan-800">Custom Mock Test</span>
              <Plus className="h-4 w-4 text-cyan-500 opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
          
          <button 
            onClick={() => setActiveModal('jee')}
            className="flex flex-col items-center justify-center p-3 sm:px-4 sm:py-2 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-400 transition-colors group relative overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-bold text-amber-800">JEE Mains Test</span>
              <Plus className="h-4 w-4 text-amber-500 opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
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
        <div className="space-y-4">
          {filtered.map(session => (
            <TestSessionCard key={session.id} session={session} />
          ))}
        </div>
      )}

      {/* Modals */}
      {setupData && (
        <>
          <Modal 
            isOpen={activeModal === 'custom'} 
            onClose={() => setActiveModal('none')} 
            title="Custom Mock Test"
            maxWidth="max-w-2xl"
          >
            <CustomTestModalContent subjects={setupData.subjects} chapters={setupData.chapters} />
          </Modal>

          <Modal 
            isOpen={activeModal === 'jee'} 
            onClose={() => setActiveModal('none')} 
            title="JEE Mains Mock"
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
function TestSessionCard({ session }: { session: TestSessionItem }) {
  const isCustom = session.mode === 'custom'
  const isJee = session.mode === 'jee_mains'
  const isWeekly = session.mode === 'weekly_exam'

  const title = isJee ? 'JEE Mains Mock' : isWeekly ? (session.config?.exam_title || 'Weekly Exam') : 'Custom Practice'
  
  const iconBg = isJee ? 'from-amber-500 to-amber-600' : isWeekly ? 'from-violet-500 to-violet-600' : 'from-cyan-500 to-cyan-600'
  const iconShadow = isJee ? 'shadow-[0_4px_12px_rgba(245,158,11,0.35)]' : isWeekly ? 'shadow-[0_4px_12px_rgba(139,92,246,0.35)]' : 'shadow-[0_4px_12px_rgba(6,182,212,0.35)]'
  const Icon = isJee ? GraduationCap : isWeekly ? Calendar : ClipboardList

  const badgeCls = session.status === 'active' ? 'bg-green-500 text-white' : session.status === 'attempted' ? 'bg-gray-500 text-white' : 'bg-red-500 text-white'
  const badgeLabel = session.status === 'active' ? 'LIVE NOW' : session.status === 'attempted' ? 'COMPLETED' : 'MISSED'

  const pct = session.max_score ? Math.round(((session.score || 0) / session.max_score) * 100) : null
  const scoreColor = pct === null ? 'text-muted' : pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-amber-500' : 'text-red-500'

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm overflow-hidden flex flex-col group transition-colors hover:border-slate-300">
      {/* Top section */}
      <div className="p-4 flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 relative">
          <div className={`size-14 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center ${iconShadow}`}>
            <Icon className="h-7 w-7 text-white" />
          </div>
          {/* Badge */}
          <span className={`absolute -top-2 -left-1 text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded ${badgeCls}`}>
            {badgeLabel}
          </span>
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-base leading-snug mb-1 truncate">{title}</h3>
          
          <div className="flex items-center gap-3 text-xs text-muted flex-wrap">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {formatDate(session.created_at)}
            </span>
            
            {session.status === 'active' && session.expires_at && (
              <>
                <span className="text-muted-2">•</span>
                <span className="flex items-center gap-1 text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <Clock className="h-3 w-3" />
                  {getExpiresString(session.expires_at)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Grid section for stats (if attempted) or info (if active/missed) */}
      <div className="border-t border-[var(--color-border)] bg-slate-50/30">
        {session.status === 'attempted' ? (
          <div className="grid grid-cols-4 divide-x divide-[var(--color-border)]">
            <div className="px-4 py-3 flex flex-col justify-center">
              <span className={`font-black text-lg leading-none ${scoreColor}`}>{session.score}/{session.max_score}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted mt-1">Score ({pct}%)</span>
            </div>
            <div className="px-4 py-3 flex flex-col justify-center">
              <span className="font-bold text-lg leading-none text-green-600 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> {session.correct ?? 0}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted mt-1">Correct</span>
            </div>
            <div className="px-4 py-3 flex flex-col justify-center">
              <span className="font-bold text-lg leading-none text-red-500 flex items-center gap-1.5"><XCircle className="h-4 w-4" /> {session.incorrect ?? 0}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted mt-1">Incorrect</span>
            </div>
            <div className="px-4 py-3 flex flex-col justify-center">
              <span className="font-bold text-lg leading-none text-slate-500 flex items-center gap-1.5"><MinusCircle className="h-4 w-4" /> {session.unattempted ?? 0}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted mt-1">Skipped</span>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3">
             <p className="text-xs text-muted-2">
               {session.status === 'active' 
                 ? "You have started this test but haven't submitted it yet. Resume before it expires."
                 : "This test was started but not submitted within the 7-day window and has expired."}
             </p>
          </div>
        )}
      </div>

      {/* Action row */}
      <div className="border-t border-[var(--color-border)] px-4 py-3 flex items-center justify-between bg-slate-50/60">
        {session.status === 'active' && (
          <ResumeTestLink
            sessionId={session.id}
            className="text-sm font-extrabold uppercase tracking-wide text-green-600 hover:opacity-80 transition-opacity flex items-center gap-1.5 w-full justify-between"
          >
            <span className="flex items-center gap-1.5"><PlayCircle className="h-4 w-4" /> Resume Test</span>
            <ChevronRight className="h-4 w-4 opacity-50" />
          </ResumeTestLink>
        )}

        {session.status === 'attempted' && (
          <Link
            href={`/tests/${session.id}/result`}
            className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-primary)] hover:opacity-80 transition-opacity flex items-center gap-1.5 w-full justify-between"
          >
            <span>View Result</span>
            <ChevronRight className="h-4 w-4 opacity-50" />
          </Link>
        )}

        {session.status === 'missed' && (
          <span className="text-sm font-extrabold uppercase tracking-wide text-slate-400 cursor-not-allowed">
            Test Expired
          </span>
        )}
      </div>
    </div>
  )
}
