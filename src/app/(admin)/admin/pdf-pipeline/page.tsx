'use client'

import { useState, useCallback, useMemo } from 'react'
import { PdfUploadZone } from '@/components/admin/pdf-upload-zone'
import { PipelinePreview, type PipelineQuestion } from '@/components/admin/pipeline-preview'
import { processPipelineImport, commitPipelineImport } from './actions'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  FileUp,
  FileText,
  Loader2,
  Zap,
  Eye,
  Upload,
  Database,
  Globe,
  Lock,
} from 'lucide-react'
import Link from 'next/link'
import { SAMPLE_JEE_QUESTIONS } from './sample-data'

type Step = 'upload' | 'preview' | 'importing' | 'result'

const STEPS = [
  { id: 'upload',  label: 'Upload & Process', num: 1 },
  { id: 'preview', label: 'Preview',          num: 2 },
  { id: 'result',  label: 'Import',           num: 3 },
] as const

function StepIndicator({ current }: { current: Step }) {
  const stepIds = STEPS.map((s) => s.id)
  const currentIdx = current === 'importing' ? 2 : stepIds.indexOf(current as any)

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i < currentIdx
        const active = i === currentIdx

        return (
          <div key={step.id} className="flex items-center gap-0 flex-1 last:flex-initial">
            <div
              className={`flex items-center gap-2.5 shrink-0 ${
                active ? 'text-white' : done ? 'text-emerald-400' : 'text-[#64748b]'
              }`}
            >
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  active
                    ? 'bg-blue-600 text-white border-2 border-blue-600'
                    : done
                    ? 'bg-emerald-600/20 text-emerald-400 border-2 border-emerald-600/30'
                    : 'border-2 text-[#64748b]'
                }`}
                style={
                  !active && !done
                    ? { background: '#1c2333', borderColor: '#2a3142' }
                    : {}
                }
              >
                {done ? '\u2713' : step.num}
              </div>
              <span
                className={`text-xs font-bold hidden sm:block ${
                  active ? 'text-white' : done ? 'text-emerald-400' : 'text-[#64748b]'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`step-connector mx-3 ${done ? 'done' : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function PdfPipelinePage() {
  const [step, setStep] = useState<Step>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [subject, setSubject] = useState('Mathematics')
  const [chapter, setChapter] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [isProcessing, setIsProcessing] = useState(false)
  const [pipelineQuestions, setPipelineQuestions] = useState<PipelineQuestion[]>([])
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState('')
  const [insertResult, setInsertResult] = useState<{
    insertedCount: number
    skippedCount: number
    errorCount: number
  } | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')

  // Calculate importable questions (valid questions that can be imported to Supabase)
  const importableCount = useMemo(() => {
    return pipelineQuestions.filter((q) => {
      if (q.merge_status === 'KEY_NOT_FOUND') return false
      const qType = q.type || q.question_type || 'mcq'
      if (qType === 'mcq') {
        return (
          (q.correct_option !== undefined && q.correct_option >= 0) ||
          (q.options && q.options.some((o: any) => typeof o !== 'string' ? o.is_correct : false))
        )
      }
      if (qType === 'numerical') {
        return Boolean(q.correct_answer && String(q.correct_answer).trim() !== '')
      }
      return true
    }).length
  }, [pipelineQuestions])

  const handleFileSelected = useCallback((file: File) => {
    setSelectedFile(file)
    setError(null)
  }, [])

  // ── Step 1: Upload & Process via API ──────────────────────────────────────
  const handleProcess = async () => {
    if (!selectedFile) return
    setIsProcessing(true)
    setError(null)
    setLogs('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('subject', subject)
      formData.append('visibility', visibility)
      if (chapter.trim()) {
        formData.append('chapter', chapter.trim())
      }

      const res = await fetch('/api/pipeline', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Pipeline failed')
        setLogs(data.logs || data.details || '')
        return
      }

      if (!data.questions || data.questions.length === 0) {
        setError('Pipeline returned no questions. Check if the PDF format is supported.')
        setLogs(data.logs || '')
        return
      }

      setPipelineQuestions(data.questions)
      setLogs(data.logs || '')
      setStep('preview')
    } catch (err: any) {
      setError(err.message || 'Failed to connect to pipeline API')
    } finally {
      setIsProcessing(false)
    }
  }

  // ── Load Sample JEE Questions for Instant Preview ─────────────────────────
  const handleLoadSample = () => {
    setPipelineQuestions(SAMPLE_JEE_QUESTIONS)
    setSubject('Mathematics')
    setChapter('Application of Derivatives')
    setError(null)
    setStep('preview')
  }

  // ── Step 3: Import to Supabase ────────────────────────────────────────────
  const handleImport = async () => {
    setStep('importing')
    setIsProcessing(true)
    setError(null)
    setProgress(0)
    setProgressText('Validating and checking for duplicates...')

    try {
      // Validate against DB
      const preview = await processPipelineImport(pipelineQuestions, subject)

      if (preview.validQuestions.length === 0) {
        setInsertResult({
          insertedCount: 0,
          skippedCount: preview.duplicateHashes.length,
          errorCount: preview.invalidQuestions.length,
        })
        setStep('result')
        return
      }

      // Commit in chunks
      const validQs = preview.validQuestions.map((v) => v.question)
      const CHUNK_SIZE = 200
      let totalInserted = 0
      let totalSkipped = preview.duplicateHashes.length
      let totalErrors = preview.invalidQuestions.length

      for (let i = 0; i < validQs.length; i += CHUNK_SIZE) {
        const chunk = validQs.slice(i, i + CHUNK_SIZE)
        setProgressText(
          `Importing ${Math.min(i + CHUNK_SIZE, validQs.length)} of ${validQs.length} questions...`
        )

        const res = await commitPipelineImport(chunk)
        totalInserted += res.insertedCount
        totalSkipped += res.skippedCount
        totalErrors += res.errorCount

        setProgress(Math.round(((i + chunk.length) / validQs.length) * 100))
      }

      setInsertResult({
        insertedCount: totalInserted,
        skippedCount: totalSkipped,
        errorCount: totalErrors,
      })
      setStep('result')
    } catch (err: any) {
      setError(err.message || 'Failed to import questions')
      setStep('preview')
    } finally {
      setIsProcessing(false)
      setProgress(0)
      setProgressText('')
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setStep('upload')
    setSelectedFile(null)
    setPipelineQuestions([])
    setInsertResult(null)
    setError(null)
    setLogs('')
    setProgress(0)
    setProgressText('')
  }

  return (
    <div className="max-w-5xl mx-auto space-y-7">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="size-9 rounded-md flex items-center justify-center"
          style={{
            background: 'rgba(139,92,246,0.15)',
            border: '1px solid rgba(139,92,246,0.25)',
          }}
        >
          <Zap className="h-4 w-4 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            PDF Pipeline
          </h1>
          <p className="text-[13px]" style={{ color: '#64748b' }}>
            Upload a JEE PDF, extract questions with AI, preview with LaTeX rendering, and import.
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* Error */}
      {error && (
        <Alert className="bg-red-500/10 border-red-500/20 text-red-400">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertTitle className="font-bold">Error</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{error}</p>
            {logs && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-red-400/70 font-medium">
                  Show pipeline logs
                </summary>
                <pre className="mt-2 text-[11px] font-mono whitespace-pre-wrap opacity-70 max-h-48 overflow-auto p-3 rounded-md bg-black/30">
                  {logs}
                </pre>
              </details>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* ── Step 1: Upload & Process ── */}
      {step === 'upload' && (
        <div className="space-y-5">
          <PdfUploadZone
            onFileSelected={handleFileSelected}
            disabled={isProcessing}
          />

          {/* Subject + Chapter + Visibility config */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/70 uppercase tracking-wider">
                Subject *
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isProcessing}
                className="w-full px-4 py-2.5 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                style={{
                  background: '#0d1117',
                  border: '1px solid #2a3142',
                }}
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/70 uppercase tracking-wider">
                Chapter Override{' '}
                <span className="text-[#64748b] font-normal normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                disabled={isProcessing}
                placeholder="e.g., Application of Derivatives"
                className="w-full px-4 py-2.5 text-sm text-white placeholder:text-[#64748b] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                style={{
                  background: '#0d1117',
                  border: '1px solid #2a3142',
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center justify-between">
                <span>Visibility *</span>
                <span className="text-[11px] font-normal text-[#64748b] capitalize">
                  {visibility === 'public' ? 'Public' : 'Private'}
                </span>
              </label>
              <div
                className="grid grid-cols-2 p-1 rounded-md"
                style={{ background: '#0d1117', border: '1px solid #2a3142' }}
              >
                <button
                  type="button"
                  id="visibility-public-btn"
                  onClick={() => setVisibility('public')}
                  disabled={isProcessing}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs font-bold transition-all ${
                    visibility === 'public'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-[#64748b] hover:text-white'
                  }`}
                  title="Questions will be publicly visible"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Public
                </button>
                <button
                  type="button"
                  id="visibility-private-btn"
                  onClick={() => setVisibility('private')}
                  disabled={isProcessing}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs font-bold transition-all ${
                    visibility === 'private'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-[#64748b] hover:text-white'
                  }`}
                  title="Questions will be marked as private"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Private
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleLoadSample}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md font-semibold text-xs transition-all border border-white/10 bg-white/[0.04] text-white/80 hover:text-white hover:bg-white/[0.08]"
              title="Preview pre-extracted JEE Main questions as a LaTeX document"
            >
              <FileText className="h-3.5 w-3.5 text-sky-400" />
              Load Sample JEE Questions (Instant LaTeX Document Preview)
            </button>

            <button
              onClick={handleProcess}
              disabled={!selectedFile || isProcessing}
              className="inline-flex items-center gap-2.5 px-7 py-3 bg-blue-600 text-white font-bold text-sm rounded-md hover:bg-blue-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(59,130,246,0.35)]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing PDF...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Process PDF
                </>
              )}
            </button>
          </div>

          {/* Processing overlay */}
          {isProcessing && (
            <div
              className="rounded-lg p-8 text-center space-y-4"
              style={{
                background: 'rgba(56,189,248,0.03)',
                border: '1px solid rgba(56,189,248,0.1)',
              }}
            >
              <Loader2 className="h-8 w-8 text-sky-400 animate-spin mx-auto" />
              <div>
                <p className="text-sm font-bold text-white">Running AI pipeline...</p>
                <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                  This can take 30-120 seconds depending on PDF size.
                  <br />
                  OCR + answer key extraction + question extraction + merge.
                </p>
              </div>
              <div className="flex items-center justify-center gap-6 text-[11px] font-medium" style={{ color: '#64748b' }}>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
                  Marker OCR
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" style={{ animationDelay: '0.3s' }} />
                  Pass 1: Answer Keys
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: '0.6s' }} />
                  Pass 2: Questions
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" style={{ animationDelay: '0.9s' }} />
                  Pass 3: Merge
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Preview ── */}
      {step === 'preview' && pipelineQuestions.length > 0 && (
        <div className="space-y-5">
          {/* Preview header */}
          <div
            className="flex items-center justify-between px-5 py-3.5 rounded-lg"
            style={{ background: '#161b27', border: '1px solid #2a3142' }}
          >
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-sky-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                LaTeX Preview
              </span>
              <span className="text-[11px] font-medium" style={{ color: '#64748b' }}>
                — Review questions before importing
              </span>
            </div>
          </div>

          {/* Questions preview */}
          <PipelinePreview questions={pipelineQuestions} subject={subject} />

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-bold text-sm transition-all"
              style={{
                border: '1px solid #2a3142',
                background: '#161b27',
                color: '#94a3b8',
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="flex-1" />
            <button
              onClick={handleImport}
              disabled={importableCount === 0 || isProcessing}
              className="inline-flex items-center gap-2.5 px-7 py-3 bg-emerald-600 text-white font-bold text-sm rounded-md hover:bg-emerald-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(16,185,129,0.35)]"
            >
              <Database className="h-4 w-4" />
              Import {importableCount} Questions to Supabase
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2.5: Importing progress ── */}
      {step === 'importing' && (
        <div className="space-y-4">
          <div
            className="p-6 rounded-lg space-y-4"
            style={{ background: '#161b27', border: '1px solid #2a3142' }}
          >
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-sky-400 animate-spin" />
              <span className="text-sm font-bold text-white">{progressText}</span>
            </div>
            {progress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span style={{ color: '#64748b' }}>Progress</span>
                  <span className="text-sky-400">{progress}%</span>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full"
                  style={{ background: '#0d1117', border: '1px solid #2a3142' }}
                >
                  <div
                    className="h-full bg-sky-500 transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 3: Result ── */}
      {step === 'result' && insertResult && (
        <div className="space-y-6">
          {/* Success card */}
          <div
            className="rounded-lg p-8 text-center"
            style={{
              border: '1px solid rgba(16,185,129,0.2)',
              background: 'rgba(16,185,129,0.05)',
            }}
          >
            <div
              className="size-14 rounded-lg flex items-center justify-center mx-auto mb-4"
              style={{
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.2)',
              }}
            >
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
            <p className="text-5xl font-black text-emerald-400 tabular-nums">
              {insertResult.insertedCount}
            </p>
            <p className="text-sm mt-2 font-medium" style={{ color: '#94a3b8' }}>
              questions imported successfully
            </p>
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className="p-5 rounded-lg text-center"
              style={{ border: '1px solid #2a3142', background: '#161b27' }}
            >
              <div className="text-2xl font-black text-amber-400">
                {insertResult.skippedCount}
              </div>
              <div className="text-xs font-medium mt-1" style={{ color: '#64748b' }}>
                Skipped (duplicates)
              </div>
            </div>
            <div
              className="p-5 rounded-lg text-center"
              style={{ border: '1px solid #2a3142', background: '#161b27' }}
            >
              <div className="text-2xl font-black text-red-400">
                {insertResult.errorCount}
              </div>
              <div className="text-xs font-medium mt-1" style={{ color: '#64748b' }}>
                Errors
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-md hover:bg-blue-500 transition-all shadow-[0_4px_14px_rgba(59,130,246,0.35)]"
              onClick={handleReset}
              id="pipeline-import-more-btn"
            >
              <Upload className="h-4 w-4" />
              Process Another PDF
            </button>
            <Link
              href="/admin/questions"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-bold text-sm transition-all"
              style={{
                border: '1px solid #2a3142',
                background: '#161b27',
                color: '#94a3b8',
              }}
            >
              View Questions
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
