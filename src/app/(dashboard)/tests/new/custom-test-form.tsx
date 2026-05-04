'use client'

import { useState, useTransition, useMemo } from 'react'
import { createCustomSession, type CustomTestConfig } from '../actions'
import { ChevronDown, ChevronUp, AlertCircle, Loader2 } from 'lucide-react'

type Subject = { id: string; name: string }
type Chapter = { id: string; name: string; subject_id: string }

type Props = {
  subjects: Subject[]
  chapters: Chapter[]
}

const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'] as const
type Difficulty = typeof DIFFICULTIES[number]

const QUESTION_COUNTS = [10, 20, 30, 50]
const TIME_LIMITS = [
  { label: '15m', value: 15 },
  { label: '30m', value: 30 },
  { label: '45m', value: 45 },
  { label: '60m', value: 60 },
]

function PillButton({
  active,
  onClick,
  children,
  color = 'cyan',
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  color?: 'cyan' | 'amber' | 'violet'
}) {
  const activeClass =
    color === 'amber'
      ? 'bg-amber-400/15 border-amber-400/40 text-amber-400'
      : color === 'violet'
        ? 'bg-violet-400/15 border-violet-400/40 text-violet-400'
        : 'bg-accent-cyan/15 border-accent-cyan/40 text-accent-cyan'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
        active
          ? activeClass
          : 'bg-surface-2 border-border text-muted hover:border-border-strong hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

export default function CustomTestForm({ subjects, chapters }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // State
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([])
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState<Difficulty>('all')
  const [questionCount, setQuestionCount] = useState(20)
  const [timeLimit, setTimeLimit] = useState(30)
  const [collapsedSubjects, setCollapsedSubjects] = useState<Record<string, boolean>>({})

  // Derived: chapters grouped by selected subjects
  const chaptersBySubject = useMemo(() => {
    return selectedSubjectIds.map(sid => ({
      subject: subjects.find(s => s.id === sid)!,
      chapters: chapters.filter(c => c.subject_id === sid),
    }))
  }, [selectedSubjectIds, subjects, chapters])

  // Toggle subject selection
  function toggleSubject(sid: string) {
    setSelectedSubjectIds(prev => {
      if (prev.includes(sid)) {
        // Deselect subject → also deselect its chapters
        const chapterIdsForSubject = chapters.filter(c => c.subject_id === sid).map(c => c.id)
        setSelectedChapterIds(cids => cids.filter(id => !chapterIdsForSubject.includes(id)))
        return prev.filter(id => id !== sid)
      }
      return [...prev, sid]
    })
  }

  // Toggle chapter selection
  function toggleChapter(cid: string) {
    setSelectedChapterIds(prev =>
      prev.includes(cid) ? prev.filter(id => id !== cid) : [...prev, cid]
    )
  }

  // Select all chapters for a subject
  function selectAllChapters(sid: string) {
    const ids = chapters.filter(c => c.subject_id === sid).map(c => c.id)
    setSelectedChapterIds(prev => {
      const existing = new Set(prev)
      ids.forEach(id => existing.add(id))
      return [...existing]
    })
  }

  // Deselect all chapters for a subject
  function deselectAllChapters(sid: string) {
    const ids = new Set(chapters.filter(c => c.subject_id === sid).map(c => c.id))
    setSelectedChapterIds(prev => prev.filter(id => !ids.has(id)))
  }

  function toggleCollapse(sid: string) {
    setCollapsedSubjects(prev => ({ ...prev, [sid]: !prev[sid] }))
  }

  function handleSubmit() {
    setError(null)

    if (selectedSubjectIds.length === 0) {
      setError('Please select at least one subject.')
      return
    }
    if (selectedChapterIds.length === 0) {
      setError('Please select at least one chapter.')
      return
    }

    const config: CustomTestConfig = {
      subject_ids: selectedSubjectIds,
      chapter_ids: selectedChapterIds,
      difficulty,
      question_count: questionCount,
      time_limit_minutes: timeLimit,
    }

    startTransition(async () => {
      const result = await createCustomSession(config)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  const canStart = selectedSubjectIds.length > 0 && selectedChapterIds.length > 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
      {/* Left: Config */}
      <div className="space-y-6">

        {/* Step 1: Subjects */}
        <div className="rounded-2xl surface-glass p-6 space-y-4 border border-white/[0.06]">
          <div>
            <h2 className="font-bold text-foreground">Step 1 — Select Subjects</h2>
            <p className="text-xs text-muted mt-0.5">You can select multiple subjects.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {subjects.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSubject(s.id)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  selectedSubjectIds.includes(s.id)
                    ? 'bg-accent-cyan/15 border-accent-cyan/50 text-accent-cyan shadow-[0_0_16px_-4px_rgba(34,211,238,0.3)]'
                    : 'bg-surface-2 border-border text-muted hover:border-border-strong hover:text-foreground'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Chapter lists per selected subject */}
          {chaptersBySubject.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-border">
              {chaptersBySubject.map(({ subject, chapters: subChapters }) => {
                const selectedInSubject = subChapters.filter(c => selectedChapterIds.includes(c.id))
                const allSelected = selectedInSubject.length === subChapters.length
                const isCollapsed = collapsedSubjects[subject.id]

                return (
                  <div key={subject.id} className="rounded-xl border border-white/[0.06] bg-surface-2/70 overflow-hidden backdrop-blur-sm">
                    {/* Subject header */}
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{subject.name}</span>
                        <span className="text-[11px] bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 rounded-full px-2 py-0.5 font-bold">
                          {selectedInSubject.length} / {subChapters.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => allSelected ? deselectAllChapters(subject.id) : selectAllChapters(subject.id)}
                          className="text-[11px] text-accent-cyan hover:underline"
                        >
                          {allSelected ? 'Deselect all' : 'Select all'}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleCollapse(subject.id)}
                          className="text-muted-2 hover:text-foreground transition-colors"
                        >
                          {isCollapsed
                            ? <ChevronDown className="h-4 w-4" />
                            : <ChevronUp className="h-4 w-4" />
                          }
                        </button>
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="px-4 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 border-t border-border">
                        {subChapters.map(ch => (
                          <label
                            key={ch.id}
                            className="flex items-center gap-2.5 py-1.5 cursor-pointer group"
                          >
                            <div
                              className={`size-4 rounded-[5px] border flex-shrink-0 flex items-center justify-center transition-all ${
                                selectedChapterIds.includes(ch.id)
                                  ? 'bg-accent-cyan border-accent-cyan'
                                  : 'border-border group-hover:border-border-strong'
                              }`}
                              onClick={() => toggleChapter(ch.id)}
                            >
                              {selectedChapterIds.includes(ch.id) && (
                                <svg className="h-2.5 w-2.5 text-black" fill="currentColor" viewBox="0 0 12 12">
                                  <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                            <span
                              className={`text-sm transition-colors ${
                                selectedChapterIds.includes(ch.id) ? 'text-foreground' : 'text-muted-2 group-hover:text-muted'
                              }`}
                              onClick={() => toggleChapter(ch.id)}
                            >
                              {ch.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Step 2: Difficulty */}
        <div className="rounded-2xl surface-glass p-6 space-y-4 border border-white/[0.06]">
          <h2 className="font-bold text-foreground">Step 2 — Difficulty</h2>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map(d => (
              <PillButton key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </PillButton>
            ))}
          </div>
        </div>

        {/* Step 3: Question Count */}
        <div className="rounded-2xl surface-glass p-6 space-y-4 border border-white/[0.06]">
          <h2 className="font-bold text-foreground">Step 3 — Questions</h2>
          <div className="flex flex-wrap gap-2">
            {QUESTION_COUNTS.map(n => (
              <PillButton key={n} active={questionCount === n} onClick={() => setQuestionCount(n)} color="violet">
                {n} Questions
              </PillButton>
            ))}
          </div>
        </div>

        {/* Step 4: Time Limit */}
        <div className="rounded-2xl surface-glass p-6 space-y-4 border border-white/[0.06]">
          <h2 className="font-bold text-foreground">Step 4 — Time Limit</h2>
          <div className="flex flex-wrap gap-2">
            {TIME_LIMITS.map(t => (
              <PillButton key={t.value} active={timeLimit === t.value} onClick={() => setTimeLimit(t.value)} color="amber">
                {t.label}
              </PillButton>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </div>

      {/* Right: Summary + Start */}
      <div className="lg:sticky lg:top-24 h-fit space-y-4">
        <div className="rounded-2xl surface-glass-strong p-5 space-y-4 border border-white/[0.07]">
          <h3 className="font-bold text-foreground">Test Summary</h3>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subjects</span>
              <span className="text-foreground font-medium">
                {selectedSubjectIds.length === 0
                  ? '—'
                  : subjects.filter(s => selectedSubjectIds.includes(s.id)).map(s => s.name).join(', ')
                }
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Chapters</span>
              <span className="text-foreground font-medium">
                {selectedChapterIds.length === 0 ? '—' : `${selectedChapterIds.length} selected`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Difficulty</span>
              <span className="text-foreground font-medium capitalize">{difficulty}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Questions</span>
              <span className="text-foreground font-medium">{questionCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Duration</span>
              <span className="text-foreground font-medium">{timeLimit} minutes</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Max Score</span>
              <span className="text-accent-electric font-bold">{questionCount * 4}</span>
            </div>
          </div>

          <div className="h-px bg-border" />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canStart || isPending}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-primary text-white shadow-[0_8px_28px_-8px_rgba(59,130,246,0.5)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Test…
              </>
            ) : (
              'Start Test →'
            )}
          </button>

          {!canStart && (
            <p className="text-[11px] text-muted text-center">
              Select at least one subject and chapter to continue.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
