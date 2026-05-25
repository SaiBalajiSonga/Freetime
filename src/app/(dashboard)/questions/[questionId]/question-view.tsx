'use client'

import { useState, useEffect } from 'react'
import { submitAttempt } from './actions'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Eye, EyeOff, RotateCcw, History } from 'lucide-react'
import Latex from '@/components/ui/latex'
import { Card, DifficultyBadge } from '@/components/site/dashboard-ui'

type QuestionViewProps = {
  question: any
  options: any[]
  attempts: any[]
}

export default function QuestionView({ question, options, attempts: initialAttempts }: QuestionViewProps) {
  const [attempts, setAttempts] = useState<any[]>(initialAttempts)
  const latestAttempt = attempts.length > 0 ? attempts[0] : null

  const [practiceMode, setPracticeMode] = useState<boolean>(attempts.length === 0)
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [numericalAnswer, setNumericalAnswer] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; isCorrect?: boolean; error?: string } | null>(null)
  const [timeTaken, setTimeTaken] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  const isSolved = !practiceMode && (result?.isCorrect || latestAttempt?.is_correct)
  const showSolution = !practiceMode && (result?.isCorrect || latestAttempt?.is_correct)

  useEffect(() => {
    if (!practiceMode) return
    const timer = setInterval(() => setTimeTaken(p => p + 1), 1000)
    return () => clearInterval(timer)
  }, [practiceMode])

  const handleSubmit = async () => {
    const answer = question.type === 'mcq' ? selectedOption : numericalAnswer
    if (!answer) return
    setIsSubmitting(true)
    const res = await submitAttempt(question.id, answer, timeTaken)
    setResult(res)
    const newAttempt = {
      id: Math.random().toString(),
      answer,
      is_correct: res.isCorrect,
      time_taken: timeTaken,
      created_at: new Date().toISOString()
    }
    setAttempts(prev => [newAttempt, ...prev])
    setPracticeMode(false)
    setIsSubmitting(false)
  }

  const handlePracticeAgain = () => {
    setPracticeMode(true)
    setResult(null)
    setSelectedOption('')
    setNumericalAnswer('')
    setTimeTaken(0)
    setShowExplanation(false)
  }

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left: Question */}
      <div className="flex-1 space-y-5">
        <Card variant="white" className="p-7">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-xl font-extrabold text-foreground tracking-[-0.03em]">
                {question.chapters?.name || 'Practice Question'}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2.5">
                {question.chapters?.subjects?.name && (
                  <span className="text-[11px] font-semibold text-accent-electric bg-accent-electric/10 border border-accent-electric/25 px-2.5 py-1 rounded-pill">
                    {question.chapters.subjects.name}
                  </span>
                )}
                {question.chapters?.name && (
                  <span className="text-[11px] font-semibold text-muted bg-surface-2 border border-border px-2.5 py-1 rounded-pill">
                    {question.chapters.name}
                  </span>
                )}
              </div>
            </div>
            <DifficultyBadge level={question.difficulty} />
          </div>

          <div className="text-[15px] text-muted leading-relaxed">
            <Latex>{question.statement}</Latex>
          </div>

          {question.image_url && (
            <div className="mt-6 flex justify-center bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
              <img
                src={question.image_url}
                alt="Question diagram"
                loading="lazy"
                className="max-h-[300px] w-auto object-contain rounded-md"
              />
            </div>
          )}

          {question.hint && (
            <div className="mt-5 pt-5 border-t border-border">
              <button onClick={() => setShowHint(!showHint)} className="flex items-center gap-2 text-sm text-accent-electric hover:text-accent-glow font-semibold transition-colors">
                {showHint ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </button>
            {showHint && (
                <div className="mt-3 text-sm text-[#93C5FD] bg-[#3B82F6]/10 border border-[#3B82F6]/25 rounded-xl p-4">
                  <Latex>{question.hint}</Latex>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Explanation */}
        {showSolution && (
          <div className="rounded-2xl surface-glass border border-white/[0.06] overflow-hidden">
            <button onClick={() => setShowExplanation(!showExplanation)} className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-2 transition-colors">
              <span className="font-bold text-foreground">Explanation</span>
              {showExplanation ? <ChevronUp className="h-4 w-4 text-muted-2" /> : <ChevronDown className="h-4 w-4 text-muted-2" />}
            </button>
            {showExplanation && (
              <div className="px-6 pb-6 text-sm text-muted leading-relaxed border-t border-border pt-4">
                <Latex>{question.solution || "No detailed solution provided for this question."}</Latex>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Answer Panel */}
      <div className="lg:w-[380px] shrink-0 space-y-5">
        <Card variant="white" className="p-6 sticky top-[90px]">
          {/* Timer */}
          {practiceMode && (
            <div className="flex items-center justify-end gap-2 mb-5">
              <div className="flex items-center gap-1.5 bg-surface-2 border border-border px-3 py-1.5 rounded-pill">
                <svg className="w-3.5 h-3.5 text-muted-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-mono font-bold text-muted">Time: {formatTime(timeTaken)}</span>
              </div>
            </div>
          )}

          <h3 className="font-bold text-foreground mb-4">Your Answer</h3>

          {question.type === 'mcq' ? (
            <RadioGroup value={practiceMode ? selectedOption : (latestAttempt?.answer || '')} onValueChange={setSelectedOption} disabled={!practiceMode}>
              <div className="space-y-2.5">
                {options.map((opt) => {
                  const isSelected = practiceMode ? selectedOption === opt.id : latestAttempt?.answer === opt.id
                  const showCorrectness = !practiceMode
                  const isCorrectSubmission = latestAttempt?.is_correct || result?.isCorrect

                  let border = 'border-border hover:border-accent-electric/45 hover:bg-accent-electric/5 text-muted'
                  if (isSelected && !showCorrectness) border = 'border-accent-electric bg-accent-electric/10 ring-2 ring-accent-electric/25 text-foreground'
                  if (showCorrectness && opt.is_correct && isCorrectSubmission) border = 'border-emerald-500 bg-emerald-500/10 text-emerald-100'
                  if (showCorrectness && isSelected && !opt.is_correct) border = 'border-red-500 bg-red-500/10 text-red-100'

                  return (
                    <div key={opt.id} className={`flex items-center gap-3 p-3.5 border rounded-xl transition-all cursor-pointer ${border}`}>
                      <RadioGroupItem value={opt.id} id={opt.id} className="shrink-0 border-border-strong text-accent-electric" />
                      <Label htmlFor={opt.id} className="flex-1 cursor-pointer text-sm font-medium"><Latex>{opt.text}</Latex></Label>
                      {showCorrectness && opt.is_correct && isCorrectSubmission && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                      {showCorrectness && isSelected && !opt.is_correct && <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
                    </div>
                  )
                })}
              </div>
            </RadioGroup>
          ) : (
            <input
              type="text"
              placeholder="Enter numerical value"
              value={practiceMode ? numericalAnswer : (latestAttempt?.answer || '')}
              onChange={(e) => setNumericalAnswer(e.target.value)}
              disabled={!practiceMode}
              className="w-full h-12 rounded-xl bg-surface-2/80 border border-white/[0.08] px-4 text-foreground placeholder:text-muted-2 focus:border-accent-electric focus:outline-none focus:ring-2 focus:ring-accent-electric/25 transition text-base"
            />
          )}

            {practiceMode && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (question.type === 'mcq' ? !selectedOption : !numericalAnswer)}
              variant="primary"
              className="w-full mt-5"
            >
              {isSubmitting ? 'Submitting…' : 'Submit Answer'}
            </Button>
          )}

          {!practiceMode && (
            <div className={`mt-5 p-4 rounded-xl flex items-center gap-3 border ${
              latestAttempt?.is_correct
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : 'bg-red-500/10 border-red-500/20'
            }`}>
              {latestAttempt?.is_correct
                ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                : <XCircle className="h-5 w-5 text-red-400" />
              }
              <div className="flex-1">
                <p className={`text-sm font-bold ${latestAttempt?.is_correct ? 'text-emerald-400' : 'text-red-400'}`}>
                  {latestAttempt?.is_correct ? 'Correct Answer!' : 'Incorrect Answer'}
                </p>
                <p className={`text-[11px] mt-0.5 ${latestAttempt?.is_correct ? 'text-emerald-500/80' : 'text-red-400/80'}`}>
                  {latestAttempt?.is_correct ? 'Great job!' : "Don't give up, try again!"}
                </p>
              </div>
            </div>
          )}

          {!practiceMode && (
            <Button variant="outline" onClick={handlePracticeAgain} className="w-full mt-4">
              <RotateCcw className="h-4 w-4 mr-2" />
              {latestAttempt?.is_correct ? 'Practice Again' : 'Try Again'}
            </Button>
          )}
        </Card>

        {/* History */}
        {attempts.length > 0 && (
          <Card variant="white" className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-4 w-4 text-muted-2" />
              <h3 className="font-bold text-foreground text-sm">Previous Submissions</h3>
            </div>
            <div className="space-y-2">
              {attempts.map((attempt, idx) => (
                <div key={attempt.id || idx} className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-border hover:border-border-strong transition-colors">
                  <div className="flex items-center gap-3">
                    {attempt.is_correct
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      : <XCircle className="h-4 w-4 text-red-400" />
                    }
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {attempt.is_correct ? 'Accepted' : 'Wrong Answer'}
                      </p>
                      <p className="text-[10px] text-muted-2 mt-0.5">
                        {new Date(attempt.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  {attempt.time_taken > 0 && (
                    <span className="text-[10px] font-mono text-muted-2 bg-surface border border-border px-2 py-1 rounded-md">
                      {formatTime(attempt.time_taken)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
