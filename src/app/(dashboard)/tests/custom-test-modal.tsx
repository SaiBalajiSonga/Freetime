'use client'

import { useState, useTransition, useMemo } from 'react'
import { createCustomSession, type CustomTestConfig } from './actions'
import { ChevronDown, ChevronUp, AlertCircle, Loader2 } from 'lucide-react'
import type { SetupData } from './page'

type Props = {
  subjects: SetupData['subjects']
  chapters: SetupData['chapters']
}

const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'] as const
type Difficulty = typeof DIFFICULTIES[number]

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
        active
          ? 'bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-500/10 dark:border-cyan-500/30 dark:text-cyan-400 shadow-sm'
          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-300'
      }`}
    >
      {children}
    </button>
  )
}

export default function CustomTestModalContent({ subjects, chapters }: Props) {
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
    return selectedSubjectIds.map((sid) => ({
      subject: subjects.find((s) => s.id === sid)!,
      chapters: chapters.filter((c) => c.subject_id === sid),
    }))
  }, [selectedSubjectIds, subjects, chapters])

  function toggleSubject(sid: string) {
    setSelectedSubjectIds((prev) => {
      if (prev.includes(sid)) {
        const chapterIdsForSubject = chapters.filter((c) => c.subject_id === sid).map((c) => c.id)
        setSelectedChapterIds((cids) => cids.filter((id) => !chapterIdsForSubject.includes(id)))
        return prev.filter((id) => id !== sid)
      }
      return [...prev, sid]
    })
  }

  function toggleChapter(cid: string) {
    setSelectedChapterIds((prev) =>
      prev.includes(cid) ? prev.filter((id) => id !== cid) : [...prev, cid]
    )
  }

  function selectAllChapters(sid: string) {
    const ids = chapters.filter((c) => c.subject_id === sid).map((c) => c.id)
    setSelectedChapterIds((prev) => {
      const existing = new Set(prev)
      ids.forEach((id) => existing.add(id))
      return [...existing]
    })
  }

  function deselectAllChapters(sid: string) {
    const ids = new Set(chapters.filter((c) => c.subject_id === sid).map((c) => c.id))
    setSelectedChapterIds((prev) => prev.filter((id) => !ids.has(id)))
  }

  function toggleCollapse(sid: string) {
    setCollapsedSubjects((prev) => ({ ...prev, [sid]: !prev[sid] }))
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
    <div className="space-y-6">
      {/* Step 1: Subjects */}
      <div className="space-y-3">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Select Subjects</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {subjects.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleSubject(s.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                selectedSubjectIds.includes(s.id)
                  ? 'bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-500/10 dark:border-cyan-500/30 dark:text-cyan-400'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Chapter lists per selected subject */}
        {chaptersBySubject.length > 0 && (
          <div className="space-y-2 pt-2">
            {chaptersBySubject.map(({ subject, chapters: subChapters }) => {
              const selectedInSubject = subChapters.filter((c) => selectedChapterIds.includes(c.id))
              const allSelected = selectedInSubject.length === subChapters.length
              const isCollapsed = collapsedSubjects[subject.id]

              return (
                <div key={subject.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{subject.name}</span>
                      <span className="text-[10px] bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400 rounded-full px-1.5 py-0.5 font-bold">
                        {selectedInSubject.length} / {subChapters.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => (allSelected ? deselectAllChapters(subject.id) : selectAllChapters(subject.id))}
                        className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
                      >
                        {allSelected ? 'Deselect all' : 'Select all'}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCollapse(subject.id)}
                        className="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                      {subChapters.map((ch) => (
                        <label key={ch.id} className="flex items-center gap-2 py-1 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={selectedChapterIds.includes(ch.id)}
                            onChange={() => toggleChapter(ch.id)}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-600"
                          />
                          <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 truncate">
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

      <hr className="border-slate-100 dark:border-slate-800" />

      {/* Grid for settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex justify-between">
              <span>Questions</span>
              <span className="text-cyan-600 dark:text-cyan-400">{questionCount}</span>
            </h3>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] font-medium text-slate-400">
              <span>5</span>
              <span>100</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex justify-between">
              <span>Time Limit</span>
              <span className="text-amber-600 dark:text-amber-400">{timeLimit} mins</span>
            </h3>
            <input
              type="range"
              min="5"
              max="180"
              step="5"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] font-medium text-slate-400">
              <span>5m</span>
              <span>180m</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Difficulty</h3>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((d) => (
              <PillButton key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </PillButton>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Action */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canStart || isPending}
          className="w-full py-2.5 rounded-xl font-bold text-sm bg-slate-900 text-white dark:bg-white dark:text-slate-900 transition-all hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Start Practice Test'
          )}
        </button>
      </div>
    </div>
  )
}
