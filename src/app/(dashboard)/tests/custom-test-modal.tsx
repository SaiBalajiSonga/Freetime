'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import { createCustomSession, type CustomTestConfig, type SubjectConfig } from './actions'
import { AlertCircle, Loader2, ChevronRight, ArrowLeft, X } from 'lucide-react'
import type { SetupData } from './page'

type Props = {
  subjects: SetupData['subjects']
  chapters: SetupData['chapters']
}

const DIFFICULTIES = [
  { id: 'all', label: 'Mixed' },
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
] as const

type Difficulty = typeof DIFFICULTIES[number]['id']

export default function CustomTestModalContent({ subjects, chapters }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'config' | 'summary'>('config')

  // We start by selecting the first subject tab
  const [activeTab, setActiveTab] = useState<string>(subjects[0]?.id || '')

  // Config State
  const [subjectConfigs, setSubjectConfigs] = useState<Record<string, {
    chapterIds: string[]
    difficulty: Difficulty
    mcqCount: number
    numericalCount: number
  }>>({})

  // Global Config
  const [testName, setTestName] = useState('')
  const [timeLimit, setTimeLimit] = useState(60) // default 60 mins initially
  const [isTimeManuallySet, setIsTimeManuallySet] = useState(false)

  // Helper to ensure config exists for a subject
  const getConfig = (subjectId: string) => {
    const defaultConf = {
      chapterIds: [],
      difficulty: 'all' as Difficulty,
      mcqCount: 20,
      numericalCount: 5
    }
    return { ...defaultConf, ...(subjectConfigs[subjectId] || {}) }
  }

  const updateConfig = (subjectId: string, updates: Partial<ReturnType<typeof getConfig>>) => {
    setSubjectConfigs(prev => ({
      ...prev,
      [subjectId]: {
        ...getConfig(subjectId),
        ...updates
      }
    }))
  }

  // Derived state for the active tab
  const activeSubject = subjects.find(s => s.id === activeTab)
  const activeChapters = useMemo(() => chapters.filter(c => c.subject_id === activeTab), [chapters, activeTab])
  const activeConfig = getConfig(activeTab)

  function toggleChapter(cid: string) {
    const current = activeConfig.chapterIds
    const next = current.includes(cid) ? current.filter(id => id !== cid) : [...current, cid]
    updateConfig(activeTab, { chapterIds: next })
  }

  function selectAllActive() {
    updateConfig(activeTab, { chapterIds: activeChapters.map(c => c.id) })
  }

  function clearActive() {
    updateConfig(activeTab, { chapterIds: [] })
  }

  // Determine if at least one subject has questions configured
  const activeSubjectsFilter = (s: SetupData['subjects'][0]) => getConfig(s.id).chapterIds.length > 0 && (getConfig(s.id).mcqCount > 0 || getConfig(s.id).numericalCount > 0)
  const configuredSubjectsCount = subjects.filter(activeSubjectsFilter).length

  // Auto-calculate time based on standard JEE algorithm (2 minutes per question)
  const totalQuestionsConfigured = subjects.reduce((acc, s) => {
    if (!activeSubjectsFilter(s)) return acc
    const c = getConfig(s.id)
    return acc + c.mcqCount + c.numericalCount
  }, 0)

  useEffect(() => {
    if (!isTimeManuallySet && totalQuestionsConfigured > 0) {
      setTimeLimit(totalQuestionsConfigured * 2)
    }
  }, [totalQuestionsConfigured, isTimeManuallySet])

  function handleProceedToSummary() {
    if (configuredSubjectsCount === 0) {
      setError('Please select chapters and questions for at least one subject.')
      return
    }
    setError(null)
    setStep('summary')
  }

  function handleSubmit() {
    setError(null)

    // Build the payload
    const activeSubjects: SubjectConfig[] = subjects
      .filter(s => getConfig(s.id).chapterIds.length > 0 && (getConfig(s.id).mcqCount > 0 || getConfig(s.id).numericalCount > 0))
      .map(s => {
        const c = getConfig(s.id)
        return {
          subject_id: s.id,
          subject_name: s.name,
          chapter_ids: c.chapterIds,
          difficulty: c.difficulty,
          mcq_count: c.mcqCount,
          numerical_count: c.numericalCount
        }
      })

    if (activeSubjects.length === 0) {
      setError('No valid subjects configured.')
      return
    }

    const payload: CustomTestConfig = {
      test_name: testName.trim() || undefined,
      subjects: activeSubjects,
      time_limit_minutes: timeLimit
    }

    startTransition(async () => {
      const result = await createCustomSession(payload)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  if (step === 'summary') {
    // SUMMARY VIEW
    const activeSubjects = subjects.filter(s => getConfig(s.id).chapterIds.length > 0 && (getConfig(s.id).mcqCount > 0 || getConfig(s.id).numericalCount > 0))
    const totalQuestions = activeSubjects.reduce((acc, s) => acc + getConfig(s.id).mcqCount + getConfig(s.id).numericalCount, 0)

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => setStep('config')}
            className="p-2 -ml-2 rounded-md hover:bg-slate-100 text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-base font-semibold text-slate-900">Review & Confirm</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-900">Test Name (Optional)</label>
            <div className="relative group">
              <input 
                type="text" 
                placeholder="e.g. Weekly Revision Test"
                value={testName}
                onChange={e => setTestName(e.target.value)}
                className="w-full px-3 py-2 pr-8 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-slate-900 focus:ring-0 transition-colors"
              />
              {testName.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTestName('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity p-0.5 rounded-sm"
                  aria-label="Clear test name"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-900">Total Time Limit</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="5"
                max="300"
                step="5"
                value={timeLimit}
                onChange={(e) => {
                  setTimeLimit(Number(e.target.value))
                  setIsTimeManuallySet(true)
                }}
                className="w-28 px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-slate-900 focus:ring-0 transition-colors"
              />
              <div className="flex flex-col">
                <span className="text-sm text-slate-500 font-medium">Minutes</span>
                {!isTimeManuallySet && totalQuestionsConfigured > 0 && (
                  <span className="text-[10px] text-slate-400">Standard JEE pacing (2 mins/Q) applied</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">Selected Subjects</h4>
            <span className="text-sm font-medium text-slate-500">{totalQuestions} Total Questions</span>
          </div>
          
          <div className="space-y-3">
            {activeSubjects.map(s => {
              const conf = getConfig(s.id)
              return (
                <div key={s.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm text-slate-900">{s.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5 capitalize">
                      {conf.difficulty} Difficulty • {conf.chapterIds.length} Topics
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">
                      {conf.mcqCount + conf.numericalCount} Qs
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {conf.mcqCount} MCQ • {conf.numericalCount} NUM
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full py-2.5 rounded-md font-semibold text-sm text-white bg-[var(--color-primary)] transition-all hover:opacity-90 shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : 'Create Session'}
          </button>
        </div>
      </div>
    )
  }

  // CONFIG VIEW (Step 1)
  return (
    <div className="space-y-5">
      {/* Subject Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-sm overflow-x-auto no-scrollbar">
        {subjects.map(s => {
          const isActive = activeTab === s.id
          const hasTopics = getConfig(s.id).chapterIds.length > 0
          return (
            <button
              key={s.id}
              onClick={() => setActiveTab(s.id)}
              className={`flex-1 min-w-[100px] whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-sm transition-all ${
                isActive 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                {s.name}
                {hasTopics && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
              </div>
            </button>
          )
        })}
      </div>

      {activeSubject && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Difficulty */}
            <div className="space-y-2 sm:col-span-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Difficulty</label>
              <div className="flex p-1 bg-slate-100 rounded-sm">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => updateConfig(activeTab, { difficulty: d.id })}
                    className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-sm transition-all ${
                      activeConfig.difficulty === d.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* MCQ Count */}
            <div className="space-y-2 sm:col-span-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">MCQ Qs</label>
              <input
                type="number"
                min="0"
                max="100"
                value={activeConfig.mcqCount ?? 0}
                onChange={e => updateConfig(activeTab, { mcqCount: Number(e.target.value) })}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-slate-900 focus:ring-0 transition-colors"
              />
            </div>

            {/* Numerical Count */}
            <div className="space-y-2 sm:col-span-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Num Qs</label>
              <input
                type="number"
                min="0"
                max="100"
                value={activeConfig.numericalCount ?? 0}
                onChange={e => updateConfig(activeTab, { numericalCount: Number(e.target.value) })}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-slate-900 focus:ring-0 transition-colors"
              />
            </div>
          </div>

          {/* Topics/Chapters */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Topics</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={selectAllActive} className="px-2.5 py-1 text-xs font-bold text-[var(--color-primary)] bg-blue-50 hover:bg-blue-100 rounded-sm transition-colors">Select All</button>
                <button type="button" onClick={clearActive} className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-sm transition-colors">Clear</button>
              </div>
            </div>
            
            <div className="border border-slate-200 rounded-md overflow-hidden flex flex-col bg-slate-50">
              <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-x-2 max-h-[220px] overflow-y-auto">
                {activeChapters.map(ch => {
                  const isChecked = activeConfig.chapterIds.includes(ch.id)
                  return (
                    <label key={ch.id} className="flex items-center gap-2 py-1.5 px-2 hover:bg-slate-100 rounded cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleChapter(ch.id)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      />
                      <span className="text-xs text-slate-700 group-hover:text-slate-900 truncate">
                        {ch.name}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-slate-500 font-medium">{configuredSubjectsCount} subjects configured</span>
        </div>
        <button
          type="button"
          onClick={handleProceedToSummary}
          disabled={configuredSubjectsCount === 0}
          className="w-full py-2.5 rounded-md font-semibold text-sm text-white bg-[var(--color-primary)] transition-all hover:opacity-90 shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 group"
          title={configuredSubjectsCount === 0 ? 'Configure at least one subject with topics to proceed' : undefined}
        >
          Review Configuration
          <ChevronRight className="w-4 h-4 text-white/50 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  )
}
